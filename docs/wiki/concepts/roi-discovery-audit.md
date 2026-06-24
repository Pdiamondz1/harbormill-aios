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

## See Also

- [[The Harbormill Ladder]]
- [[Four-Condition Loop Test]]
- [[Access Model]]
- [[AIOS Pages]]
- [[Google Workspace Bridge]]
- [[Plug-and-Play Client Compatibility]]
- [[Harbormill AIOS]]
