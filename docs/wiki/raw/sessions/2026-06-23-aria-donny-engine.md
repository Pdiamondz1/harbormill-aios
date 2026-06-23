# Session extract — Aria "Donny-grade" engine (M1) + M2 comms roadmap

Date: 2026-06-23
Branch/PR: `feat/aria-donny-maturity` → **PR #21** (open against `main`; NOT yet merged — live
deploy + browser e2e pending). Plan: `docs/superpowers/plans/2026-06-21-aria-donny-maturity.md`.

## Context

Damon is building Harbormill Automation's own AIOS (eventually `aios.harbormill.net`) by maturing
the **base template** so improvements flow to all clients via `upstream`. Reference for maturity is
DragonCandy's "Donny". Roadmap: **M1** assistant engine → **M2** comms layer → **M3** business
domains → deploy. This session executed M1 and began M2.

## What was built (M1 — Aria engine upgrade, in `supabase/functions/assistant-chat/`)

Five upgrades, **no DB migration** (`messages` already had `tool_calls`/`tool_result`):

1. **NDJSON streaming + live tool-status.** The function now streams a `ReadableStream` of
   newline-delimited JSON events — `status` (e.g. "Reading the latest metrics…"), `text` (token
   deltas), `heartbeat` (15s), `done`, `error` — instead of one buffered JSON reply. New pure module
   `stream-accumulator.ts` assembles Anthropic SSE events (incl. `input_json_delta` → tool_use
   input, and thinking blocks). Frontend reads it via `parseNdjson` (`src/lib/aria/stream.ts`) in
   `useAssistant.ts`, rendering incrementally in `AriaChatView`.
2. **Tool-aware memory + pairing repair.** New pure module `history.ts` (`reconstructHistory`)
   replays prior `tool_use`/`tool_result` turns (assistant tool-use turns are now persisted to
   `tool_calls`, previously dropped). `enforceToolPairing` drops orphaned tool_use/tool_result
   blocks so a truncated window can never 400/422 the API, and **never emits an empty-content turn**.
   History window raised ~40→60 rows.
3. **Loop hardening.** `MAX_TOOL_ROUNDS` 8→12, a `TOKEN_SAFETY_NET` (300k), and a post-budget
   "answer now" no-tools fallback that answers **every** pending tool_use (avoids both empty bubbles
   and a multi-tool-call 400).
4. **Agentic action chips.** New `suggest_actions` tool → `{label, route}` chips rendered by
   `AriaActionChips` (route-based, distinct from the prompt-based `AriaQuickChips`).
5. **Opus + extended thinking.** Env-configurable: `ANTHROPIC_MODEL` (base default
   `claude-sonnet-4-6`; Harbormill's deploy uses Opus), `ANTHROPIC_THINKING_BUDGET` (0 = off;
   >0 enables thinking + auto-raises `max_tokens`), `ANTHROPIC_MAX_TOKENS`. **Thinking rule:** kept
   verbatim (thinking-first) within the live tool loop; stripped from the persisted `tool_calls` so
   future `reconstructHistory` replay can't ship stale thinking signatures. With budget=0 the path
   is behaviorally identical to the prior plain tool-use loop.

All M1 security guards preserved (auth, role gating, conversation ownership, injection `sanitize()`,
`DISABLED_TOOLS`, `MAX_INPUT_LENGTH`, `logCost` on every call, prompt-cache breakpoint) — all fire
before the stream starts.

## Key decisions / learnings

- **DragonCandy's "orchestrator" is not multi-LLM** — it is one loop with domain-grouped tools that
  return `{context, suggested_actions}`, which M1's single loop + `suggest_actions` already covers.
  A real sub-agent orchestrator was **deferred** (YAGNI).
- A plan-mandated test would have forced an empty-content user turn (Anthropic **422** in prod);
  surfaced to Damon, corrected the test + the repair to drop emptied turns.
- An "answer now" fallback that answered only the first pending tool_use would 400 on parallel tool
  calls; fixed to answer all.
- Edge functions are Deno (excluded from vitest); pure modules tested with `deno test`. Installed
  deno 2.8.3 (winget). Static gate green: deno 11/11, vitest 44/44, build/typecheck/lint clean.
- Out-of-scope but kept: `eslint.config.js` now ignores `.claude/worktrees/**` + `website/**`
  (nested worktrees + the separate Vite app shouldn't be linted by the root config).

## M2 — comms layer (decomposed; design begun, then PAUSED)

Slices: **Gmail+Calendar tools → triage scheduler → Google Chat channel.** Orchestrator deferred.

**M2a (Aria Gmail + Calendar) — design agreed, not yet written/built:**
- Extend `_shared/google-workspace.ts` `GOOGLE_SCOPES` with `gmail.readonly`, `gmail.compose`,
  `gmail.send`, `calendar.events` (one re-consent; `prompt:"consent"` already forces it). Gmail are
  Google **restricted** scopes — fine for per-client internal Workspace use.
- New focused helpers `_shared/google-gmail.ts` + `_shared/google-calendar.ts` (reuse
  `getValidAccessToken`). 7 Aria tools in `tools-gmail.ts`/`tools-calendar.ts`: triage_inbox,
  get_email, draft_email, send_draft, list_calendar_events, create_calendar_event,
  update_calendar_event.
- **Email send = drafts + confirm-to-send:** `draft_email` creates a real Gmail draft (shown);
  `send_draft(draft_id)` sends it only after explicit confirmation — strict system-prompt rule like
  `propose_correction`. Never silent auto-send.
- Out of M2a: triage scheduler (cron+scoring), Google Chat channel, gmail.modify archive/label,
  new frontend inbox/calendar UI.
