// Pure helpers for the Google Chat webhook — no Deno globals, unit-testable.

export interface ChatEvent {
  type?: string;
  message?: {
    text?: string;
    sender?: { email?: string };
    thread?: { name?: string };
  };
  space?: { name?: string };
  user?: { email?: string };
}

export interface ParsedChatEvent {
  type: "MESSAGE" | "ADDED_TO_SPACE" | "OTHER";
  text: string;
  senderEmail: string | null; // null when Chat did not provide one → fail closed
  threadRef: string | null;
}

// MESSAGE → message.thread.name, falling back to the space name (DMs may omit a
// thread). Other event types key on the space so a greeting reuses one row.
function threadRef(e: ChatEvent): string | null {
  return e.message?.thread?.name ?? e.space?.name ?? null;
}

export function parseChatEvent(e: ChatEvent): ParsedChatEvent {
  const type =
    e.type === "MESSAGE" ? "MESSAGE" : e.type === "ADDED_TO_SPACE" ? "ADDED_TO_SPACE" : "OTHER";
  const senderEmail =
    type === "MESSAGE"
      ? e.message?.sender?.email ?? null
      : type === "ADDED_TO_SPACE"
        ? e.user?.email ?? null
        : null;
  return {
    type,
    text: e.message?.text?.trim() ?? "",
    senderEmail: senderEmail || null,
    threadRef: threadRef(e),
  };
}

// Case-insensitive exact match; empty/absent inputs never match (fail closed).
export function isAllowedSender(email: string | null, allowed: string): boolean {
  if (!email || !allowed) return false;
  return email.trim().toLowerCase() === allowed.trim().toLowerCase();
}
