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
  const hasOrphan = out.some((m: { role: string; content: any }) => Array.isArray(m.content) &&
    (m.content as any[]).some((b: any) => b.type === "tool_result"));
  assertEquals(hasOrphan, false);
});

Deno.test("orphan tool_use (no answering tool_result) is dropped", () => {
  const out = reconstructHistory([
    { role: "user", content: "hi" },
    { role: "assistant", content: "", tool_calls: [{ type: "tool_use", id: "tu_1", name: "x", input: {} }] },
    // truncated before the tool result
  ]);
  const hasToolUse = out.some((m: { role: string; content: any }) => Array.isArray(m.content) &&
    (m.content as any[]).some((b: any) => b.type === "tool_use"));
  assertEquals(hasToolUse, false);
});

Deno.test("parallel tool calls: two tool_result blocks fold into a single user turn", () => {
  const out = reconstructHistory([
    { role: "user", content: "do both" },
    { role: "assistant", content: "", tool_calls: [
      { type: "tool_use", id: "tu_a", name: "read_metrics", input: {} },
      { type: "tool_use", id: "tu_b", name: "search_knowledge", input: { q: "x" } },
    ]},
    { role: "tool", content: "tu_a", tool_result: { mrr: 1000 } },
    { role: "tool", content: "tu_b", tool_result: { hits: [] } },
    { role: "assistant", content: "done" },
  ]);
  // assistant tool_use turn with both tool_use blocks is preserved
  assertEquals(out[1].role, "assistant");
  const toolUseBlocks = (out[1].content as any[]).filter((b: any) => b.type === "tool_use");
  assertEquals(toolUseBlocks.length, 2);
  assertEquals(toolUseBlocks[0].id, "tu_a");
  assertEquals(toolUseBlocks[1].id, "tu_b");
  // both tool_result blocks folded into a SINGLE following user turn
  assertEquals(out[2].role, "user");
  const resultBlocks = (out[2].content as any[]).filter((b: any) => b.type === "tool_result");
  assertEquals(resultBlocks.length, 2);
  const ids = resultBlocks.map((b: any) => b.tool_use_id);
  assertEquals(ids.includes("tu_a"), true);
  assertEquals(ids.includes("tu_b"), true);
  // final assistant text is present
  assertEquals(out[3], { role: "assistant", content: "done" });
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
