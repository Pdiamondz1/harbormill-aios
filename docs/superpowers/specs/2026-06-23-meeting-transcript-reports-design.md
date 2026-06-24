# Meeting Transcript Reports — Design (AIOS Outcome Edition, Spec #2)

## Context

**Why this exists.** A stated AIOS capability (`PROJECT_CONTEXT.md`: *"meeting transcripts →
summaries → next action steps"*) has zero scaffolding today. This spec ships it: an admin pastes or
uploads a meeting transcript, Claude turns it into a **meeting summary** plus **structured action
items**, and both surface in the deck — so nothing said in a meeting is lost after the call. It adds a
second sellable capability to the Outcome Edition alongside the Loop Engine (Spec #1).

**Confirmed product decisions.**
- **Input:** manual paste/upload only. No Google Meet/Calendar/Drive auto-pull → **no new OAuth
  scopes, no re-consent, works on any client's Workspace tier.** (Auto-pull is a deferred follow-on.)
- **Outputs:** a meeting **summary** + **action items** (decisions/risks). KPI extraction, RAG
  searchability, and project-status updates are deferred.

**Reuse (confirmed present in the codebase).**
- `_shared/anthropic-fetch.ts` — retrying Anthropic caller (`claude-sonnet-4-6`, default).
- `logCost()` + `cost_ledger` — token-cost tracking (mirror `assistant-chat`).
- `report-ingest` `type:"findings"` — upsert-on-`fingerprint`, severity-typed, admin-only. Perfect
  fit for action items.
- The `features.ts` / `App.tsx` / `AppLayout.tsx` flag+route+nav trio and the `Findings` page UI.

**The one honest net-new bit of schema.** The summary has no clean existing home (`briefings` is
`unique(week_start)` — one per week — so it can't store per-meeting summaries). A minimal
`meeting_reports` table is the correct fit.

## Goal

Admin pastes a transcript → gets a saved, readable meeting summary + a set of action items filed as
findings, in one step — reusing the existing AI-call and findings seams, adding only a small
`meeting_reports` table, one edge function, and one page.

## Scope

**In scope:**
1. `meeting_reports` table (+ admin RLS).
2. `transcript-summarize` edge function: transcript → Claude structured extraction → write summary +
   fan action items to `report-ingest`.
3. `Meetings` admin page: paste/upload form + list of past reports with their action items.

**Out of scope (deferred follow-ons):** Drive/Calendar auto-pull, KPI extraction into
`metric_snapshots`, RAG embedding of transcripts, automatic project-status updates, editing/re-running
a report, stakeholder visibility (admin-only for v1).

## Architecture

```
Admin pastes transcript (Meetings page)
  → transcript-summarize (edge fn, admin JWT)
      → anthropic-fetch → Claude returns { summary_md, action_items[] }   (logCost)
      → insert meeting_reports row (summary)
      → POST report-ingest type:"findings" (action items, evidence links back to the report)
  → Meetings page shows the report + its filed findings
```

### Data model — new migration
**`meeting_reports`:**
```
id uuid pk · title text not null · meeting_date date not null
summary_md text not null · transcript_chars integer            -- size logged, transcript NOT stored by default
action_item_count integer not null default 0
source text not null default 'manual'
created_by uuid references auth.users · created_at timestamptz default now()
```
Admin-only RLS (mirror `findings` / `audits` policies). Storing the raw transcript is **out of scope**
(privacy default); only `transcript_chars` is recorded for cost/audit. Action items link back via
`findings.evidence = { meeting_report_id }` (no `findings` schema change — `evidence jsonb` exists).

### Edge function — `supabase/functions/transcript-summarize/index.ts`
- **Auth:** admin JWT (mirror `connector-sync`'s admin path) — it's an interactive admin action.
- **Input:** `{ title, meeting_date, transcript }` (transcript length-capped, e.g. ≤ ~100k chars;
  reject larger with a clear error in v1).
- **Claude call:** `anthropic-fetch` to `/v1/messages`, model `claude-sonnet-4-6`, a prompt that
  instructs **strict JSON** output: `{ summary_md: string, action_items: [{ severity:
  'critical'|'high'|'medium'|'low', title: string, summary_md: string }] }`. **Cap action items at
  ≤50** in the prompt ("the most important action items, at most 50") — `report-ingest` rejects >50
  findings per request. Parse defensively (extract the JSON block; on parse failure return a clear
  error, don't write partial data).
- **Cost:** `logCost()` with the returned usage (mirror `assistant-chat`).
- **Fan-out:**
  1. Insert one `meeting_reports` row (summary; `action_item_count` = number of items Claude
     returned, derived locally — `report-ingest` returns only `{inserted,updated,reopened}` counts,
     not per-finding IDs).
  2. POST `report-ingest` `type:"findings"` **with the service-role key** (`Authorization: Bearer
     ${SERVICE_ROLE_KEY}`, exact match — an HTTP fetch to the function URL, exactly as `connector-sync`
     does; do NOT forward the caller's admin JWT or it 401s). Each action item carries
     `source:"transcript-agent"`, a deterministic `fingerprint` (e.g. `meeting:<report_id>:<index>`),
     and `evidence:{ meeting_report_id }`. The linkage is set in the outbound payload — no ID
     round-trip needed.
- **Return:** `{ meeting_report_id, action_item_count }`.
- **Note:** action items inherit the `findings` lifecycle (`status` open/resolved, reopen-on-recur).
  Harmless in v1 (no re-run, so no fingerprint collisions); UI copy may reconcile "action item" vs
  "finding" wording later.

### Frontend — `src/pages/Meetings.tsx` (+ flag/route/nav, hook)
- Admin-only; new `meetings` feature flag; nav entry; `/meetings` route (mirror `Findings`/`Audits`).
- **Form:** title, meeting date, a large textarea (paste) + a file input that reads a `.txt`/`.md`
  into the textarea client-side. Submit → `supabase.functions.invoke("transcript-summarize")`;
  show progress + result toast.
- **List:** past `meeting_reports` (newest first); each expands to show `summary_md` (rendered
  markdown) and its linked findings (query `findings` where `evidence->>meeting_report_id = id`).
- Hook `src/hooks/useMeetingReports.ts` (TanStack Query) for list + the invoke mutation.

## Security / RLS
- `meeting_reports`: admin-only (mirror `findings`). `transcript-summarize`: admin JWT only.
- Findings written through the existing service-role `report-ingest` seam (unchanged trust boundary).
- Raw transcript not persisted (privacy default); only summary + counts stored.

## Verification (the gate)
- `npm run typecheck && npm run lint && npm run build && npm run test` green.
- **Unit (Vitest, `src/test/`):** a pure JSON-extraction/parse helper for the Claude response
  (`parseTranscriptResult`) — valid JSON, JSON wrapped in prose, and malformed input → throws.
  (Put the helper in an import-free module under `_shared/` and test from `src/test/`, mirroring the
  `stripe-map` pattern.)
- **Manual E2E (deployed):** paste a sample transcript → `meeting_reports` row created → action items
  appear on the `Findings` page and under the report on `/meetings` → `cost_ledger` shows the call.

## Decomposition / roadmap (follow-on specs)
1. **Drive/Calendar auto-pull source** (adds `drive.readonly` / `calendar.readonly` scopes).
2. **KPI extraction** → `metric_snapshots`; **RAG embedding** of summaries → `knowledge-sync`.
3. **Project-status updates** (needs a new service-role `projects` ingest path in `report-ingest`).
4. Re-run/edit a report; stakeholder visibility toggle.

## Key files
- New: `supabase/migrations/<ts>_meeting_reports.sql`,
  `supabase/functions/transcript-summarize/index.ts`,
  `supabase/functions/_shared/transcript.ts` (pure `parseTranscriptResult` + prompt builder),
  `src/test/transcript.test.ts`, `src/pages/Meetings.tsx`, `src/hooks/useMeetingReports.ts`,
  `src/types/meeting.ts`.
- Modified: `src/config/features.ts`, `src/App.tsx`, `src/components/layout/AppLayout.tsx`.
- Pattern references: `supabase/functions/assistant-chat/index.ts` (anthropic-fetch + logCost),
  `supabase/functions/report-ingest/index.ts` (findings type), `src/pages/Findings.tsx`,
  `src/pages/Audits.tsx`.
