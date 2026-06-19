import type { PageSuggestion } from "@/types/aria";

// Page-aware help for the Aria tray. Neutral, domain-agnostic copy — clients can
// tune these strings. Keyed by route prefix; the longest matching prefix wins.

const DEFAULT_SUGGESTION: PageSuggestion = {
  title: "How can I help?",
  chips: [
    { label: "How are we doing this week?", prompt: "How are we doing this week?" },
    { label: "Current metrics", prompt: "What are our current metrics right now?" },
    { label: "Latest brief", prompt: "Summarize the latest briefing for me." },
  ],
};

const BY_PREFIX: { prefix: string; suggestion: PageSuggestion }[] = [
  {
    prefix: "/briefings",
    suggestion: {
      title: "About the briefings",
      tip: "I can pull the latest weekly brief and explain what changed.",
      chips: [
        { label: "Summarize this week's brief", prompt: "Summarize the latest briefing." },
        { label: "What changed vs last week?", prompt: "What changed in the metrics since the last briefing?" },
      ],
    },
  },
  {
    prefix: "/findings",
    suggestion: {
      title: "About findings",
      tip: "Tell me about a bug or risk and I'll log it to the findings tracker.",
      chips: [
        { label: "Log a new finding", prompt: "I want to log a new finding." },
        { label: "What are the open risks?", prompt: "What open findings or risks should I know about?" },
      ],
    },
  },
  {
    prefix: "/strategy",
    suggestion: {
      title: "About the strategy library",
      tip: "Ask me anything about how the business works — I search the knowledge base.",
      chips: [
        { label: "What's our positioning?", prompt: "What is our positioning?" },
        { label: "Find a playbook", prompt: "What playbooks or processes do we have documented?" },
      ],
    },
  },
  {
    prefix: "/workspace",
    suggestion: {
      title: "Workspace & Google Drive",
      tip: "I can export a brief or analysis to a Google Doc once Google is connected.",
      chips: [
        { label: "Export the latest brief", prompt: "Export the latest briefing to a Google Doc." },
        { label: "What's in my Drive folder?", prompt: "List the files in my Drive folder." },
      ],
    },
  },
  {
    prefix: "/projects",
    suggestion: {
      title: "About projects",
      chips: [
        { label: "What's active right now?", prompt: "What projects are active right now?" },
        { label: "What's blocked?", prompt: "Are any projects blocked?" },
      ],
    },
  },
  {
    prefix: "/calendar",
    suggestion: {
      title: "About the calendar",
      chips: [{ label: "What's due this week?", prompt: "What's due this week?" }],
    },
  },
];

export function getSuggestionsForPage(pathname: string): PageSuggestion {
  const match = BY_PREFIX.filter((e) => pathname.startsWith(e.prefix)).sort(
    (a, b) => b.prefix.length - a.prefix.length
  )[0];
  return match?.suggestion ?? DEFAULT_SUGGESTION;
}
