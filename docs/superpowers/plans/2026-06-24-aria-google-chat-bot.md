# Aria in Google Chat — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Damon DM the "Aria" Google Chat app and get read-only, grounded answers from the AIOS, reusing Aria's existing chat brain behind a Google-JWT + single-sender security gate.

**Architecture:** Extract Aria's chat loop into a shared `_shared/assistant-core.ts` (`runAssistantTurn`) that both the deck's `assistant-chat` and a new `google-chat-webhook` edge function call. The webhook verifies Google's signed JWT, confirms the sender is Damon, maps to his admin deck user, resolves a per-thread conversation (new nullable `conversations.external_ref` column), and runs the turn with a read-only tool allowlist.

**Tech Stack:** Deno edge functions (Supabase), Anthropic `claude-sonnet-4-6`, `jose` for JWT/JWKS verification, Vitest for the pure-logic units, Supabase migrations.

**Spec:** `docs/superpowers/specs/2026-06-24-aria-google-chat-bot-design.md`

**Target project for deploy:** Harbormill's own dogfood instance `harbormill-aios` (ref `znkoxpwvocxxvrvajmza`) — the one Damon actually uses. The migration file lands in the repo so it flows to other clones later.

---

## File Structure

| File | Responsibility |
|---|---|
| `supabase/migrations/20260624000100_conversations_external_ref.sql` | Add nullable `external_ref` column + partial index to `conversations` (thread→conversation key). |
| `supabase/functions/_shared/aria-chat-tools.ts` | **Pure, no Deno globals.** Read-only tool allowlist + excluded list (string arrays). Imported by the webhook and the partition test. |
| `src/test/aria-chat-tools.test.ts` | Vitest: the allowlist + excluded set partition the live `tools.ts` registry; no write tool is allowlisted. |
| `supabase/functions/_shared/google-chat.ts` | **Pure, no Deno globals.** Parse a Google Chat event → `{ type, text, senderEmail, threadRef }`; `isAllowedSender`. |
| `src/test/google-chat.test.ts` | Vitest for the parse/identity helpers. |
| `supabase/functions/_shared/assistant-core.ts` | Extracted Aria turn: `runAssistantTurn(...)` + `AssistantInputError`. The system prompt, sanitiser, cache-breakpoint, `extractText`, Anthropic wrapper, and length cap move here. |
| `supabase/functions/assistant-chat/index.ts` | Refactored to a thin caller of `runAssistantTurn`. Behaviour identical (deck-Aria regression gate). |
| `supabase/functions/google-chat-webhook/index.ts` | New edge function: Google-JWT gate → identity gate → conversation resolve → `runAssistantTurn` (read-only) → Chat reply. |

**Build order rationale:** pure testable modules first (Tasks 1–3, real TDD), then the core extraction with the deck as regression (Task 4), then the webhook (Task 5), then deploy + config + live smoke (Task 6).

---

## Task 1: Migration — `conversations.external_ref`

**Files:**
- Create: `supabase/migrations/20260624000100_conversations_external_ref.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Add a nullable external reference to conversations so an external front-end
-- (e.g. the Google Chat bot) can key its own threads to a conversation row.
-- Deck-created conversations leave this null; behaviour is unchanged for them.
alter table public.conversations add column if not exists external_ref text;

-- Partial index: fast lookup of (user, external_ref) for rows that set it.
create index if not exists idx_conversations_external_ref
  on public.conversations (user_id, external_ref)
  where external_ref is not null;
```

- [ ] **Step 2: Sanity-check the SQL**

Run: `npx --yes supabase@latest db lint --help >/dev/null 2>&1 || true` (no local DB here; the real apply happens in Task 6). Visually confirm: nullable column, partial index, idempotent (`if not exists`). RLS unchanged (the webhook uses the service role; deck access already scoped by `user_id`).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260624000100_conversations_external_ref.sql
git commit -m "feat(db): add conversations.external_ref for external chat front-ends"
```

---

## Task 2: Read-only tool allowlist (pure module + partition test)

**Files:**
- Create: `supabase/functions/_shared/aria-chat-tools.ts`
- Test: `src/test/aria-chat-tools.test.ts`

The test enforces the spec's guarantee: the allowlist + excluded set must **partition the entire `tools.ts` registry**, so any future tool forces a read/write classification. The test extracts registry names by reading `tools.ts` as text (it can't be imported in Vitest — it uses Deno globals).

- [ ] **Step 1: Write the pure module**

`supabase/functions/_shared/aria-chat-tools.ts`:

```ts
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
];

