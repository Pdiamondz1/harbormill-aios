---
title: Assistant Chat Loop
type: concept
created: 2026-06-17
updated: 2026-06-17
sources: [supabase/functions/assistant-chat/index.ts, supabase/migrations/20260617000200_assistant.sql, src/hooks/useAssistant.ts]
tags: [ai, assistant, agentic-loop, security, technical]
---

# Assistant Chat Loop

The agentic orchestration behind [[Aria]], in `supabase/functions/assistant-chat/index.ts`
(user-JWT, requires `has_access` — see [[Access Model]]).

## The loop

1. Persist the user message; load ~**40 turns** of history from `messages`.
2. Call Anthropic (`ANTHROPIC_MODEL`, default `claude-sonnet-4-6`) with the tool
   set ([[AI Tool Registry]]); history carries `cache_control: ephemeral`.
3. While the model returns `tool_use`, run the tool and feed results back — up to
   **8 rounds** (hard cap against infinite loops).
4. Persist the assistant reply; log spend to the [[Cost Ledger]].

## Persistence model

`conversations` (one per user) + `messages` (`role`, `content`, `tool_calls`,
`tool_result`), both RLS-scoped to the owner. The front end reads them via
`src/hooks/useAssistant.ts` (optimistic pending state, refetch on settle).

## Safety

Prompt-injection sanitization filters override attempts ("ignore previous",
"system:", …) and treats tool results as data, not instructions. Tool failures are
reported back gracefully rather than crashing the turn. Grounding comes only from
the [[Report-Ingest Seam]] tables + [[Knowledge & RAG]] — never client business tables.

## See Also

- [[Aria]]
- [[AI Tool Registry]]
- [[Knowledge & RAG]]
- [[Cost Ledger]]
- [[AI Providers]]
