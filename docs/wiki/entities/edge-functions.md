---
title: Edge Functions
type: entity
created: 2026-06-17
updated: 2026-06-24
sources: [supabase/functions/report-ingest/index.ts, supabase/functions/assistant-chat/index.ts, supabase/functions/knowledge-sync/index.ts, supabase/functions/google-workspace-proxy/index.ts, supabase/functions/connector-sync/index.ts, supabase/functions/kpi-watch/index.ts, supabase/functions/_shared]
tags: [backend, deno, edge-functions, technical]
---

# Edge Functions

The Deno edge functions in `supabase/functions/` are the only server-side write
paths in [[Harbormill AIOS]]. Most are service-role choke points; two are
user-authenticated. Two of the service-role functions are **scheduled loops**
invoked by pg_cron (see below).

## The core functions

- **`report-ingest`** *(service-role only)* — the single audited write seam.
  Accepts `{ type: "metrics" | "findings" | "briefing", payload }`, validates
  (status/severity enums, max 100 metrics / 50 findings per call), and writes to
  the three generic tables. Findings upsert on `fingerprint` and **reopen on
  recurrence**. See [[Report-Ingest Seam]].
- **`assistant-chat`** *(user JWT, requires `has_access`)* — the agentic loop for
  [[Aria]]: persists the message, loads ~40 turns of history, calls Anthropic
  (`claude-sonnet-4-6` default) with the tool registry, iterates up to **8 tool
  rounds**, logs spend to `cost_ledger`. Includes prompt-injection sanitization.
  See [[AI Tool Registry]].
- **`knowledge-sync`** *(service-role only)* — embeds documents for RAG via OpenAI
  `text-embedding-3-small` (1536-dim) and **idempotently upserts** the `knowledge`
  table keyed on `metadata.source_id` (1–100 items/call). [[Wiki-to-Aria Sync]]
  drives it to load `docs/wiki/` into RAG (`npm run sync:wiki`). Auth is an exact
  Bearer match against the injected `SUPABASE_SERVICE_ROLE_KEY` — on new-key-system
  projects that is the `sb_secret_…` key, not the legacy JWT.
- **`google-workspace-proxy`** *(user JWT or service mode)* — the single audited
  gateway to Google Drive/Sheets; tokens never leave the server. See
  [[Google Workspace Bridge]].

## Scheduled loops (service-role, pg_cron + pg_net + Vault)

Two functions run unattended on a cron, invoked by `pg_net` with the URL +
service-role key read from Vault. Same scheduling idiom for both:

- **`connector-sync`** *(service-role cron **or** admin JWT)* — hourly; pulls live
  SaaS data (Stripe first) into `metric_snapshots`. Dual-auth: scheduled or an
  admin "Sync now". See [[Connector Library]].
- **`kpi-watch`** *(service-role only)* — daily (`0 13 * * *`); deterministic,
  no-LLM. Reads `metric_latest`, derives a finding for any KPI whose status is
  `at_risk`/`off_track`, and upserts via `report-ingest`. The in-product
  embodiment of the [[Four-Condition Loop Test]]. See [[KPI-Watch Loop]].

## Shared (`_shared/`)

`cors.ts` (origin allow-list), `cost-ledger.ts` (`logCost`, best-effort, never
blocks), `google-workspace.ts` (OAuth + Drive/Sheets helpers, `drive.file` scope).

## See Also

- [[Harbormill AIOS]]
- [[Supabase]]
- [[Report-Ingest Seam]]
- [[AI Tool Registry]]
- [[Google Workspace Bridge]]
- [[Connector Library]]
- [[KPI-Watch Loop]]
