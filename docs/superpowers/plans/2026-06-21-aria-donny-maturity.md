# Aria → "Donny-grade" Agent — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the base-template assistant **Aria** (`supabase/functions/assistant-chat`) to the maturity of DragonCandy's **Donny**: streaming responses with live tool-status, tool-aware conversation memory with pairing-repair, a hardened tool loop, agentic action chips, and an Opus + extended-thinking intelligence tier.

**Architecture:** Two new pure Deno modules (`stream-accumulator.ts`, `history.ts`) carry the testable logic and are TDD'd with `deno test`. `index.ts` is rewired to stream NDJSON through a `ReadableStream`, persist assistant tool-use turns, and replay them faithfully. A pure frontend NDJSON parser (`src/lib/aria/stream.ts`) is TDD'd with vitest, then consumed by `useAssistant.ts`; the Aria context/provider/chat-view render incrementally. **No database migration** — `public.messages` already has `role('user'|'assistant'|'tool')`, `content`, `tool_calls jsonb`, `tool_result jsonb`.

**Tech Stack:** Deno edge functions (Supabase) · Anthropic Messages API (streaming SSE + extended thinking + tool use) · React 18 + TanStack Query + vitest · TypeScript strict.

**Reference implementation to port from** (read these — do not invent):
- `C:/GIT/dragoncandy-v3-d783432b/supabase/functions/donny-chat/stream-accumulator.ts`
- `C:/GIT/dragoncandy-v3-d783432b/supabase/functions/donny-chat/history.ts`
- `C:/GIT/dragoncandy-v3-d783432b/supabase/functions/donny-chat/index.ts` (streaming loop, persistence, "answer now" fallback)
- `C:/GIT/dragoncandy-v3-d783432b/src/hooks/internal/useInternalDonny.ts` (client stream reader)

**Spec:** `C:/Users/dwill/.claude/plans/harbormill-automation-needs-its-quizzical-conway.md`

---

## File Structure

**Create**
- `supabase/functions/assistant-chat/stream-accumulator.ts` — pure: assemble Anthropic SSE stream events into a final message (`text`, `tool_use`, `thinking`, `usage`). Emits text deltas.
- `supabase/functions/assistant-chat/stream-accumulator_test.ts` — Deno tests.
- `supabase/functions/assistant-chat/history.ts` — pure: rebuild Anthropic message history from stored `messages` rows + tool-pairing repair.
- `supabase/functions/assistant-chat/history_test.ts` — Deno tests.
- `src/lib/aria/stream.ts` — pure: incremental NDJSON line parser for the client.
- `src/lib/aria/stream.test.ts` — vitest tests.
- `src/components/assistant/AriaActionChips.tsx` — route-based chip row (`{label, route}` → `navigate`), distinct from the prompt-based `AriaQuickChips`.

**Modify**
- `supabase/functions/assistant-chat/index.ts` — request builder (model/thinking), `reconstructHistory`, persist assistant tool-use turns, `ReadableStream` NDJSON streaming, status events, loop hardening, capture `suggest_actions`.
- `supabase/functions/assistant-chat/tools.ts` — add `suggest_actions` tool.
- `src/hooks/useAssistant.ts` — streaming reader + streaming state.
- `src/contexts/aria-context.ts`, `src/contexts/AriaProvider.tsx` — expose `streamingText` / `statusLabel` / `actions`.
- `src/components/assistant/AriaChatView.tsx` — incremental render, status line, action chips (via `AriaQuickChips.tsx`).
- `docs/client-setup.md` + `.env.example` (or equivalent) — document `ANTHROPIC_MODEL`, `ANTHROPIC_THINKING_BUDGET`.

**Adaptation notes vs DragonCandy**
- Harbormill has **no legacy OpenAI-format `tool_calls` rows** — omit Donny's OpenAI→native conversion branch in `history.ts`. Stored `tool_calls` is already an Anthropic content array.
- Harbormill stores the tool-result pairing id in `messages.content` for `role='tool'` rows (matches Donny). `tool_result` column holds the result object.
- Keep Harbormill's existing concerns intact: `sanitize()` injection guard, role gating (`isAdmin`/`hasAccess`), `DISABLED_TOOLS`, `logCost()`, `withHistoryCacheBreakpoint()`, persona env vars.

