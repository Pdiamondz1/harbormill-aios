// knowledge-sync
// Embeds documents into the assistant's RAG store (public.knowledge).
//
// - Service-role only (knowledge is service-role write).
// - Embeds with OpenAI text-embedding-3-small (1536d) to match match_knowledge.
// - Idempotent: one row per item, keyed on metadata.source_id. Re-syncing an
//   item updates its row instead of duplicating.
//
// Request body: { items: [{ source_id, content, metadata? }] }
//   source_id  stable key, e.g. "doc:strategy/positioning"
//   content    text to embed + store
//   metadata   optional { title, path, tags? } — stored alongside; source_id added.
//              When `path` AND `title` are present, the readable `documents`
//              library row is upserted too (kept in sync with the RAG store).
//
// Tip: to sync the whole strategy library, pass each `documents` row as
//   { source_id: "doc:" + path, content: content_md, metadata: { title, path, tags } }.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { logCost } from "../_shared/cost-ledger.ts";

const EMBED_MODEL = "text-embedding-3-small";

interface SyncItem {
  source_id: string;
  content: string;
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (req.headers.get("Authorization") !== `Bearer ${serviceRoleKey}`) {
    return json({ error: "Unauthorized" }, 401);
  }

  let items: SyncItem[];
  try {
    const body = await req.json();
    items = body.items;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    return json({ error: "items must be an array of 1-100 objects" }, 400);
  }
  for (const it of items) {
    if (!it?.source_id || typeof it.content !== "string" || !it.content.trim()) {
      return json({ error: "each item needs a source_id and non-empty content" }, 400);
    }
  }

  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) return json({ error: "OPENAI_API_KEY not configured" }, 500);

  const embedResp = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, input: items.map((i) => i.content) }),
  });
  if (!embedResp.ok) {
    return json({ error: "Embedding API failed", details: await embedResp.text() }, 502);
  }
  const embedData = await embedResp.json();
  const embeddings: number[][] = embedData.data.map((d: { embedding: number[] }) => d.embedding);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

  const results: { source_id: string; action: "inserted" | "updated" | "error"; error?: string }[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const row = {
      content: item.content,
      embedding: embeddings[i],
      source_type: "document",
      metadata: { ...(item.metadata ?? {}), source_id: item.source_id },
    };

    const { data: existing, error: selErr } = await supabase
      .from("knowledge")
      .select("id")
      .eq("metadata->>source_id", item.source_id)
      .maybeSingle();
    if (selErr) {
      results.push({ source_id: item.source_id, action: "error", error: selErr.message });
      continue;
    }

    const { error } = existing
      ? await supabase.from("knowledge").update(row).eq("id", existing.id)
      : await supabase.from("knowledge").insert(row);
    results.push(
      error
        ? { source_id: item.source_id, action: "error", error: error.message }
        : { source_id: item.source_id, action: existing ? "updated" : "inserted" }
    );

    // When the item carries a document path + title, also upsert the strategy/
    // reference library row so the readable doc stays in sync with the RAG store
    // (and corrections targeting a `document` by path have a row to land on).
    const path = item.metadata?.path;
    const title = item.metadata?.title;
    if (typeof path === "string" && path.trim() && typeof title === "string" && title.trim()) {
      const tags = Array.isArray(item.metadata?.tags) ? item.metadata!.tags : [];
      const { error: docErr } = await supabase
        .from("documents")
        .upsert(
          { path: path.trim(), title: title.trim(), content_md: item.content, tags },
          { onConflict: "path" }
        );
      if (docErr) console.error(`[knowledge-sync] documents upsert (${path}):`, docErr.message);
    }
  }

  const approxTokens = Math.ceil(items.reduce((n, i) => n + i.content.length, 0) / 4);
  await logCost(supabase, { edgeFunction: "knowledge-sync", model: EMBED_MODEL, inputTokens: approxTokens });

  const inserted = results.filter((r) => r.action === "inserted").length;
  const updated = results.filter((r) => r.action === "updated").length;
  const errors = results.filter((r) => r.action === "error").length;
  return json({ synced: inserted + updated, inserted, updated, errors, results });
});
