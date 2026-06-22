// Pure SSE accumulator for assistant-chat. No network imports — unit-testable
// with `deno test`. Ported from donny-chat/stream-accumulator.ts.

export interface AccumulatedMessage {
  content: Array<Record<string, unknown>>; // text / tool_use / thinking blocks
  stop_reason: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
}

/**
 * Splits an SSE byte-buffer into parsed `data:` JSON events.
 * Returns the parsed events and the unterminated tail (kept for next chunk).
 * Ignores `event:` lines, comment lines, blank lines, and `[DONE]` sentinels.
 */
export function parseSseLines(
  buffer: string,
  chunk: string,
): { events: any[]; buffer: string } {
  const text = buffer + chunk;
  const lines = text.split("\n");
  const tail = lines.pop() ?? ""; // last element is a (possibly partial) line
  const events: any[] = [];
  for (const line of lines) {
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    events.push(JSON.parse(payload));
  }
  return { events, buffer: tail };
}

/**
 * Consumes parsed Anthropic stream events one at a time.
 * push() returns { textDelta } when the event produced user-facing text, else {}.
 * finalize() returns the assembled message matching the non-streaming shape.
 */
export class StreamAccumulator {
  private blocks: any[] = [];
  private partialJson: Record<number, string> = {};
  private stopReason: string | null = null;
  private usage: AccumulatedMessage["usage"] = {
    input_tokens: 0,
    output_tokens: 0,
    cache_read_input_tokens: 0,
    cache_creation_input_tokens: 0,
  };

  push(ev: any): { textDelta?: string } {
    switch (ev?.type) {
      case "message_start": {
        const u = ev.message?.usage ?? {};
        this.usage.input_tokens = u.input_tokens ?? 0;
        this.usage.cache_read_input_tokens = u.cache_read_input_tokens ?? 0;
        this.usage.cache_creation_input_tokens = u.cache_creation_input_tokens ?? 0;
        return {};
      }
      case "content_block_start": {
        const cb = ev.content_block ?? {};
        if (cb.type === "tool_use") {
          this.blocks[ev.index] = { type: "tool_use", id: cb.id, name: cb.name, input: {} };
          this.partialJson[ev.index] = "";
        } else if (cb.type === "text") {
          this.blocks[ev.index] = { type: "text", text: cb.text ?? "" };
        } else {
          // thinking, redacted_thinking, or other future block types — preserve as-is
          this.blocks[ev.index] = { ...cb };
        }
        return {};
      }
      case "content_block_delta": {
        const d = ev.delta ?? {};
        if (d.type === "text_delta") {
          const b = this.blocks[ev.index];
          if (b?.type === "text") b.text += d.text ?? "";
          return { textDelta: d.text ?? "" };
        }
        if (d.type === "input_json_delta") {
          this.partialJson[ev.index] = (this.partialJson[ev.index] ?? "") + (d.partial_json ?? "");
          return {};
        }
        if (d.type === "thinking_delta") {
          const b = this.blocks[ev.index];
          if (b) b.thinking = (b.thinking ?? "") + (d.thinking ?? "");
          return {};
        }
        if (d.type === "signature_delta") {
          const b = this.blocks[ev.index];
          if (b) b.signature = d.signature ?? "";
          return {};
        }
        return {};
      }
      case "content_block_stop": {
        const b = this.blocks[ev.index];
        if (b?.type === "tool_use") {
          const raw = (this.partialJson[ev.index] ?? "").trim();
          b.input = raw ? JSON.parse(raw) : {}; // throws on malformed — intentional: fatal stream error
        }
        return {};
      }
      case "message_delta": {
        if (ev.delta?.stop_reason) this.stopReason = ev.delta.stop_reason;
        if (ev.usage?.output_tokens != null) this.usage.output_tokens = ev.usage.output_tokens;
        return {};
      }
      default:
        return {}; // ping, message_stop, etc.
    }
  }

  finalize(): AccumulatedMessage {
    return {
      content: this.blocks.filter(Boolean),
      stop_reason: this.stopReason,
      usage: this.usage,
    };
  }
}