export const READ_ONLY_TOOLS: ReadonlySet<string> = new Set(READ_ONLY_TOOL_NAMES);
```

- [ ] **Step 2: Write the failing test**

`src/test/aria-chat-tools.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  READ_ONLY_TOOL_NAMES,
  CHAT_EXCLUDED_TOOL_NAMES,
} from "../../supabase/functions/_shared/aria-chat-tools";

// Extract every tool `name: "..."` from the Deno registry source (can't import
// tools.ts here — it uses Deno globals).
function registryToolNames(): string[] {
  const path = fileURLToPath(
    new URL("../../supabase/functions/assistant-chat/tools.ts", import.meta.url),
  );
  const src = readFileSync(path, "utf8");
  const names = new Set<string>();
  for (const m of src.matchAll(/name:\s*"([a-z_]+)"/g)) names.add(m[1]);
  return [...names];
}

describe("aria-chat read-only tool policy", () => {
  const registry = registryToolNames();

  it("registry parse found a sane number of tools", () => {
    expect(registry.length).toBeGreaterThanOrEqual(10);
  });

  it("every allowlisted name exists in the registry", () => {
    for (const n of READ_ONLY_TOOL_NAMES) expect(registry).toContain(n);
  });

  it("every excluded name exists in the registry", () => {
    for (const n of CHAT_EXCLUDED_TOOL_NAMES) expect(registry).toContain(n);
  });

  it("allowlist and excluded set partition the whole registry", () => {
    const classified = new Set([...READ_ONLY_TOOL_NAMES, ...CHAT_EXCLUDED_TOOL_NAMES]);
    const unclassified = registry.filter((n) => !classified.has(n));
    expect(unclassified).toEqual([]); // a new tool must be classified read or write
  });

  it("no excluded (write/action) tool leaks into the allowlist", () => {
    const allow = new Set(READ_ONLY_TOOL_NAMES);
    for (const n of CHAT_EXCLUDED_TOOL_NAMES) expect(allow.has(n)).toBe(false);
  });
});
```

- [ ] **Step 3: Run the test**

Run: `npm run test -- aria-chat-tools`
Expected: PASS (5 tests). If "partition" fails, the registry gained/renamed a tool — classify it in `aria-chat-tools.ts`.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/_shared/aria-chat-tools.ts src/test/aria-chat-tools.test.ts
git commit -m "feat(aria): read-only chat tool allowlist with registry-partition test"
```

---

## Task 3: Google Chat event helpers (pure module + test)

**Files:**
- Create: `supabase/functions/_shared/google-chat.ts`
- Test: `src/test/google-chat.test.ts`

Parses both `MESSAGE` (sender at `message.sender.email`) and `ADDED_TO_SPACE` (adder at `user.email`) events, derives the thread ref, and gates the sender. Fails closed on a missing email.

- [ ] **Step 1: Write the pure module**

`supabase/functions/_shared/google-chat.ts`:

```ts
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
```

- [ ] **Step 2: Write the failing test**

`src/test/google-chat.test.ts`:

```ts
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
```

- [ ] **Step 3: Run the test**

Run: `npm run test -- google-chat`
Expected: PASS (7 tests).

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/_shared/google-chat.ts src/test/google-chat.test.ts
git commit -m "feat(aria): pure Google Chat event-parse + sender-gate helpers"
```

---

## Task 4: Extract `assistant-core.ts` and refactor `assistant-chat`

**Files:**
- Create: `supabase/functions/_shared/assistant-core.ts`
- Modify: `supabase/functions/assistant-chat/index.ts`

**Note on testing:** Deno edge functions are NOT in the Vitest/tsc gate (see CLAUDE.md). Verification here is: (a) the deck Aria still works (live regression in Task 6), (b) careful diff review that the loop logic is moved verbatim. Do not change behaviour — only relocate it and add the `edgeFunction` label + `toolAllowlist` + length-cap-in-core.

- [ ] **Step 1: Create the shared core**

`supabase/functions/_shared/assistant-core.ts` — move the constants and helpers (`sanitize`, `systemPrompt`, `withHistoryCacheBreakpoint`, `extractText`, `anthropic`) out of `assistant-chat/index.ts` verbatim, then add `runAssistantTurn`:

```ts
// Aria's chat turn, shared by assistant-chat (deck UI) and external front-ends
// (e.g. google-chat-webhook). Owns everything AFTER auth + conversation
// resolution: validate, persist the user message, load history, run the tool
// loop, log cost, persist the reply, return the text. Callers handle their own
// auth, conversation ownership/creation, and response formatting.

