# AIOS Outcome Edition — Loop Engine + AR Follow-Up (Spec #1)

## Context

> **Pricing corrected 2026-07-15 — do not use this spec's original numbers.** An earlier draft of
> this section proposed a **$10K project + $2,500/mo retainer**. The retainer figure was wrong and
> is superseded; see "Pricing" below. The $10K project price stands. Canon for the ladder and its
> prices is [`docs/PROJECT_CONTEXT.md`](../../PROJECT_CONTEXT.md) §8; `docs/gtm/` owns call
> mechanics. This spec introduces **no new tier** — it targets an existing published one.

**Why this exists.** Harbormill wants an AIOS product it can sell as a **$10K project + the
Embedded retainer ($8–10k/mo)** to **$3–10M-revenue SMBs**. Today's AIOS deck is a
**visibility layer** — it reads data and displays it, including an already-built **Value Delivered /
ROI surface**. What it cannot do is *take action in the world* to actually produce that value. This
spec adds the missing half: a **Loop Engine** that runs hard-dollar automation loops on a cadence,
and the first loop — **AR / invoice follow-up** — which produces measurable recovered-cash value and
feeds it straight into the existing ROI surface.

**The reframe (from codebase exploration).** The "prove-it" half is ~80% built and must be *reused,
not rebuilt*:
- `value_events` table + `deck_value_summary()` RPC + `ValueDeliveredCard` + `/value` page already
  show this-month value, cumulative, **ROI multiple vs. fee**, and a by-category breakdown.
- `report-ingest` already accepts `type:"value"` events with defensibility `metadata`.
- The `connectors` framework + `connector-sync` + **pg_cron/pg_net scheduling** already prove the
  exact pattern this engine mirrors.
- The `audits` / `audit_opportunities` tables already hold the *promised* value from the sale.

**The gap this closes.** There is **no outbound execution** anywhere today: no email/reminder send,
no workflow/loop runner beyond connector polling, no action queue. This spec adds that — built
entirely in the existing config/data seams, **no fork of the shared engine**.

## Goal

Ship the smallest unit that is both **sellable** and **provable**: a generic Loop Engine + the AR
follow-up loop + an approve-first action queue + email send + promised-vs-delivered reconciliation —
so a real client sees reminders go out (with their approval) and watches recovered cash appear on the
Value page, reconciled against what was promised at the audit.

## Scope

