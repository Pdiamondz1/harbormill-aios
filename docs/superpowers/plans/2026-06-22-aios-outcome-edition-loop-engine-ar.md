# AIOS Outcome Edition — Loop Engine + AR Follow-Up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a generic Loop Engine and the first loop (AR / invoice follow-up) so the AIOS deck can take scheduled, approve-first actions that produce measurable recovered-cash value, reconciled against what was promised at the audit.

**Architecture:** Clone the existing `connectors` framework into a `loops` framework. A pg_cron tick drives `loop-run`, which loads enabled loops, calls each module's `plan()` to read state and propose actions, queues them as `loop_actions` (status `proposed`), and pushes AR metrics through `report-ingest`. An admin approves a queued action in the new `Loops` page; approval sends the reminder via `google-workspace-proxy` (Gmail) and records a `value_event` linked to the audit opportunity, which surfaces on the existing `/value` page as promised-vs-delivered.

**Tech Stack:** React 18 + Vite + TypeScript (strict), TanStack Query, Tailwind/shadcn; Supabase (Postgres + RLS), Deno edge functions; Vitest for all unit tests — including `_shared` pure modules, which are import-free and tested from `src/test/` via relative import (the existing `stripe-map` pattern: module in `supabase/functions/_shared/...`, test in `src/test/...`). `vitest.config.ts` excludes `supabase/functions/**`, so there is no `deno test` in this repo.

**Spec:** `docs/superpowers/specs/2026-06-22-aios-outcome-edition-design.md`

**Conventions for every task:**
- Migrations: new file under `supabase/migrations/` named `YYYYMMDDHHMMSS_<slug>.sql` (use a timestamp after the latest existing migration). Apply with the Supabase MCP `apply_migration` or `supabase db push`; verify with `list_tables` / SQL.
- Edge functions are **Deno** — not covered by `npm run test`. Verify on deploy (`supabase functions deploy <name>`) and via the integration steps in each task.
- Gate before claiming a task done where app code changed: `npm run typecheck && npm run lint && npm run build && npm run test`.
- Follow existing patterns: `_shared/connectors/*`, `supabase/functions/connector-sync/`, `src/pages/Connectors.tsx`, `src/hooks/useMetrics.ts`, `src/types/value.ts`.

---

## File Structure

**Create:**
- `supabase/migrations/<ts>_loops.sql` — `loops` + `loop_actions` tables + RLS
- `supabase/migrations/<ts>_ar_invoices.sql` — `ar_invoices` table + RLS
- `supabase/migrations/<ts>_value_events_audit_link.sql` — ALTER `value_events`; extend `deck_value_summary()`
- `supabase/migrations/<ts>_loop_schedule.sql` — pg_cron schedule for `loop-run`
- `supabase/functions/_shared/loops/types.ts` — `Loop`, `LoopContext`, `LoopPlan`, `ProposedAction`
- `supabase/functions/_shared/loops/registry.ts` — `LOOPS` map
- `supabase/functions/_shared/loops/ar-followup-map.ts` — pure value/cadence logic (import-free)
- `src/test/ar-followup-map.test.ts` — Vitest for the pure logic (imports the import-free map via relative path; mirrors `src/test/stripe-map.test.ts`)
- `supabase/functions/_shared/loops/ar-followup.ts` — the AR loop module
- `supabase/functions/loop-run/index.ts` — cron tick + approve mode
- `src/types/loops.ts` — Loop + LoopAction app types
- `src/hooks/useLoops.ts`, `src/hooks/useLoopActions.ts` — TanStack Query hooks
- `src/pages/Loops.tsx` — admin page (config + approval queue)
- `src/lib/reconciliation.ts` + `src/lib/reconciliation.test.ts` — promised-vs-delivered formatting (vitest)

**Modify:**
- `supabase/functions/report-ingest/index.ts` — add `invoices` type; extend `value` handler with `audit_opportunity_id`
- `supabase/functions/google-workspace-proxy/index.ts` — add `gmail.send` op + scope
- `supabase/functions/assistant-chat/tools.ts` — add `list_pending_loop_actions` tool
- `src/config/features.ts` — add `loops` flag
- `src/App.tsx` — add `/loops` route
- `src/components/layout/AppLayout.tsx` — add nav entry
- `src/pages/Value.tsx` + `src/hooks/useValue.ts` — render reconciliation

---

## Task 1: `loops` + `loop_actions` tables

**Files:**
- Create: `supabase/migrations/<ts>_loops.sql`

- [ ] **Step 1: Write the migration**