**Testing strategy**
- Pure Deno modules → `deno test <file>` (no permissions needed; pure logic).
- Pure frontend parser → `npx vitest run src/lib/aria/stream.test.ts`.
- `index.ts` rewiring, tools.ts, context/provider/UI → validated by `npm run typecheck` + `npm run build` + manual e2e (edge functions are excluded from vitest by design, `vite.config.ts:36`).

---

## Task 1: Stream accumulator (pure Deno module)

**Files:**
- Create: `supabase/functions/assistant-chat/stream-accumulator.ts`
- Test: `supabase/functions/assistant-chat/stream-accumulator_test.ts`

Read the reference `donny-chat/stream-accumulator.ts` first. Port a `StreamAccumulator` plus a `parseSseLines(buffer, chunk)` helper.

**Target interface:**
```ts
export interface AccumulatedMessage {
  content: Array<Record<string, unknown>>; // text / tool_use / thinking blocks
  stop_reason: string | null;
  usage: { input_tokens: number; output_tokens: number;
           cache_read_input_tokens?: number; cache_creation_input_tokens?: number };
}
// Splits an SSE byte-buffer into parsed `data:` JSON events; returns leftover buffer.
export function parseSseLines(buffer: string, chunk: string): { events: any[]; buffer: string };
export class StreamAccumulator {
  push(event: any): { textDelta?: string }; // feed one SSE event; returns any text delta
  finalize(): AccumulatedMessage;
}
```

**Behavior to implement (event types):** `message_start` (seed usage), `content_block_start` (open a text / tool_use / thinking / redacted_thinking block), `content_block_delta` (`text_delta` → append text and return as `textDelta`; `input_json_delta` → append to that block's `partialJson`; `thinking_delta` → append thinking; `signature_delta` → set the thinking block's `signature`), `content_block_stop` (for a tool_use block, `JSON.parse(partialJson || "{}")` into `.input`), `message_delta` (update `stop_reason` + output usage), `message_stop`.

- [ ] **Step 1: Write failing tests**

```ts
// stream-accumulator_test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { StreamAccumulator, parseSseLines } from "./stream-accumulator.ts";

function ev(o: unknown) { return { data: JSON.stringify(o) }; } // helper if push takes parsed objects

Deno.test("accumulates text deltas in order and returns each delta", () => {
  const acc = new StreamAccumulator();
  acc.push({ type: "message_start", message: { usage: { input_tokens: 10, output_tokens: 0 } } });
  acc.push({ type: "content_block_start", index: 0, content_block: { type: "text", text: "" } });
  const a = acc.push({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "Hel" } });
  const b = acc.push({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "lo" } });
  acc.push({ type: "content_block_stop", index: 0 });
  acc.push({ type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 5 } });
  assertEquals(a.textDelta, "Hel");
  assertEquals(b.textDelta, "lo");
  const out = acc.finalize();
  assertEquals(out.stop_reason, "end_turn");
  assertEquals(out.content[0], { type: "text", text: "Hello" });
  assertEquals(out.usage.input_tokens, 10);
  assertEquals(out.usage.output_tokens, 5);
});

Deno.test("assembles a tool_use block from input_json_delta fragments", () => {
  const acc = new StreamAccumulator();
  acc.push({ type: "content_block_start", index: 0,
             content_block: { type: "tool_use", id: "tu_1", name: "read_metrics", input: {} } });
  acc.push({ type: "content_block_delta", index: 0, delta: { type: "input_json_delta", partial_json: '{"ke' } });
  acc.push({ type: "content_block_delta", index: 0, delta: { type: "input_json_delta", partial_json: 'y":"mrr"}' } });
  acc.push({ type: "content_block_stop", index: 0 });
  acc.push({ type: "message_delta", delta: { stop_reason: "tool_use" }, usage: { output_tokens: 3 } });
  const out = acc.finalize();
  assertEquals(out.stop_reason, "tool_use");
  assertEquals(out.content[0], { type: "tool_use", id: "tu_1", name: "read_metrics", input: { key: "mrr" } });
});

Deno.test("preserves a thinking block with its signature", () => {
  const acc = new StreamAccumulator();
  acc.push({ type: "content_block_start", index: 0, content_block: { type: "thinking", thinking: "" } });
  acc.push({ type: "content_block_delta", index: 0, delta: { type: "thinking_delta", thinking: "let me think" } });
  acc.push({ type: "content_block_delta", index: 0, delta: { type: "signature_delta", signature: "sig123" } });
  acc.push({ type: "content_block_stop", index: 0 });
  const out = acc.finalize();
  assertEquals(out.content[0].type, "thinking");
  assertEquals(out.content[0].thinking, "let me think");
  assertEquals(out.content[0].signature, "sig123");
});

Deno.test("parseSseLines splits complete events and keeps a partial tail buffered", () => {
  const r1 = parseSseLines("", "data: {\"type\":\"a\"}\n\ndata: {\"ty");
  assertEquals(r1.events.length, 1);
  assertEquals(r1.events[0].type, "a");
  const r2 = parseSseLines(r1.buffer, "pe\":\"b\"}\n\n");
  assertEquals(r2.events[0].type, "b");
});
```

