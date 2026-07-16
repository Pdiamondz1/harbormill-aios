export type AriaStreamEvent =
  | { type: "status"; tool: string; label: string }
  | { type: "text"; delta: string }
  | { type: "heartbeat" }
  | { type: "done"; content: string; actions?: { label: string; route: string }[] }
  | { type: "error"; message: string };

export function parseNdjson(
  buffer: string,
  chunk: string,
): { events: AriaStreamEvent[]; buffer: string } {
  const lines = (buffer + chunk).split("\n");
  const tail = lines.pop() ?? "";
  const events: AriaStreamEvent[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      events.push(JSON.parse(line) as AriaStreamEvent);
    } catch {
      // skip unparseable fragments
    }
  }
  return { events, buffer: tail };
}