```sql
-- loops: per-client automation loop configs (mirrors public.connectors)
create table public.loops (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in ('ar_followup')),
  enabled       boolean not null default false,
  config        jsonb not null default '{}'::jsonb,
  schedule_cron text,
  last_run_at   timestamptz,
  last_status   text,
  last_error    text,
  next_run_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- loop_actions: the approve-first queue + outbound audit log
create table public.loop_actions (
  id                   uuid primary key default gen_random_uuid(),
  loop_id              uuid not null references public.loops (id) on delete cascade,
  type                 text not null check (type in ('email_reminder')),
  status               text not null default 'proposed'
                         check (status in ('proposed','approved','sent','skipped','failed')),
  target               jsonb not null default '{}'::jsonb,
  payload              jsonb not null default '{}'::jsonb,
  value_estimate_cents integer not null default 0 check (value_estimate_cents >= 0),
  value_category       text not null default 'revenue_captured'
                         check (value_category in ('hours_saved','revenue_captured','cost_avoided','other')),
  audit_opportunity_id uuid references public.audit_opportunities (id) on delete set null,
  metadata             jsonb not null default '{}'::jsonb,
  approved_by          uuid references auth.users (id),
  approved_at          timestamptz,
  sent_at              timestamptz,
  last_error           text,
  created_at           timestamptz not null default now()
);
create index idx_loop_actions_status on public.loop_actions (status, created_at desc);
create index idx_loop_actions_loop on public.loop_actions (loop_id);

alter table public.loops enable row level security;
alter table public.loop_actions enable row level security;

-- admin-only read/write (mirror public.connectors policies)
create policy "loops admin all" on public.loops
  for all using (public.is_admin()) with check (public.is_admin());
create policy "loop_actions admin all" on public.loop_actions
  for all using (public.is_admin()) with check (public.is_admin());

-- keep updated_at fresh (reuse existing trigger fn if present; else inline)
create trigger trg_loops_updated_at before update on public.loops
  for each row execute function public.handle_updated_at();
```

- [ ] **Step 2: Confirm helper names before applying**

Verify `public.is_admin()` and `public.handle_updated_at()` exist (grep `supabase/migrations/` — both are defined in `20260617000100_operating_deck.sql` and used by audits/connectors). If the updated-at trigger fn has a different name in your tree, match it; if none exists, drop the trigger statement.

- [ ] **Step 3: Apply the migration**

Use Supabase MCP `apply_migration` (name `loops`) or `supabase db push`.

- [ ] **Step 4: Verify schema**

Run `list_tables` (MCP) or SQL `select * from public.loops limit 1;` — expect empty success, both tables present, RLS enabled.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations
git commit -m "feat(loops): add loops and loop_actions tables with admin RLS"
```

---

## Task 2: `ar_invoices` ingest table

**Files:**
- Create: `supabase/migrations/<ts>_ar_invoices.sql`

- [ ] **Step 1: Write the migration**

```sql
-- ar_invoices: vendor-neutral overdue-invoice store, fed via report-ingest
create table public.ar_invoices (
  id               uuid primary key default gen_random_uuid(),
  external_id      text not null,
  customer_name    text not null,
  customer_email   text,
  amount_cents     integer not null check (amount_cents >= 0),
  due_date         date not null,
  status           text not null default 'open' check (status in ('open','paid','written_off')),
  last_reminded_at timestamptz,
  captured_at      timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  unique (external_id)
);
create index idx_ar_invoices_status_due on public.ar_invoices (status, due_date);

alter table public.ar_invoices enable row level security;
create policy "ar_invoices admin all" on public.ar_invoices
  for all using (public.is_admin()) with check (public.is_admin());
```

- [ ] **Step 2: Apply** (MCP `apply_migration` name `ar_invoices`).
- [ ] **Step 3: Verify** `select count(*) from public.ar_invoices;` → 0.
- [ ] **Step 4: Commit**

```bash
git add supabase/migrations
git commit -m "feat(loops): add ar_invoices ingest table with admin RLS"
```

---

## Task 3: Link delivered value to the audit promise + reconciliation RPC

**Files:**
- Create: `supabase/migrations/<ts>_value_events_audit_link.sql`
- Reference: `supabase/migrations/20260617000700_value_delivered.sql` (the existing `deck_value_summary()` body — read it first)

- [ ] **Step 1: Read the current RPC**

Open `20260617000700_value_delivered.sql`; copy the existing `deck_value_summary()` body so the new version is a superset (do not drop existing keys).

- [ ] **Step 2: Write the migration**

```sql
alter table public.value_events
  add column audit_opportunity_id uuid references public.audit_opportunities (id) on delete set null;

