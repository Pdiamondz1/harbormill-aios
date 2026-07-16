// Pure conversation-history reconstruction for assistant-chat.
//
// Stored messages rows are replayed into the Anthropic Messages format.
// The Anthropic API has a hard invariant: every `tool_result` block in a user
// message must correspond to a `tool_use` block in the IMMEDIATELY preceding
// assistant message, and every `tool_use` must be answered by a `tool_result`
// in the next message. Replaying a fixed window of stored rows can violate this
// (a window that cuts a tool pair, a tool-result row that failed to insert, or
// created_at ties that reorder rows), which surfaces as a 400 like:
//   messages.N.content.0: unexpected `tool_use_id` found in `tool_result` blocks
// reconstructHistory therefore ends with enforceToolPairing, which drops any
// orphaned block so a malformed array never reaches the API.

export interface StoredRow {
  role: "user" | "assistant" | "tool";
  content: string | null; // text for user/assistant; tool_use_id for tool rows
  tool_calls?: unknown[] | null; // assistant: full Anthropic content array (text/tool_use/thinking)
  tool_result?: unknown | null; // tool: the result object
}

export type AnthropicMessage = { role: "user" | "assistant"; content: any };

// Map stored rows into Anthropic messages. Adjacent tool-result rows are folded
// into a single user message of tool_result blocks.
function mapStoredToAnthropic(rows: StoredRow[]): AnthropicMessage[] {
  const messages: AnthropicMessage[] = [];

  for (const row of rows) {
    if (row.role === "user") {
      messages.push({ role: "user", content: row.content ?? "" });
    } else if (row.role === "assistant") {
      if (row.tool_calls && Array.isArray(row.tool_calls)) {
        // Already Anthropic format — stored as a content array.
        messages.push({ role: "assistant", content: row.tool_calls });
      } else {
        messages.push({ role: "assistant", content: row.content ?? "" });
      }
    } else if (row.role === "tool" && row.tool_result !== undefined && row.tool_result !== null) {
      // Tool results become user messages with tool_result content blocks.
      // row.content stores the tool_use_id.
      const toolResultBlock = {
        type: "tool_result",
        tool_use_id: row.content ?? "unknown",
        content: JSON.stringify(row.tool_result),
      };
      const prev = messages[messages.length - 1];
      if (
        prev?.role === "user" &&
        Array.isArray(prev.content) &&
        (prev.content as any[])[0]?.type === "tool_result"
      ) {
        (prev.content as any[]).push(toolResultBlock);
      } else {
        messages.push({ role: "user", content: [toolResultBlock] });
      }
    }
    // Skip any unrecognised roles.
  }

  return messages;
}

function asBlocks(content: any): any[] {
  if (Array.isArray(content)) return content;
  if (typeof content === "string" && content) return [{ type: "text", text: content }];
  return [];
}

// Merge consecutive same-role messages (Anthropic prefers alternating turns).
// When a text turn meets a tool-bearing turn they are folded into one content
// array — never dropped — so tool blocks are preserved.
function mergeConsecutive(messages: AnthropicMessage[]): AnthropicMessage[] {
  const out: AnthropicMessage[] = [];
  for (const msg of messages) {
    const prev = out[out.length - 1];
    if (!prev || prev.role !== msg.role) {
      out.push({ ...msg });
      continue;
    }
    // Same role as previous — combine without losing any block.
    if (typeof prev.content === "string" && typeof msg.content === "string") {
      prev.content = prev.content ? `${prev.content}\n\n${msg.content}` : msg.content;
    } else {
      prev.content = [...asBlocks(prev.content), ...asBlocks(msg.content)];
    }
  }
  return out;
}

