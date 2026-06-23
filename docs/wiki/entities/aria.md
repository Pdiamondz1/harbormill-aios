---
title: Aria
type: entity
created: 2026-06-17
updated: 2026-06-23
sources: [src/config/brand.ts, supabase/functions/assistant-chat/tools.ts, supabase/functions/assistant-chat/index.ts]
tags: [assistant, ai, tool-registry, streaming]
---

# Aria

The operator's AI co-pilot in [[Harbormill AIOS]] — concise, candid, and grounded
in the business's live metrics and knowledge base. Default name set in
`src/config/brand.ts` (`assistantName`), rebrandable per client. Powered by
Anthropic chat (`ANTHROPIC_MODEL`; base default `claude-sonnet-4-6`, Harbormill's
deploy uses Opus + extended thinking).

## Engine

Aria runs the [[Assistant Chat Loop]]. As of **PR #21** (`feat/aria-donny-maturity`,
pending live e2e + merge), the engine streams responses (NDJSON: live tool-status +
token deltas), replays tool-aware history with pairing-repair, hardens the tool loop
(12 rounds + "answer now" fallback), supports Opus + extended thinking, and can
attach route-based action chips. This is the "Donny-grade" upgrade — see the loop
page for mechanics.

## Tool Registry

Aria's tools live in `supabase/functions/assistant-chat/tools.ts` — the
**pluggable AI tool registry** keystone (per-tool off-switch via `DISABLED_TOOLS`).
Add capabilities by appending here. Tools include:

- `search_knowledge` — RAG over Strategy docs (OpenAI embeddings).
- `read_metrics` — live KPIs with labels, values, targets, status.
- `get_latest_briefing` — most recent weekly brief.
- `create_finding` — log a bug/risk from chat (admin triage).
- `export_to_drive` / `list_drive_files` — Google Doc export / Workspace browse (needs Workspace).
- `compose_email_link` — build a pre-filled Gmail compose link (no send).
- `get_value_summary`, `get_cost_stats`, `get_weight_trend`, `get_document`, `propose_correction` — value/ROI, AI spend (admin), platform scale, full-doc read, and the admin correction-proposal protocol.
- `suggest_actions` — attach `{label, route}` follow-up chips to a reply (PR #21).

**Coming in M2a:** Gmail + Calendar tools — `triage_inbox`, `get_email`, `draft_email`,
`send_draft` (drafts + confirm-to-send), `list_calendar_events`, `create_calendar_event`,
`update_calendar_event` — via expanded scopes on the [[Google Workspace Bridge]]. Designed,
not yet built.

## Key Decisions

- Grounded only in what enters via the [[Report-Ingest Seam]] + knowledge base —
  Aria does not query client business tables.
- Extensible by clients without forking the engine (registry pattern).
- Send safety: Aria drafts email and only sends after explicit confirmation (M2a) —
  the same "propose, then act on confirmation" pattern as `propose_correction`.

## See Also

- [[Harbormill AIOS]]
- [[Assistant Chat Loop]]
- [[AI Tool Registry]]
- [[Google Workspace Bridge]]
- [[Report-Ingest Seam]]
- [[Project Context]]