-- Recreate deck_value_summary() as a superset: existing keys + a `reconciliation` object.
-- Paste the ORIGINAL body, then add the reconciliation CTE/keys shown below.
-- Preserve the ORIGINAL signature exactly: language plpgsql STABLE security definer,
-- the original raise-exception message, and the trailing revoke/grant lines.
-- `create or replace` keeps existing grants, but re-include them to avoid drift.
create or replace function public.deck_value_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
  promised_cents bigint;
  delivered_cents bigint;
begin
  if not public.has_access() then
    raise exception 'forbidden: access tier required';
  end if;

  -- <<< PASTE the existing computation that builds `result` here, UNCHANGED >>>

  -- promised = sum of opportunities on the most recent won audit
  select coalesce(sum(o.annual_value_cents), 0) into promised_cents
  from public.audit_opportunities o
  join public.audits a on a.id = o.audit_id
  where a.status = 'won';

  -- delivered = value_events linked to any opportunity on a won audit
  select coalesce(sum(v.amount_cents), 0) into delivered_cents
  from public.value_events v
  where v.audit_opportunity_id is not null;

  result := result || jsonb_build_object(
    'reconciliation', jsonb_build_object(
      'promised_annual_cents', promised_cents,
      'delivered_cents', delivered_cents,
      'pct_of_promise',
        case when promised_cents > 0
          then round((delivered_cents::numeric / promised_cents) * 100, 1)
          else null end
    )
  );

  return result;
end;
$$;

revoke execute on function public.deck_value_summary() from anon;
grant execute on function public.deck_value_summary() to authenticated, service_role;
```

- [ ] **Step 3: Apply** (MCP `apply_migration` name `value_events_audit_link`).
- [ ] **Step 4: Verify** `select public.deck_value_summary();` returns JSON containing both the original keys **and** a `reconciliation` object. (Run as an admin/has_access session, or temporarily via service role.)
- [ ] **Step 5: Commit**

```bash
git add supabase/migrations
git commit -m "feat(value): link value_events to audit opportunities + reconciliation in deck_value_summary"
```

---

## Task 4: Schedule `loop-run` via pg_cron

**Files:**
- Create: `supabase/migrations/<ts>_loop_schedule.sql`
- Reference: `supabase/migrations/20260617001000_connector_schedule.sql` (copy its exact vault/pg_net shape)

- [ ] **Step 1: Write the migration** (mirror the connector schedule; new vault secret `loop_run_url`)

```sql
-- requires pg_cron + pg_net (already enabled by the connector schedule migration)
select cron.schedule('loop-run-hourly', '15 * * * *', $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'loop_run_url'),
    headers := jsonb_build_object(
                 'Authorization', 'Bearer ' || coalesce(
                   (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'), ''),
                 'Content-Type', 'application/json'),
    body    := '{}'::jsonb
  );
$$);
```

(`15 * * * *` offsets it from connector-sync's `0 * * * *`.)

- [ ] **Step 2: Document the vault secret** in the task notes: operator must `select vault.create_secret('https://<ref>.supabase.co/functions/v1/loop-run', 'loop_run_url');` after deploy. (Don't apply the schedule until the function exists in Task 9 — but the migration can land now; the cron call no-ops until the secret + function exist.)
- [ ] **Step 3: Apply** (MCP `apply_migration` name `loop_schedule`).
- [ ] **Step 4: Verify** `select jobname from cron.job;` includes `loop-run-hourly`.
- [ ] **Step 5: Commit**

```bash
git add supabase/migrations
git commit -m "feat(loops): schedule loop-run hourly via pg_cron"
```

---

## Task 5: Loop module interface + registry

**Files:**
- Create: `supabase/functions/_shared/loops/types.ts`
- Create: `supabase/functions/_shared/loops/registry.ts`
- Reference: `supabase/functions/_shared/connectors/types.ts`, `registry.ts`

- [ ] **Step 1: Write `types.ts`**

```ts
// Mirrors _shared/connectors/types.ts, extended for action-proposing loops.
export interface PulledMetric {
  key: string; label: string; value: string;
  unit?: string; target?: string; status?: "on_track" | "at_risk" | "off_track";
}

