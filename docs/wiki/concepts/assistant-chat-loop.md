---
title: Assistant Chat Loop
type: concept
created: 2026-06-17
updated: 2026-06-23
sources: [supabase/functions/assistant-chat/index.ts, supabase/functions/assistant-chat/history.ts, supabase/functions/assistant-chat/stream-accumulator.ts, supabase/migrations/20260617000200_assistant.sql, src/hooks/useAssistant.ts, src/lib/aria/stream.ts]
tags: [ai, assistant, agentic-loop, streaming, security, technical]
---

# Assistant Chat Loop

The agentic orchestration behind [[Aria]], in `supabase/functions/assistant-chat/index.ts`
(user-JWT, requires `has_access` — see [[Access Model]]).

> **Status:** the "Donny-grade" engine below (streaming, tool-aware memory, extended thinking,
> loop hardening, action chips) is implemented in **PR #21** (`feat/aria-donny-maturity`) and
> **pending live e2e + merge** as of 2026-06-23 — not yet deployed to the demo. No DB migration was
> needed (`messages` already had `tool_calls`/`tool_result`).

## The loop

1. Persist the user message; rebuild ~**60 turns** of history with `history.ts`
   (`reconstructHistory`) — including prior `tool_use`/`tool_result` turns, with **pairing repair**
   (`enforceToolPairing` drops orphaned tool blocks so a truncated window can never 400/422 the API,
   and never emits an empty-content turn).
2. Call Anthropic (`ANTHROPIC_MODEL`; base default `claude-sonnet-4-6`, Harbormill's deploy uses
   Opus) with the tool set ([[AI Tool Registry]]); the system block + history carry
   `cache_control: ephemeral`.
3. While the model returns `tool_use`, run the tool and feed results back — up to **12 rounds**,
   bounded also by a `TOKEN_SAFETY_NET`. A post-budget **"answer now"** no-tools fallback answers
   every pending tool_use so a long chain never returns an empty bubble.
4. Persist the assistant reply; log spend to the [[Cost Ledger]].

## Streaming

The function returns a `ReadableStream` of newline-delimited JSON (`application/x-ndjson`), not one
buffered reply. Events: `status` (live tool labels, e.g. "Searching the knowledge base…"), `text`
(token deltas), `heartbeat` (15s), `done` (final text + `actions`), `error`. The pure
`stream-accumulator.ts` assembles Anthropic SSE events (incl. `input_json_delta` → tool_use input
and thinking blocks); the front end consumes it via `parseNdjson` (`src/lib/aria/stream.ts`) in
`src/hooks/useAssistant.ts`, rendering incrementally. Action chips ride the `done` event and render
as route-based buttons (`AriaActionChips`).

## Extended thinking

`ANTHROPIC_THINKING_BUDGET` (0 = off) enables Anthropic extended thinking and auto-raises
`max_tokens` above the budget. **Rule:** thinking blocks are kept verbatim (thinking-first) within
the live tool loop — required so the thinking immediately precedes its tool_use when results are
returned — but **stripped from the persisted `tool_calls`** so future `reconstructHistory` replay
can't ship stale thinking signatures. With budget 0 the path is identical to plain tool-use.

## Persistence model

`conversations` (one per user) + `messages` (`role` ∈ user/assistant/tool, `content`, `tool_calls`,
`tool_result`), RLS-scoped to the owner. Assistant tool-use turns are now persisted to `tool_calls`
(previously only the final text was kept), which is what makes the tool-aware replay possible.

## Safety

Prompt-injection sanitization filters override attempts ("ignore previous", "system:", …) and treats
tool results as data, not instructions. All guards — auth, role gating, conversation ownership,
`sanitize()`, `DISABLED_TOOLS`, `MAX_INPUT_LENGTH`, `logCost` — fire **before** the stream starts.
Tool failures are reported back gracefully. Grounding comes only from the [[Report-Ingest Seam]]
tables + [[Knowledge & RAG]] — never client business tables.

## See Also

- [[Aria]]
- [[AI Tool Registry]]
- [[Knowledge & RAG]]
- [[Cost Ledger]]
- [[AI Providers]]