- [ ] **Step 2: Run to verify failure** — `deno test supabase/functions/assistant-chat/stream-accumulator_test.ts` → FAIL (module not found).
- [ ] **Step 3: Implement** `stream-accumulator.ts` by porting the reference and satisfying the interface above. `parseSseLines` ignores `event:` lines and `[DONE]`, JSON-parses each `data:` payload, and returns the unterminated tail in `buffer`.
- [ ] **Step 4: Run to verify pass** — same command → all PASS.
- [ ] **Step 5: Commit** — `git add` the two files; `git commit -m "feat(aria): SSE stream accumulator for assistant-chat"`.

---

## Task 2: History reconstruction + tool-pairing repair (pure Deno module)

**Files:**
- Create: `supabase/functions/assistant-chat/history.ts`
- Test: `supabase/functions/assistant-chat/history_test.ts`

Read the reference `donny-chat/history.ts`. Port `reconstructHistory(rows)` and the helpers, **omitting the OpenAI→native branch** (Harbormill has no legacy rows).

**Target interface:**
```ts
export interface StoredRow {
  role: "user" | "assistant" | "tool";
  content: string | null;            // text for user/assistant; tool_use_id for tool rows
  tool_calls?: unknown[] | null;     // assistant: full Anthropic content array (text/tool_use/thinking)
  tool_result?: unknown | null;      // tool: the result object
}
export function reconstructHistory(rows: StoredRow[]): Array<{ role: "user" | "assistant"; content: any }>;
```

**Algorithm:** map rows → Anthropic messages (user → `{role:"user", content}`; assistant with `tool_calls` → `{role:"assistant", content: tool_calls}` else `{role:"assistant", content}`; tool → fold a `{type:"tool_result", tool_use_id: content, content: JSON.stringify(tool_result)}` block into the preceding/synthetic user turn) → `mergeConsecutive` → `stripLeadingOrphans` → `enforceToolPairing` (pass 1 drops `tool_result` blocks with no matching `tool_use` in the prior assistant turn; pass 2 drops `tool_use` blocks with no answering `tool_result` in the next turn; drop emptied messages and re-merge).

- [ ] **Step 1: Write failing tests**

```ts
// history_test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { reconstructHistory } from "./history.ts";

Deno.test("plain user/assistant text passes through", () => {
  const out = reconstructHistory([
    { role: "user", content: "hi" },
    { role: "assistant", content: "hello" },
  ]);
  assertEquals(out, [
    { role: "user", content: "hi" },
    { role: "assistant", content: "hello" },
  ]);
});

Deno.test("a complete tool round is replayed as paired tool_use + tool_result", () => {
  const out = reconstructHistory([
    { role: "user", content: "metrics?" },
    { role: "assistant", content: "", tool_calls: [{ type: "tool_use", id: "tu_1", name: "read_metrics", input: {} }] },
    { role: "tool", content: "tu_1", tool_result: { mrr: 1000 } },
    { role: "assistant", content: "MRR is $1000" },
  ]);
  // assistant tool_use turn preserved
  assertEquals(out[1].role, "assistant");
  assertEquals((out[1].content as any[])[0].id, "tu_1");
  // tool_result folded into a following user turn, paired to tu_1
  const tr = (out[2].content as any[]).find((b: any) => b.type === "tool_result");
  assertEquals(tr.tool_use_id, "tu_1");
  assertEquals(out[3], { role: "assistant", content: "MRR is $1000" });
});

Deno.test("orphan tool_result (no matching tool_use) is dropped", () => {
  const out = reconstructHistory([
    { role: "user", content: "hi" },
    { role: "tool", content: "tu_missing", tool_result: { x: 1 } }, // window cut off the tool_use
    { role: "assistant", content: "ok" },
  ]);
  // no tool_result block survives anywhere
  const hasOrphan = out.some((m) => Array.isArray(m.content) &&
    (m.content as any[]).some((b: any) => b.type === "tool_result"));
  assertEquals(hasOrphan, false);
});

Deno.test("orphan tool_use (no answering tool_result) is dropped", () => {
  const out = reconstructHistory([
    { role: "user", content: "hi" },
    { role: "assistant", content: "", tool_calls: [{ type: "tool_use", id: "tu_1", name: "x", input: {} }] },
    // truncated before the tool result
  ]);
  const hasToolUse = out.some((m) => Array.isArray(m.content) &&
    (m.content as any[]).some((b: any) => b.type === "tool_use"));
  assertEquals(hasToolUse, false);
});

Deno.test("only an orphan tool_result + a leading assistant repairs to empty (never emits an empty-content turn)", () => {
  const out = reconstructHistory([
    { role: "tool", content: "tu_1", tool_result: { x: 1 } }, // orphan: no preceding tool_use
    { role: "assistant", content: "answer" },                  // invalid as a leading turn
  ]);
  // The orphan tool_result's user turn would be empty after repair → it must be DROPPED,
  // never emitted as { role:"user", content:[] } (an Anthropic 422). The leading assistant
  // turn is also stripped. Nothing valid remains.
  assertEquals(out.length, 0);
});
```

