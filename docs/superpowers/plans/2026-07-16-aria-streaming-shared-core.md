# Aria Streaming Shared-Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify Aria's `assistant-chat` into one streaming engine — the shared `_shared/assistant-core.ts` — that streams NDJSON for the deck and returns final text for the Google Chat bot, so both surfaces run identical logic from one codebase in `main`.

**Architecture:** Lift PR #21's post-auth streaming engine into `runAssistantTurn(supabase, opts, emit?)`. `emit` present ⇒ deck streams; `emit` absent ⇒ Chat uses `TurnResult.content`. The core always streams to Anthropic (`stream:true`) and assembles via `StreamAccumulator`, whose `finalize()` returns the same `{content, stop_reason, usage}` shape the tool loop already consumes. Callers stay thin: they own auth, conversation resolution, and transport (deck = `ReadableStream`; Chat = card).

**Tech Stack:** Deno edge functions (Supabase), TypeScript, Anthropic Messages API (streaming SSE), Vitest (frontend/tool tests), `deno test` (accumulator/history unit tests).

**Spec:** `docs/superpowers/specs/2026-07-16-aria-streaming-shared-core-design.md` — read it before starting. This plan implements it; where they disagree, the spec wins (or flag it).

**Branch:** `docs/aria-streaming-shared-core` (already created off `main`; the spec + this plan are already committed here).

---

## Orientation — read these before Task 1

The two source architectures already exist in the repo; you are merging them, not writing from scratch:

- **#21 (streaming, on `main` = your branch base):**
  - `supabase/functions/assistant-chat/index.ts` — the full streaming engine + `serve` handler (auth, ReadableStream, tool loop, persistence). ~430 lines.
  - `supabase/functions/assistant-chat/stream-accumulator.ts` — SSE → assembled message. Pure, unit-tested.
  - `supabase/functions/assistant-chat/history.ts` — `reconstructHistory(rows)` + `StoredRow`. Pure, unit-tested.
  - `supabase/functions/assistant-chat/{history_test.ts, stream-accumulator_test.ts}` — Deno tests.
  - Frontend contract: `src/lib/aria/stream.ts` (event union) + `src/hooks/useAssistant.ts` (parser). **Do not change these** — they are the live contract you preserve.
- **#35 (shared core, on branch `pr-35-check` — fetched from PR #35 head; inspect with `git show pr-35-check:<path>`):**
  - `supabase/functions/_shared/assistant-core.ts` — `runAssistantTurn` (non-streaming). You rewrite this.
  - `supabase/functions/google-chat-webhook/index.ts` — the Chat webhook. Thin; calls the core.
  - `supabase/functions/_shared/google-chat.ts` — `parseChatEvent`, `isAllowedSender`.
  - `supabase/functions/_shared/aria-chat-tools.ts` — read-only tool allowlist for Chat.
  - `supabase/migrations/20260624000100_conversations_external_ref.sql` — Chat thread → conversation mapping.
  - `src/test/{google-chat,aria-chat-tools}.test.ts` — Vitest.
  - Also carries `supabase/seed.sql` (+73/−32) and `.gitignore` (+3) — clean, ride along.

**The verified NDJSON event union (preserve exactly — spec §3.2):**
```ts
| { type: "heartbeat" }
| { type: "text"; delta: string }
| { type: "status"; tool: string; label: string }     // one per tool at exec start
| { type: "done"; content: string; actions: AriaAction[] }  // actions ride on done
| { type: "error"; message: string }
```

**File structure after this plan (final state):**
- `_shared/assistant-core.ts` — the one streaming engine (`runAssistantTurn`, `emit?`).
- `_shared/stream-accumulator.ts` + `_shared/history.ts` (+ their `_test.ts`) — moved here from `assistant-chat/`.
- `_shared/google-chat.ts`, `_shared/aria-chat-tools.ts` — from #35 (aria-chat-tools modified).
- `assistant-chat/index.ts` — thin streaming caller.
- `assistant-chat/tools.ts` — unchanged (main superset).
- `google-chat-webhook/index.ts` — thin non-streaming caller.

---

## Task 1: Merge #35's additions onto the branch

