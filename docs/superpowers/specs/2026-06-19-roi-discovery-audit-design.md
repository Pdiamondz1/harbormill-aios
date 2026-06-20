# ROI-Discovery Audit (Opportunity Report) — design spec

## Context & problem

Harbormill sells the AIOS deck as the recurring surface of a **$5k/mo operating-partner
retainer**. The retainer only closes if a prospect believes the value is real — ideally ~10× the
fee. Today there is no repeatable way to **quantify a prospect's value opportunity from their own
situation and hand them a credible artifact** that justifies the spend. This feature adds that: an
admin-only prospecting surface that captures a prospect's value opportunities, auto-computes total
opportunity and ROI vs the proposed fee, and exports a branded **Opportunity Report** that doubles
as the proposal. It is rung 2 of the Harbormill ladder (the paid audit) productized, and the motion
that lands the first $5k retainers.

This is the first build in the "pre-clients / prospecting" phase: the bottleneck is sales, not
delivery efficiency, so the audit (sales) precedes the connector library (delivery scaling).

## Goals

- Capture, per prospect, a set of quantified value opportunities with a recorded basis.
- Auto-compute total annual opportunity, ROI multiple vs the proposed retainer, and a
  value-vs-effort prioritization.
- Produce a polished, branded Opportunity Report exportable to a Google Doc (the proposal).
- Be repeatable across many prospects (a pipeline), not a one-off.
- Keep numbers **defensible**: value is entered deliberately by the operator with a stated basis;
  the deck never fabricates it.

## Non-goals (explicitly deferred)

- Aria-assisted drafting of opportunities (manual entry now; assist is a fast-follow).
- Converting a *won* audit's opportunities into the client deck's `value_events` baseline.
- A public, self-serve ROI calculator on the marketing site (different job: top-of-funnel).
- Multi-user collaboration on an audit; client/stakeholder visibility (audits are private sales data).
- **No `activity`-table logging for audits.** Unlike `projects`/`notes`, audits must NOT write to the
  append-only `activity` table — that feed is access-tier-readable and would leak prospect names to
  stakeholders. Do **not** copy the projects activity-trigger pattern onto these tables.

## Users & access

Admin-only, end to end. Audits are the operator's sales pipeline and must never be visible to
stakeholders or clients. RLS: admin manages (select/insert/update/delete); no stakeholder access.
Routes gated `tier="admin"` (mirrors Findings). The audit lives in the operator's own deck.

## Data model — migration `supabase/migrations/20260617000800_audits.sql`

`audits`
- `id uuid pk`, `prospect_name text not null`, `company text`,
- `status text check in ('draft','presented','won','lost') default 'draft'`,
- `proposed_retainer_cents integer not null default 500000` (seeded from the existing
  `aios_dashboard_settings.monthly_retainer_cents` at insert time via the app, or the column default),
- `summary_notes text`,
- `last_export_doc_id text` (the Drive doc id from the most recent export, so re-export updates the
  same Doc instead of creating duplicates — the proxy already supports `doc_id`),
- `created_by uuid references auth.users(id) default auth.uid()`, `created_at`, `updated_at`.

No `activity` triggers on either table (see Non-goals — avoids leaking prospect names).

`audit_opportunities`
- `id uuid pk`, `audit_id uuid references audits(id) on delete cascade`,
- `title text not null`, `description_md text`,
- `category text check in ('hours_saved','revenue_captured','cost_avoided','other')`,
- `annual_value_cents integer not null check (annual_value_cents >= 0)`,
- `confidence text check in ('low','med','high') default 'med'`,
- `effort text check in ('low','med','high') default 'med'`,
- `basis_md text` (how the number was derived),
- `sort_order int default 0`, `created_at`, `updated_at`.

RLS (both tables): `admin manage` via `has_role(auth.uid(),'admin')` for all; no other policies.
`updated_at` triggers via the existing `handle_updated_at()`.

## Value math

- Each opportunity is an **annual** dollar value with a recorded **basis**
  (e.g. "3 hrs/wk × $80 × 52 = $12,480" or "2 extra deals/mo × $1,500 × 12 = $36,000").
- The entry form provides an hours helper (hrs/wk × hourly rate → annual) that fills
  `annual_value_cents` and writes the basis string into `basis_md`.
- **Total opportunity** = sum of `annual_value_cents` across the audit's opportunities.
- **ROI multiple** = total annual ÷ (`proposed_retainer_cents` × 12).
- **Prioritization** = value-vs-effort; high-value / low-effort surfaced first, confidence shown,
  so the report leads with the credible wins.
- Computation is done client-side in the hook/components (admin-only, small per-audit data set) —
  no RPC needed.

## Surfaces (admin-only; behind a `audits` feature flag)