- [ ] **Step 2: Run to verify failure** — `deno test supabase/functions/assistant-chat/history_test.ts` → FAIL.
- [ ] **Step 3: Implement** `history.ts` per the algorithm; satisfy all tests.
- [ ] **Step 4: Run to verify pass** — same command → all PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(aria): tool-aware history reconstruction with pairing repair"`.

---

## Task 3: `suggest_actions` tool

**Files:**
- Modify: `supabase/functions/assistant-chat/tools.ts`

Add a tool whose only job is to let the model attach navigational chips to its answer. `execute` validates and echoes; `index.ts` (Task 6) captures the input to emit in the `done` event.

- [ ] **Step 1: Add the tool** to the `TOOLS` array, matching the existing tool shape in the file:

```ts
{
  requiresAdmin: false,
  definition: {
    name: "suggest_actions",
    description:
      "Attach up to 3 clickable follow-up chips to your answer. Each action is an in-app navigation. " +
      "Call this when a next step maps to a page (e.g. opening Projects, Briefings, Findings). " +
      "Routes must be real in-app paths like '/projects', '/briefings', '/findings', '/value', '/strategy'.",
    input_schema: {
      type: "object",
      properties: {
        actions: {
          type: "array",
          maxItems: 3,
          items: {
            type: "object",
            properties: {
              label: { type: "string", description: "Short chip label, e.g. 'Open Projects'" },
              route: { type: "string", description: "In-app path, e.g. '/projects'" },
            },
            required: ["label", "route"],
          },
        },
      },
      required: ["actions"],
    },
  },
  // deno-lint-ignore no-explicit-any
  execute: async (input: any) => {
    const actions = Array.isArray(input?.actions) ? input.actions.slice(0, 3) : [];
    return { ok: true, actions };
  },
},
```

- [ ] **Step 2: Typecheck the function bundle** — `npx tsc --noEmit -p supabase/functions` if a tsconfig exists there, otherwise rely on the `index.ts` import compiling in Task 6. Visually confirm the array/exports are well-formed.
- [ ] **Step 3: Commit** — `git commit -m "feat(aria): add suggest_actions tool"`.

---

## Task 4: `index.ts` — request builder for model + extended thinking

**Files:**
- Modify: `supabase/functions/assistant-chat/index.ts`

Centralize the Anthropic request body so model, `max_tokens`, thinking, and temperature are consistent across the initial call and every loop call.

- [ ] **Step 1: Add env + helper** near the existing env reads (after line 28):

```ts
const THINKING_BUDGET = parseInt(Deno.env.get("ANTHROPIC_THINKING_BUDGET") ?? "0", 10) || 0;
const MAX_OUTPUT_TOKENS = parseInt(Deno.env.get("ANTHROPIC_MAX_TOKENS") ?? "4096", 10) || 4096;

// Build the request body. With extended thinking, max_tokens must exceed the
// thinking budget and temperature must be left at default (omit it).
// deno-lint-ignore no-explicit-any
function buildRequest(system: any, messages: any[], tools: any[]) {
  const thinkingOn = THINKING_BUDGET > 0;
  const maxTokens = thinkingOn ? Math.max(MAX_OUTPUT_TOKENS, THINKING_BUDGET + 1024) : MAX_OUTPUT_TOKENS;
  // deno-lint-ignore no-explicit-any
  const body: any = {
    model: ANTHROPIC_MODEL,
    max_tokens: maxTokens,
    system,
    messages: withHistoryCacheBreakpoint(messages),
    tools,
    stream: true,
  };
  if (thinkingOn) body.thinking = { type: "enabled", budget_tokens: THINKING_BUDGET };
  return body;
}
```

