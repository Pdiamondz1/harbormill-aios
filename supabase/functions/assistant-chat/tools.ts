// Pluggable tool registry for the assistant.
//
// Add a tool by appending a { definition, execute } entry. `definition` is the
// Anthropic tool schema the model sees; `execute(args, ctx)` runs server-side
// with the service-role client. Keep tools small and grounded — the assistant
// is only as trustworthy as what these return.
//
// Phase 4 adds Google Workspace tools (export_to_drive, list_drive_files).

import {
  GoogleWorkspaceError,
  driveCtx,
  exportMarkdownToDoc,
  listFiles,
} from "../_shared/google-workspace.ts";

const EMBED_MODEL = "text-embedding-3-small";

// For propose_correction: route through the report-ingest service-role choke
// point so the before-value is captured server-side, never supplied by the model.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export interface ToolContext {
  // deno-lint-ignore no-explicit-any
  supabase: any;
  userId: string;
  openaiKey?: string;
  // Caller's access tier. Admin-only tools (requiresAdmin) are hidden from
  // stakeholders both in the tool list and at execution time.
  isAdmin: boolean;
}

export interface Tool {
  definition: {
    name: string;
    description: string;
    input_schema: Record<string, unknown>;
  };
  // When true, the tool is offered/executed only for admins (e.g. cost/spend,
  // corrections). Stakeholders never see it in the tool list.
  requiresAdmin?: boolean;
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
  {
    definition: {
      name: "export_to_drive",
      description:
        "Export a complete markdown document as a Google Doc in the user's Drive folder. Compose the FULL document first (headings + the actual content/numbers), then call this once. Returns the doc link. Only works if the user has connected Google on the Workspace page.",
      input_schema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Document title" },
          markdown: { type: "string", description: "The complete, self-contained markdown document — never a placeholder." },
        },
        required: ["title", "markdown"],
      },
    },
    execute: async (args, ctx) => {
      const markdown = String(args.markdown ?? "").trim();
      if (markdown.length < 200 || !markdown.includes("#")) {
        return {
          error:
            "markdown rejected: it must be the COMPLETE document (headings + the full content). Compose the whole document now and call export_to_drive again.",
        };
      }
      try {
        const { token, folderId } = await driveCtx(ctx.supabase, ctx.userId);
        const file = await exportMarkdownToDoc(token, folderId, String(args.title).trim() || "Untitled", markdown);
        return { id: file.id, name: file.name, link: file.webViewLink };
      } catch (err) {
        if (err instanceof GoogleWorkspaceError && (err.code === "not_connected" || err.code === "needs_reconnect")) {
          return { message: "Google isn't connected for this account — connect it on the Workspace page, then ask again." };
        }
        throw err;
      }
    },
  },
  {
    definition: {
      name: "list_drive_files",
      description: "List the files in the user's Drive folder (docs, sheets, slides). Only works if Google is connected.",
      input_schema: { type: "object", properties: {} },
    },
    execute: async (_args, ctx) => {
      try {
        const { token, folderId } = await driveCtx(ctx.supabase, ctx.userId);
        const files = await listFiles(token, folderId);
        // deno-lint-ignore no-explicit-any
        return files.map((f: any) => ({ id: f.id, name: f.name, mimeType: f.mimeType, link: f.webViewLink }));
      } catch (err) {
        if (err instanceof GoogleWorkspaceError && (err.code === "not_connected" || err.code === "needs_reconnect")) {
          return { message: "Google isn't connected for this account — connect it on the Workspace page." };
        }
        throw err;
      }
    },
  },
  {
    definition: {
      name: "get_document",
      description:
        "Read documents from the strategy/reference library by exact path. Call with no path to list every document (path + title) so you can find the right one; call with a path to get the FULL markdown body. Use this (not search_knowledge, which only returns excerpts) when you need a document's complete content — e.g. before proposing a correction to it.",
      input_schema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Exact document path. Omit to list all documents." },
        },
      },
    },
    execute: async (args, ctx) => {
      // No path → list every doc so the model can find the exact path.
      if (!args.path || typeof args.path !== "string") {
        const { data, error } = await ctx.supabase
          .from("documents")
          .select("path, title")
          .order("title");
        if (error) throw error;
        return { docs: data ?? [], count: (data ?? []).length };
      }
      const { data, error } = await ctx.supabase
        .from("documents")
        .select("path, title, content_md, tags")
        .eq("path", args.path)
        .maybeSingle();
      if (error) throw error;
      if (!data) return { error: `No document at path '${args.path}'.` };
      return data;
    },
  },
  {
    definition: {
      name: "compose_email_link",
      description:
        "Build a Gmail compose link pre-filled with a drafted email. Write the FULL subject and body yourself, then present the returned link as a clickable markdown link (e.g. [Open this email in Gmail](link)) for the user to review and send. You never send email — this only opens a pre-filled compose window.",
      input_schema: {
        type: "object",
        properties: {
          subject: { type: "string", description: "Email subject line" },
          body: { type: "string", description: "Full email body, composed by you" },
          to: { type: "string", description: "Optional recipient email address" },
        },
        required: ["subject", "body"],
      },
    },
    // Pure string-builder: no scopes, no send. Zero coupling.
    execute: async (args) => {
      const subject = String(args.subject ?? "").trim();
      const body = String(args.body ?? "").trim();
      if (!subject || !body) {
        return { error: "subject and body are both required to compose an email." };
      }
      const params = new URLSearchParams({ view: "cm", fs: "1", su: subject, body });
      const to = typeof args.to === "string" ? args.to.trim() : "";
      if (to) params.set("to", to);
      return {
        link: `https://mail.google.com/mail/?${params.toString()}`,
        to: to || null,
        subject,
        note: "Opens Gmail's compose window pre-filled. Review and send it yourself — nothing was sent.",
      };
    },
  },
  {
    definition: {
      name: "get_cost_stats",
      description:
        "AI spend summary from the cost ledger: total input/output tokens and per-model breakdown over a recent window. Use for questions about AI cost, token usage, or model spend. Admin-only.",
      input_schema: {
        type: "object",
        properties: {
          days: { type: "number", description: "Look-back window in days (default 30, max 90)." },
        },
      },
    },
    requiresAdmin: true,
    execute: async (args, ctx) => {
      const days = Math.min(Math.max(Number(args.days) || 30, 1), 90);
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await ctx.supabase
        .from("cost_ledger")
        .select("model, edge_function, input_tokens, output_tokens")
        .gte("created_at", since);
      if (error) throw error;
      // deno-lint-ignore no-explicit-any
      const rows = (data ?? []) as any[];
      const byModel: Record<string, { input_tokens: number; output_tokens: number; calls: number }> = {};
      let totalIn = 0;
      let totalOut = 0;
      for (const r of rows) {
        totalIn += r.input_tokens ?? 0;
        totalOut += r.output_tokens ?? 0;
        const m = (byModel[r.model] ??= { input_tokens: 0, output_tokens: 0, calls: 0 });
        m.input_tokens += r.input_tokens ?? 0;
        m.output_tokens += r.output_tokens ?? 0;
        m.calls += 1;
      }
      return {
        window_days: days,
        total_calls: rows.length,
        total_input_tokens: totalIn,
        total_output_tokens: totalOut,
        by_model: byModel,
      };
    },
  },
  {
    definition: {
      name: "get_value_summary",
      description:
        "The ROI summary: value delivered this month, last month, cumulative, the configured monthly retainer, and the multiple of the fee (roi_multiple). Use for any question about ROI, value delivered, 'what have we gotten', or 'is this worth it'. State the dollar figure and the multiple.",
      input_schema: { type: "object", properties: {} },
    },
    execute: async (_args, ctx) => {
      const { data, error } = await ctx.supabase.rpc("deck_value_summary");
      if (error) throw error;
      return data;
    },
  },
  {
    definition: {
      name: "get_weight_trend",
      description:
        "Platform 'weight' over time: daily snapshots of database size, storage bytes, total users, and row counts. Use for questions about scale, growth, capacity, or 'how big are we getting'.",
      input_schema: {
        type: "object",
        properties: {
          days: { type: "number", description: "Number of recent daily snapshots (default 30, max 90)." },
        },
      },
    },
    execute: async (args, ctx) => {
      const days = Math.min(Math.max(Number(args.days) || 30, 1), 90);
      const { data, error } = await ctx.supabase
        .from("platform_weight")
        .select("captured_at, db_bytes, storage_bytes, users_total, row_counts")
        .order("captured_at", { ascending: false })
        .limit(days);
      if (error) throw error;
      return { snapshots: data ?? [] };
    },
  },
  {
    definition: {
      name: "propose_correction",
      description:
        "Queue a correction for an admin to approve — use when the user says a dashboard value or a document is wrong/outdated. The proposal only lands in a queue; it is NOT applied until an admin approves it. For a 'document' correction you MUST first call get_document (no path to find the path, then with the path to read the full content_md), edit that full text, and send the ENTIRE corrected markdown as proposed_value — never an excerpt or diff. Admin-only.",
      input_schema: {
        type: "object",
        properties: {
          target_type: { type: "string", enum: ["dashboard_setting", "document"] },
          target_ref: { type: "string", description: "Dashboard setting key, or the document path." },
          title: { type: "string", description: "Short title for the proposed correction." },
          rationale_md: { type: "string", description: "Why this correction is needed." },
          proposed_value: {
            description:
              "The corrected value. For dashboard_setting: the new value. For document: the FULL corrected markdown string.",
          },
        },
        required: ["target_type", "target_ref", "title", "rationale_md", "proposed_value"],
      },
    },
    requiresAdmin: true,
    execute: async (args, ctx) => {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/report-ingest`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "correction",
          payload: {
            target_type: args.target_type,
            target_ref: args.target_ref,
            title: args.title,
            rationale_md: args.rationale_md,
            proposed_value: args.proposed_value,
            proposed_by: "assistant",
            acting_user_id: ctx.userId,
          },
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) return { error: data?.error ?? `proposal failed (${resp.status})` };
      return { proposed: true, id: data.id, note: "Queued for an admin to approve — not yet applied." };
    },
  },
  {
    definition: {
      name: "list_pending_loop_actions",
      description:
        "List automation-loop reminder actions awaiting admin approval (recipient, subject, estimated value). Use when the operator asks what's waiting for approval or about the automation queue. Admin-only.",
      input_schema: { type: "object", properties: {} },
    },
    requiresAdmin: true,
    execute: async (_args, ctx) => {
      const { data, error } = await ctx.supabase
        .from("loop_actions")
        .select("id, target, payload, value_estimate_cents, created_at")
        .eq("status", "proposed")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // deno-lint-ignore no-explicit-any
      const actions = (data ?? []) as any[];
      return {
        count: actions.length,
        actions: actions.map((a) => ({
          recipient: a.target?.recipient ?? null,
          subject: a.payload?.subject ?? null,
          estimated_value_cents: a.value_estimate_cents,
        })),
      };
    },
  },
];
