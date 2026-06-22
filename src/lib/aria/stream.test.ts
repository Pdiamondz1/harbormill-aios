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