import { logCost } from "./cost-ledger.ts";
import { anthropicFetch } from "./anthropic-fetch.ts";
import { TOOLS, type ToolContext } from "../assistant-chat/tools.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const ANTHROPIC_MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-4-6";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const PRODUCT_NAME = Deno.env.get("PRODUCT_NAME") ?? "the operating deck";
const ASSISTANT_NAME = Deno.env.get("ASSISTANT_NAME") ?? "Aria";
const ASSISTANT_PERSONA =
  Deno.env.get("ASSISTANT_PERSONA") ??
  "the operator's AI co-pilot — concise, candid, and grounded in this business's live metrics and knowledge base";

const MAX_INPUT_LENGTH = 20_000;
const MAX_TOOL_ROUNDS = 8;

const DISABLED_TOOLS = new Set(
  (Deno.env.get("DISABLED_TOOLS") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
);

// Thrown when the user message exceeds MAX_INPUT_LENGTH; callers map it to their
// own error shape (assistant-chat → 400, webhook → friendly text).
export class AssistantInputError extends Error {}

// --- (sanitize, systemPrompt, withHistoryCacheBreakpoint, extractText, anthropic
//      moved here VERBATIM from assistant-chat/index.ts) ---

export interface RunTurnOptions {
  userId: string;
  conversationId: string; // must already exist and be owned by userId
  message: string;
  isAdmin: boolean;
  edgeFunction: string; // cost-ledger label
  toolAllowlist?: ReadonlySet<string>; // when set, only these tool names are exposed
}

// deno-lint-ignore no-explicit-any
export async function runAssistantTurn(
  supabase: any,
  opts: RunTurnOptions,
): Promise<{ content: string }> {
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");
  const { userId, conversationId, isAdmin, edgeFunction, toolAllowlist } = opts;

  if (typeof opts.message !== "string" || !opts.message.trim()) {
    throw new AssistantInputError("message is required");
  }
  if (opts.message.length > MAX_INPUT_LENGTH) {
    throw new AssistantInputError(`Message too long (max ${MAX_INPUT_LENGTH} chars)`);
  }

  const sanitized = sanitize(opts.message);
  await supabase.from("messages").insert({ conversation_id: conversationId, role: "user", content: sanitized });

  const { data: history } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .in("role", ["user", "assistant"])
    .not("content", "is", null)
    .order("created_at", { ascending: true })
    .limit(40);

  // deno-lint-ignore no-explicit-any
  const claudeMessages: any[] = (history ?? []).map((m: { role: string; content: string }) => ({
    role: m.role,
    content: m.content,
  }));

  const availableTools = TOOLS.filter(
    (t) =>
      (isAdmin || !t.requiresAdmin) &&
      !DISABLED_TOOLS.has(t.definition.name) &&
      (!toolAllowlist || toolAllowlist.has(t.definition.name)),
  );
  const system = [{ type: "text", text: systemPrompt(isAdmin), cache_control: { type: "ephemeral" } }];
  const toolDefs = availableTools.map((t) => t.definition);
  const toolCtx: ToolContext = { supabase, userId, openaiKey: OPENAI_API_KEY, isAdmin };

  const callModel = () =>
    anthropic({
      model: ANTHROPIC_MODEL,
      max_tokens: 4096,
      system,
      messages: withHistoryCacheBreakpoint(claudeMessages),
      tools: toolDefs,
    });
  const ledger = (result: { usage?: { input_tokens?: number; output_tokens?: number } }) =>
    logCost(supabase, {
      userId,
      edgeFunction,
      model: ANTHROPIC_MODEL,
      inputTokens: result.usage?.input_tokens ?? 0,
      outputTokens: result.usage?.output_tokens ?? 0,
    });

  let resp = await callModel();
  if (!resp.ok) throw new Error(`Anthropic error: ${resp.status} ${await resp.text()}`);
  let result = await resp.json();
  await ledger(result);

  let rounds = 0;
  while (result.stop_reason === "tool_use" && rounds < MAX_TOOL_ROUNDS) {
    rounds++;
    // deno-lint-ignore no-explicit-any
    const toolUses = (result.content as any[]).filter((b) => b.type === "tool_use");
    // deno-lint-ignore no-explicit-any
    const toolResults: any[] = [];
    for (const tu of toolUses) {
      const tool = availableTools.find((t) => t.definition.name === tu.name);
      let output: unknown;
      try {
        output = tool ? await tool.execute(tu.input, toolCtx) : { error: `Unknown tool ${tu.name}` };
      } catch (err) {
        output = { error: err instanceof Error ? err.message : "tool failed" };
      }
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "tool",
        content: tu.id,
        tool_result: output,
      });
      toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: JSON.stringify(output) });
    }
    claudeMessages.push({ role: "assistant", content: result.content });
    claudeMessages.push({ role: "user", content: toolResults });

    resp = await callModel();
    if (!resp.ok) throw new Error(`Anthropic error: ${resp.status} ${await resp.text()}`);
    result = await resp.json();
    await ledger(result);
  }

  let content = extractText(result.content);
  if (!content.trim()) {
    content = "I gathered the data but ran out of room composing the answer. Ask me again, more specifically if you can.";
  }
  await supabase.from("messages").insert({ conversation_id: conversationId, role: "assistant", content });
  await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversationId);
  return { content };
}
```

(Copy `sanitize`, `systemPrompt`, `withHistoryCacheBreakpoint`, `extractText`, and `anthropic` from the current `assistant-chat/index.ts` lines ~38–124 into the marked block — unchanged. `anthropic` must reference the module's `ANTHROPIC_API_KEY`.)

- [ ] **Step 2: Refactor `assistant-chat/index.ts` to a thin caller**

Replace everything from the `sanitized`/insert block through the final `return json(...)` (current lines ~178–285) with a call to the core; keep the auth, role check, body parse, and conversation-ownership check above it. Remove the now-moved helpers and constants (they live in the core). Result:

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { runAssistantTurn, AssistantInputError } from "../_shared/assistant-core.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(req), "Content-Type": "application/json" } });

  // Auth: validate the caller's session and resolve the user.
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Unauthorized" }, 401);
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
  const userId = userData.user.id;

  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roleList = (roles ?? []) as { role: string }[];
  const isAdmin = roleList.some((r) => r.role === "admin");
  const hasAccess = isAdmin || roleList.some((r) => r.role === "stakeholder");
  if (!hasAccess) return json({ error: "forbidden: no access tier" }, 403);

  let conversation_id: string;
  let message: string;
  try {
    const body = await req.json();
    conversation_id = body.conversation_id;
    message = body.message;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!conversation_id) return json({ error: "conversation_id and message are required" }, 400);

  const { data: conv } = await supabase
    .from("conversations").select("id, user_id").eq("id", conversation_id).maybeSingle();
  if (!conv || conv.user_id !== userId) return json({ error: "forbidden: not your conversation" }, 403);

  try {
    const { content } = await runAssistantTurn(supabase, {
      userId, conversationId: conversation_id, message, isAdmin, edgeFunction: "assistant-chat",
    });
    return json({ success: true, content });
  } catch (err) {
    if (err instanceof AssistantInputError) return json({ error: err.message }, 400);
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("[assistant-chat]", msg);
    return json({ error: msg }, 500);
  }
});
```

