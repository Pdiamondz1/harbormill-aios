# Loop Audit deliverable (Phase 2) — design spec

## Context & problem

The [[Four-Condition Loop Test]] (`docs/wiki/concepts/four-condition-loop-test.md`) is one
framework reused across three surfaces. **Phase 1** shipped the dev-side `loop-audit` skill. This
spec is **Phase 2**: package the same gate-then-rank framework as Harbormill's signature **paid
"Loop Audit"** sales deliverable — the engagement that maps a prospect's repeating work, scores
each task for loop-ability, and hands them a branded "build this loop first" recommendation.

The shipped **ROI-Discovery Audit** (PR #13, on `main`) already captures **Stage 2 — the ranking**
per opportunity: `category` / `annual_value_cents` / `confidence` / `effort`, with ROI math
(`summarizeAudit`), value/effort ordering (`prioritize`), a branded markdown report
(`composeReportMarkdown`), and a Google Doc export. What it does **not** capture is **Stage 1 — the
gate**: the four conditions (repeats / a-rule-decides-done / afford-wasted-runs / AI-has-data+tools)
and the resulting `candidate` / `blocked` / `not-a-loop` outcome, nor a single "build-first"
recommendation.

So Phase 2 is **not a new engine** — it adds the gate (and a loop-flavored report) on top of the
shipped audit surface, behind a per-audit flag. This honors the keystone *"customize in the seams,
don't fork the shared engine."*

## Goals

- Let an operator run an audit as a **Loop Audit**: capture the four conditions per opportunity and
  derive each one's loop outcome (`candidate` / `blocked` / `not-a-loop`).
- Rank the `candidate`s by value-per-effort (reuse the shipped `prioritize`) and surface **one
  recommended first build** with its reasoning.
- Export a branded **Loop Audit report** to a Google Doc (reuse the existing
  `export_markdown_to_doc` action) — the paid deliverable.
- Leave the existing **Opportunity Report** path **exactly as shipped** when the flag is off.
- Ship a **methodology playbook** so the engagement is repeatable and teachable (education-first).

## Non-goals (explicitly deferred)

- **Phase 2b — the `website/` marketing/offer page.** Spec'd here as deferred; built as its own
  task once the deliverable exists.
- **Phase 3 — the in-app Aria feature** (scoring a *client's* recurring work from deck signals).
  Still fails condition #4 today (per-client task data not ingested); unchanged by this spec.
- Aria-assisted drafting of the gate (manual entry now, same posture as ROI-audit opportunities).
- Storing the derived outcome in the DB (it is computed from the four fields — single source of
  truth, mirroring `summarizeAudit`).
- Any new feature flag — Loop Audit rides the existing `audits` flag (same admin surface).
- Any `activity`-table logging — same rule as the ROI audit: private sales data, must not leak.

## Users & access

Admin-only, end to end — identical to the ROI-Discovery Audit. The new columns inherit the existing
admin-only RLS policies on `audits` / `audit_opportunities`; no policy changes.

## Design

### Decision: one per-audit flag turns an Audit into a Loop Audit

`audits.is_loop_audit` (default `false`). Off → today's Opportunity Report, untouched. On → the same
opportunities also carry the four conditions; the form shows the gate controls and the export uses
the loop report. Loop Audit is a **sibling mode**, not a replacement.

### 1. Schema — one additive migration

`supabase/migrations/<timestamp>_loop_audit.sql` (additive + defaulted, so existing rows are
unaffected; columns inherit the tables' admin-only RLS):

- `alter table public.audits add column is_loop_audit boolean not null default false;`
- On `public.audit_opportunities` (all **nullable** — null = not assessed for loop-ability):
  - `loop_repeats text check (loop_repeats in ('strong','partial','weak'))` — condition 1 *(scored)*
  - `loop_done_rule boolean` — condition 2 *(hard blocker)*
  - `loop_afford_waste text check (loop_afford_waste in ('strong','partial','weak'))` — condition 3 *(scored)*
  - `loop_has_tools boolean` — condition 4 *(hard blocker)*

No new index, trigger, or policy needed (the `updated_at` trigger and RLS already cover the tables).

### 2. Types (`src/types/audit.ts`)

- `export type GateScore = "strong" | "partial" | "weak";`
- `export type LoopOutcome = "candidate" | "blocked" | "not-a-loop";`
- `Audit` gains `is_loop_audit: boolean;`
- `AuditOpportunity` gains `loop_repeats: GateScore | null; loop_done_rule: boolean | null;
  loop_afford_waste: GateScore | null; loop_has_tools: boolean | null;`
- Add `LOOP_OUTCOME_LABELS` for badge/report text.
- Update `AUDIT_COLS` / `OPP_COLS` in `src/hooks/useAudits.ts` to select the new columns.

### 3. Lib — pure, unit-tested (`src/lib/audit.ts`)

- `isUngated(opp): boolean` — all four gate fields are `null` (not yet assessed).
- `gateOutcome(opp: AuditOpportunity): LoopOutcome`
  - `blocked` if `loop_done_rule === false || loop_has_tools === false` (hard blockers first)
  - else `not-a-loop` if `loop_repeats === "weak" || loop_afford_waste === "weak"`
  - else `candidate` **only when all four fields are non-null and passing**; otherwise (a
    partially-gated row that hasn't failed anything) `not-a-loop`.
  - Net effect: a row is `candidate` *only* when fully gated and all four pass — so an ungated or
    half-filled row can never be a silent candidate. The UI uses `isUngated` to show a neutral
    "needs assessment" badge instead of the `not-a-loop` outcome for never-assessed rows.
- `recommendFirstBuild(opps: AuditOpportunity[]): AuditOpportunity | null` — the top `candidate`
  by the existing `prioritize()` (annual value desc → effort low-first → confidence high-first), or
  `null` if no candidates.
- `composeLoopReportMarkdown(audit, opps, summary): string` — the loop deliverable:
  1. **"Build first: {title}"** headline + one paragraph (why it wins on value-per-effort, which
     conditions it passes strongly).
  2. A **ranked candidates** table: Rank | Task | Category | Annual value | Confidence | Effort |
     the four gate cells.
  3. A **ledger** for every opportunity including `blocked` (with the single unblock step) and
     `not-a-loop` (why it stays manual).
  - The existing `composeReportMarkdown` is unchanged and still used when `!is_loop_audit`.

### 4. UI — extend existing components (no new page)

- **`src/pages/Audits.tsx` (create flow):** a "Loop Audit" toggle when creating an audit; pass
  `is_loop_audit` through `useSaveAudit`.
- **`src/components/audit/AuditCard.tsx`:** a small "Loop Audit" badge when the flag is set.
- **`src/components/audit/AuditOpportunityForm.tsx`:** when `audit.is_loop_audit`, render the four
  gate controls — two `strong/partial/weak` selects (`loop_repeats`, `loop_afford_waste`) and two
  yes/no toggles (`loop_done_rule`, `loop_has_tools`) — plus a live outcome chip (`gateOutcome`).
  Form takes an `isLoopAudit` prop (the form currently only knows `auditId`); thread it from
  `AuditDetail`.
- **`src/components/audit/LoopGateBadge.tsx` (new):** the `candidate` / `blocked` / `not-a-loop`
  pill (token-based colors), used per row in `OpportunityList` and reused by the report header.
- **`src/components/audit/OpportunityList.tsx`:** show the `LoopGateBadge` per row in loop mode.
- **`src/components/audit/OpportunityReport.tsx`:** in loop mode, add a strip under the hero —
  candidate/blocked counts and the "Build first: {name}" line (or "No candidates yet"). Hero ROI
  numbers stay.
- **`src/pages/AuditDetail.tsx`:** pick `composeLoopReportMarkdown` when `audit.is_loop_audit`; Doc
  title becomes `Loop Audit — {prospect_name}`. Thread `isLoopAudit` into the form.

**UI note (ungated rows):** in a loop audit, an opportunity with no gate data is shown as
"needs assessment" (neutral badge), never as a silent `candidate`. Only fully-passing rows count
toward the build-first ranking.

### 5. Methodology — the bundled playbook

- `docs/loop-audit-playbook.md` — how to *run* the paid engagement: the discovery interview script,
  the four-condition rubric (what strong/partial/weak means per condition), what the prospect
  receives (the exported Doc), and how it slots into **Rung 2 (Paid audit, $500–$2,500)** to sell
  **Rung 3 (Focused project)**. Education-first: the rubric is teachable, not a black box.
- **Wiki:** mark **surface 2 as shipped** in `docs/wiki/concepts/four-condition-loop-test.md`;
  cross-link the loop mode from `docs/wiki/concepts/roi-discovery-audit.md`. Add a `log.md` entry.
  (Use the `wiki-ops` ingest flow; lint for orphans/broken wikilinks.)

## Testing & verification

App code + schema are touched, so the full gate applies:

- **Unit tests (`src/lib/audit.test.ts`):**
  - `gateOutcome` — each branch: hard-blocker `blocked` (done_rule false; has_tools false),
    `not-a-loop` (repeats weak; afford weak), `candidate` (all four present and pass), and
    partially-gated rows resolving to `not-a-loop` (never a silent candidate); `isUngated` true
    only when all four are null.
  - `recommendFirstBuild` — picks the top candidate by `prioritize`; returns `null` with no
    candidates; ignores blocked/not-a-loop.
  - `composeLoopReportMarkdown` — includes the build-first headline, the ranked table, and the
    blocked/not-a-loop ledger; excludes non-candidates from the ranking.
- **Gate:** `npm run typecheck` · `npm run lint` · `npm run build` · `npm run test`.
- **RLS / edge functions:** unchanged. Export reuses the existing `export_markdown_to_doc` action;
  validate the migration on deploy (Deno/SQL not covered by the npm gate).
- **Manual:** create a Loop Audit, add opportunities across all three outcomes, confirm the report
  preview + Doc export show the build-first recommendation and the ledger; confirm a non-loop audit
  still produces the original Opportunity Report.

## Files touched (summary)

- New: `supabase/migrations/<timestamp>_loop_audit.sql`,
  `src/components/audit/LoopGateBadge.tsx`, `docs/loop-audit-playbook.md`.
- Edited: `src/types/audit.ts`, `src/hooks/useAudits.ts`, `src/lib/audit.ts`,
  `src/lib/audit.test.ts`, `src/pages/Audits.tsx`, `src/pages/AuditDetail.tsx`,
  `src/components/audit/{AuditCard,AuditOpportunityForm,OpportunityList,OpportunityReport}.tsx`,
  `docs/wiki/concepts/four-condition-loop-test.md`, `docs/wiki/concepts/roi-discovery-audit.md`,
  `docs/wiki/log.md`.
- Deferred (Phase 2b, separate task): `website/` Loop Audit offer page.