export interface ProposedAction {
  type: "email_reminder";
  target: Record<string, unknown>;      // { recipient, invoice_id, ... }
  payload: { subject: string; body_md: string };
  value_estimate_cents: number;
  value_category: "hours_saved" | "revenue_captured" | "cost_avoided" | "other";
  audit_opportunity_id?: string | null;
  metadata?: Record<string, unknown>;   // defensibility basis
}

export interface LoopPlan { actions: ProposedAction[]; metrics: PulledMetric[]; }

export interface LoopContext {
  // service-role Supabase client + loop config; mirror ConnectorContext shape
  supabase: any;
  config: Record<string, unknown>;
}

export interface Loop {
  type: string;
  plan(ctx: LoopContext): Promise<LoopPlan>;
}
```

- [ ] **Step 2: Write `registry.ts`** (import the AR module added in Task 7; leave a TODO import until then)

```ts
import type { Loop } from "./types.ts";
import { arFollowup } from "./ar-followup.ts";

export const LOOPS: Record<string, Loop> = {
  [arFollowup.type]: arFollowup,
};
```

- [ ] **Step 3: Typecheck** the Deno modules: `deno check supabase/functions/_shared/loops/types.ts` (registry will fail until Task 7 — acceptable; note it).
- [ ] **Step 4: Commit**

```bash
git add supabase/functions/_shared/loops/types.ts supabase/functions/_shared/loops/registry.ts
git commit -m "feat(loops): add loop module interface and registry"
```

---

## Task 6: AR value/cadence pure logic (TDD)

**Files:**
- Create: `supabase/functions/_shared/loops/ar-followup-map.ts` (import-free)
- Test: `src/test/ar-followup-map.test.ts` (Vitest — mirrors `src/test/stripe-map.test.ts`)
- Reference: `supabase/functions/_shared/connectors/stripe-map.ts` + `src/test/stripe-map.test.ts` for the exact split/test style

- [ ] **Step 1: Write the failing Vitest** (import the import-free module via relative path)

```ts
import { describe, it, expect } from "vitest";
import { daysOverdue, recoveryLikelihood, estimateRecoverableCents, dueForReminder }
  from "../../supabase/functions/_shared/loops/ar-followup-map";

describe("ar-followup-map", () => {
  it("daysOverdue counts whole days past due", () => {
    expect(daysOverdue("2026-06-01", new Date("2026-06-16T00:00:00Z"))).toBe(15);
    expect(daysOverdue("2026-07-01", new Date("2026-06-16T00:00:00Z"))).toBe(0); // not yet due
  });
  it("recoveryLikelihood decays with age", () => {
    expect(recoveryLikelihood(7) > recoveryLikelihood(90)).toBe(true);
    expect(recoveryLikelihood(7) <= 1 && recoveryLikelihood(90) >= 0).toBe(true);
  });
  it("estimateRecoverableCents = amount * likelihood, rounded", () => {
    expect(estimateRecoverableCents(100000, 7)).toBe(Math.round(100000 * recoveryLikelihood(7)));
  });
  it("dueForReminder respects cadence and last_reminded_at", () => {
    const now = new Date("2026-06-16T00:00:00Z");
    expect(dueForReminder(15, null, [7, 14, 30], now)).toBe(true);          // due
    expect(dueForReminder(15, "2026-06-16T00:00:00Z", [7, 14, 30], now)).toBe(false); // reminded today
    expect(dueForReminder(3, null, [7, 14, 30], now)).toBe(false);          // below first step
  });
});
```

- [ ] **Step 2: Run the test, expect failure**

Run: `npm run test -- ar-followup-map`
Expected: FAIL (module/exports not found).

- [ ] **Step 3: Implement `ar-followup-map.ts`**

```ts
// Pure, dependency-free AR follow-up logic. Unit-tested in isolation.

export function daysOverdue(dueDate: string, now: Date): number {
  const due = new Date(dueDate + "T00:00:00Z").getTime();
  const diff = now.getTime() - due;
  return diff <= 0 ? 0 : Math.floor(diff / 86_400_000);
}

// Likelihood of recovering an overdue invoice, decaying with age.
// Conservative defaults; tune per real client data (drives the ROI number).
export function recoveryLikelihood(overdue: number): number {
  if (overdue <= 0) return 0;
  if (overdue <= 14) return 0.85;
  if (overdue <= 30) return 0.7;
  if (overdue <= 60) return 0.5;
  if (overdue <= 90) return 0.3;
  return 0.15;
}

export function estimateRecoverableCents(amountCents: number, overdue: number): number {
  return Math.round(amountCents * recoveryLikelihood(overdue));
}

