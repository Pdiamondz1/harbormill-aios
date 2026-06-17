// Pluggable tool registry for the assistant.
//
// Add a tool by appending a { definition, execute } entry. `definition` is the
// Anthropic tool schema the model sees; `execute(args, ctx)` runs server-side
// with the service-role client. Keep tools small and grounded — the assistant
// is only as trustworthy as what these return.
//
// Phase 4 adds Google Workspace tools (export_to_drive, list_drive_files).

const EMBED_MODEL = "text-embedding-3-small";

export interface ToolContext {
  // deno-lint-ignore no-explicit-any
  supabase: any;
  userId: string;
  openaiKey?: string;
}

export interface Tool {
  definition: {
    name: string;
    description: string;
    input_schema: Record<string, unknown>;
  };
  // deno-lint-ignore no-explicit-any
  execute: (args: Record<string, any>, ctx: ToolContext) => Promise<unknown>;
}

async function embedQuery(query: string, openaiKey: string): Promise<number[]> {
  const resp = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, input: query }),
  });
  if (!resp.ok) throw new Error(`Embedding failed: ${await resp.text()}`);
  const data = await resp.json();
  return data.data[0].embedding;
}

export const TOOLS: Tool[] = [
  {
    definition: {
      name: "search_knowledge",
      description:
        "Search the business knowledge base (strategy docs, playbooks, reference material) for context. Use for any question about how the business works, its strategy, processes, or domain.",
      input_schema: {
        type: "object",
        properties: { query: { type: "string", description: "Natural-language search query" } },
        required: ["query"],
      },
    },
    execute: async (args, ctx) => {
      if (!ctx.openaiKey) return { error: "Knowledge search unavailable — OPENAI_API_KEY not configured." };
      const embedding = await embedQuery(String(args.query), ctx.openaiKey);
      const { data, error } = await ctx.supabase.rpc("match_knowledge", {
        query_embedding: embedding,
        match_count: 5,
      });
      if (error) throw error;
      return { chunks: data ?? [], count: (data ?? []).length };
    },
  },
  {
    definition: {
      name: "read_metrics",
      description:
        "Read the latest value of every operating metric (KPIs). Use for any question about current numbers, performance, or 'how are we doing'.",
      input_schema: { type: "object", properties: {} },
    },
    execute: async (_args, ctx) => {
      const { data, error } = await ctx.supabase
        .from("metric_latest")
        .select("key, label, value, unit, target, status, captured_at");
      if (error) throw error;
      return { metrics: data ?? [] };
    },
  },
  {
    definition: {
      name: "get_latest_briefing",
      description:
        "The most recent weekly operating brief: title, week, KPI list, and full markdown body. Use when asked about the weekly brief, 'this week', or current KPI status.",
      input_schema: { type: "object", properties: {} },
    },
    execute: async (_args, ctx) => {
      const { data, error } = await ctx.supabase
        .from("briefings")
        .select("week_start, title, body_md, kpis, published_at")
        .order("week_start", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ?? { message: "No briefings exist yet." };
    },
  },
  {
    definition: {
      name: "create_finding",
      description:
        "Log an issue or risk to the findings tracker for an admin to triage. Use when the user reports a bug/problem or asks you to record one.",
      input_schema: {
        type: "object",
        properties: {
          severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
          title: { type: "string", description: "Short issue title" },
          summary_md: { type: "string", description: "Markdown description of the issue" },
        },
        required: ["severity", "title", "summary_md"],
      },
    },
    execute: async (args, ctx) => {
      const { data, error } = await ctx.supabase
        .from("findings")
        .insert({
          severity: args.severity,
          title: String(args.title).trim(),
          summary_md: args.summary_md,
          source: "assistant",
        })
        .select("id")
        .single();
      if (error) throw error;
      return { id: data.id, created: true };
    },
  },
];