- [ ] **Step 2: Do NOT commit standalone.** `buildRequest` is only consumed in Task 6, so a standalone commit trips the `deno check`/lint unused-symbol check. **Stage these env+helper additions and commit them together with Task 6** (the streaming rewrite that first calls `buildRequest`). Treat Tasks 4 and 6 as one commit boundary.

---

## Task 5: `index.ts` — faithful history + persist assistant tool-use turns

**Files:**
- Modify: `supabase/functions/assistant-chat/index.ts` (replace the loader at lines ~183-196; add persistence inside the loop)

- [ ] **Step 1: Replace the lossy history loader.** Import `reconstructHistory` (`import { reconstructHistory } from "./history.ts";`). Change the query to also select `tool_calls, tool_result` and **include `tool` rows**, then build messages via the reconstructor:

```ts
const { data: history } = await supabase
  .from("messages")
  .select("role, content, tool_calls, tool_result")
  .eq("conversation_id", conversation_id)
  .order("created_at", { ascending: true })
  .limit(60);

// deno-lint-ignore no-explicit-any
const claudeMessages: any[] = reconstructHistory((history ?? []) as any[]);
```

- [ ] **Step 2: Persist the assistant tool-use turn inside the loop.** Where the loop currently does `claudeMessages.push({ role: "assistant", content: result.content })` (line ~251), first persist it so the next request rebuilds it:

```ts
await supabase.from("messages").insert({
  conversation_id,
  role: "assistant",
  content: extractText(result.content),     // human-readable text part (may be empty)
  tool_calls: result.content,               // full content array incl. tool_use / thinking
});
```

Keep the existing `tool`-row insert (content = `tu.id`, `tool_result` = output) unchanged.

- [ ] **Step 3: Verify build** — `npm run build` (front end build also type-checks shared TS) and, if available, `deno check supabase/functions/assistant-chat/index.ts`. Expected: compiles.
- [ ] **Step 4: Commit** — `git commit -m "feat(aria): tool-aware memory — persist + replay tool-use turns"`.

---

## Task 6: `index.ts` — NDJSON streaming + status events + loop hardening + actions capture

**Files:**
- Modify: `supabase/functions/assistant-chat/index.ts` (replace the buffered try-block at lines ~208-285)

Read the reference `donny-chat/index.ts` streaming loop. Rewrite the response path to a `ReadableStream` that emits NDJSON lines and runs the (now streaming) tool loop.

- [ ] **Step 1: Add a streaming model call** that feeds the accumulator and forwards text deltas via an `emit` callback:

```ts
import { StreamAccumulator, parseSseLines } from "./stream-accumulator.ts";

// deno-lint-ignore no-explicit-any
async function callModelStreaming(body: any, emit: (e: unknown) => void) {
  const resp = await anthropic(body); // anthropic() already JSON.stringifies; body.stream=true
  if (!resp.ok || !resp.body) throw new Error(`Anthropic error: ${resp.status} ${await resp.text()}`);
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  const acc = new StreamAccumulator();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    const { events, buffer: rest } = parseSseLines(buffer, decoder.decode(value, { stream: true }));
    buffer = rest;
    for (const ev of events) {
      const { textDelta } = acc.push(ev);
      if (textDelta) emit({ type: "text", delta: textDelta });
    }
  }
  return acc.finalize();
}
```

- [ ] **Step 2: Wrap the loop in a ReadableStream.** Replace the old `try { ... return json(...) }` with:

