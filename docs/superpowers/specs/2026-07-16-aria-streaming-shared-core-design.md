# Aria streaming shared-core — reconcile PR #21 (streaming) with PR #35 (shared core)

**Date:** 2026-07-16
**Status:** Design approved (Damon, 2026-07-16). Awaiting spec review → implementation plan.
**Owner:** Damon Williams / Harbormill

## 1. Problem

`assistant-chat` — Aria's edge function — exists in three incompatible shapes because two
refactors branched in parallel and never reconciled:

| Where | Architecture | Streams? | Source |
|---|---|---|---|
| **Demo** (`khtlrhtgnwhrhrstivkw`) | #21 streaming engine, self-contained in `assistant-chat/` | ✅ | main (deployed 2026-07-16, v9) |
| **Prod** (`znkoxpwvocxxvrvajmza`) | #35 shared `assistant-core.ts`, non-streaming; also runs `google-chat-webhook` | ❌ | PR #35 (open, unmerged) |
| **main** (git) | #21 streaming engine | ✅ | Merged (#21) |

- **PR #21** (`feat/aria-donny-maturity`, merged) rewrote `assistant-chat` into a **streaming
  NDJSON engine** — `assistant-chat/index.ts` "always streams", `stream-accumulator.ts` assembles
  the final message, `history.ts` does tool-aware replay with pairing repair. The frontend
  (`src/hooks/useAssistant.ts`) reads the stream via `resp.body.getReader()` (commit `622aeb0`).
- **PR #35** (`worktree-HMA-AIOS-prod3`, open) branched **before** #21 and extracted the *old,
  non-streaming* turn into `_shared/assistant-core.ts` (`runAssistantTurn`) so both the deck and a
  new **read-only Google Chat bot** (`google-chat-webhook`) share one core. Streaming was explicitly
  deferred for the Chat bot v1.

The two are now mutually exclusive: **main has streaming but no shared core; prod runs the shared
core but has no streaming.** Deploying either naively to prod leaves two divergent Aria brains (deck
vs Chat) and leaves `main` missing the Chat bot entirely.

## 2. Goal & non-goals

**Goal:** one Aria turn engine — the shared `assistant-core.ts` — that **streams** for the deck and
returns **final text** for the Google Chat bot, so both surfaces run identical logic from a single
codebase in `main`. Then deploy prod once and merge #35.

**Non-goals (this spec):**
- No change to Aria's tools, prompts, or model. This is a **structural** reconciliation, not a
  feature change. **Deck-Aria is the reference engine and does not change.** The Google Chat bot,
  which currently runs #35's older non-streaming core, **inherits the deck's (#21) engine
  parameters** as a deliberate consequence of unifying — see §3.4 for the exact deltas (tool-round
  cap 8→12, extended-thinking budget, "answer now" fallback, a different empty-answer string). These
  are acceptable and intended; the Chat bot's *observable contract* (read-only tools, single-sender
  gate, per-thread conversation, returns a grounded answer) is unchanged.