- `/audits` (`pages/Audits.tsx`): list of prospect audits showing status, total opportunity, and ROI
  multiple; a "New audit" action (prospect name/company + proposed retainer).
- `/audits/:id` (`pages/AuditDetail.tsx`): the report —
  - prospect header + status control,
  - a summary hero ("Projected **$X/yr — N×** the annual fee"), reusing `roiClass`/`formatDollars`,
  - the opportunities table with add/edit/remove (`components/audit/AuditOpportunityForm` modeled on
    `ValueEventForm`; `OpportunityList`),
  - a priority/by-category view,
  - an **"Export to Google Doc"** button.

## Export

The page composes the Opportunity Report markdown **deterministically** from the audit data (exact
numbers, not via the LLM) and exports via the Workspace proxy's existing `export_markdown_to_doc`
action (`supabase/functions/google-workspace-proxy`, already implemented; accepts `title`, `markdown`,
optional `doc_id`).

**Implementation note (export seam):** `callProxy` in `src/hooks/useGoogleWorkspace.ts` is currently
module-private and no export hook is exported. Add an exported hook there (e.g. `useExportDoc`) that
wraps `callProxy("export_markdown_to_doc", { title, markdown, doc_id })` — keep the single proxy seam;
do **not** duplicate the auth/fetch boilerplate. On success, persist the returned doc id to
`audits.last_export_doc_id` and pass it as `doc_id` on subsequent exports (idempotent re-export).
Requires a connected Google account (same as the deck's other exports); show the standard "connect
Google on the Workspace page" message if not.

**States:** handle export in-flight (button `isLoading`) and failure (toast the error); a
zero-opportunity audit shows total $0 and no ROI multiple (`roiClass(null)` muted), and the export
button is disabled until at least one opportunity exists.

## Components, types, hooks

- `types/audit.ts` — `AuditStatus` = `'draft'|'presented'|'won'|'lost'`; `Confidence` = `Effort` =
  `'low'|'med'|'high'` (**`'med'`, not `'medium'` — must match the DB check constraints**);
  `OpportunityCategory` reuses `ValueCategory` from `types/value.ts`; plus `Audit`, `AuditOpportunity`,
  `AuditSummary`.
- `hooks/useAudits.ts` — `useAudits` (list), `useAudit(id)` (with opportunities), `useSaveAudit`,
  `useSaveOpportunity`, `useDeleteOpportunity`; a `summarize(opps, retainer)` helper. Inserts set
  `created_by` (or rely on the `default auth.uid()`).
- `hooks/useGoogleWorkspace.ts` — add an exported `useExportDoc` hook (see Export note).
- `components/audit/` — `AuditCard`, `AuditStatusBadge`, `AuditOpportunityForm` (modeled on
  `ValueEventForm`), `OpportunityList`, `OpportunityReport` (the on-screen + markdown-composing report).
- `lib/status.ts` — add `auditStatusClass(status)` (in scope) and reuse `roiClass`.
- Primitives (exact paths): `src/components/PageHeader.tsx`, `src/components/EmptyState.tsx`,
  `src/components/ui/spinner.tsx` (`Spinner`), `src/components/ui/button.tsx` (`Button`, supports
  `isLoading`).
- Wiring: `App.tsx` gated routes (`features.audits`, `tier="admin"`), `AppLayout` nav item
  (`adminOnly: true, feature: "audits"`), `config/features.ts` add `audits: true` to `FeatureFlags`.

## Reuse (don't reinvent)

value categories + `formatDollars` (`types/value.ts`), `roiClass` (`lib/status.ts`), admin/RLS
patterns (`projects`/`findings`), feature-flag gating (`config/features.ts`, `AppLayout`, `App.tsx`),
the Drive export (`google-workspace-proxy` `export_markdown_to_doc`), `PageHeader`/`EmptyState`/
`Spinner`/`Button` primitives.

## Verification

- Gate: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test`.
- Brand-leak grep over `src/components/audit/**` (no `dc-`/raw palette/`bg-white`/`text-gray-`).
- Live on `harbormill-aios-demo` (MCP): apply the migration; confirm both tables + admin-only RLS via
  the security advisor (no new issue class); insert a sample audit + opportunities; verify the
  summary/ROI math.
- Manual (`npm run dev`): admin can create an audit, add opportunities (incl. the hours helper),
  see the projected $/yr + multiple, and export to a Google Doc; a stakeholder cannot reach `/audits`;
  toggling `features.audits=false` hides the nav + routes.

## Deferred follow-ups (recorded for later)

1. Aria-assisted opportunity drafting (interview → suggested value math the operator edits).
2. On `status='won'`, convert opportunities into the client deck's `value_events` baseline.
3. Connector library so tracked actuals (post-engagement) flow in automatically.
