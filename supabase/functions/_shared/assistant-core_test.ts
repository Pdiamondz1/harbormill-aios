// Core-turn test for runAssistantTurn (the streaming shared core).
//
// There is NO DI seam: assistant-core.ts reads ANTHROPIC_API_KEY at module load
// and anthropic-fetch.ts calls the global fetch directly, so we stub Anthropic by
// overriding globalThis.fetch with a canned SSE Response. The fake supabase never
// calls fetch, so only the Anthropic call is intercepted.
//
// Run as (the key MUST be in the launch env — Deno.env.set in the body is too late):
//   ANTHROPIC_API_KEY=test deno test --allow-env supabase/functions/_shared/assistant-core_test.ts
import { assert, assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { runAssistantTurn } from "./assistant-core.ts";

const encoder = new TextEncoder();

// Build a fake Anthropic streaming Response from a list of SSE event objects.
function sseResponse(events: unknown[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const ev of events) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(ev)}\n\n`));
      }
      controller.close();
    },
  });
  return new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } });
}

// Round 1: a thinking block + a tool_use (stop_reason tool_use), no visible text.
// The tool name is deliberately unknown to the registry so the core's tool loop
// runs (status event + persistence) without executing any real tool (which would
// itself call fetch and desync the canned responses).
const ROUND1 = [
  { type: "message_start", message: { usage: { input_tokens: 10, output_tokens: 0 } } },
  { type: "content_block_start", index: 0, content_block: { type: "thinking", thinking: "" } },
  { type: "content_block_delta", index: 0, delta: { type: "thinking_delta", thinking: "let me check the metrics" } },
  { type: "content_block_delta", index: 0, delta: { type: "signature_delta", signature: "sig_abc" } },
  { type: "content_block_stop", index: 0 },
  { type: "content_block_start", index: 1, content_block: { type: "tool_use", id: "tu_1", name: "fake_tool", input: {} } },
  { type: "content_block_delta", index: 1, delta: { type: "input_json_delta", partial_json: "{}" } },
  { type: "content_block_stop", index: 1 },
  { type: "message_delta", delta: { stop_reason: "tool_use" }, usage: { output_tokens: 5 } },
];

// Round 2: final visible text (stop_reason end_turn).
const ROUND2 = [
  { type: "message_start", message: { usage: { input_tokens: 20, output_tokens: 0 } } },
  { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
  { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "MRR is " } },
  { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "$1,000." } },
  { type: "content_block_stop", index: 0 },
  { type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 8 } },
];
const FINAL_TEXT = "MRR is $1,000.";

// A fake supabase that records inserts and returns a scripted history on select.
// deno-lint-ignore no-explicit-any
function makeSupabase(history: unknown[]): { supabase: any; inserts: { table: string; row: any }[] } {
  // deno-lint-ignore no-explicit-any
  const inserts: { table: string; row: any }[] = [];
  const from = (table: string) => {
    // deno-lint-ignore no-explicit-any
    const builder: any = {
      // deno-lint-ignore no-explicit-any
      insert: (row: any) => {
        inserts.push({ table, row });
        return Promise.resolve({ data: null, error: null });
      },
      select: () => builder,
      eq: () => builder,
      in: () => builder,
      order: () => builder,
      limit: () => Promise.resolve({ data: history }),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    };
    return builder;
  };
  return { supabase: { from }, inserts };
}

const OPTS = {
  userId: "user-1",
  conversationId: "conv-1",
  message: "how are we doing?",
  isAdmin: true,
  edgeFunction: "assistant-chat",
};

// Override globalThis.fetch to return canned SSE responses in order, and capture
// each request's parsed JSON body (so tests can assert what was sent to Anthropic,
// e.g. that round 2 carries the accumulated tool_result).
// deno-lint-ignore no-explicit-any
function installFetch(responses: Response[]): { restore: () => void; requests: any[] } {
  let i = 0;
  // deno-lint-ignore no-explicit-any
  const requests: any[] = [];
  const real = globalThis.fetch;
  globalThis.fetch = ((_url: unknown, init?: { body?: unknown }) => {
    try {
      requests.push(typeof init?.body === "string" ? JSON.parse(init.body) : null);
    } catch {
      requests.push(null);
    }
    const r = responses[i++];
    if (!r) return Promise.reject(new Error("unexpected extra fetch call"));
    return Promise.resolve(r);
  }) as unknown as typeof fetch;
  return { restore: () => { globalThis.fetch = real; }, requests };
}

Deno.test("runAssistantTurn streams a two-round tool turn: final text, text+status emits, #21 persistence shape", async () => {
  const { restore } = installFetch([sseResponse(ROUND1), sseResponse(ROUND2)]);
  const { supabase, inserts } = makeSupabase([{ role: "user", content: "how are we doing?" }]);
  // deno-lint-ignore no-explicit-any
  const events: any[] = [];
  // deno-lint-ignore no-explicit-any
  const emit = (e: any) => events.push(e);
  try {
    const result = await runAssistantTurn(supabase, OPTS, emit);

    // 1. returns the final assembled text
    assertEquals(result.content, FINAL_TEXT);

    // 2a. text-delta events concatenate to exactly the final text
    const streamed = events.filter((e) => e.type === "text").map((e) => e.delta).join("");
    assertEquals(streamed, FINAL_TEXT);

    // 2b. at least one status event was emitted for the tool round
    const statuses = events.filter((e) => e.type === "status");
    assert(statuses.length >= 1, "expected at least one {type:'status'} event");
    assertEquals(statuses[0].tool, "fake_tool");
    assert(typeof statuses[0].label === "string" && statuses[0].label.length > 0, "status must carry a label");

    // 4. persistence shape — assistant tool-use row with THINKING-STRIPPED tool_calls
    const msgInserts = inserts.filter((i) => i.table === "messages");
    const assistantToolRow = msgInserts.find((i) => i.row.role === "assistant" && i.row.tool_calls);
    assert(assistantToolRow, "expected an assistant row carrying tool_calls");
    // deno-lint-ignore no-explicit-any
    const tc = assistantToolRow!.row.tool_calls as any[];
    assert(
      tc.every((b) => b.type !== "thinking" && b.type !== "redacted_thinking"),
      "thinking / redacted_thinking blocks must be stripped from persisted tool_calls",
    );
    assert(tc.some((b) => b.type === "tool_use" && b.id === "tu_1"), "the tool_use block must be persisted");

    // ...and a role:'tool' row keyed by tool_use_id with a tool_result set
    const toolRow = msgInserts.find((i) => i.row.role === "tool");
    assert(toolRow, "expected a role:'tool' result row");
    assertEquals(toolRow!.row.content, "tu_1");
    assert(toolRow!.row.tool_result != null, "tool_result must be set on the tool row");
  } finally {
    restore();
  }
});

Deno.test("runAssistantTurn resolves without an emit callback (emit is optional)", async () => {
  const { restore } = installFetch([sseResponse(ROUND1), sseResponse(ROUND2)]);
  const { supabase } = makeSupabase([{ role: "user", content: "how are we doing?" }]);
  try {
    const result = await runAssistantTurn(supabase, OPTS); // no emit — must not throw
    assertEquals(result.content, FINAL_TEXT);
  } finally {
    restore();
  }
});

// A mid-stream Anthropic error event: HTTP 200, a couple of text deltas, then an
// {"type":"error",...} event (e.g. overloaded_error). The turn must REJECT so the
// deck surfaces {type:"error"} rather than a silently truncated success.
const ERROR_MID_STREAM = [
  { type: "message_start", message: { usage: { input_tokens: 10, output_tokens: 0 } } },
  { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
  { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "partial " } },
  { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "answer" } },
  { type: "error", error: { type: "overloaded_error", message: "Overloaded" } },
];

Deno.test("runAssistantTurn throws on a mid-stream Anthropic error event (no silent truncation)", async () => {
  const { restore } = installFetch([sseResponse(ERROR_MID_STREAM)]);
  const { supabase } = makeSupabase([{ role: "user", content: "how are we doing?" }]);
  try {
    await assertRejects(
      () => runAssistantTurn(supabase, OPTS),
      Error,
      "Anthropic stream error",
    );
  } finally {
    restore();
  }
});

// Round 1 as a REAL suggest_actions tool_use (with input.actions) exercises the
// tool registry, the real tool_result payload, and the deck action-chip capture.
const ACTIONS_ROUND1 = [
  { type: "message_start", message: { usage: { input_tokens: 10, output_tokens: 0 } } },
  {
    type: "content_block_start",
    index: 0,
    content_block: { type: "tool_use", id: "tu_sa", name: "suggest_actions", input: {} },
  },
  {
    type: "content_block_delta",
    index: 0,
    delta: {
      type: "input_json_delta",
      // 4 actions on purpose — the core must slice to 3.
      partial_json: JSON.stringify({
        actions: [
          { label: "Open Projects", route: "/projects" },
          { label: "Open Briefings", route: "/briefings" },
          { label: "Open Findings", route: "/findings" },
          { label: "Open Strategy", route: "/strategy" },
        ],
      }),
    },
  },
  { type: "content_block_stop", index: 0 },
  { type: "message_delta", delta: { stop_reason: "tool_use" }, usage: { output_tokens: 5 } },
];

Deno.test("runAssistantTurn captures suggest_actions chips (sliced to 3) and sends the tool_result on round 2", async () => {
  const { restore, requests } = installFetch([sseResponse(ACTIONS_ROUND1), sseResponse(ROUND2)]);
  const { supabase } = makeSupabase([{ role: "user", content: "what next?" }]);
  try {
    const result = await runAssistantTurn(supabase, OPTS);

    // Actions come from the tool-use INPUT and are capped at 3.
    assertEquals(result.content, FINAL_TEXT);
    // deno-lint-ignore no-explicit-any
    const actions = result.actions as any[];
    assertEquals(actions.length, 3);
    assertEquals(actions[0], { label: "Open Projects", route: "/projects" });
    assertEquals(actions[2], { label: "Open Findings", route: "/findings" });

    // Round 2's request body must carry the accumulated tool_result for tu_sa.
    assertEquals(requests.length, 2);
    const round2 = requests[1];
    // deno-lint-ignore no-explicit-any
    const hasToolResult = (round2.messages as any[]).some(
      (m) =>
        Array.isArray(m.content) &&
        // deno-lint-ignore no-explicit-any
        (m.content as any[]).some((b: any) => b?.type === "tool_result" && b.tool_use_id === "tu_sa"),
    );
    assert(hasToolResult, "round 2 request must include the tool_result for tu_sa");
  } finally {
    restore();
  }
});