// Drop leading messages until the history starts with a plain user message.
// A leading assistant turn or a user turn headed by tool_result blocks is not a
// valid start (the API rejects tool_result blocks with no matching tool_use in
// the previous message).
function stripLeadingOrphans(messages: AnthropicMessage[]): AnthropicMessage[] {
  const out = messages.slice();
  while (
    out.length > 0 &&
    (out[0].role !== "user" ||
      (Array.isArray(out[0].content) && (out[0].content as any[])[0]?.type === "tool_result"))
  ) {
    out.shift();
  }
  return out;
}

function isEmptyContent(content: any): boolean {
  if (Array.isArray(content)) return (content as any[]).length === 0;
  return !content || (typeof content === "string" && content.trim() === "");
}

// Final integrity pass — guarantees the tool_use/tool_result pairing invariant
// regardless of how the replayed window was cut or which rows failed to persist:
//   pass 1: drop tool_result blocks whose tool_use_id has no matching tool_use
//           in the immediately preceding assistant message (orphaned results are
//           removed from the block array; if no blocks remain the user turn is
//           dropped entirely — emitting an empty-content user turn would 422 the
//           Anthropic API);
//   pass 2: drop tool_use blocks not answered by a tool_result in the next
//           message (if no blocks remain the assistant turn is dropped entirely);
// then drop any empty assistant message and re-merge to restore alternating turns.
function enforceToolPairing(messages: AnthropicMessage[]): AnthropicMessage[] {
  // Pass 1 — strip orphaned tool_result blocks.
  const afterResults: AnthropicMessage[] = [];
  for (const msg of messages) {
    if (
      msg.role === "user" &&
      Array.isArray(msg.content) &&
      (msg.content as any[]).some((b: any) => b?.type === "tool_result")
    ) {
      const prev = afterResults[afterResults.length - 1];
      const prevToolUseIds = new Set<string>(
        prev?.role === "assistant" && Array.isArray(prev.content)
          ? (prev.content as any[])
              .filter((b: any) => b?.type === "tool_use")
              .map((b: any) => b.id)
          : [],
      );
      const kept = (msg.content as any[]).filter(
        (b: any) => b?.type !== "tool_result" || prevToolUseIds.has(b.tool_use_id),
      );
      if (kept.length === 0) continue; // every block was orphaned — drop the message
      afterResults.push({ ...msg, content: kept });
    } else {
      afterResults.push(msg);
    }
  }

  // Pass 2 — strip unanswered tool_use blocks (their result was cut off / lost).
  const afterUses: AnthropicMessage[] = [];
  for (let i = 0; i < afterResults.length; i++) {
    const msg = afterResults[i];
    if (
      msg.role === "assistant" &&
      Array.isArray(msg.content) &&
      (msg.content as any[]).some((b: any) => b?.type === "tool_use")
    ) {
      const next = afterResults[i + 1];
      const answeredIds = new Set<string>(
        next?.role === "user" && Array.isArray(next.content)
          ? (next.content as any[])
              .filter((b: any) => b?.type === "tool_result")
              .map((b: any) => b.tool_use_id)
          : [],
      );
      const kept = (msg.content as any[]).filter(
        (b: any) => b?.type !== "tool_use" || answeredIds.has(b.id),
      );
      if (kept.length === 0) continue; // nothing but unanswered tool_use — drop the assistant turn
      afterUses.push({ ...msg, content: kept });
    } else {
      afterUses.push(msg);
    }
  }

  // Drop any message left genuinely empty, then re-merge so dropping a turn in
  // the middle never leaves two same-role turns adjacent.
  const nonEmpty = afterUses.filter((m) => !isEmptyContent(m.content));
  return mergeConsecutive(nonEmpty);
}

// Replay stored rows into a valid Anthropic message array.
export function reconstructHistory(
  rows: StoredRow[],
): Array<{ role: "user" | "assistant"; content: any }> {
  if (!rows || rows.length === 0) return [];
  const mapped = mapStoredToAnthropic(rows);
  const merged = mergeConsecutive(mapped);
  const stripped = stripLeadingOrphans(merged);
  return enforceToolPairing(stripped);
}
