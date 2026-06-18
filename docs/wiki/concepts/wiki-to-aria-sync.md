---
title: Wiki-to-Aria Sync
type: concept
created: 2026-06-18
updated: 2026-06-18
sources: [scripts/sync-wiki.mjs, docs/sync-aria.md, supabase/functions/knowledge-sync/index.ts, supabase/migrations/20260617000200_assistant.sql]
tags: [ai, rag, sync, ops, technical]
---

# Wiki-to-Aria Sync

The shipped form of [[Self-Improving App]] **Phase 2 (`sync-aria`)**: the pipeline
that loads the `docs/wiki/` knowledge base into [[Aria]]'s RAG store so the product
can reason over it. It connects the human-facing wiki (built by `wiki-ops` /
`autoresearch`) to the machine-facing `knowledge` table behind `search_knowledge`
([[Knowledge & RAG]]).

## The script

`scripts/sync-wiki.mjs` (zero-dependency Node, native `fetch`; `npm run sync:wiki`):

- Walks every page under `docs/wiki/`, **skipping `index.md` (catalog) and
  `log.md` (ledger)** — navigation, not knowledge.
- Strips YAML frontmatter; `source_id = "wiki:<relative-path>"`; carries
  `metadata` `{ title, path, type, tags, origin: "wiki" }`.
- Batches (50/request) and POSTs to the `knowledge-sync` function. `--dry-run`
  parses + previews offline with no credentials.

## The seam

`supabase/functions/knowledge-sync` (service-role; one of the four
[[Edge Functions]]) embeds each item with **OpenAI `text-embedding-3-small`
(1536-dim)** and **idempotently upserts** `public.knowledge` keyed on
`metadata.source_id` — so re-running after a wiki edit updates pages in place
rather than duplicating. Run it on every wiki change.

## Auth gotcha — the service-role key on the new key system

`knowledge-sync` (and `report-ingest`) authenticate by **exact-matching**
`Authorization: Bearer <token>` against the function's injected
`SUPABASE_SERVICE_ROLE_KEY`. On a Supabase project provisioned under the **new API
key system**, that injected value is the **`sb_secret_…` secret key — NOT the
legacy `eyJ…` service_role JWT**. Sending the legacy JWT returns `401
Unauthorized` even though it decodes to `role=service_role`. Put the `sb_secret_…`
key in `SUPABASE_SERVICE_ROLE_KEY` in a gitignored repo-root `.env`. The secret
key is also a valid service key for the embedding writes (`supabase-js` v2
accepts it). See `docs/sync-aria.md`.

## Verify

- `select count(*) from public.knowledge where metadata->>'origin' = 'wiki';`
- Ask Aria a wiki-only question (e.g. *"What are the four architecture
  keystones?"*) — the grounded answer should cite the synced pages.

## Per-client

The base template's wiki documents Harbormill AIOS itself (so an internal deck's
Aria knows the product). A client deployment syncs **its own** corpus the same
way — only the `source_id` namespace and content change; the seam is identical.
See [[Per-Client Deployment]].

## See Also

- [[Knowledge & RAG]]
- [[Self-Improving App]]
- [[Edge Functions]]
- [[Aria]]
- [[Per-Client Deployment]]