- No streaming *to* Google Chat (a Chat card renders a whole message; token streaming adds
  complexity for zero user benefit — stays deferred, per #35).
- No repricing, no product/spec changes outside these edge functions and their tests.

## 3. Design — unified streaming core with an optional `emit`

### 3.1 The decomposition boundary

#21's `serve` handler already splits exactly where #35 drew the core boundary: **the caller owns
auth + conversation resolution + transport; the core owns everything after.** The reconciliation
lifts #21's post-auth engine body into `runAssistantTurn`, keeping its streaming.

```
runAssistantTurn(supabase, opts: RunTurnOptions, emit?: (e: AriaEvent) => void): Promise<TurnResult>
```

- `emit` **present** (deck): the core streams from Anthropic and calls `emit({type:"text", delta})`
  per text delta (plus tool-status events, below). The thin deck caller enqueues each event as one
  NDJSON line into its `ReadableStream`.
- `emit` **absent** (Google Chat): the core still streams from Anthropic internally (one code path,
  as #21 already does) but emits nothing; the caller uses only the returned `TurnResult.content`.

The core **always** uses `stream: true` to Anthropic and assembles via `StreamAccumulator`, whose
`finalize()` returns `{ content, stop_reason, usage }` — **the exact shape the non-streaming tool
loop already consumed**. This is what makes the merge a drop-in rather than a rewrite: the tool loop
is unchanged; only the "get one model response" step swaps `await resp.json()` for
`callModelStreaming(body, emit)`.

### 3.2 Types

```ts
export interface RunTurnOptions {
  userId: string;
  conversationId: string;      // must already exist and be owned by userId (caller enforces)
  message: string;
  isAdmin: boolean;
  edgeFunction: string;        // cost-ledger label: "assistant-chat" | "google-chat-webhook"
  toolAllowlist?: ReadonlySet<string>; // Chat bot passes the read-only allowlist
}

export interface TurnResult {
  content: string;             // final assembled assistant text
  actions?: AriaAction[];      // deck action chips; Chat caller ignores
}

// NDJSON events the deck streams to the browser — VERIFIED against index.ts + the
// frontend union in src/lib/aria/stream.ts:1-6 (parsed in src/hooks/useAssistant.ts).
// This is the live contract; preserve every shape exactly.
type AriaEvent =
  | { type: "heartbeat" }                              // index.ts:288 (first-byte flush) + :289 (15s); frontend ignores
  | { type: "text"; delta: string }                    // index.ts:196; frontend: acc += ev.delta
  | { type: "status"; tool: string; label: string }    // index.ts:331-334, ONE event per tool at exec start (NOT start/done phases)
  | { type: "done"; content: string; actions: AriaAction[] } // index.ts:414 — actions ride HERE, not a standalone event
  | { type: "error"; message: string };                // index.ts:418 — field is `message`, not `error`
```

> **This union was corrected in spec review** — the earlier draft had four of six shapes wrong.
> Do NOT emit a standalone `{type:"actions"}` event and do NOT rename `status`→`tool` or
> `message`→`error`: the frontend (`stream.ts:1-6`, `useAssistant.ts:104-115`) parses exactly the
> five shapes above and silently no-ops anything else (a wrong `status` shape kills the
> "Searching the knowledge base…" indicator; actions off anything but `done` are dropped).

### 3.3 Persistence & history contract (the one subtle reconciliation point)

#21's `reconstructHistory` (kept — it is strictly better than #35's plain last-40 load) requires the
tool loop to persist, per round:
- the **assistant tool-use turn** with `tool_calls =` the assistant content array **with
  `thinking`/`redacted_thinking` blocks stripped** (`index.ts:319-321` — replaying thinking
  signatures on a later request can 400; keep the strip, do not persist raw `result.content`), and
- each **tool result** as a `role:"tool"` row with `content = tool_use_id`, `tool_result = output`.

#35's `runAssistantTurn` persisted the tool rows but **not** the assistant `tool_calls` turn, relying
on a simpler history load that ignored tool rows. The unified core **must adopt #21's persistence
shape** so `reconstructHistory` (with its `enforceToolPairing` repair) replays correctly. This is the
single behavioural detail that must not be dropped in the merge.

History load: 60 rows, roles `user|assistant|tool`, columns `role, content, tool_calls, tool_result`,
ordered by `created_at`, then `reconstructHistory(...)`.

### 3.4 Callers become thin

**`assistant-chat/index.ts` (deck):** OPTIONS/CORS → validate session (`getUser`) → require
admin/stakeholder role → parse body → **validate blank/over-length input and return a clean 400 JSON
BEFORE opening the stream** (`index.ts:239-244`; the frontend's `if (!resp.ok)` path expects a 400,
not a 200 NDJSON error event) → **conversation ownership check** → build `ReadableStream` with 15s
heartbeat and a `send` enqueuer → `runAssistantTurn(supabase, opts, send)` → on resolve emit a single
`{type:"done", content, actions}` (actions ride on `done` — there is no standalone actions event) and
close; on throw emit `{type:"error", message}`. Response `Content-Type: application/x-ndjson`. Auth
stays self-handled ⇒ deploy `--no-verify-jwt`.

**`google-chat-webhook/index.ts` (Chat):** observable contract unchanged — verify Google's signed JWT
→ single-sender identity gate → resolve/create the per-thread conversation (`external_ref`, idempotent
migration) → `runAssistantTurn(supabase, {..., edgeFunction:"google-chat-webhook", toolAllowlist:
READ_ONLY})` (**no `emit`**) → format `content` into a Chat card. Because it passes no `emit`, the
lifted core's streaming callback **must be optional** (`emit?.({type:"text",...})` — #21's
`callModelStreaming` currently *requires* the callback; guard it). The Chat turn does inherit #21's
engine parameters (§2 non-goal): `MAX_TOOL_ROUNDS` 8→12, extended-thinking budget +
`MAX_OUTPUT_TOKENS`/`TOKEN_SAFETY_NET` "answer now" fallback, and a different empty-answer string.
Intended; not a contract change.

### 3.5 Shared pieces live in the core / `_shared`

`systemPrompt`, `sanitize`/`INJECTION_PATTERNS`, `DISABLED_TOOLS`, `MAX_TOOL_ROUNDS`,
`MAX_INPUT_LENGTH` (**`export`ed** — the deck imports it for its pre-stream 400 so the two never
drift), `STATUS_LABELS` (the per-tool status-event labels, consumed inside the tool loop that now
lives in the core), `withHistoryCacheBreakpoint`, `extractText`, `anthropic()` wrapper, cost ledger,
and #21's `THINKING_BUDGET`/`MAX_OUTPUT_TOKENS`/`TOKEN_SAFETY_NET` — all move into (or stay in)
`assistant-core.ts`. **Where #21 and #35 both define a constant, #21's value wins** (the deck is the
reference engine): notably `MAX_TOOL_ROUNDS = 12` (not #35's 8). `stream-accumulator.ts` and
`history.ts` **move** from `assistant-chat/` into `_shared/` **with their `_test.ts` files** (the
tests import `./history.ts`/`./stream-accumulator.ts` relatively, so co-moving keeps imports valid).
The thin deck `index.ts` then **drops** its `./history.ts`/`./stream-accumulator.ts` imports
(`index.ts:17-18`) — only the core imports them now, from `../_shared/`. `tools.ts` stays at
`assistant-chat/tools.ts` (main's superset, incl. `suggest_actions`).

## 4. Files touched

- `supabase/functions/_shared/assistant-core.ts` — **rewrite** to the streaming engine above.
- `supabase/functions/_shared/stream-accumulator.ts` — **moved** from `assistant-chat/` (+ test).
- `supabase/functions/_shared/history.ts` — **moved** from `assistant-chat/` (+ test).
- `supabase/functions/assistant-chat/index.ts` — **thin streaming caller** (resolves the #21↔#35 conflict).
- `supabase/functions/google-chat-webhook/index.ts` — from #35, re-pointed at the new core (contract unchanged).
- `supabase/functions/_shared/google-chat.ts` — from #35, unchanged.
- `supabase/functions/_shared/aria-chat-tools.ts` — from #35, **MODIFIED**: add `suggest_actions` to
  `CHAT_EXCLUDED_TOOL_NAMES`. Main's `tools.ts` has 14 tools; #35's allowlist only classifies 13, so
  against the superset `aria-chat-tools.test.ts` finds `unclassified === ["suggest_actions"]` and the
  Vitest gate **fails**. `suggest_actions` drives deck action-chips — meaningless to the read-only
  Chat surface — so it belongs in the excluded set. **This is a required change, not "unchanged."**
- `supabase/functions/assistant-chat/tools.ts` — main's version (superset), unchanged.
- `supabase/migrations/20260624000100_conversations_external_ref.sql` — from #35 (Chat thread mapping; idempotent).
- `supabase/seed.sql` (+73/−32) and `.gitignore` (+3) — also carried from #35; main touched neither
  since the merge-base, so both merge clean. Listed for completeness; review the seed delta on merge.
- Tests: `src/test/{google-chat,aria-chat-tools}.test.ts` (from #35) + the Deno `_test.ts` files that
  co-move with accumulator/history into `_shared/` + a new core-turn test (§8 risk coverage).

## 5. Sequencing & merge strategy

1. Branch from current `main`.
2. Bring #35's net-new files onto the branch (rebase `worktree-HMA-AIOS-prod3` on main, or cherry-pick
   its non-conflicting additions): `assistant-core.ts`, `google-chat-webhook/`, `google-chat.ts`,
   `aria-chat-tools.ts`, the migration, the two Vitest tests. **The only real conflict is
   `assistant-chat/index.ts`** (#21 streaming vs #35 thin caller) — resolved *by this design*, not by
   picking a side: it becomes the thin streaming caller in §3.4.
3. Implement §3 (rewrite the core to stream; move accumulator/history to `_shared`; thin both callers).
4. Gate (§6).
5. Deploy prod once (§7).
6. Damon merges #35 → main (his standing merge-approval gate).

## 6. Verification gate

Root app is unaffected in behaviour but must prove no regression:
```
npm run typecheck && npm run lint && npm run test && npm run build
```
Edge functions are Deno (not in the npm gate) — validate explicitly:
```
deno check supabase/functions/assistant-chat/index.ts
deno check supabase/functions/google-chat-webhook/index.ts
deno test supabase/functions/_shared/       # accumulator + history unit tests
```
Existing Deno unit tests for `stream-accumulator` and `history` must pass unchanged after the move.
The Vitest tool-partition test (`aria-chat-tools.test.ts`) must still classify every tool in the
(superset) `tools.ts` as read or write — a new tool with no classification fails the build by design.

## 7. Deploy & rollback

- Deploy **both** functions to prod (`znkoxpwvocxxvrvajmza`) via the authenticated Supabase CLI,
  preserving `--no-verify-jwt` (both self-authenticate):
  `supabase functions deploy assistant-chat --project-ref znkoxpwvocxxvrvajmza --no-verify-jwt`
  `supabase functions deploy google-chat-webhook --project-ref znkoxpwvocxxvrvajmza --no-verify-jwt`
  (The auto-mode classifier gates each deploy — needs Damon's per-action approval.)
- Also redeploy **demo** from the unified branch so demo and prod converge (demo currently runs the
  self-contained #21 build; functionally identical, but keep the source aligned).
- **Smoke:** unauth POST → 401 on both; then an authenticated deck chat streams token-by-token; then a
  Google Chat DM returns a grounded answer (Damon, once #35's secrets are set).
- **Rollback:** the prior prod `assistant-chat` (v7) and `google-chat-webhook` (v1) bundles are
  captured via `get_edge_function`; redeploy from the pre-merge commit if needed. Prod deploy happens
  only after the full gate passes.

## 8. Risks

- **NDJSON event contract drift** — if the unified deck caller changes any event shape, the live
  frontend breaks. Mitigation: inventory #21's events from the file and preserve them; the deck
  frontend is the contract.
- **History pairing regressions** — the tool_calls persistence detail (§3.3) is the likeliest place
  to silently break multi-tool conversations. Mitigation: the core-turn test must cover a two-round
  tool conversation and assert the next turn's replayed history is well-formed.
- **Google Chat behaviour change** — the webhook must stay byte-equivalent in behaviour. Mitigation:
  #35's `google-chat` + `aria-chat-tools` tests ride along unchanged and must pass.

## 9. Out of scope (deferred)

Streaming to Google Chat; write/actions from Chat; multi-user Chat account-linking; any Aria
feature/tool/prompt change; anything outside these edge functions, their tests, and the one migration.