- [ ] **Step 3: Static review (no CI for Deno)**

Re-read both files. Confirm: no duplicated constant/helper across the two files; `assistant-chat` no longer imports `TOOLS`/`logCost`/`anthropicFetch` directly; the moved helpers reference the core's module constants; the request/response contract (200 `{success,content}`, 400 on bad input/too-long, 401/403 on auth) is preserved.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/_shared/assistant-core.ts supabase/functions/assistant-chat/index.ts
git commit -m "refactor(aria): extract runAssistantTurn into _shared/assistant-core"
```

(Live deck-Aria regression is verified in Task 6 after deploy.)

---

## Task 5: The `google-chat-webhook` edge function

**Files:**
- Create: `supabase/functions/google-chat-webhook/index.ts`

- [ ] **Step 1: Write the function**

```ts
// google-chat-webhook
// A read-only Google Chat front-end for Aria. Verifies Google's signed JWT,
// confirms the sender is the single allowed user, maps to that admin deck user,
// resolves a per-thread conversation, and runs a read-only Aria turn.
// Deployed with --no-verify-jwt (it verifies Google's JWT itself).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jwtVerify, createRemoteJWKSet } from "https://esm.sh/jose@5";
import { runAssistantTurn } from "../_shared/assistant-core.ts";
import { READ_ONLY_TOOLS } from "../_shared/aria-chat-tools.ts";
import { parseChatEvent, isAllowedSender, type ChatEvent } from "../_shared/google-chat.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ALLOWED_EMAIL = Deno.env.get("ARIA_CHAT_ALLOWED_EMAIL") ?? "";
const CHAT_USER_ID = Deno.env.get("ARIA_CHAT_USER_ID") ?? "";
const PROJECT_NUMBER = Deno.env.get("ARIA_CHAT_PROJECT_NUMBER") ?? "";