// Due if overdue has reached a cadence step the invoice hasn't been reminded for today.
export function dueForReminder(
  overdue: number, lastRemindedAt: string | null, cadence: number[], now: Date,
): boolean {
  if (overdue < Math.min(...cadence)) return false;
  if (!lastRemindedAt) return true;
  const last = new Date(lastRemindedAt);
  const sameDay = last.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
  return !sameDay; // one reminder per day max; cadence steps gate the floor
}
```

- [ ] **Step 4: Run the test, expect pass**

Run: `npm run test -- ar-followup-map`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/loops/ar-followup-map.ts src/test/ar-followup-map.test.ts
git commit -m "feat(loops): AR follow-up pure value/cadence logic with tests"
```

---

## Task 7: AR follow-up loop module

**Files:**
- Create: `supabase/functions/_shared/loops/ar-followup.ts`
- Reference: `_shared/connectors/stripe.ts` (module shape)

- [ ] **Step 1: Implement the module**

```ts
import type { Loop, LoopContext, LoopPlan, ProposedAction } from "./types.ts";
import { daysOverdue, estimateRecoverableCents, dueForReminder } from "./ar-followup-map.ts";

interface ArConfig {
  cadence_days?: number[];           // default [7,14,30]
  audit_opportunity_id?: string;     // links delivered value to the audit promise
  sender_name?: string;
}

export const arFollowup: Loop = {
  type: "ar_followup",
  async plan(ctx: LoopContext): Promise<LoopPlan> {
    const cfg = ctx.config as ArConfig;
    const cadence = cfg.cadence_days?.length ? cfg.cadence_days : [7, 14, 30];
    const now = new Date();

    const { data: invoices, error } = await ctx.supabase
      .from("ar_invoices").select("*").eq("status", "open");
    if (error) throw error;

    const actions: ProposedAction[] = [];
    let openTotal = 0, overdueTotal = 0;

    for (const inv of invoices ?? []) {
      openTotal += inv.amount_cents;
      const overdue = daysOverdue(inv.due_date, now);
      if (overdue <= 0) continue;
      overdueTotal += inv.amount_cents;
      if (!dueForReminder(overdue, inv.last_reminded_at, cadence, now)) continue;

      const valueCents = estimateRecoverableCents(inv.amount_cents, overdue);
      const amount = (inv.amount_cents / 100).toLocaleString("en-US",
        { style: "currency", currency: "USD" });
      actions.push({
        type: "email_reminder",
        target: { recipient: inv.customer_email, invoice_id: inv.id, external_id: inv.external_id },
        payload: {
          subject: `Friendly reminder: invoice ${inv.external_id} (${amount})`,
          body_md:
            `Hi ${inv.customer_name},\n\nThis is a friendly reminder that invoice ` +
            `**${inv.external_id}** for **${amount}** was due on ${inv.due_date} ` +
            `(${overdue} days ago). If it's already on its way, thank you — please ` +
            `disregard.\n\nBest,\n${cfg.sender_name ?? "Accounts Receivable"}`,
        },
        value_estimate_cents: valueCents,
        value_category: "revenue_captured",
        audit_opportunity_id: cfg.audit_opportunity_id ?? null,
        metadata: { invoice_id: inv.id, days_overdue: overdue, amount_cents: inv.amount_cents,
          basis: "amount × recovery_likelihood(days_overdue)" },
      });
    }

    const metrics = [
      { key: "ar_open_total", label: "AR Outstanding",
        value: `$${(openTotal / 100).toLocaleString("en-US")}`, unit: "$" },
      { key: "ar_overdue_total", label: "AR Overdue",
        value: `$${(overdueTotal / 100).toLocaleString("en-US")}`, unit: "$",
        status: overdueTotal > 0 ? "at_risk" as const : "on_track" as const },
    ];
    return { actions, metrics };
  },
};
```

- [ ] **Step 2: Typecheck** `deno check supabase/functions/_shared/loops/registry.ts` (now resolves). Expected: no errors.
- [ ] **Step 3: Commit**

```bash
git add supabase/functions/_shared/loops/ar-followup.ts
git commit -m "feat(loops): AR follow-up loop module (plan: invoices -> proposed reminders + metrics)"
```

---

## Task 8: Extend `report-ingest` (invoices type + value audit link)

**Files:**
- Modify: `supabase/functions/report-ingest/index.ts`
- Reference: its existing `value`/`metrics` handlers for validation style

- [ ] **Step 1: Read the existing handler** to match the switch/validation idiom exactly.

- [ ] **Step 2: Add the `invoices` payload type** — upsert on `external_id` into `ar_invoices` (batch ≤100), validating `external_id, customer_name, amount_cents, due_date` required; `customer_email, status` optional. Mirror the existing metrics batch validation.

- [ ] **Step 3: Extend the `value`/`values` handler** to accept and persist optional `audit_opportunity_id` (string UUID) on each event. Add it to the inserted row object.

- [ ] **Step 3b: Update the unsupported-type error string** at the function's fallthrough to include `invoices` in the allowed list (currently lists `'metrics', 'briefing', 'findings', 'correction', 'value'`).

- [ ] **Step 4: Deploy + integration test**

```bash
supabase functions deploy report-ingest
```
Then POST a sample (service-role bearer):
```bash
curl -X POST "$URL/functions/v1/report-ingest" -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" -d '{
    "type":"invoices","payload":{"invoices":[
      {"external_id":"INV-1001","customer_name":"Acme","customer_email":"ap@acme.test",
       "amount_cents":120000,"due_date":"2026-05-20","status":"open"}]}}'
