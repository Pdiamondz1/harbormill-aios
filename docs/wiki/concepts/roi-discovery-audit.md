---
title: ROI-Discovery Audit
type: concept
created: 2026-06-19
updated: 2026-06-19
sources: [supabase/migrations/20260617000800_audits.sql, src/types/audit.ts, src/lib/audit.ts, src/hooks/useAudits.ts, src/pages/Audits.tsx, src/pages/AuditDetail.tsx, src/components/audit/, docs/superpowers/specs/2026-06-19-roi-discovery-audit-design.md]
tags: [frontend, product, sales, prospecting, roi, admin-only]
---

# ROI-Discovery Audit

**Shipped** (PR #13, merged to `main` 2026-06-20; demo project has the migration
applied). An **admin-only, in-deck prospecting tool** that turns the sales motion
into a deliverable: for each prospect, an operator captures the value
opportunities they've found, sets a proposed retainer, and the deck computes the
ROI and exports a branded **Opportunity Report** to Google Docs. It is the artifact
that justifies the **$5k/mo retainer** on the sales call — the prospecting-side
mirror of the in-deck *Value Delivered* surface (which proves ROI *after* a client
signs).

It operationalizes **Rung 2 (Paid audit)** of [[The Harbormill Ladder]] and is the
engine for selling **Rung 4 (Retainer)**.

## Data model

Two admin-only tables (migration `20260617000800_audits.sql`):

- **`audits`** — one row per prospect: `prospect_name`, `company`, `status`
  (`draft` → `presented` → `won` | `lost`), `proposed_retainer_cents`
  (default `500000` = $5k/mo), `summary_notes`, `last_export_doc_id` (set on
  export so re-exports update the same Doc), `created_by default auth.uid()`.
- **`audit_opportunities`** — line items per audit: `title`, `description_md`,
  `category` (reuses the *Value* categories `hours_saved` / `revenue_captured` /
  `cost_avoided` / `other`), `annual_value_cents`, `confidence` and `effort`
  (`low` / `med` / `high`), `basis_md` (keeps the number defensible),
  `sort_order`. `on delete cascade` from the parent audit.

**RLS:** both tables are **admin-only** for all operations
(`has_role(auth.uid(), 'admin')`) — see [[Access Model]]. Unlike the Projects /
Notes and other deck tables, the audit tables are **deliberately not written to the
access-tier-readable `activity` table**: an activity row would leak prospect names
to stakeholders. This is sales data, not client data.

## ROI logic (`src/lib/audit.ts`, unit-tested)

- `summarizeAudit(opps, retainerCents)` → `{ total_annual_cents, annual_fee_cents,
  roi_multiple, by_category }`. `annual_fee = retainer × 12`; `roi_multiple =
  total ÷ annual_fee`, rounded to one decimal (null if the fee is 0).
- `prioritize(opps)` → sorts by annual value (desc), then effort (low first),
  then confidence (high first) — surfaces the quick, high-value wins at the top.
- `composeReportMarkdown(audit, opps, summary)` → the exportable report: headline
  projected annual value, the ROI multiple vs the retainer, then each prioritized
  opportunity with its category / confidence / effort and basis.

## Surfaces & flow

- Pages `src/pages/Audits.tsx` (list) and `src/pages/AuditDetail.tsx` (detail),
  routed under `/audits` and gated `tier="admin"` **and** behind the `audits`
  [[Plug-and-Play Client Compatibility|feature flag]] — see [[AIOS Pages]].
- Hooks in `src/hooks/useAudits.ts`; components in `src/components/audit/`.
- **Export:** AuditDetail composes the report markdown → `useExportDoc`
  (`useGoogleWorkspace`) → the [[Google Workspace Bridge]]'s
  `export_markdown_to_doc` action → persists `last_export_doc_id` → toast. The
  report lands as a branded Google Doc the operator can share with the prospect.

## Notes

- **Value is reported in, never fabricated** — same trust discipline as the
  ingest/value path: every opportunity carries a `basis_md`.
- No Aria tool was added for audits (sales data is out of the assistant's grounded
  scope); the feature is operator-driven through the UI.
- **Loop Audit mode** (`is_loop_audit`) extends this surface with the
  [[Four-Condition Loop Test]] gate — same tables, scoring, and Doc export, with a
  per-opportunity gate and a "build-first" recommendation. See
  `docs/loop-audit-playbook.md`.

## The audit computes the number value pricing needs (2026-07-15)

**Harbormill's conclusion, not a source's claim.** Recorded from
[[Ditching Hourly (Jonathan Stark, 2026)]].

[[Value-Based Pricing]] prices work as a percentage of the client's **first-year value** (~10%
floor; three options at ~10/25/50%). Its hard step is obtaining that value number at all — the
prescribed answer is a skilled interview, which is exactly the skill most operators lack and
which produces a figure nobody can check afterwards.

**This audit already computes it.** `audit_opportunities.annual_value_cents` is a scored,
sourced, per-opportunity annual value — structurally the same input the formula multiplies.
Two consequences:

- **A project price can be derived from the audit's own number** rather than any fixed figure on
  the ladder. Not proposed as a change here — the ladder's published prices are canon in
  [[Project Context]] §8, and the entry-rung reprice was already settled on PR #39 (hourly
  retired, prices unchanged); this is a separate idea about how the project rung could be priced.
- **The estimate gets checked.** The promised-vs-delivered reconciliation (spec
  `2026-06-22-aios-outcome-edition-design.md`, `value_events_audit_link`) compares the audit's
  promise against delivered `value_events`. Most consultants talk their way to a value number and
  never revisit it; this one is falsifiable after the fact.

That combination — compute the value, price off it, then prove it — is a structural advantage
this tool already has and the GTM material does not yet use.

**Flag:** the same spec prices a $10K project against a claimed $320K/yr of value (~3%, under a
third of the 10% floor). Recorded on [[Value-Based Pricing]]; not repriced.

## See Also

- [[The Harbormill Ladder]]
- [[Value-Based Pricing]]
- [[Ditching Hourly (Jonathan Stark, 2026)]]
- [[Four-Condition Loop Test]]
- [[Access Model]]
- [[AIOS Pages]]
- [[Google Workspace Bridge]]
- [[Plug-and-Play Client Compatibility]]
- [[Harbormill AIOS]]
