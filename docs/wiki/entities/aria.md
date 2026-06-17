---
title: Aria
type: entity
created: 2026-06-17
updated: 2026-06-17
sources: [src/config/brand.ts, supabase/functions/assistant-chat/tools.ts]
tags: [assistant, ai, tool-registry]
---

# Aria

The operator's AI co-pilot in [[Harbormill AIOS]] — concise, candid, and grounded
in the business's live metrics and knowledge base. Default name set in
`src/config/brand.ts` (`assistantName`), rebrandable per client. Powered by
Anthropic chat (default `claude-sonnet-4-6`).

## Tool Registry

Aria's tools live in `supabase/functions/assistant-chat/tools.ts` — the
**pluggable AI tool registry** keystone. Add capabilities by appending here.
Current tools:

- `search_knowledge` — RAG over Strategy docs (OpenAI embeddings).
- `read_metrics` — live KPIs with labels, values, targets, status.
- `get_latest_briefing` — most recent weekly brief.
- `create_finding` — log a bug/risk from chat (admin triage).
- `export_to_drive` — compose markdown → Google Doc (needs Workspace).
- `list_drive_files` — browse the Workspace folder.

## Key Decisions

- Grounded only in what enters via the [[Report-Ingest Seam]] + knowledge base —
  Aria does not query client business tables.
- Extensible by clients without forking the engine (registry pattern).

## See Also

- [[Harbormill AIOS]]
- [[Report-Ingest Seam]]
- [[Project Context]]
