// Read-only tool policy for external Aria front-ends (e.g. the Google Chat bot).
// These names MUST stay in sync with the registry in assistant-chat/tools.ts —
// src/test/aria-chat-tools.test.ts fails if a registry tool is unclassified.

// Safe to expose to a read-only Q&A surface: all are read-only. get_cost_stats
// and list_pending_loop_actions are admin-gated reads (the webhook runs as admin).
export const READ_ONLY_TOOL_NAMES: readonly string[] = [
  "search_knowledge",
  "read_metrics",
  "get_latest_briefing",
  "get_document",
  "get_value_summary",
  "get_weight_trend",
  "get_cost_stats",
  "list_pending_loop_actions",
];

// Write/action or Google-proxy tools (the latter need an interactive user JWT
// the webhook context does not have). Never exposed to the read-only bot.
export const CHAT_EXCLUDED_TOOL_NAMES: readonly string[] = [
  "create_finding",
  "propose_correction",
  "export_to_drive",
  "list_drive_files",
  "compose_email_link",
  "suggest_actions", // deck-only: drives action chips, meaningless to the read-only Chat surface
];

export const READ_ONLY_TOOLS: ReadonlySet<string> = new Set(READ_ONLY_TOOL_NAMES);
