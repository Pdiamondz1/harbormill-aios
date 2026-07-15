#!/usr/bin/env node
// transcribe-media — turn any audio/video file into a timestamped transcript.
//
// Closes the one missing hop in the media→knowledge path. Everything downstream
// of "we have a transcript string" already exists: the `transcript-summarize`
// edge function (summary + action items → findings) and `sync:wiki` →
// `knowledge-sync` (wiki page → Aria's RAG). This script produces that string.
//
// Normalizes the input to mono 16kHz mp3 (what Whisper listens to anyway),
// splits it into chunks that comfortably clear the API's 25MB/request limit,
// transcribes each, and stitches the results back into one absolute timeline.
//
// Usage:
//   OPENAI_API_KEY=sk-... \
//   node scripts/transcribe-media.mjs <input> [--out <path>] [--dry-run]
//
// The key is read from the environment, or from a .env file in the repo root if
// present (shell env wins). Same variable the knowledge-sync function uses.
//
// Flags:
//   --out <path>     where to write the transcript (default: docs/wiki/raw/external/<slug>.md)
//   --prompt <text>  vocabulary hint — names, jargon, product names. Whisper reliably
//                    mangles proper nouns ("Henneberry" → "Hanbury"); listing them here
//                    fixes it. Applied to every chunk. First ~224 tokens are used.
//   --dry-run        probe + report the plan and cost; make no network calls.
//
// Note: Whisper does not diarize. A multi-speaker recording comes back as one
// unattributed stream of text — speakers must be inferred from context. If
// attribution matters, use a service with speaker labels (AssemblyAI, Deepgram).
//
// Raw transcripts of third-party material belong in docs/wiki/raw/external/,
// which is gitignored on purpose — summarize into docs/wiki/sources/ instead of
// committing someone else's content verbatim.

import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, dirname, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { mkdtempSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const ENDPOINT = "https://api.openai.com/v1/audio/transcriptions";
const MODEL = "whisper-1"; // the only model returning verbose_json (per-segment timestamps)
const RATE_PER_MIN = 0.006; // USD, whisper-1

// 15min @ 32kbps ≈ 3.5MB — far under the 25MB cap, so a long file never wedges
// on a single oversized upload, and a mid-run failure is cheap to retry.
const CHUNK_SECONDS = 900;
const BITRATE = "32k";

// Merge Whisper's ~5-10s segments into readable blocks instead of hundreds of
// one-line stubs. Tuned for prose, not subtitles.
const BLOCK_SECONDS = 30;

// Flags that consume the next argv entry — skipped when hunting for the input path,
// so `--out foo.md input.mp3` doesn't mistake "foo.md" for the input.
const VALUE_FLAGS = new Set(["--out", "--prompt"]);

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes("--dry-run");
const flagValue = (name) => (argv.indexOf(name) !== -1 ? argv[argv.indexOf(name) + 1] : null);
const OUT_FLAG = flagValue("--out");
const PROMPT = flagValue("--prompt");
const INPUT = argv.find(
  (a, i) => !a.startsWith("--") && !(i > 0 && VALUE_FLAGS.has(argv[i - 1]))
);

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

// ── ffmpeg/ffprobe helpers ───────────────────────────────────────────────────
function probeDuration(file) {
  const out = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
    { encoding: "utf8" }
  );
  const secs = parseFloat(out.trim());
  if (!isFinite(secs)) throw new Error(`Could not read duration from ${file}`);
  return secs;
}

