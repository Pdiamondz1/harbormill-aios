# Meeting Transcript Reports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin paste/upload a meeting transcript and get back a saved meeting summary plus action items filed as findings — in one step.

**Architecture:** A new `transcript-summarize` edge function (admin JWT) calls Claude via the existing `anthropic-fetch` helper to extract `{ summary_md, action_items[] }`, inserts a summary row into a new minimal `meeting_reports` table, and fans the action items into the existing `report-ingest` `findings` seam (linked back via `evidence.meeting_report_id`). A new admin `Meetings` page provides the paste/upload form and lists past reports with their action items. Raw transcripts are not persisted.

**Tech Stack:** React 18 + Vite + TypeScript (strict), TanStack Query, Tailwind/shadcn; Supabase (Postgres + RLS), Deno edge functions. Vitest for unit tests, including the import-free `_shared/transcript.ts` parser tested from `src/test/` (the `stripe-map` pattern; no `deno test` in this repo).

**Spec:** `docs/superpowers/specs/2026-06-23-meeting-transcript-reports-design.md`

**Conventions:** migrations under `supabase/migrations/<ts>_<slug>.sql` (apply via Supabase MCP `apply_migration` or `supabase db push`); edge functions are Deno (validate on deploy); gate app changes with `npm run typecheck && npm run lint && npm run build && npm run test`.

---

## File Structure

**Create:**
- `supabase/migrations/<ts>_meeting_reports.sql` — table + admin RLS
- `supabase/functions/_shared/transcript.ts` — import-free `parseTranscriptResult` + `buildTranscriptPrompt`
- `src/test/transcript.test.ts` — Vitest for the parser
- `supabase/functions/transcript-summarize/index.ts` — the edge function
- `src/types/meeting.ts` — `MeetingReport` type
- `src/hooks/useMeetingReports.ts` — list query + summarize mutation
- `src/pages/Meetings.tsx` — admin page

**Modify:**
- `src/config/features.ts` (add `meetings` flag), `src/App.tsx` (route), `src/components/layout/AppLayout.tsx` (nav)

---

## Task 1: `meeting_reports` table

**Files:**
- Create: `supabase/migrations/<ts>_meeting_reports.sql`
- Reference: `supabase/migrations/20260617000800_audits.sql` (admin RLS + `handle_updated_at`)

- [ ] **Step 1: Write the migration**

```sql
create table public.meeting_reports (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  meeting_date      date not null,
  summary_md        text not null,
  transcript_chars  integer not null default 0,
  action_item_count integer not null default 0,
  source            text not null default 'manual',
  created_by        uuid references auth.users (id) on delete set null,
  created_at        timestamptz not null default now()
);
create index idx_meeting_reports_date on public.meeting_reports (meeting_date desc);

alter table public.meeting_reports enable row level security;
create policy "meeting_reports admin all" on public.meeting_reports
  for all using (public.is_admin()) with check (public.is_admin());
```

- [ ] **Step 2: Apply** (MCP `apply_migration` name `meeting_reports`).
- [ ] **Step 3: Verify** `select count(*) from public.meeting_reports;` → 0; RLS enabled.
- [ ] **Step 4: Commit**

```bash
git add supabase/migrations
git commit -m "feat(meetings): add meeting_reports table with admin RLS"
```

---

## Task 2: Transcript parser + prompt (TDD, pure module)

**Files:**
- Create: `supabase/functions/_shared/transcript.ts` (import-free)
- Test: `src/test/transcript.test.ts` (Vitest)
- Reference: `src/test/stripe-map.test.ts` for the import-free-from-`src/test` pattern

- [ ] **Step 1: Write the failing Vitest**

