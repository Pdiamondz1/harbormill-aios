---
title: Knowledge & RAG
type: concept
created: 2026-06-17
updated: 2026-06-17
sources: [supabase/migrations/20260617000200_assistant.sql, supabase/functions/knowledge-sync/index.ts, supabase/functions/assistant-chat/tools.ts]
tags: [ai, rag, embeddings, search, technical]
---

# Knowledge & RAG

How [[Aria]] grounds answers in the business's own documents — the retrieval layer
behind the `search_knowledge` tool ([[AI Tool Registry]]).

## The knowledge store

`supabase/migrations/20260617000200_assistant.sql` defines the `knowledge` table:
chunk `content`, a **pgvector 1536-dim `embedding`** (hnsw index) **and** a tsvector
`search_vector` (gin index) — i.e. **hybrid** semantic + full-text search. The
`match_knowledge(query_embedding, match_count)` RPC is `SECURITY DEFINER` and
returns the nearest chunks (default 5).

## Sync pipeline

`supabase/functions/knowledge-sync` (service-role) embeds documents with **OpenAI
`text-embedding-3-small` (1536-dim)** and **idempotently upserts** the `knowledge`
table keyed on `metadata.source_id` (1–100 items/call) — re-syncing updates rather
than duplicating. The Strategy page's `documents` are the typical input
(`source_id: "doc:" + path`). The `docs/wiki/` pages are loaded through this same
function by [[Wiki-to-Aria Sync]] — the shipped `sync-aria` phase
([[Self-Improving App]]).

## Retrieval at query time

`search_knowledge` embeds the user's query (OpenAI), calls `match_knowledge`, and
returns the top chunks for Aria to cite. See [[AI Providers]].

## See Also

- [[Aria]]
- [[AI Tool Registry]]
- [[AI Providers]]
- [[Wiki-to-Aria Sync]]
- [[Self-Improving App]]
- [[Supabase]]