```
Expected: 200; `select * from public.ar_invoices;` shows the row.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/report-ingest/index.ts
git commit -m "feat(report-ingest): accept invoices payload + audit_opportunity_id on value events"
```

---

## Task 9: `loop-run` edge function (cron tick + approve mode)

**Files:**
- Create: `supabase/functions/loop-run/index.ts`
- Reference: `supabase/functions/connector-sync/index.ts` (dual-mode shape, service-role auth, status updates)

- [ ] **Step 1: Implement the cron tick (no body)** — service-role only:
  1. Load enabled loops where `next_run_at is null or next_run_at <= now()`.
  2. For each: `LOOPS[loop.type].plan({ supabase, config: loop.config })`.
  3. Insert returned `actions` into `loop_actions` (status `proposed`), carrying value/category/audit_opportunity_id/metadata/target/payload.
  4. POST returned `metrics` to `report-ingest` (`type:"metrics"`) using the service key.
  5. Update `last_run_at`, `last_status`, `last_error`, `next_run_at` = `Date.now() + 3600*1000` (fixed +1h, exactly mirroring connector-sync — do NOT parse `schedule_cron` into an interval in v1).
  - Wrap each loop in try/catch so one failure doesn't abort the batch (mirror connector-sync).

- [ ] **Step 2: Implement the approve mode (POST `{mode:'approve', action_id}` with admin JWT)**:
  1. AuthN: require admin (mirror connector-sync's on-demand admin path).
  2. Load the `loop_action`; guard status is `proposed`.
  3. Invoke `google-workspace-proxy` with body `{ action: "gmail_send", to: target.recipient, subject: payload.subject, body: payload.body_md }` (Task 10 — note `action`, snake_case, matching the proxy's `switch (body.action)` dispatch).
  4. On success: POST a `value` event to `report-ingest` (`amount_cents = value_estimate_cents`, `category = value_category`, `source:"agent"`, `audit_opportunity_id`, `metadata`); set `ar_invoices.last_reminded_at = now()` for `target.invoice_id`; update action → `sent`, `approved_by`, `approved_at`, `sent_at`.
  5. On failure: action → `failed`, `last_error`.
  - Add a `{mode:'skip', action_id}` branch → status `skipped`.

- [ ] **Step 3: Deploy**

```bash
supabase functions deploy loop-run
```
Then set the cron secret (one-time): `select vault.create_secret('https://<ref>.supabase.co/functions/v1/loop-run','loop_run_url');`

- [ ] **Step 4: Integration test (cron path)** — seed an enabled `ar_followup` loop:
```sql
insert into public.loops (type, enabled, config)
values ('ar_followup', true, '{"cadence_days":[7,14,30]}');
```
Invoke with service-role bearer + empty body. Expected: `loop_actions` rows appear as `proposed` with sensible `value_estimate_cents`; `ar_overdue_total` metric visible on Overview; loop `last_status` = ok.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/loop-run/index.ts
git commit -m "feat(loops): loop-run edge function (cron tick + approve/skip modes)"
```

---

## Task 10: Gmail send in `google-workspace-proxy`

**Files:**
- Modify: `supabase/functions/_shared/google-workspace.ts` (where `GOOGLE_SCOPES`, `buildAuthUrl`, and all Google API helpers actually live)
- Modify: `supabase/functions/google-workspace-proxy/index.ts` (the `switch (body.action)` dispatch)
- Reference: the existing Drive helpers in `_shared/google-workspace.ts` (`getValidAccessToken`, `exportMarkdownToDoc`) + the `case "..."` actions in index.ts

- [ ] **Step 1: Add the send scope** — append `https://www.googleapis.com/auth/gmail.send` to `GOOGLE_SCOPES` in `_shared/google-workspace.ts` (consumed by `buildAuthUrl` via `GOOGLE_SCOPES.join(" ")`). Note in task: existing connected users must re-consent to gain send.
- [ ] **Step 2: Add a `sendGmail` helper** in `_shared/google-workspace.ts` — signature `sendGmail(token: string, { to, subject, body }): Promise<{id,threadId}>`: build an RFC-2822 MIME message, base64url-encode, POST to `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`. Then add a `case "gmail_send":` to the **user-mode** switch in `index.ts` that calls `getValidAccessToken(...)` then `sendGmail(...)` and returns `{ id, threadId }`. Tokens never returned to client (unchanged invariant).
- [ ] **Step 3: Deploy** `supabase functions deploy google-workspace-proxy`.
- [ ] **Step 4: Integration test** — from a Google-connected admin session, call the op with a test recipient you control; confirm receipt. (Manual; Deno function — validate on deploy.)
- [ ] **Step 5: Commit**

```bash
git add supabase/functions/google-workspace-proxy/index.ts
git commit -m "feat(workspace): add gmail.send op + scope to google-workspace-proxy"
```

---

## Task 11: App types + data hooks

**Files:**
- Create: `src/types/loops.ts`, `src/hooks/useLoops.ts`, `src/hooks/useLoopActions.ts`
- Reference: `src/types/value.ts`, `src/hooks/useMetrics.ts` (Query patterns)

- [ ] **Step 1: Write `src/types/loops.ts`** — `Loop` and `LoopAction` interfaces mirroring the DB columns (status unions, value category union).
- [ ] **Step 2: Write `useLoops.ts`** — `useLoops()` query (`loops` ordered by created_at) + `useToggleLoop()` mutation (update `enabled`/`config`).
- [ ] **Step 3: Write `useLoopActions.ts`** — `usePendingLoopActions()` query (`loop_actions` where status `proposed`) + `useApproveLoopAction()` / `useSkipLoopAction()` mutations that invoke `loop-run` (`mode:'approve'|'skip'`) via `supabase.functions.invoke`, then invalidate the queries.
- [ ] **Step 4: Gate** `npm run typecheck && npm run lint`. Expected: clean.
- [ ] **Step 5: Commit**

```bash
git add src/types/loops.ts src/hooks/useLoops.ts src/hooks/useLoopActions.ts
git commit -m "feat(loops): app types + TanStack Query hooks for loops and actions"
```

---

## Task 12: `Loops` admin page + flag + route + nav

**Files:**
- Create: `src/pages/Loops.tsx`
- Modify: `src/config/features.ts`, `src/App.tsx`, `src/components/layout/AppLayout.tsx`
- Reference: `src/pages/Connectors.tsx` (layout, admin-only gating)

- [ ] **Step 1: Add `loops: boolean` to `FeatureFlags`** and set `loops: true` in `features` (`src/config/features.ts`).
- [ ] **Step 2: Build `Loops.tsx`** — admin-only, two sections mirroring Connectors:
  - **Loops:** list configured loops with enable toggle + last-run status/error (`useLoops`).
  - **Approval queue:** `usePendingLoopActions()` → for each, show recipient, drafted subject/body, estimated value (`$value_estimate_cents/100`), and **Approve** / **Skip** buttons (mutations). Optimistic disable while pending; toast on result.
- [ ] **Step 3: Add the route** in `src/App.tsx` (`/loops`, gated by `features.loops`, admin-only, mirror `/connectors`).
- [ ] **Step 4: Add the nav entry** in `AppLayout.tsx`: `{ to: "/loops", label: "Loops", adminOnly: true, feature: "loops" }`.
- [ ] **Step 5: Gate + manual check** `npm run typecheck && npm run lint && npm run build && npm run test`; run `npm run dev`, sign in as admin, visit `/loops`, approve a seeded proposed action, confirm it flips to sent and an email is sent.
- [ ] **Step 6: Commit**

```bash
git add src/config/features.ts src/App.tsx src/components/layout/AppLayout.tsx src/pages/Loops.tsx
git commit -m "feat(loops): Loops admin page with approval queue + nav/route/flag"
```

---

## Task 13: Promised-vs-delivered on the Value page (TDD on formatting)

**Files:**
- Create: `src/lib/reconciliation.ts`, `src/lib/reconciliation.test.ts`
- Modify: `src/hooks/useValue.ts` (surface `reconciliation` from the RPC), `src/pages/Value.tsx`
- Reference: `src/components/value/ValueDeliveredCard.tsx`

- [ ] **Step 1: Write the failing vitest** for `formatReconciliation(reconciliation)`:

```ts
import { describe, it, expect } from "vitest";
import { formatReconciliation } from "./reconciliation";

describe("formatReconciliation", () => {
  it("formats promised, delivered, and pct", () => {
    const out = formatReconciliation({ promised_annual_cents: 32000000, delivered_cents: 8000000, pct_of_promise: 25 });
    expect(out.promised).toBe("$320,000");
    expect(out.delivered).toBe("$80,000");
    expect(out.pct).toBe("25%");
  });
  it("handles null promise", () => {
    const out = formatReconciliation({ promised_annual_cents: 0, delivered_cents: 0, pct_of_promise: null });
    expect(out.pct).toBe("—");
  });
});
```

- [ ] **Step 2: Run, expect fail** `npm run test -- reconciliation`.
- [ ] **Step 3: Implement `reconciliation.ts`** — pure formatter returning `{ promised, delivered, pct }`. **Reuse the existing `formatDollars(cents)` export from `src/types/value.ts`** for `promised`/`delivered` (do not reimplement USD formatting); `pct` → `"{n}%"` or `"—"` when null.
- [ ] **Step 4: Run, expect pass** `npm run test -- reconciliation`.
- [ ] **Step 5: Wire UI** — add a `reconciliation` field to the `ValueSummary` interface in `src/types/value.ts` (so `useValue`'s `data as ValueSummary` exposes it); extend `useValue` if needed; in `Value.tsx` add a line/card under the hero: *"Promised at audit: {promised}/yr · Delivered to date: {delivered} · {pct} of promise."* Hide if promised is 0.
- [ ] **Step 6: Gate** `npm run typecheck && npm run lint && npm run build && npm run test`.
- [ ] **Step 7: Commit**

```bash
git add src/lib/reconciliation.ts src/lib/reconciliation.test.ts src/hooks/useValue.ts src/pages/Value.tsx
git commit -m "feat(value): promised-vs-delivered reconciliation on Value page"
```

---

## Task 14: Aria tool — surface the pending queue

**Files:**
- Modify: `supabase/functions/assistant-chat/tools.ts`
- Reference: the existing `create_finding` / `get_value_summary` tool entries + `requiresAdmin` flag

- [ ] **Step 1: Add `list_pending_loop_actions`** (admin-only): counts/lists `loop_actions` where status `proposed` (recipient, subject, estimated value), and returns a short summary. Follow the exact `{ definition, requiresAdmin, execute }` shape.
- [ ] **Step 2: (Optional) suggest_actions chip** to `/loops` when items are pending.
- [ ] **Step 3: Deploy** `supabase functions deploy assistant-chat`; ask Aria "any reminders waiting for approval?" → expect a grounded count + chip.
- [ ] **Step 4: Commit**

```bash
git add supabase/functions/assistant-chat/tools.ts
git commit -m "feat(aria): list_pending_loop_actions tool"
```

---

## Task 15: End-to-end verification + docs

**Files:**
- Modify: `docs/extending.md` (add a "Loops" section), optionally `supabase/seed.sql` (sample loop + invoices for demo)

- [ ] **Step 1: Full E2E** (deployed project): push invoices via `report-ingest` → run `loop-run` (cron path) → see `proposed` actions + AR metrics on Overview → Approve in `/loops` → email sends → `value_event` appears on `/value` → reconciliation line updates.
- [ ] **Step 2: Final gate** `npm run typecheck && npm run lint && npm run build && npm run test` — all green.
- [ ] **Step 3: Document** the loop seam in `docs/extending.md` (how to add a new loop module: registry + module + config), mirroring the connector docs.
- [ ] **Step 4: Commit**

```bash
git add docs/extending.md supabase/seed.sql
git commit -m "docs(loops): document the loop seam; seed demo loop + invoices"
```

---

## Out of scope (follow-on plans, same pattern)
- Lead-intake loop + CRM write connector
- Renewal / re-engagement loop
- Auto-send mode (`config.mode = auto|approve`)
- Webhook ingestion (e.g. Stripe paid-invoice → close the AR loop automatically)
- **Google Meet AI transcript reports** — its own spec + plan (next).