```ts
import { describe, it, expect } from "vitest";
import { parseTranscriptResult, buildTranscriptPrompt }
  from "../../supabase/functions/_shared/transcript";

describe("parseTranscriptResult", () => {
  it("parses clean JSON", () => {
    const r = parseTranscriptResult('{"summary_md":"# S","action_items":[{"severity":"high","title":"Do X","summary_md":"detail"}]}');
    expect(r.summary_md).toBe("# S");
    expect(r.action_items).toHaveLength(1);
    expect(r.action_items[0].severity).toBe("high");
  });
  it("extracts JSON embedded in prose/code fences", () => {
    const r = parseTranscriptResult('Sure!\n```json\n{"summary_md":"x","action_items":[]}\n```\nDone');
    expect(r.summary_md).toBe("x");
    expect(r.action_items).toHaveLength(0);
  });
  it("caps action items at 50", () => {
    const items = Array.from({ length: 80 }, (_, i) => ({ severity: "low", title: `t${i}`, summary_md: "d" }));
    const r = parseTranscriptResult(JSON.stringify({ summary_md: "x", action_items: items }));
    expect(r.action_items.length).toBe(50);
  });
  it("throws on malformed input", () => {
    expect(() => parseTranscriptResult("not json at all")).toThrow();
  });
});

describe("buildTranscriptPrompt", () => {
  it("includes the transcript and asks for strict JSON + <=50 items", () => {
    const p = buildTranscriptPrompt("Alice: hi");
    expect(p).toContain("Alice: hi");
    expect(p.toLowerCase()).toContain("json");
    expect(p).toContain("50");
  });
});
```

- [ ] **Step 2: Run, expect fail** `npm run test -- transcript`.

- [ ] **Step 3: Implement `_shared/transcript.ts`**

```ts
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
  // Extract the first {...} JSON block (tolerates code fences / prose).
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
```

- [ ] **Step 4: Run, expect pass** `npm run test -- transcript`.
- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/transcript.ts src/test/transcript.test.ts
git commit -m "feat(meetings): transcript parser + prompt builder with tests"
```

---

## Task 3: `transcript-summarize` edge function

**Files:**
- Create: `supabase/functions/transcript-summarize/index.ts`
- Reference: `supabase/functions/assistant-chat/index.ts` (anthropic-fetch + `logCost`), `supabase/functions/connector-sync/index.ts` (admin-JWT auth), `supabase/functions/report-ingest/index.ts` (findings payload)

- [ ] **Step 1: Implement the function**
  1. **Auth:** require admin via JWT (mirror connector-sync Mode B: `auth.getUser(token)` → check `user_roles.role === 'admin'`; 401/403 otherwise).
  2. **Input:** `{ title, meeting_date, transcript }`; reject empty or `transcript.length > 100000` with a clear 400.
  3. **Claude:** `anthropicFetch("https://api.anthropic.com/v1/messages", …)` with model `Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-4-6"`, `max_tokens` from env or 4096, messages = `[{role:"user", content: buildTranscriptPrompt(transcript)}]`. Read text from `content[0].text`.
  4. **Cost:** `logCost(supabase, { userId, edgeFunction:"transcript-summarize", model, inputTokens: usage.input_tokens, outputTokens: usage.output_tokens })`.
  5. **Parse:** `const result = parseTranscriptResult(text)` (catch → 502 "model returned unparseable output").
  6. **Insert summary:** into `meeting_reports` (`title, meeting_date, summary_md: result.summary_md, transcript_chars: transcript.length, action_item_count: result.action_items.length, source:'manual', created_by: userId`). Capture `report_id`.
  7. **Fan findings:** if `action_items.length`, POST to `${SUPABASE_URL}/functions/v1/report-ingest` with header `Authorization: Bearer ${SERVICE_ROLE_KEY}` (exact match — NOT the admin JWT), body:
     ```json
     { "type":"findings", "payload": { "findings": [
       { "severity":"…","title":"…","summary_md":"…",
         "source":"transcript-agent",
         "fingerprint":"meeting:<report_id>:<index>",
         "evidence": { "meeting_report_id":"<report_id>" } } ] } }
     ```
  8. **Return:** `{ meeting_report_id: report_id, action_item_count: result.action_items.length }`.

- [ ] **Step 2: Deploy** `supabase functions deploy transcript-summarize`.
- [ ] **Step 3: Integration test** — from an admin session (or with an admin JWT) invoke with a short sample transcript. Expected: 200 `{ meeting_report_id, action_item_count }`; a `meeting_reports` row; findings on the Findings page with `evidence.meeting_report_id`; a `cost_ledger` row.
- [ ] **Step 4: Commit**