```ts
const STATUS_LABELS: Record<string, string> = {
  search_knowledge: "Searching the knowledge base…",
  read_metrics: "Reading the latest metrics…",
  get_latest_briefing: "Pulling the latest briefing…",
  get_value_summary: "Calculating value delivered…",
  get_document: "Reading the document…",
  // fallback handled below
};

const encoder = new TextEncoder();
const stream = new ReadableStream({
  async start(controller) {
    const send = (e: unknown) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
    send({ type: "heartbeat" }); // flush first byte immediately
    const heartbeat = setInterval(() => send({ type: "heartbeat" }), 15_000);
    let capturedActions: unknown[] = [];
    try {
      let result = await callModelStreaming(buildRequest(system, claudeMessages, toolDefs), send);
      await logCost(supabase, { userId, edgeFunction: "assistant-chat", model: ANTHROPIC_MODEL,
        inputTokens: result.usage?.input_tokens ?? 0, outputTokens: result.usage?.output_tokens ?? 0 });

      let rounds = 0;
      let totalTokens = (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0);
      while (result.stop_reason === "tool_use" && rounds < MAX_TOOL_ROUNDS && totalTokens < TOKEN_SAFETY_NET) {
        rounds++;
        const toolUses = (result.content as any[]).filter((b) => b.type === "tool_use");
        const toolResults: any[] = [];

        await supabase.from("messages").insert({
          conversation_id, role: "assistant",
          content: extractText(result.content), tool_calls: result.content,
        });

        for (const tu of toolUses) {
          send({ type: "status", tool: tu.name, label: STATUS_LABELS[tu.name] ?? `Working on ${tu.name}…` });
          if (tu.name === "suggest_actions") capturedActions = (tu.input?.actions ?? []).slice(0, 3);
          const tool = availableTools.find((t) => t.definition.name === tu.name);
          let output: unknown;
          try { output = tool ? await tool.execute(tu.input, toolCtx) : { error: `Unknown tool ${tu.name}` }; }
          catch (err) { output = { error: err instanceof Error ? err.message : "tool failed" }; }
          await supabase.from("messages").insert({ conversation_id, role: "tool", content: tu.id, tool_result: output });
          toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: JSON.stringify(output) });
        }

        claudeMessages.push({ role: "assistant", content: result.content });
        claudeMessages.push({ role: "user", content: toolResults });

        result = await callModelStreaming(buildRequest(system, claudeMessages, toolDefs), send);
        totalTokens += (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0);
        await logCost(supabase, { userId, edgeFunction: "assistant-chat", model: ANTHROPIC_MODEL,
          inputTokens: result.usage?.input_tokens ?? 0, outputTokens: result.usage?.output_tokens ?? 0 });
      }

      // Loop hardening: budget hit with pending tool_use and no text → one no-tools "answer now" call.
      let content = extractText(result.content);
      if (result.stop_reason === "tool_use" && !content.trim()) {
        claudeMessages.push({ role: "assistant", content: result.content });
        claudeMessages.push({ role: "user", content:
          [{ type: "tool_result", tool_use_id: (result.content as any[]).find((b:any)=>b.type==="tool_use")?.id,
             content: "Tool budget reached — answer now from what you have." }] });
        const finalBody = buildRequest(system, claudeMessages, []); // no tools
        result = await callModelStreaming(finalBody, send);
        content = extractText(result.content);
      }
      if (!content.trim()) content = "I gathered the data but couldn't compose an answer. Ask again, more specifically if you can.";

      await supabase.from("messages").insert({ conversation_id, role: "assistant", content });
      await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversation_id);
      send({ type: "done", content, actions: capturedActions });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Internal error";
      console.error("[assistant-chat]", msg);
      send({ type: "error", message: msg });
    } finally {
      clearInterval(heartbeat);
      controller.close();
    }
  },
});

return new Response(stream, {
  headers: { ...corsHeaders(req), "Content-Type": "application/x-ndjson" },
});
```