**Files:**
- Merge into branch: all #35 net-new files (listed in Orientation).
- Resolve conflict: `supabase/functions/assistant-chat/index.ts` — **keep main's #21 streaming version** (you rewrite it in Task 5; do not adopt #35's thin caller here).

- [ ] **Step 1: Confirm you are on the work branch**

Run: `git branch --show-current`
Expected: `docs/aria-streaming-shared-core`

- [ ] **Step 2: Merge #35's head into the branch**

Run: `git merge --no-commit --no-ff pr-35-check`
Expected: a conflict on `supabase/functions/assistant-chat/index.ts` only (per spec §5; `tools.ts` does NOT conflict). If other conflicts appear, STOP and reconcile against the spec before continuing.

- [ ] **Step 3: Resolve the index.ts conflict to main's version**

Run: `git checkout --ours supabase/functions/assistant-chat/index.ts && git add supabase/functions/assistant-chat/index.ts`
(`--ours` = the branch tip = main's #21 streaming index.ts. This is intentional and temporary.)

- [ ] **Step 4: Verify the tree now has both architectures**

Run: `ls supabase/functions/_shared/assistant-core.ts supabase/functions/google-chat-webhook/index.ts supabase/functions/_shared/aria-chat-tools.ts supabase/migrations/20260624000100_conversations_external_ref.sql`
Expected: all four exist. Also confirm `supabase/functions/assistant-chat/stream-accumulator.ts` still exists (main's). (The merge also brings 4 harmless pr-35 doc files under `docs/superpowers/{plans,specs}/2026-06-24-*` and `seed.sql`/`.gitignore` — expected, ignore.)

- [ ] **Step 5: Commit the merge**

```bash
git commit -m "merge #35 additions onto streaming base (index.ts kept as #21 streaming)"
```

- [ ] **Step 6: Establish the failing baseline**

Run: `npm install && npm run test 2>&1 | tail -30`
Expected: `src/test/aria-chat-tools.test.ts` **FAILS** — `unclassified === ["suggest_actions"]` (main's 14th tool is unclassified by #35's allowlist). This failure is expected and is fixed in Task 2. Other suites should pass.

---

## Task 2: Classify `suggest_actions` in the Chat allowlist (make the gate green)

**Files:**
- Modify: `supabase/functions/_shared/aria-chat-tools.ts` (add to `CHAT_EXCLUDED_TOOL_NAMES`)
- Test: `src/test/aria-chat-tools.test.ts` (existing — must go green)

- [ ] **Step 1: Run the failing test in isolation**

Run: `npm run test -- src/test/aria-chat-tools.test.ts 2>&1 | tail -20`
Expected: FAIL, `unclassified` contains `"suggest_actions"`.

- [ ] **Step 2: Read the allowlist to find the excluded-set constant**

Run: `git show HEAD:supabase/functions/_shared/aria-chat-tools.ts` (or open the file). Locate `CHAT_EXCLUDED_TOOL_NAMES` (the write/deck-only set). `suggest_actions` drives deck action-chips and is meaningless to the read-only Chat surface, so it belongs in the EXCLUDED set (not the read allowlist).

- [ ] **Step 3: Add `suggest_actions` to `CHAT_EXCLUDED_TOOL_NAMES`**

Add the string `"suggest_actions"` to that set/array, matching the file's existing formatting and any inline comment convention (note briefly: deck-only action-chip tool).

- [ ] **Step 4: Verify the test passes**

Run: `npm run test -- src/test/aria-chat-tools.test.ts 2>&1 | tail -20`
Expected: PASS (`unclassified === []`).

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/aria-chat-tools.ts
git commit -m "fix(aria-chat): classify suggest_actions as deck-only (Chat excluded)"
```

---

## Task 3: Move `stream-accumulator.ts` + `history.ts` into `_shared/`

**Files:**
- Move: `assistant-chat/stream-accumulator.ts` → `_shared/stream-accumulator.ts` (+ `_test.ts`)
- Move: `assistant-chat/history.ts` → `_shared/history.ts` (+ `_test.ts`)
- Modify (temporarily): `assistant-chat/index.ts:17-18` import paths → `../_shared/…` (index.ts is rewritten in Task 5, but must compile now)

- [ ] **Step 1: git-move the four files (preserves the relative `./` imports inside the `_test.ts` files)**

```bash
git mv supabase/functions/assistant-chat/stream-accumulator.ts supabase/functions/_shared/stream-accumulator.ts
git mv supabase/functions/assistant-chat/stream-accumulator_test.ts supabase/functions/_shared/stream-accumulator_test.ts
git mv supabase/functions/assistant-chat/history.ts supabase/functions/_shared/history.ts
git mv supabase/functions/assistant-chat/history_test.ts supabase/functions/_shared/history_test.ts
```

- [ ] **Step 2: Fix the two imports in the (still-#21) deck index.ts so the tree compiles**

In `supabase/functions/assistant-chat/index.ts`, change lines 17–18 from `./history.ts` / `./stream-accumulator.ts` to `../_shared/history.ts` / `../_shared/stream-accumulator.ts`.

- [ ] **Step 3: Verify the Deno unit tests still pass from their new home**

Run: `deno test supabase/functions/_shared/history_test.ts supabase/functions/_shared/stream-accumulator_test.ts`
Expected: all pass (the `_test.ts` files import `./history.ts` / `./stream-accumulator.ts` relatively, which now resolve within `_shared/`).

- [ ] **Step 4: Verify the deck function still type-checks**

Run: `deno check supabase/functions/assistant-chat/index.ts`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add -A supabase/functions/
git commit -m "refactor(aria): move stream-accumulator + history into _shared/"
```

---

## Task 4: Rewrite `_shared/assistant-core.ts` as the streaming engine (TDD)

This is the core task. The new `runAssistantTurn(supabase, opts, emit?)` absorbs #21's engine: streaming model call (optional `emit`), the tool loop, #21's persistence shape (assistant `tool_calls` = thinking-stripped content array; tool rows keyed by `tool_use_id`), `reconstructHistory` (60 rows), and #21's constant values (`MAX_TOOL_ROUNDS = 12`, thinking budget, `MAX_OUTPUT_TOKENS`, `TOKEN_SAFETY_NET`).

**Files:**
- Rewrite: `supabase/functions/_shared/assistant-core.ts`
- Test (create): `supabase/functions/_shared/assistant-core_test.ts`

- [ ] **Step 1: Write the failing core-turn test**

Create `supabase/functions/_shared/assistant-core_test.ts`. **Stub strategy (there is NO DI seam):** `anthropic-fetch.ts` calls the global `fetch` directly, so intercept by overriding `globalThis.fetch` in the test to return a canned SSE `Response` (`new Response(body, {headers:{"content-type":"text/event-stream"}})` where `body` is a `ReadableStream` of `data: {...}\n\n` lines). The fake `supabase` never calls `fetch`, so only the Anthropic call is intercepted. Use a fake `supabase` that records `insert`s and returns a scripted `messages` history on `select`. Script a **two-round tool conversation**: response 1 = a `tool_use` block (`stop_reason:"tool_use"`), response 2 = final text (`stop_reason:"end_turn"`). Assert:
  1. `runAssistantTurn` returns `{ content: <final text> }`.
  2. When an `emit` spy is passed, it received `{type:"text", delta}` events whose concatenation equals the final text, **and** at least one `{type:"status", tool, label}` event for the tool round.
  3. When `emit` is omitted, the call still resolves to the same `{content}` (no throw — the emit callback must be optional).
  4. **Persistence shape:** the recorded inserts include an assistant row with `tool_calls` set to the round-1 content array **with any `thinking` block stripped**, and a `role:"tool"` row with `content === <tool_use_id>` and `tool_result` set. (This is what `reconstructHistory` needs on the next turn — spec §3.3.)

**Env caveat (critical):** the core does `const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")` **at module load**, and `runAssistantTurn` throws `"ANTHROPIC_API_KEY not configured"` if it's falsy. `Deno.env.set` in the test body runs too late (after import evaluation), so the key MUST be present in the launch environment. Run every core test as `ANTHROPIC_API_KEY=test deno test --allow-env …`.

Keep the SSE fixture small; reuse `parseSseLines`/`StreamAccumulator` shapes from `_shared/stream-accumulator.ts` for realistic events (`message_start`, `content_block_start`, `content_block_delta`/`text_delta`, `content_block_start`/`tool_use`, `input_json_delta`, `content_block_stop`, `message_delta` with `stop_reason`).

- [ ] **Step 2: Run the test to verify it fails**

Run: `ANTHROPIC_API_KEY=test deno test --allow-env supabase/functions/_shared/assistant-core_test.ts`
Expected: FAIL on the assertions (current `runAssistantTurn` is non-streaming, has no `emit` param, and does not persist `tool_calls`). Note: without `--allow-env` this fails with a `NotCapable` permission error instead — that is a setup error, not the intended red.

- [ ] **Step 3: Port #21's streaming primitive into the core, with optional emit**

Into `assistant-core.ts`, add `callModelStreaming(body, emit?)` copied from `assistant-chat/index.ts:180-200`, but make emit optional: `if (textDelta) emit?.({ type: "text", delta: textDelta });`. It returns `acc.finalize()` (shape `{content, stop_reason, usage}`). Import `StreamAccumulator, parseSseLines` from `./stream-accumulator.ts` and `reconstructHistory, StoredRow` from `./history.ts`.

- [ ] **Step 4: Rewrite `runAssistantTurn` to use the streaming loop + #21 persistence**

Signature: `runAssistantTurn(supabase, opts: RunTurnOptions, emit?: (e: unknown) => void): Promise<{ content: string; actions?: unknown[] }>`.
**Lift these #21 module-level pieces from `assistant-chat/index.ts` into the core** (the tool loop moving here depends on them): `STATUS_LABELS` (`index.ts:49-64`, consumed at `:333`), plus `MAX_TOOL_ROUNDS`, `MAX_INPUT_LENGTH` (**`export` it** so the deck can import it for its pre-stream 400 — Task 5), the thinking-budget constants (`THINKING_BUDGET`/`MAX_OUTPUT_TOKENS`/`TOKEN_SAFETY_NET`), `sanitize`/`INJECTION_PATTERNS`, `systemPrompt`, `DISABLED_TOOLS`, `withHistoryCacheBreakpoint`, `extractText`. Where #21 and #35 both define one, **#21's value wins** (esp. `MAX_TOOL_ROUNDS = 12`, not #35's 8).
Body (adapt from #21's `serve` handler body, everything AFTER auth/ownership — `index.ts` ~254-420):
  - validate `message` (blank / `MAX_INPUT_LENGTH`) → throw `AssistantInputError` (callers translate; the DECK caller validates BEFORE calling — see Task 5 — so this is a defense-in-depth guard for non-deck callers).
  - `sanitize` + insert user message.
  - load 60 rows (`role, content, tool_calls, tool_result`, roles `user|assistant|tool`) → `reconstructHistory`.
  - filter tools (`isAdmin`, `DISABLED_TOOLS`, and `toolAllowlist` when set).
  - build request with `stream: true` + system (cache breakpoint) + thinking budget (#21 values).
  - loop (`MAX_TOOL_ROUNDS = 12`): `result = await callModelStreaming(body, emit)`; `logCost`; if `stop_reason==="tool_use"`, for each tool_use: **emit `{type:"status", tool: tu.name, label: STATUS_LABELS[tu.name] ?? <default>}` via `emit?.()`** (mirror `index.ts:330-334`), **capture deck action chips from the tool_use INPUT** — `if (tu.name === "suggest_actions") capturedActions = (tu.input?.actions ?? []).slice(0, 3)` (per `index.ts:336`; it is the tool-use `input`, NOT the tool result) — execute the tool, **persist assistant `tool_calls` (thinking-stripped, per `index.ts:319-321`)** + tool rows, push to `claudeMessages`, continue.
  - final `content = extractText(result.content)` (+ empty fallback; apply the answer-now token fallback per `index.ts:377-403`), persist assistant reply, bump `conversations.last_message_at`.
  - return `{ content, actions: capturedActions }`.
Keep `RunTurnOptions` as-is (userId, conversationId, message, isAdmin, edgeFunction, toolAllowlist?).

- [ ] **Step 5: Run the test to verify it passes**

Run: `ANTHROPIC_API_KEY=test deno test --allow-env supabase/functions/_shared/assistant-core_test.ts`
Expected: PASS (all four assertions).

- [ ] **Step 6: Type-check the core**

Run: `deno check supabase/functions/_shared/assistant-core.ts`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/_shared/assistant-core.ts supabase/functions/_shared/assistant-core_test.ts
git commit -m "feat(aria): streaming shared core — runAssistantTurn with optional emit"
```

---

## Task 5: Thin the deck `assistant-chat/index.ts` to call the core

**Files:**
- Rewrite: `supabase/functions/assistant-chat/index.ts`

- [ ] **Step 1: Rewrite the handler to delegate to the core**

New `index.ts` responsibilities (transport + auth only):
  - OPTIONS/CORS; `ANTHROPIC_API_KEY` presence → 500.
  - Auth: `getUser(token)` → 401; require admin/stakeholder role → 403 (keep `index.ts:213-228` logic).
  - Parse body (`conversation_id`, `message`).
  - **Validate blank / `MAX_INPUT_LENGTH` → return 400 JSON BEFORE opening the stream** (preserve `index.ts:239-244`; the frontend `if(!resp.ok)` path depends on a real 400, not a mid-stream error event — spec §3.4). Import `MAX_INPUT_LENGTH` from the core (`../_shared/assistant-core.ts`, exported in Task 4) rather than redefining it, so the deck's pre-check and the core's guard never drift.
  - Conversation ownership check → 403.
  - Build `ReadableStream`: emit `{type:"heartbeat"}` immediately + every 15s; define `send`; call `runAssistantTurn(supabase, {userId, conversationId:conversation_id, message, isAdmin, edgeFunction:"assistant-chat"}, send)`; on resolve emit a single `{type:"done", content, actions}` (actions ride on `done` — NO standalone actions event) and close; on throw emit `{type:"error", message}`; clear the heartbeat in `finally`.
  - Response headers `Content-Type: application/x-ndjson`.
  - It must NOT import `history.ts`/`stream-accumulator.ts` anymore (the core owns them). Import only `corsHeaders`, `createClient`, `serve`, `sanitize`? — note `sanitize` now lives in the core; the deck does not sanitize (the core does). Keep the deck import list minimal.

- [ ] **Step 2: Type-check**

Run: `deno check supabase/functions/assistant-chat/index.ts`
Expected: no errors.

- [ ] **Step 3: Manually verify the event contract against the frontend**

Cross-check every `send({...})` in the new `index.ts` against `src/lib/aria/stream.ts:1-6`. Confirm exact shapes: `heartbeat`, `text{delta}` (from the core via emit), `status{tool,label}` (from the core's tool loop via emit — confirm the core emits these; if #21 emitted `status` from the handler, that logic moves into the core's tool loop), `done{content,actions}`, `error{message}`. Any shape the frontend does not parse is a silent break.

> NOTE for the implementer: `status` events (`index.ts:331-334`) are emitted from inside the tool loop, which now lives in the CORE. Ensure the core emits `{type:"status", tool, label}` via `emit?.()` when it starts executing each tool, so the deck's "Searching…" indicator keeps working. Add this to Task 4's core if not already covered, and extend the Task 4 test to assert a `status` event is emitted for the tool round.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/assistant-chat/index.ts
git commit -m "refactor(aria): thin deck assistant-chat caller over shared streaming core"
```

---

## Task 6: Re-point `google-chat-webhook` at the unified core

**Files:**
- Modify (if needed): `supabase/functions/google-chat-webhook/index.ts`
- Test: `src/test/google-chat.test.ts` (existing)

- [ ] **Step 1: Confirm the call site matches the (unchanged) `RunTurnOptions`**

Read `supabase/functions/google-chat-webhook/index.ts`. It calls `runAssistantTurn(supabase, {...})` with no `emit`. Since `RunTurnOptions` is unchanged and `emit` is optional, this should need no change. Confirm it reads only `.content` from the result.

- [ ] **Step 2: Type-check the webhook against the new core**

Run: `deno check supabase/functions/google-chat-webhook/index.ts`
Expected: no errors. If the core's signature/return changed anything the webhook relied on, fix the webhook (not the core).

- [ ] **Step 3: Run the Chat unit tests**

Run: `npm run test -- src/test/google-chat.test.ts src/test/aria-chat-tools.test.ts 2>&1 | tail -20`
Expected: PASS (behaviour unchanged; the webhook now rides #21's engine params — acceptable per spec §2/§3.4).

- [ ] **Step 4: Commit (only if the file changed)**

```bash
git add supabase/functions/google-chat-webhook/index.ts
git commit -m "chore(aria): point google-chat-webhook at unified streaming core"
```

---

## Task 7: Full gate, deploy, and merge

**Files:** none (verification + deploy).

- [ ] **Step 1: Root app gate (prove no regression)**

Run: `npm run typecheck && npm run lint && npm run test && npm run build`
Expected: all green (the 2 known react-refresh lint warnings on button.tsx/AuthContext.tsx are OK).

- [ ] **Step 2: Deno gate for both edge functions**

Run:
```bash
deno check supabase/functions/assistant-chat/index.ts
deno check supabase/functions/google-chat-webhook/index.ts
ANTHROPIC_API_KEY=test deno test --allow-env supabase/functions/_shared/
```
Expected: no type errors; all `_shared` unit tests pass (accumulator, history, core-turn). The `ANTHROPIC_API_KEY=test` + `--allow-env` are required because `assistant-core.ts` reads env at module load (the pure accumulator/history tests don't need them, but the directory run loads the core test too).

- [ ] **Step 3: Push the branch and open the PR**

```bash
git push -u origin docs/aria-streaming-shared-core
gh pr create --title "feat(aria): unify assistant-chat on one streaming shared core (reconcile #21 + #35)" --body "<summarize: what, why, spec link, that #35 is superseded/absorbed, deploy + smoke checklist below>"
```
Note in the PR body that merging this makes PR #35 redundant (its content is absorbed) — Damon decides whether to close #35 or merge this in its place.

- [ ] **Step 4: Deploy to prod — Damon-gated (the auto-mode classifier prompts per deploy)**

```bash
supabase functions deploy assistant-chat --project-ref znkoxpwvocxxvrvajmza --no-verify-jwt
supabase functions deploy google-chat-webhook --project-ref znkoxpwvocxxvrvajmza --no-verify-jwt
```
Then redeploy demo from this unified branch so demo + prod share source:
```bash
supabase functions deploy assistant-chat --project-ref khtlrhtgnwhrhrstivkw --no-verify-jwt
```
If the `external_ref` migration is not yet applied to prod, apply it first (idempotent): `20260624000100_conversations_external_ref.sql`.

- [ ] **Step 5: Smoke**

- Unauth `POST` to each deployed `assistant-chat` → `HTTP 401 {"error":"Unauthorized"}`.
- Damon: open the deck (demo + prod), ask Aria something → answer streams token-by-token; a tool call shows the "Searching…" status; action chips still render.
- Damon (once #35's `ARIA_CHAT_*` secrets are set): DM the Google Chat bot → grounded answer returns.

- [ ] **Step 6: Merge**

Damon merges the PR to `main` (his standing merge-approval gate). Update memory `project-aria-google-chat-bot.md`: prod converged onto the unified streaming core; #21/#35 divergence resolved.

---

## Notes for the implementer

- **The frontend is the contract.** Never edit `src/lib/aria/stream.ts` or `src/hooks/useAssistant.ts` to fit the backend — fit the backend's emitted events to them.
- **`#21 wins on constants.** Any value defined in both #21's `index.ts` and #35's `assistant-core.ts` takes #21's number (esp. `MAX_TOOL_ROUNDS = 12`).
- **Deno, not npm, for edge functions.** The npm gate does not cover `supabase/functions/*`. Always `deno check` / `deno test` them.
- **Rollback:** prod's current `assistant-chat` v7 + `google-chat-webhook` v1 bundles are captured via `get_edge_function`; redeploy from the pre-merge commit if a smoke check fails. Deploy only after the full gate is green.