function hhmmss(secs) {
  const s = Math.max(0, Math.floor(secs));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

// Normalize + split in one pass. Whisper resamples to 16kHz mono regardless, so
// doing it here costs nothing and shrinks the upload by an order of magnitude.
function splitToChunks(input, outDir) {
  execFileSync(
    "ffmpeg",
    [
      "-hide_banner", "-loglevel", "error", "-y",
      "-i", input,
      "-vn",
      "-ac", "1",
      "-ar", "16000",
      "-c:a", "libmp3lame",
      "-b:a", BITRATE,
      "-f", "segment",
      "-segment_time", String(CHUNK_SECONDS),
      "-reset_timestamps", "1",
      join(outDir, "chunk-%03d.mp3"),
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  );
  return readdirSync(outDir)
    .filter((f) => f.startsWith("chunk-") && f.endsWith(".mp3"))
    .sort()
    .map((f) => join(outDir, f));
}

// ── Whisper ──────────────────────────────────────────────────────────────────
async function transcribeChunk(file, apiKey, prompt) {
  const form = new FormData();
  form.append("file", new Blob([readFileSync(file)], { type: "audio/mpeg" }), basename(file));
  form.append("model", MODEL);
  form.append("response_format", "verbose_json");
  if (prompt) form.append("prompt", prompt);

  const resp = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  const text = await resp.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { error: { message: text } };
  }
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}: ${body.error?.message ?? text}`);
  }
  return body;
}

// ── Render ───────────────────────────────────────────────────────────────────
// Segments arrive per-chunk with chunk-relative times; `offset` lifts them back
// onto the absolute timeline. Offsets accumulate from each chunk's *actual*
// duration, since -segment_time only splits on frame boundaries.
function toBlocks(segments) {
  const blocks = [];
  let cur = null;
  for (const seg of segments) {
    const t = seg.start;
    const txt = (seg.text ?? "").trim();
    if (!txt) continue;
    if (!cur || t - cur.start >= BLOCK_SECONDS) {
      cur = { start: t, parts: [txt] };
      blocks.push(cur);
    } else {
      cur.parts.push(txt);
    }
  }
  return blocks.map((b) => `[${hhmmss(b.start)}] ${b.parts.join(" ")}`);
}

function render({ title, input, duration, blocks, fullText }) {
  const today = new Date().toISOString().slice(0, 10);
  return [
    `# ${title}`,
    "",
    `- Source file: \`${basename(input)}\``,
    `- Duration: ${hhmmss(duration)}`,
    `- Transcribed: ${today} via OpenAI \`${MODEL}\``,
    `- Speakers: **not labelled** — Whisper does not diarize; attribute from context.`,
    `- Characters: ${fullText.length}`,
    "",
    "---",
    "",
    ...blocks,
    "",
  ].join("\n");
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  loadDotEnv();

  if (!INPUT) {
    console.error(
      "Usage: node scripts/transcribe-media.mjs <input> [--out <path>] [--dry-run]\n" +
        "  <input>  any audio or video file ffmpeg can read\n"
    );
    process.exit(1);
  }
  if (!existsSync(INPUT)) {
    console.error(`Input not found: ${INPUT}`);
    process.exit(1);
  }

  const duration = probeDuration(INPUT);
  const minutes = duration / 60;
  const chunks = Math.ceil(duration / CHUNK_SECONDS);
  const slug = basename(INPUT, extname(INPUT))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const outPath = OUT_FLAG ?? join(ROOT, "docs", "wiki", "raw", "external", `${slug}.md`);

  console.log(`Input:    ${INPUT}`);
  console.log(`Duration: ${hhmmss(duration)} (${minutes.toFixed(1)} min)`);
  console.log(`Chunks:   ${chunks} × ≤${CHUNK_SECONDS / 60}min, mono 16kHz mp3 @ ${BITRATE}`);
  console.log(`Model:    ${MODEL}  (~$${(minutes * RATE_PER_MIN).toFixed(2)})`);
  if (PROMPT) console.log(`Prompt:   ${PROMPT.slice(0, 70)}${PROMPT.length > 70 ? "…" : ""}`);
  console.log(`Out:      ${outPath}`);

  if (DRY_RUN) {
    console.log("\n--dry-run: no network calls made.");
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error(
      "\nMissing OPENAI_API_KEY.\n" +
        "Set it in the environment or a repo-root .env file. Example:\n" +
        "  OPENAI_API_KEY=sk-...\n"
    );
    process.exit(1);
  }

  const workDir = mkdtempSync(join(tmpdir(), "transcribe-"));
  let errors = 0;
  try {
    process.stdout.write("Splitting audio… ");
    const files = splitToChunks(INPUT, workDir);
    console.log(`ok (${files.length} chunks)`);

    const segments = [];
    let offset = 0;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      process.stdout.write(`Transcribing ${i + 1}/${files.length}… `);
      try {
        const res = await transcribeChunk(f, apiKey, PROMPT);
        for (const seg of res.segments ?? []) {
          segments.push({ start: seg.start + offset, end: seg.end + offset, text: seg.text });
        }
        console.log(`ok (${(res.text ?? "").length} chars)`);
      } catch (err) {
        errors++;
        console.log(`FAILED — ${err.message}`);
      }
      offset += probeDuration(f); // actual, not nominal — segments land on frame boundaries
    }

    if (!segments.length) {
      console.error("\nNo transcript produced. If the capture was silent, check that audio was");
      console.error("routing to Stereo Mix and the output device was not muted.");
      process.exit(1);
    }

    const blocks = toBlocks(segments);
    const fullText = segments.map((s) => s.text.trim()).join(" ");
    const title = basename(INPUT, extname(INPUT));
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, render({ title, input: INPUT, duration, blocks, fullText }), "utf8");

    console.log(`\nDone. ${blocks.length} blocks, ${fullText.length} chars, ${errors} errors.`);
    console.log(`Wrote ${outPath}`);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }

  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
