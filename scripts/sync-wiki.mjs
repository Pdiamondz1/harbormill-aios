#!/usr/bin/env node
// sync-wiki — teach Aria the knowledge base.
//
// Reads every page under docs/wiki/ and pushes it into the assistant's RAG
// store (public.knowledge) through the `knowledge-sync` edge function. The
// function is idempotent on metadata.source_id, so re-running updates pages in
// place instead of duplicating — safe to run on every wiki change.
//
// Usage:
//   SUPABASE_URL=https://<ref>.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
//   node scripts/sync-wiki.mjs [--dry-run]
//
// Credentials are read from the environment, or from a .env file in the repo
// root if present (shell env wins). The service-role key is a server secret —
// never expose it to the browser (no VITE_ prefix, keep .env gitignored).
//
// Flags:
//   --dry-run   parse + report what would sync; make no network calls.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const WIKI_DIR = join(ROOT, "docs", "wiki");

// index.md is a link catalog and log.md is the research ledger — navigation,
// not knowledge. Everything else under docs/wiki/ is fair game for Aria.
const EXCLUDE = new Set(["index.md", "log.md"]);

// knowledge-sync caps items at 100/request; stay well under for headroom.
const BATCH = 50;

const DRY_RUN = process.argv.includes("--dry-run");

// ── Minimal .env loader (no dependency) ──────────────────────────────────────
// Loads KEY=VALUE lines from repo-root .env without overriding real env vars.
function loadDotEnv() {
  const envPath = join(ROOT, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const [, key, rawVal] = m;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawVal.replace(/^["']|["']$/g, "");
  }
}

// ── Tiny YAML frontmatter parser ─────────────────────────────────────────────
// Handles the flat `key: value` / `key: [a, b]` frontmatter the wiki uses.
function parseFrontmatter(raw) {
  if (!raw.startsWith("---")) return { data: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: raw };
  const head = raw.slice(3, end).trim();
  const body = raw.slice(raw.indexOf("\n", end + 1) + 1).replace(/^\s+/, "");
  const data = {};
  for (const line of head.split("\n")) {
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, val] = m;
    const trimmed = val.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      data[key] = trimmed
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else {
      data[key] = trimmed;
    }
  }
  return { data, body: body.trimEnd() };
}

// ── Collect wiki pages ───────────────────────────────────────────────────────
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".md") && !EXCLUDE.has(entry.name)) out.push(full);
  }
  return out;
}

function buildItems() {
  return walk(WIKI_DIR)
    .sort()
    .map((file) => {
      const relPath = relative(ROOT, file).split("\\").join("/"); // posix for stable ids
      const rel = relative(WIKI_DIR, file).split("\\").join("/").replace(/\.md$/, "");
      const { data, body } = parseFrontmatter(readFileSync(file, "utf8"));
      if (!body.trim()) return null;
      return {
        source_id: `wiki:${rel}`,
        content: body,
        metadata: {
          title: data.title ?? rel,
          path: relPath,
          type: data.type ?? "wiki",
          tags: Array.isArray(data.tags) ? data.tags : [],
          origin: "wiki",
        },
      };
    })
    .filter(Boolean);
}

// ── Push to the edge function ────────────────────────────────────────────────
async function syncBatch(endpoint, serviceKey, items) {
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ items }),
  });
  const text = await resp.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { error: text };
  }
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}: ${body.error ?? text}`);
  }
  return body;
}

async function main() {
  loadDotEnv();
  const items = buildItems();
  console.log(`Found ${items.length} wiki pages under docs/wiki/`);

  if (DRY_RUN) {
    for (const it of items) {
      console.log(`  ${it.source_id}  (${it.content.length} chars, [${it.metadata.tags.join(", ")}])`);
    }
    console.log("\n--dry-run: no network calls made.");
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error(
      "Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY.\n" +
        "Set them in the environment or a repo-root .env file. Example:\n" +
        "  SUPABASE_URL=https://abcd.supabase.co\n" +
        "  SUPABASE_SERVICE_ROLE_KEY=eyJ...\n"
    );
    process.exit(1);
  }
  const endpoint = `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/knowledge-sync`;

  let inserted = 0;
  let updated = 0;
  let errors = 0;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    process.stdout.write(`Syncing ${i + 1}–${i + batch.length} of ${items.length}… `);
    try {
      const res = await syncBatch(endpoint, SERVICE_KEY, batch);
      inserted += res.inserted ?? 0;
      updated += res.updated ?? 0;
      errors += res.errors ?? 0;
      console.log(`ok (+${res.inserted} new, ~${res.updated} updated, ${res.errors} errors)`);
      for (const r of res.results ?? []) {
        if (r.action === "error") console.log(`    ! ${r.source_id}: ${r.error}`);
      }
    } catch (err) {
      errors += batch.length;
      console.log(`FAILED — ${err.message}`);
    }
  }

  console.log(`\nDone. ${inserted} inserted, ${updated} updated, ${errors} errors.`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
