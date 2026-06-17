---
title: Cost Ledger
type: concept
created: 2026-06-17
updated: 2026-06-17
sources: [supabase/migrations/20260617000200_assistant.sql, supabase/functions/_shared/cost-ledger.ts]
tags: [ai, cost, observability, technical]
---

# Cost Ledger

AI-spend accounting for [[Harbormill AIOS]]. The `cost_ledger` table
(`supabase/migrations/20260617000200_assistant.sql`) records token usage per
**user × model × edge-function**, indexed `(created_at desc)`; admin-only read
([[Access Model]]).

## How it's written

`supabase/functions/_shared/cost-ledger.ts` exports `logCost(supabase, {
userId?, edgeFunction, model, inputTokens, outputTokens? })`. It is **best-effort
— it never blocks or fails the caller**. Two writers today:

- [[Assistant Chat Loop]] — logs input/output tokens per turn (model
  `claude-sonnet-4-6`).
- [[Knowledge & RAG]] — logs approximate embedding tokens on sync (model
  `text-embedding-3-small`).

## Why it exists

It makes per-client AI spend auditable — useful for the operator running their own
keys ([[Per-Client Deployment]]) and a foundation for spend caps/alerts.

## See Also

- [[Assistant Chat Loop]]
- [[AI Providers]]
- [[Edge Functions]]
- [[Harbormill AIOS]]
