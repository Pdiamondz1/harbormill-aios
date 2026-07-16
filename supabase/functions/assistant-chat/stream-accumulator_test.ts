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

Deno.test("text_delta for orphaned index returns no textDelta and does not appear in finalize", () => {
  const acc = new StreamAccumulator();
  // No content_block_start for index 99 — orphaned delta
  const result = acc.push({ type: "content_block_delta", index: 99, delta: { type: "text_delta", text: "ghost" } });
  assertEquals(result.textDelta, undefined);
  const out = acc.finalize();
  assertEquals(out.content.length, 0);
});