**In scope (Spec #1):**
1. Loop Engine: `loops` + `loop_actions` tables, `loop-run` edge function (pg_cron-driven), a
   `_shared/loops/` module registry, and a `Loops.tsx` admin page.
2. AR follow-up loop module + a vendor-neutral `ar_invoices` ingest seam.
3. Email-send seam (extend `google-workspace-proxy` with Gmail send).
4. Approve-first queue (no customer email sends without a one-click admin approval).
5. Promised-vs-delivered reconciliation on the Value page.

**Out of scope (follow-on specs, same pattern):** lead-intake loop, renewal/re-engagement loop,
external CRM *write* connectors, **auto-send mode** (approve-first ships first), webhook ingestion.

## Pricing (corrected 2026-07-15)

**$10K project + Embedded retainer ($8–10k/mo)** — both inside the published ladder. No new tier.

### Why the original $2,500/mo was wrong

The draft's headline — *"8× value ($320K/yr)"* — was computed against **first-year total** cost:
$10K project + ($2,500 × 12) = $40K, and 8 × $40K = $320K. Internally consistent, but it blends a
one-time fee into an ongoing ratio, which **hides the steady-state number**. From year two on the
project fee is gone:

| | Fee | Value | Multiple |
|---|---|---|---|
| Year 1 (as drafted) | $40K | $320K | 8× |
| **Year 2+ (as drafted)** | **$30K/yr ($2,500/mo)** | **$320K** | **10.7×** |
| Year 2+ (corrected) | $96–120K/yr ($8–10k/mo) | $320K | **2.7–3.3×** |

`docs/gtm/retainer-tiers.md` sets the health metric at **≥3× the monthly fee**. At $2,500/mo the
steady-state multiple is **10.7× — roughly 3.5× below what our own target permits.** To land at 3×,
the fee is ~$8,900/mo; at a comfortable 4×, ~$6,700/mo. Either lands in **Embedded ($8–10k/mo)**.

Two further tells that the original number was picked for what felt sellable rather than off the
client's prize — the exact hourly-brain habit [[The Harbormill Ladder]]'s 2026-07-15 decision
removed from the rest of the business:

- **$2,500/mo sits *below* the $3,000 Operate floor** — the cheapest published tier — while serving
  our *largest* clients ($3–10M revenue) and delivering our *highest* value. The biggest client
  would have paid the least per month.
- **$10K against $320K/yr is payback in ~11 days.** The Field Guide sells payback *in weeks*. If
  either half of this was mispriced, it was never the project fee.

### Why the $10K project price stands

At zero published case studies, the project's job is **proof**, not margin — a fixed, obviously-fair
price maximizes shipped-and-provable wins. The retainer is where value compounds, so that is where
the correction belongs.

### Gate before selling this

This spec is **unshipped**, and the $3–10M-revenue segment cannot be sold Embedded on an empty
proof page (`website/src/config/site.ts` → `caseStudies` currently reads "Publishing soon" ×2).
**Do not publish this as a second model.** Sell the standard ladder, bank two case studies with real
reconciled ROI, then revisit — at which point the promised-vs-delivered reconciliation below is
exactly the artifact that earns the Embedded ask.

## Architecture

The engine is a deliberate clone of the proven **connector** pattern. Where a connector *reads* SaaS
metrics on a schedule, a loop *reads state, proposes actions, and (on approval) acts + records value*.

### Data model (new migrations in `supabase/migrations/`)

**`loops`** — mirrors `connectors` (`20260617001000_*` family):
```
id uuid pk · type text (check: 'ar_followup', extensible) · enabled bool default false
config jsonb default '{}'      -- per-client: cadence days, sender identity, source config
schedule_cron text · last_run_at timestamptz · last_status text · last_error text
next_run_at timestamptz · created_at · updated_at
```

**`loop_actions`** — the approve-first queue + outbound audit log:
```
id uuid pk · loop_id uuid fk → loops · type text ('email_reminder')
status text check ('proposed','approved','sent','skipped','failed') default 'proposed'
target jsonb        -- {recipient, invoice_id, ...}
payload jsonb       -- {subject, body_md}
value_estimate_cents integer · value_category text (mirrors value_events.category)
audit_opportunity_id uuid null fk → audit_opportunities   -- promised↔delivered link
metadata jsonb default '{}'   -- defensibility basis (days_overdue, amount, recovery_basis)
approved_by uuid · approved_at · sent_at · created_at
```

**`ar_invoices`** — vendor-neutral overdue-invoice store (honors the one-ingest-seam keystone; any
accounting system feeds it through `report-ingest`):
```
id uuid pk · external_id text · customer_name text · customer_email text
amount_cents integer · due_date date · status text ('open','paid','written_off')
last_reminded_at timestamptz · captured_at · created_at
unique (external_id)
```

**`value_events`** — add nullable `audit_opportunity_id uuid references audit_opportunities` so
delivered value reconciles to the promise. (A standard add-column ALTER migration — same shape as the
`loop_audit` columns added to `audit_opportunities` in `20260617001100_loop_audit.sql`, applied here
to `value_events`.)

### `report-ingest` extension (`supabase/functions/report-ingest/index.ts`)
Add a `type:"invoices"` payload (batch, ≤100) writing to `ar_invoices` (upsert on `external_id`).
Follows the existing metrics/value validation style exactly. The client's accounting agent pushes
overdue invoices here — same service-role choke point, no new auth surface.

### `loop-run` edge function (`supabase/functions/loop-run/`) — mirrors `connector-sync`
- Invoked by **pg_cron → pg_net** (new migration mirroring `20260617001000_connector_schedule.sql`).
- Loads enabled loops where `next_run_at <= now()`.
- For each: resolve the module from `_shared/loops/registry.ts`, call `loop.plan(ctx)`.
- `plan()` returns `{ actions, metrics }`. **In approve-first mode, insert `actions` as
  `status:'proposed'`** (nothing sends). Push `metrics` (e.g. `ar_overdue_total`,
  `ar_invoices_open`) through `report-ingest` so they surface on Overview.
- Update `last_run_at / last_status / next_run_at`.

### Loop module interface (`_shared/loops/types.ts`) — mirrors `_shared/connectors/types.ts`
```ts
interface Loop {
  type: string;
  plan(ctx: LoopContext): Promise<LoopPlan>;   // read state → propose actions + estimate value
}
interface LoopPlan { actions: ProposedAction[]; metrics: PulledMetric[]; }
```
Keep the **value-estimation logic in a separate pure module** (`ar-followup-map.ts`, no imports,
unit-testable) — mirrors the `stripe.ts` / `stripe-map.ts` split.

### AR follow-up loop (`_shared/loops/ar-followup.ts`)
- Reads `ar_invoices` where `status='open'` and overdue.
- Applies config cadence (default: remind at 7 / 14 / 30 days overdue, respecting `last_reminded_at`).
- Drafts a reminder email per invoice (subject/body from a template + invoice data).
- Estimates recoverable value via the pure map: `amount_cents × recovery_likelihood(days_overdue)`,
  category `revenue_captured`, with full basis in `metadata`.
- Returns proposed `email_reminder` actions + AR metrics.
- **Audit linkage:** `plan()` stamps each action's `audit_opportunity_id` from the loop's
  `config.audit_opportunity_id` (a deployment has one won audit; its AR opportunity id is set when
  the loop is configured). This is what lets delivered value reconcile to the promise. If unset,
  actions carry a null link and simply don't contribute to the reconciliation view.

### Email-send seam (extend `supabase/functions/google-workspace-proxy/index.ts`)
Add a `gmail.send` operation (new OAuth scope `gmail.send`), reusing the proxy's existing
server-side token storage/security. Approving a `loop_action` calls this to send, then on success
the approval handler pushes a `value_event` (`source:"agent"`, `audit_opportunity_id` carried
through) via `report-ingest` and marks the action `sent` + sets `ar_invoices.last_reminded_at`.

### Approve-first UI (`src/pages/Loops.tsx`) — mirrors `src/pages/Connectors.tsx`
- Admin-only, gated by a new `loops` feature flag (`src/config/features.ts`) + nav entry
  (`AppLayout.tsx`) + route (`App.tsx`).
- Section 1: configured loops with enable toggle + last-run status (mirrors Connectors).
- Section 2: **the queue** — proposed `loop_actions` with recipient, drafted email, estimated value,
  and **Approve / Skip** buttons. Approve = send + record value (above). Skip = `status:'skipped'`.
- Aria assist: add a `list_pending_loop_actions` tool to `assistant-chat/tools.ts` (admin-only,
  mirrors the existing tool pattern) so Aria can surface "3 reminders awaiting approval" + a
  `suggest_actions` chip to `/loops`.

### Promised-vs-delivered reconciliation
Extend `deck_value_summary()` **in place** (it already gates on `has_access()` and returns the value
totals the `/value` page reads — add a `reconciliation` object rather than introducing a second RPC
the page must also call) to compute, for the won audit: **promised** (sum of
`audit_opportunities.annual_value_cents`) vs **delivered** (sum of linked `value_events`).
Surface on `/value` (`Value.tsx`) as: *"Promised at audit: $X/yr · Delivered to date: $Y · Z% of
promise"*. This turns the value multiple into a reconciled fact rather than a brochure number — and
it is what makes the Embedded ask defensible at renewal (see Pricing).

## Security / RLS
- `loops`, `loop_actions`, `ar_invoices`: admin-only RLS using existing `is_admin()` / `has_role`
  (mirror the `audits` / `connectors` policies). Not logged to the activity feed if they carry
  customer PII (mirror the audit privacy decision).
- `loop-run`: service-role only (exact bearer match, like `connector-sync` / `report-ingest`).
- Email send: through the proxy's existing token security; tokens never reach the client.
- `value_events` insert remains service-role only (unchanged).

## Verification (the gate — before "done")
- `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test` all green.
- **Unit test** the pure value-estimation map (`ar-followup-map.test.ts`) — recovery-likelihood ×
  amount across overdue buckets (mirror existing `*-map` tests).
- **Seam test:** POST sample overdue invoices to `report-ingest type:"invoices"` → rows in
  `ar_invoices`.
- **Engine test:** run `loop-run` against the seeded set → `loop_actions` appear as `proposed` with
  correct value estimates; AR metrics appear on Overview.
- **End-to-end manual:** queue → Approve → Gmail send fires → `value_event` appears on `/value` →
  promised-vs-delivered updates. (Edge functions are Deno — validate on deploy, not in the npm gate.)

## Decomposition / roadmap (follow-on specs)
1. **Lead-intake loop** — same module pattern; needs a lead-source ingest + CRM write connector.
2. **Renewal/re-engagement loop** — same pattern; reads subscription/renewal dates.
3. **Auto-send mode** — per-loop `config.mode = approve | auto` graduation once a client trusts it
   (a retainer-expansion lever).
4. **Connectors that write `value_events` directly** (e.g. Stripe paid-invoice → recovered value).

## Key files
- New: `supabase/functions/loop-run/index.ts`, `_shared/loops/{types,registry,ar-followup,ar-followup-map}.ts`,
  `src/pages/Loops.tsx`, migrations for `loops` / `loop_actions` / `ar_invoices` / pg_cron schedule /
  `value_events` ALTER.
- Modified: `supabase/functions/report-ingest/index.ts` (add `invoices` type; **also extend the
  existing `value`/`values` handler to accept + persist `audit_opportunity_id`** — the reconciliation
  link depends on it),
  `supabase/functions/google-workspace-proxy/index.ts` (gmail.send),
  `supabase/functions/assistant-chat/tools.ts` (list_pending_loop_actions),
  `deck_value_summary()` RPC, `src/config/features.ts`, `src/App.tsx`,
  `src/components/layout/AppLayout.tsx`, `src/pages/Value.tsx`.
- Pattern references to follow: `_shared/connectors/*`, `supabase/functions/connector-sync/`,
  `src/pages/Connectors.tsx`, migration `20260617001000_connector_schedule.sql`,
  `20260617000700_value_delivered.sql`, `20260617000800_audits.sql`.