const CHAT_ISSUER = "chat@system.gserviceaccount.com";
// Module-level so jose caches Google's keyset across invocations (do not rebuild per request).
const JWKS = createRemoteJWKSet(
  new URL(`https://www.googleapis.com/service_accounts/v1/jwk/${CHAT_ISSUER}`),
);

const text = (t: string) => new Response(JSON.stringify({ text: t }), { headers: { "Content-Type": "application/json" } });
const REFUSAL = "Sorry, I'm a private assistant and can't help here.";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // 1. Authenticity gate: verify the Google-signed Bearer JWT.
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return new Response("Unauthorized", { status: 401 });
  try {
    await jwtVerify(token, JWKS, { issuer: CHAT_ISSUER, audience: PROJECT_NUMBER });
  } catch (_err) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Parse the event.
  let event: ChatEvent;
  try {
    event = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const parsed = parseChatEvent(event);

  // 3. Identity gate (fail closed on missing email).
  if (!isAllowedSender(parsed.senderEmail, ALLOWED_EMAIL)) return text(REFUSAL);

  if (parsed.type === "ADDED_TO_SPACE") {
    return text("Hi — I'm Aria. Ask me about your metrics, weekly brief, value delivered, or anything in the knowledge base.");
  }
  if (parsed.type !== "MESSAGE" || !parsed.text) return new Response(null, { status: 200 });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // 5. Resolve the conversation for this Chat thread (create on first message).
  const externalRef = parsed.threadRef ?? "google-chat:default";
  let conversationId: string;
  const { data: existing } = await supabase
    .from("conversations").select("id")
    .eq("user_id", CHAT_USER_ID).eq("external_ref", externalRef).maybeSingle();
  if (existing) {
    conversationId = existing.id;
  } else {
    const { data: created, error } = await supabase
      .from("conversations").insert({ user_id: CHAT_USER_ID, external_ref: externalRef }).select("id").single();
    if (error || !created) {
      console.error("[google-chat-webhook] conversation create failed:", error?.message);
      return text("I hit an error pulling that — try again in a moment.");
    }
    conversationId = created.id;
  }

  // 6. Run the read-only turn.
  try {
    const { content } = await runAssistantTurn(supabase, {
      userId: CHAT_USER_ID,
      conversationId,
      message: parsed.text,
      isAdmin: true,
      edgeFunction: "google-chat-webhook",
      toolAllowlist: READ_ONLY_TOOLS,
    });
    return text(content);
  } catch (err) {
    console.error("[google-chat-webhook]", err instanceof Error ? err.message : err);
    return text("I hit an error pulling that — try again in a moment.");
  }
});
```

- [ ] **Step 2: Static review**

Confirm: JWKS built once at module scope; audience compared as a string (`PROJECT_NUMBER`); identity gate runs before any DB/Anthropic work; `ADDED_TO_SPACE` greeting only after the gate; conversation create handles error; every Aria turn passes `READ_ONLY_TOOLS`. Note the redelivery decision (spec §3 step 4): v1 accepts rare duplicates on slow Chat retries (single user) — no dedupe storage.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/google-chat-webhook/index.ts
git commit -m "feat(aria): google-chat-webhook — read-only Aria over Google Chat"
```

---

## Task 6: Deploy, configure, and live smoke-test

Target: `harbormill-aios` (ref `znkoxpwvocxxvrvajmza`). Deploys use the Supabase MCP tools (`apply_migration`, `deploy_edge_function`, `execute_sql`) or CLI `npx --yes supabase@latest ... --project-ref znkoxpwvocxxvrvajmza` with `SUPABASE_ACCESS_TOKEN` set. Run the full local gate first.

- [ ] **Step 1: Run the full gate (local)**

