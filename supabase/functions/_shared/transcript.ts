export interface ActionItem {
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  summary_md: string;
}
export interface TranscriptResult { summary_md: string; action_items: ActionItem[]; }

const SEVERITIES = new Set(["critical", "high", "medium", "low"]);

export function buildTranscriptPrompt(transcript: string): string {
  return [
    "You are a meeting analyst. Read the transcript and return ONLY a JSON object,",
    "no prose, with this exact shape:",
    '{ "summary_md": string (markdown summary of decisions, context, outcomes),',
    '  "action_items": [ { "severity": "critical"|"high"|"medium"|"low",',
    '                      "title": string, "summary_md": string } ] }',
    "Include the most important action items only, at most 50.",
    "",
    "TRANSCRIPT:",
    transcript,
  ].join("\n");
}

export function parseTranscriptResult(raw: string): TranscriptResult {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) throw new Error("no JSON object in model output");
  const parsed = JSON.parse(raw.slice(start, end + 1));
  if (typeof parsed.summary_md !== "string") throw new Error("missing summary_md");
  const items: ActionItem[] = Array.isArray(parsed.action_items) ? parsed.action_items : [];
  const clean = items
    .filter((i) => i && typeof i.title === "string" && SEVERITIES.has(i.severity))
    .slice(0, 50)
    .map((i) => ({ severity: i.severity, title: i.title, summary_md: String(i.summary_md ?? "") }));
  return { summary_md: parsed.summary_md, action_items: clean };
}
