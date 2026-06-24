import { describe, it, expect } from "vitest";
import { parseChatEvent, isAllowedSender } from "../../supabase/functions/_shared/google-chat";

describe("parseChatEvent", () => {
  it("parses a MESSAGE with sender + thread", () => {
    const p = parseChatEvent({
      type: "MESSAGE",
      message: {
        text: "  what's overdue?  ",
        sender: { email: "d@harbormill.net" },
        thread: { name: "spaces/A/threads/B" },
      },
      space: { name: "spaces/A" },
    });
    expect(p).toEqual({
      type: "MESSAGE",
      text: "what's overdue?",
      senderEmail: "d@harbormill.net",
      threadRef: "spaces/A/threads/B",
    });
  });

  it("falls back to the space name when a DM has no thread", () => {
    const p = parseChatEvent({ type: "MESSAGE", message: { text: "hi" }, space: { name: "spaces/A" } });
    expect(p.threadRef).toBe("spaces/A");
    expect(p.senderEmail).toBeNull(); // no sender email → fail closed
  });

  it("reads the adder email on ADDED_TO_SPACE", () => {
    const p = parseChatEvent({ type: "ADDED_TO_SPACE", user: { email: "d@harbormill.net" }, space: { name: "spaces/A" } });
    expect(p.type).toBe("ADDED_TO_SPACE");
    expect(p.senderEmail).toBe("d@harbormill.net");
  });

  it("classifies unknown types as OTHER", () => {
    expect(parseChatEvent({ type: "REMOVED_FROM_SPACE" }).type).toBe("OTHER");
  });
});

describe("isAllowedSender", () => {
  const allowed = "Damon@Harbormill.net";
  it("matches case-insensitively", () => {
    expect(isAllowedSender("damon@harbormill.net", allowed)).toBe(true);
  });
  it("rejects a different address", () => {
    expect(isAllowedSender("someone@else.com", allowed)).toBe(false);
  });
  it("fails closed on null/empty", () => {
    expect(isAllowedSender(null, allowed)).toBe(false);
    expect(isAllowedSender("", allowed)).toBe(false);
    expect(isAllowedSender("damon@harbormill.net", "")).toBe(false);
  });
});