Run: `npm run test && npm run lint && npm run typecheck && npm run build`
Expected: all green (2 known react-refresh lint warnings OK). Note: this gate covers the Vitest pure modules and the app; the Deno functions are validated by the deploy + smoke below.

- [ ] **Step 2: Apply the migration**

Apply `20260624000100_conversations_external_ref.sql` to `znkoxpwvocxxvrvajmza` (MCP `apply_migration`). Verify with MCP `list_migrations` (the new entry appears) and `get_advisors` (security: no new issues — the column is on an already-RLS'd table).

- [ ] **Step 3: Look up Damon's admin user_id**

Run (MCP `execute_sql` on the project): `select id from auth.users where email = 'dwilliams@harbormill.net';`
Record the UUID for `ARIA_CHAT_USER_ID`.

- [ ] **Step 4: Set the edge-function secrets**

Set on the project (dashboard or CLI `secrets set`): `ARIA_CHAT_ALLOWED_EMAIL=dwilliams@harbormill.net`, `ARIA_CHAT_USER_ID=<uuid from Step 3>`, `ARIA_CHAT_PROJECT_NUMBER=<Damon's Chat app project number — from Step 7>`. (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `SUPABASE_*` already set.)

- [ ] **Step 5: Deploy the functions**

Deploy `assistant-chat` (re-deploy — now imports the shared core) and `google-chat-webhook` (new), both `--no-verify-jwt`:

```bash
SUPABASE_ACCESS_TOKEN=$TOKEN npx --yes supabase@latest functions deploy assistant-chat --no-verify-jwt --project-ref znkoxpwvocxxvrvajmza
SUPABASE_ACCESS_TOKEN=$TOKEN npx --yes supabase@latest functions deploy google-chat-webhook --no-verify-jwt --project-ref znkoxpwvocxxvrvajmza
```

(Or MCP `deploy_edge_function`.) Verify both ACTIVE via MCP `list_edge_functions`. Record the webhook URL: `https://znkoxpwvocxxvrvajmza.supabase.co/functions/v1/google-chat-webhook`.

- [ ] **Step 6: Deck-Aria regression (proves the refactor is safe)**

Damon, in the live deck at `https://aios.harbormill.net` → Assistant: ask a metrics question ("how are we tracking?") and a value question ("what value have we delivered?"). Confirm Aria answers as before. This is the gate for Task 4.

- [ ] **Step 7: Damon configures the Google Chat app (runbook)**

1. Google Cloud Console (the project that will own the Chat app) → **enable the Google Chat API**.
2. Chat API → **Configuration**: App name `Aria`; avatar + description; **enable interactive features**; **Connection settings → App URL** = the webhook URL from Step 5; **Visibility** = restricted to himself / the Harbormill Workspace org (this is load-bearing — it's what makes `sender.email` present and trusted).
3. Note the Google Cloud **project number** → give it to set `ARIA_CHAT_PROJECT_NUMBER` (Step 4), then re-deploy is not needed (secrets are read at runtime), but the secret must be set before testing.

- [ ] **Step 8: Live smoke test**

- In Google Chat, find and DM **Aria**: "what's overdue right now?" → expect a grounded, read-only answer.
- Confirm in the DB (`execute_sql`): a `conversations` row with the thread's `external_ref` and `messages` rows; a `cost_ledger` row with `edge_function = 'google-chat-webhook'`.
- Negative: an unsigned `curl` POST to the webhook returns **401** (no `{text}` body).
- (If feasible) a message from a non-allowed account returns the polite refusal, not an answer.

- [ ] **Step 9: Final commit / branch wrap**

After smoke passes, proceed to `superpowers:finishing-a-development-branch` (tests already green) to merge/PR per Damon's choice.

---

## Notes for the implementer
- **Deno files aren't in CI.** Get them right by review + deploy smoke; the Vitest gate only covers the pure `_shared` modules (Tasks 2–3) and the app.
- **Don't change Aria's behaviour in Task 4** — it's a pure move + three additive options (`edgeFunction`, `toolAllowlist`, length-cap-in-core). The deck regression (Step 6) is the proof.
- **Secrets are write-only** on Supabase; you can set but not read them back. `ARIA_CHAT_PROJECT_NUMBER` depends on Damon's Google step, so Step 4 may be split (set the two known secrets now, the project number after Step 7).
- **The security boundary is the JWT gate + the single-sender gate** — both must pass before any tool runs. Keep them at the very top of the handler.
