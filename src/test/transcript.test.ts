import { describe, it, expect } from "vitest";
import { parseTranscriptResult, buildTranscriptPrompt }
  from "../../supabase/functions/_shared/transcript";

describe("parseTranscriptResult", () => {
  it("parses clean JSON", () => {
    const r = parseTranscriptResult('{"summary_md":"# S","action_items":[{"severity":"high","title":"Do X","summary_md":"detail"}]}');
    expect(r.summary_md).toBe("# S");
    expect(r.action_items).toHaveLength(1);
    expect(r.action_items[0].severity).toBe("high");
  });
  it("extracts JSON embedded in prose/code fences", () => {
    const r = parseTranscriptResult('Sure!\n```json\n{"summary_md":"x","action_items":[]}\n```\nDone');
    expect(r.summary_md).toBe("x");
    expect(r.action_items).toHaveLength(0);
  });
  it("caps action items at 50", () => {
    const items = Array.from({ length: 80 }, (_, i) => ({ severity: "low", title: `t${i}`, summary_md: "d" }));
    const r = parseTranscriptResult(JSON.stringify({ summary_md: "x", action_items: items }));
    expect(r.action_items.length).toBe(50);
  });
  it("drops items with invalid severity or missing title", () => {
    const r = parseTranscriptResult(JSON.stringify({ summary_md: "x", action_items: [
      { severity: "bogus", title: "bad", summary_md: "d" },
      { severity: "high", summary_md: "no title" },
      { severity: "medium", title: "good", summary_md: "d" },
    ] }));
    expect(r.action_items).toHaveLength(1);
    expect(r.action_items[0].title).toBe("good");
  });
  it("throws on malformed input", () => {
    expect(() => parseTranscriptResult("not json at all")).toThrow();
  });
  it("falls back to title when summary_md is empty/missing", () => {
    const r = parseTranscriptResult(JSON.stringify({ summary_md: "x", action_items: [
      { severity: "high", title: "Email the CFO", summary_md: "" },
      { severity: "low", title: "Book the room" },
    ] }));
    expect(r.action_items).toHaveLength(2);
    expect(r.action_items[0].summary_md).toBe("Email the CFO");
    expect(r.action_items[1].summary_md).toBe("Book the room");
  });
});

describe("buildTranscriptPrompt", () => {
  it("includes the transcript and asks for strict JSON + <=50 items", () => {
    const p = buildTranscriptPrompt("Alice: hi");
    expect(p).toContain("Alice: hi");
    expect(p.toLowerCase()).toContain("json");
    expect(p).toContain("50");
  });
});