```bash
git add supabase/functions/transcript-summarize/index.ts
git commit -m "feat(meetings): transcript-summarize edge function (Claude -> summary + findings)"
```

---

## Task 4: App types + hook

**Files:**
- Create: `src/types/meeting.ts`, `src/hooks/useMeetingReports.ts`
- Reference: `src/hooks/useFindings.ts`, `src/types/value.ts`

- [ ] **Step 1: `src/types/meeting.ts`** — `MeetingReport` interface mirroring the table columns.
- [ ] **Step 2: `useMeetingReports.ts`** — `useMeetingReports()` query (`meeting_reports` ordered by `meeting_date desc`) + `useSummarizeTranscript()` mutation calling `supabase.functions.invoke("transcript-summarize", { body })`, invalidating the list (and findings) on success.
- [ ] **Step 3: Gate** `npm run typecheck && npm run lint`. Expected: clean.
- [ ] **Step 4: Commit**

```bash
git add src/types/meeting.ts src/hooks/useMeetingReports.ts
git commit -m "feat(meetings): app types + hooks for meeting reports"
```

---

## Task 5: `Meetings` page + flag + route + nav

**Files:**
- Create: `src/pages/Meetings.tsx`
- Modify: `src/config/features.ts`, `src/App.tsx`, `src/components/layout/AppLayout.tsx`
- Reference: `src/pages/Findings.tsx` (list + evidence render), `src/pages/Audits.tsx` (admin form)

- [ ] **Step 1: Add `meetings: boolean` to `FeatureFlags`**, set `meetings: true` (`src/config/features.ts`).
- [ ] **Step 2: Build `Meetings.tsx`** (admin-only):
  - **Form:** title, meeting date (date input), a textarea for paste + a file input that reads a `.txt`/`.md` into the textarea client-side (`file.text()`); submit → `useSummarizeTranscript`; disable + spinner while pending; toast result.
  - **List:** `useMeetingReports()` newest-first; each row expands to render `summary_md` (existing markdown renderer) and its linked findings (query `findings` where `evidence->>meeting_report_id` = report id — reuse the findings hook with a filter, or a small inline query).
- [ ] **Step 3: Route** in `src/App.tsx` — `/meetings`, gated by `features.meetings`, admin-only (mirror `/findings`).
- [ ] **Step 4: Nav** in `AppLayout.tsx` — `{ to: "/meetings", label: "Meetings", adminOnly: true, feature: "meetings" }`.
- [ ] **Step 5: Gate + manual** `npm run typecheck && npm run lint && npm run build && npm run test`; `npm run dev`, sign in as admin, paste a sample transcript, confirm a report appears with action items.
- [ ] **Step 6: Commit**

```bash
git add src/config/features.ts src/App.tsx src/components/layout/AppLayout.tsx src/pages/Meetings.tsx
git commit -m "feat(meetings): Meetings admin page (upload transcript -> summary + action items)"
```

---

## Task 6: End-to-end verification + docs

**Files:**
- Modify: `docs/extending.md` (short "Meeting transcript reports" note)

- [ ] **Step 1: Full E2E** (deployed) — paste a realistic transcript → summary saved → action items on Findings + under the report → `cost_ledger` shows the call.
- [ ] **Step 2: Final gate** `npm run typecheck && npm run lint && npm run build && npm run test` — green.
- [ ] **Step 3: Document** the feature + the deferred follow-ons (Drive/Calendar pull, KPIs, RAG, project updates) in `docs/extending.md`.
- [ ] **Step 4: Commit**

```bash
git add docs/extending.md
git commit -m "docs(meetings): document transcript reports + deferred follow-ons"
```

---

## Out of scope (follow-on plans)
- Drive/Calendar auto-pull source (new OAuth scopes)
- KPI extraction → `metric_snapshots`; RAG embedding → `knowledge-sync`
- Project-status updates (new service-role `projects` ingest path)
- Re-run/edit a report; stakeholder visibility