- [ ] **Step 2b: Add constants** near line 28: bump `MAX_TOOL_ROUNDS` 8 → 12 and add `const TOKEN_SAFETY_NET = 300_000;`. Remove the now-unused buffered `anthropic`-then-`.json()` paths and the old `withHistoryCacheBreakpoint` call sites that are superseded by `buildRequest` (keep the function itself — it's used inside `buildRequest`).
- [ ] **Step 3: Verify** — `deno check supabase/functions/assistant-chat/index.ts` (if deno available) and `npm run build`. Expected: compiles, no unused symbols.
- [ ] **Step 4: Commit** — `git commit -m "feat(aria): NDJSON streaming, live tool-status, loop hardening, action capture"`.

---

## Task 7: Frontend NDJSON parser (pure, vitest)

**Files:**
- Create: `src/lib/aria/stream.ts`
- Test: `src/lib/aria/stream.test.ts`

Mirror the server's line protocol on the client.

**Interface:**
```ts
export type AriaStreamEvent =
  | { type: "status"; tool: string; label: string }
  | { type: "text"; delta: string }
  | { type: "heartbeat" }
  | { type: "done"; content: string; actions?: { label: string; route: string }[] }
  | { type: "error"; message: string };
// Parse newline-delimited JSON; return parsed events + the unterminated tail.
export function parseNdjson(buffer: string, chunk: string): { events: AriaStreamEvent[]; buffer: string };
```

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from "vitest";
import { parseNdjson } from "@/lib/aria/stream";

describe("parseNdjson", () => {
  it("parses complete lines and buffers a partial tail", () => {
    const r1 = parseNdjson("", '{"type":"text","delta":"Hi"}\n{"type":"status","tool":"x","lab');
    expect(r1.events).toEqual([{ type: "text", delta: "Hi" }]);
    const r2 = parseNdjson(r1.buffer, 'el":"x","label":"Working…"}\n');
    expect(r2.events[0]).toEqual({ type: "status", tool: "x", label: "Working…" });
  });

  it("ignores blank lines and unparseable fragments without throwing", () => {
    const r = parseNdjson("", '\n\n{"type":"heartbeat"}\n');
    expect(r.events).toEqual([{ type: "heartbeat" }]);
  });

  it("surfaces a done event with actions", () => {
    const r = parseNdjson("", '{"type":"done","content":"ok","actions":[{"label":"Open","route":"/projects"}]}\n');
    expect(r.events[0]).toEqual({ type: "done", content: "ok", actions: [{ label: "Open", route: "/projects" }] });
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npx vitest run src/lib/aria/stream.test.ts` → FAIL.
- [ ] **Step 3: Implement** `parseNdjson`: append chunk to buffer, split on `\n`, keep the last element as the new buffer, `JSON.parse` each non-empty line inside a try/catch (skip on error).
- [ ] **Step 4: Run to verify pass** — same command → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(aria): client NDJSON stream parser"`.

---

## Task 8: `useAssistant.ts` — streaming reader + streaming state

**Files:**
- Modify: `src/hooks/useAssistant.ts`

- [ ] **Step 1: Add streaming state and replace the fetch.** Add `const [streamingText, setStreamingText] = useState("");` and `const [statusLabel, setStatusLabel] = useState<string | null>(null);` and `const [actions, setActions] = useState<{label:string;route:string}[]>([]);`. Replace the `mutationFn` body (lines 74-84) so it reads the stream:

```ts
const resp = await fetch(`${SUPABASE_URL}/functions/v1/assistant-chat`, {
  method: "POST",
  headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ conversation_id: conversation.id, message: content }),
});
if (!resp.ok || !resp.body) {
  const data = await resp.json().catch(() => ({}));
  throw new Error(data?.error || "The assistant could not respond");
}
const reader = resp.body.getReader();
const decoder = new TextDecoder();
let buffer = "";
let acc = "";
setStreamingText(""); setStatusLabel(null); setActions([]);
try {
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    const parsed = parseNdjson(buffer, decoder.decode(value, { stream: true }));
    buffer = parsed.buffer;
    for (const ev of parsed.events) {
      if (ev.type === "text") { acc += ev.delta; setStreamingText(acc); }
      else if (ev.type === "status") setStatusLabel(ev.label);
      else if (ev.type === "done") { setActions(ev.actions ?? []); return { content: ev.content }; }
      else if (ev.type === "error") throw new Error(ev.message);
      // heartbeat: ignore
    }
  }
  throw new Error("The assistant response was cut off");
} finally { reader.cancel().catch(() => {}); }
```

Add `import { parseNdjson } from "@/lib/aria/stream";`. In `onSettled`, also `setStreamingText(""); setStatusLabel(null);` then invalidate the messages query (existing). Return the new state from the hook: `streamingText`, `statusLabel`, `actions`.

- [ ] **Step 2: Verify** — `npm run typecheck`. Expected: PASS.
- [ ] **Step 3: Commit** — `git commit -m "feat(aria): stream assistant replies in useAssistant"`.

---

## Task 9: Aria context/provider — expose streaming state

**Files:**
- Modify: `src/contexts/aria-context.ts`, `src/contexts/AriaProvider.tsx`

- [ ] **Step 1: Extend the context type** in `aria-context.ts` (`AriaContextValue`): add `streamingText: string; statusLabel: string | null; actions: { label: string; route: string }[];`.
- [ ] **Step 2: Wire them through** in `AriaProvider.tsx` from `useAssistant()` into the provided value (alongside the existing `messages`, `pending`, `thinking`).
- [ ] **Step 3: Verify** — `npm run typecheck`. Expected: PASS.
- [ ] **Step 4: Commit** — `git commit -m "feat(aria): expose streaming state via AriaProvider"`.

---

## Task 10: `AriaChatView.tsx` — incremental render + status + action chips

**Files:**
- Modify: `src/components/assistant/AriaChatView.tsx`; wire `src/components/assistant/AriaQuickChips.tsx`

- [ ] **Step 1: Render the live partial.** While `isThinking`, append a transient assistant bubble showing `streamingText` (fallback to `<TypingIndicator/>` when empty) and, above it, the `statusLabel` line when present.
- [ ] **Step 2: Render action chips.** NOTE: the existing `AriaQuickChips` is typed `chips: QuickChip[]` (`{label, prompt}`) with `onPick:(prompt)=>void` — it is **prompt-based, not route-based**, so do NOT force-fit it (it won't typecheck for `{label, route}`). Instead add a small dedicated row component (e.g. `AriaActionChips`) next to it that renders each `{label, route}` as a button calling `navigate(route)` (React Router `useNavigate`). Keep `AriaQuickChips` + the page-aware suggestions from `src/lib/aria/suggestions.ts` as the empty-state (no-actions) fallback.
- [ ] **Step 3: Verify** — `npm run typecheck && npm run build`. Expected: PASS.
- [ ] **Step 4: Commit** — `git commit -m "feat(aria): incremental chat render, status line, action chips"`.

---

## Task 11: Document the new env vars

**Files:**
- Modify: `docs/client-setup.md` and the env example file (`.env.example` or the documented env list)

- [ ] **Step 1: Document** `ANTHROPIC_MODEL` (base default `claude-sonnet-4-6`; Harbormill's clone sets an Opus id), `ANTHROPIC_THINKING_BUDGET` (0 = off; e.g. `8000` enables extended thinking), and `ANTHROPIC_MAX_TOKENS` (default 4096). Note that with thinking on, `max_tokens` is auto-raised above the budget and temperature is left default.
- [ ] **Step 2: Commit** — `git commit -m "docs: document Aria model + extended-thinking env vars"`.

---

## Task 12: Full verification gate + manual e2e

**Files:** none (verification only)

- [ ] **Step 1: Static gate** — run and confirm each:
  - `deno test supabase/functions/assistant-chat/` → all PASS
  - `npm run test` → PASS (includes `src/lib/aria/stream.test.ts`)
  - `npm run typecheck` → clean
  - `npm run lint` → only the 2 known react-refresh warnings
  - `npm run build` → succeeds
- [ ] **Step 2: Deploy** the `assistant-chat` function to a Supabase preview/branch with `ANTHROPIC_MODEL` (Opus), `ANTHROPIC_THINKING_BUDGET` set.
- [ ] **Step 3: Manual e2e** (`npm run dev`, open Aria), confirm against the spec's checklist:
  - Streaming + status labels on a multi-tool prompt ("how are we doing, and draft an update email about it").
  - Tool-aware memory: a follow-up referencing the prior turn retains context with no API 400s.
  - Loop hardening: a long tool chain never yields an empty bubble.
  - Action chips render and navigate.
  - Thinking path runs on a hard question without 400s; `tool_result` turns keep the thinking block first.
  - `cost_ledger` rows written per call.
  - A stakeholder (non-admin) session still hides admin-only tools and the corrections protocol.
- [ ] **Step 4: Final commit / open PR** — `git commit -m "test: verify Aria Donny-grade engine end-to-end"` (if any fixups), then per superpowers:finishing-a-development-branch.

---

## Notes for the implementer
- DRY: reuse `extractText`, `withHistoryCacheBreakpoint`, `anthropic()`, `logCost`, `sanitize` — do not re-create them.
- YAGNI: no sub-agent orchestrator in M1 (deferred to M2). Do not add abstraction for future domains.
- TDD: Tasks 1, 2, 7 are pure and test-first. Tasks 3–6, 8–10 are wiring — guarded by typecheck/build + the manual e2e in Task 12 (edge functions are excluded from vitest by design).
- If `deno` is unavailable locally, the Task 1/2 tests still define correctness — run them in any Deno-capable environment (Supabase CLI bundles Deno) before deploy.
