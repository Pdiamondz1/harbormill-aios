# Connector Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pull live business metrics from external SaaS (Stripe first) into the AIOS deck automatically, via a scheduled, per-client-configurable connector runtime that writes through the existing `report-ingest` seam.

**Architecture:** A `connectors` table (admin-RLS) holds per-client config + last-run status. A pluggable connector registry (`supabase/functions/_shared/connectors/`) maps `type → { pull() }`. A `connector-sync` edge function (dual auth: service-role for cron, admin-JWT for the UI "Sync now") pulls each enabled connector, maps the response to metrics, and POSTs `{type:"metrics"}` to `report-ingest`. `pg_cron` + `pg_net` invoke it on a schedule using Vault-stored credentials. An admin "Connectors" page manages it all.

**Tech Stack:** Supabase (Postgres + RLS + Deno edge functions + pg_cron/pg_net/Vault), React 18 + TanStack Query + shadcn/ui, Vitest. Spec: `docs/superpowers/specs/2026-06-19-connector-library-design.md`.

> **Execution order:** Tasks 1-6, then **9** (scheduling — must run after the
> function is deployed in Task 6), then 7-8, then 10-12. Task 9 is placed in the
> document between Tasks 6 and 7 for narrative flow; follow this order, not strict
> top-to-bottom numbering.

---

## Spec refinements discovered during planning (read first)

1. **`connector-sync` uses DUAL auth, not service-role-only.** The spec said
   "service-role only." That works for the cron caller, but the admin **"Sync now"**
   button calls the function from the browser, which only holds the *user's* JWT
   (never the service-role key). So the function authorizes **either**:
   - `Authorization: Bearer <SERVICE_ROLE_KEY>` (exact match) → trusted cron, runs
     **scheduled mode** (all enabled + due connectors); **or**
   - a valid **user JWT** whose user has the `admin` role (validated exactly like
     `assistant-chat/index.ts:137-152`) → runs **on-demand mode**, requires
     `{ connector_id }`.
   - Anything else → 401/403.

   Internally it always uses a **service-role** Supabase client to read/write
   `connectors` and to call `report-ingest`. This matches the existing
   `assistant-chat` pattern (user token in, service-role client for work).

2b. **Due-selection is a DB query, not a unit-tested JS helper.** The spec listed a
   `next_run_at` / due-selection helper as a second TDD unit. In implementation,
   due-selection is a PostgREST filter
   (`.or('next_run_at.is.null,next_run_at.lte.<iso>')`) executed in
   `connector-sync` — DB logic, not pure JS — so it is **intentionally not** a
   separate Vitest unit (would require mocking the query builder for no real
   coverage). It is verified by the **live invoke** in Task 6 (and the cron fire in
   Task 9). The `mapStripe` unit test remains the one TDD unit. This is a
   deliberate YAGNI narrowing of the spec's testing note.

2c. **`useSyncConnector` uses an auth'd `fetch`, not `supabase.functions.invoke`.**
   The spec named `functions.invoke`; the plan uses the established
   `useGoogleWorkspace.callProxy` `fetch` pattern instead (explicit error-body
   handling, one consistent invoke style in the repo). Intentional, equivalent
   deviation — not a conformance gap.

3. **Pure Stripe mapping lives in its own import-free module** so Vitest can test
   it: `supabase/functions/_shared/connectors/stripe-map.ts` (NO `https://`
   imports, NO `Deno.*`). The test lives under `src/` (Vitest excludes
   `supabase/functions/**` from *running* tests, but a `src/` test may *import*
   that pure module). `stripe.ts` (which does network + `Deno.env`) imports
   `mapStripe` from `stripe-map.ts`.

---

## File Structure

**New — backend**
- `supabase/migrations/20260617000900_connectors.sql` — `connectors` table, index, RLS, `updated_at` trigger. (Scheduling cron added later in Task 9, after the function is deployed.)
- `supabase/functions/_shared/connectors/types.ts` — `Connector`, `ConnectorContext`, `PulledMetric` interfaces.
- `supabase/functions/_shared/connectors/stripe-map.ts` — **pure** `mapStripe(raw, config)` (no imports).
- `supabase/functions/_shared/connectors/stripe.ts` — Stripe `Connector` (fetch + env + `mapStripe`).
- `supabase/functions/_shared/connectors/registry.ts` — `CONNECTORS: Record<string, Connector>`.
- `supabase/functions/connector-sync/index.ts` — dual-auth scheduler/dispatcher.

**New — frontend**
- `src/types/connector.ts` — `Connector`, `ConnectorType`, `ConnectorRunStatus`, label maps.
- `src/hooks/useConnectors.ts` — `useConnectors`, `useSaveConnector`, `useSyncConnector`.
- `src/pages/Connectors.tsx` — admin page (list + empty state + form dialog).
- `src/components/connectors/ConnectorCard.tsx` — one connector row (toggle, status, Sync now).
- `src/components/connectors/ConnectorForm.tsx` — create/edit config.

**New — tests / docs**
- `src/test/stripe-map.test.ts` — Vitest unit test for `mapStripe`.
- `docs/wiki/concepts/connector-library.md` — wiki page.

**Modify**
- `src/lib/status.ts` — add `connectorStatusClass`.
- `src/config/features.ts` — add `connectors: boolean`.
- `src/App.tsx` — gated `/connectors` route.
- `src/components/layout/AppLayout.tsx` — nav item.
- `supabase/seed.sql` — one disabled sample Stripe connector.
- `docs/extending.md`, `docs/client-setup.md` — connector + Vault setup.
- `docs/wiki/index.md`, `docs/wiki/log.md` — register the new page.

---

## Task 1: `connectors` table migration

**Files:**
- Create: `supabase/migrations/20260617000900_connectors.sql`

Mirror the conventions in `supabase/migrations/20260617000800_audits.sql` (admin
RLS via `public.has_role(auth.uid(),'admin'::public.app_role)`, `handle_updated_at`
trigger, `created_by default auth.uid()`, no explicit service-role policy — the
service-role key bypasses RLS). **Do NOT add the cron block yet** (Task 9).

- [ ] **Step 1: Write the migration**

```sql
-- Connector library: per-client config + last-run status for managed data pulls.
-- The connector-sync edge function reads enabled rows, pulls from each SaaS, and
-- writes metrics through report-ingest. API SECRETS ARE NEVER STORED HERE — they
-- live in edge-function env vars (CONNECTOR_<TYPE>_SECRET_KEY). Admin-only.

create table public.connectors (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in ('stripe')),  -- extend per connector
  name          text not null,
  enabled       boolean not null default false,
  config        jsonb not null default '{}'::jsonb,        -- non-secret: KPI toggles, targets, labels
  schedule_cron text not null default '0 * * * *',         -- advisory cadence
  next_run_at   timestamptz,                                -- NULL = due on next tick
  last_run_at   timestamptz,
  last_status   text not null default 'never' check (last_status in ('ok','error','never')),
  last_error    text,
  last_result   jsonb,                                      -- {inserted:N, keys:[...]}
  created_by    uuid references auth.users (id) default auth.uid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_connectors_due on public.connectors (enabled, next_run_at);

alter table public.connectors enable row level security;
create policy "connectors admin manage" on public.connectors
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create trigger trg_connectors_updated_at
  before update on public.connectors
  for each row execute function public.handle_updated_at();
```

- [ ] **Step 2: Apply to the demo project and verify**

Apply via the Supabase MCP `apply_migration` (name `connectors`, the SQL above) to
project `harbormill-aios-demo`. Then verify with `execute_sql`:

```sql
select column_name, data_type from information_schema.columns
where table_name = 'connectors' order by ordinal_position;
select polname from pg_policies where tablename = 'connectors';
```

Expected: all columns present; one policy `connectors admin manage`.

- [ ] **Step 3: Run the local gate (migration is SQL, but keep the tree green)**

Run: `npm run typecheck && npm run lint`
Expected: PASS (no TS touched yet).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260617000900_connectors.sql
git commit -m "feat(connectors): connectors table (admin-RLS, run status)"
```

---

## Task 2: Connector framework types + registry

**Files:**
- Create: `supabase/functions/_shared/connectors/types.ts`
- Create: `supabase/functions/_shared/connectors/registry.ts`

These are Deno files (not covered by the local gate). `registry.ts` will import
`stripe.ts` (built in Task 4) — to keep tasks independent, create `registry.ts`
with the Stripe entry now but expect it to only resolve once Task 4 lands. (If you
prefer, create `registry.ts` in Task 4; either is fine.)

- [ ] **Step 1: Write `types.ts`**

```ts
// Connector framework: the pluggable seam, mirroring assistant-chat/tools.ts.
// A connector pulls from an external SaaS and returns metrics that connector-sync
// writes through report-ingest.

export interface PulledMetric {
  key: string;
  label: string;
  value: string | number;
  unit?: string;
  target?: string;
  status?: "on_track" | "at_risk" | "off_track";
}

export interface ConnectorContext {
  config: Record<string, unknown>;          // the connector row's config jsonb
  env: Record<string, string | undefined>;  // Deno.env.toObject()
}

export interface Connector {
  type: string;
  secretEnvVar: string;                      // e.g. "CONNECTOR_STRIPE_SECRET_KEY"
  pull(ctx: ConnectorContext): Promise<PulledMetric[]>;
}
```

- [ ] **Step 2: Write `registry.ts`**

```ts
import type { Connector } from "./types.ts";
import { stripeConnector } from "./stripe.ts";

export const CONNECTORS: Record<string, Connector> = {
  stripe: stripeConnector,
};
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/_shared/connectors/types.ts supabase/functions/_shared/connectors/registry.ts
git commit -m "feat(connectors): connector framework types + registry"
```

---

## Task 3: Stripe pure mapping (`mapStripe`) — TDD

**Files:**
- Create: `supabase/functions/_shared/connectors/stripe-map.ts`
- Test: `src/test/stripe-map.test.ts`

@superpowers:test-driven-development — pure logic, so write the test first. The
module has **no imports** (no Deno, no `https://`) so Vitest can import it.

The mapping takes a normalized Stripe summary object (the network code in Task 4
produces this from Stripe API calls) plus the connector `config` (which KPIs are
enabled + optional target/label overrides) and returns `PulledMetric[]`. Keeping
the network separate from the mapping is what makes this testable.

Input shape (what `stripe.ts` will assemble and pass in):
```ts
interface StripeSummary {
  mrr_cents: number;
  active_subscriptions: number;
  new_customers_30d: number;
  churned_30d: number;
}
```
Config shape (all optional; default = all KPIs on, no overrides):
```ts
// config.kpis?: string[]  -> if present, only these keys are emitted
// config.targets?: Record<string, string>  -> optional target per key
```

- [ ] **Step 1: Write the failing test**

```ts
// src/test/stripe-map.test.ts
import { describe, it, expect } from "vitest";
import { mapStripe } from "../../supabase/functions/_shared/connectors/stripe-map";

const summary = { mrr_cents: 1234500, active_subscriptions: 42, new_customers_30d: 9, churned_30d: 3 };

describe("mapStripe", () => {
  it("emits all four KPIs by default with formatted values", () => {
    const out = mapStripe(summary, {});
    const byKey = Object.fromEntries(out.map((m) => [m.key, m]));
    expect(out).toHaveLength(4);
    expect(byKey.stripe_mrr).toMatchObject({ label: "MRR", value: "12,345", unit: "$" });
    expect(byKey.stripe_active_subscriptions).toMatchObject({ value: 42 });
    expect(byKey.stripe_new_customers_30d).toMatchObject({ value: 9 });
    expect(byKey.stripe_churned_30d).toMatchObject({ value: 3 });
  });

  it("emits only the KPIs named in config.kpis", () => {
    const out = mapStripe(summary, { kpis: ["stripe_mrr"] });
    expect(out.map((m) => m.key)).toEqual(["stripe_mrr"]);
  });

  it("applies a target override from config.targets", () => {
    const out = mapStripe(summary, { targets: { stripe_mrr: "15,000" } });
    const mrr = out.find((m) => m.key === "stripe_mrr");
    expect(mrr?.target).toBe("15,000");
  });
});
```

- [ ] **Step 2: Run it; verify it fails**

Run: `npm run test -- stripe-map`
Expected: FAIL — cannot find module `stripe-map` / `mapStripe is not a function`.

- [ ] **Step 3: Implement `stripe-map.ts`**

```ts
// Pure Stripe summary -> PulledMetric[] mapping. NO imports (Vitest-testable).
export interface StripeSummary {
  mrr_cents: number;
  active_subscriptions: number;
  new_customers_30d: number;
  churned_30d: number;
}
export interface StripeMapConfig {
  kpis?: string[];                          // if set, only these keys are emitted
  targets?: Record<string, string>;         // optional target per key
}
interface Metric { key: string; label: string; value: string | number; unit?: string; }

function dollars(cents: number): string {
  return Math.round(cents / 100).toLocaleString("en-US");
}

export function mapStripe(s: StripeSummary, config: StripeMapConfig) {
  const all: Metric[] = [
    { key: "stripe_mrr", label: "MRR", value: dollars(s.mrr_cents), unit: "$" },
    { key: "stripe_active_subscriptions", label: "Active subscriptions", value: s.active_subscriptions },
    { key: "stripe_new_customers_30d", label: "New customers (30d)", value: s.new_customers_30d },
    { key: "stripe_churned_30d", label: "Churned (30d)", value: s.churned_30d },
  ];
  const enabled = config.kpis && config.kpis.length ? all.filter((m) => config.kpis!.includes(m.key)) : all;
  const targets = config.targets ?? {};
  return enabled.map((m) => (targets[m.key] ? { ...m, target: targets[m.key] } : m));
}
```

- [ ] **Step 4: Run the test; verify it passes**

Run: `npm run test -- stripe-map`
Expected: PASS (3 tests).

- [ ] **Step 5: Confirm typecheck still green (cross-boundary import sanity)**

Run: `npm run typecheck`
Expected: PASS. If tsc errors on the cross-boundary import path, the fallback is to
keep the relative import but ensure `stripe-map.ts` has zero non-type imports
(it does). Do not move the file into `src/` — it is backend logic.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/_shared/connectors/stripe-map.ts src/test/stripe-map.test.ts
git commit -m "feat(connectors): pure mapStripe + unit tests"
```

---

## Task 4: Stripe connector module (network + env)

**Files:**
- Create: `supabase/functions/_shared/connectors/stripe.ts`

Deno file (not in the local gate; validated live in Task 6). Implements the
`Connector` interface: reads the secret from env, fetches from Stripe's REST API,
assembles a `StripeSummary`, and delegates to `mapStripe`.

- [ ] **Step 1: Implement `stripe.ts`**

```ts
import type { Connector, ConnectorContext, PulledMetric } from "./types.ts";
import { mapStripe, type StripeSummary } from "./stripe-map.ts";

const SECRET_ENV = "CONNECTOR_STRIPE_SECRET_KEY";
const API = "https://api.stripe.com/v1";

async function stripeGet(path: string, key: string): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Stripe ${path} ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function fetchSummary(key: string): Promise<StripeSummary> {
  const now = Math.floor(Date.now() / 1000);
  const since = now - 30 * 24 * 3600;

  // Active subscriptions (and MRR from their plan amounts).
  const subs = await stripeGet(`/subscriptions?status=active&limit=100`, key);
  let mrr_cents = 0;
  for (const sub of subs.data ?? []) {
    for (const item of sub.items?.data ?? []) {
      const price = item.price;
      const qty = item.quantity ?? 1;
      const amount = price?.unit_amount ?? 0;
      const interval = price?.recurring?.interval ?? "month";
      const monthly = interval === "year" ? amount / 12 : amount;
      mrr_cents += monthly * qty;
    }
  }

  const newCustomers = await stripeGet(`/customers?created[gte]=${since}&limit=100`, key);

  return {
    mrr_cents: Math.round(mrr_cents),
    active_subscriptions: (subs.data ?? []).length,
    new_customers_30d: (newCustomers.data ?? []).length,
    churned_30d: 0, // refine later; Stripe churn needs canceled-subscription scan
  };
}

export const stripeConnector: Connector = {
  type: "stripe",
  secretEnvVar: SECRET_ENV,
  async pull(ctx: ConnectorContext): Promise<PulledMetric[]> {
    const key = ctx.env[SECRET_ENV];
    if (!key) throw new Error(`missing ${SECRET_ENV}`);
    const summary = await fetchSummary(key);
    return mapStripe(summary, ctx.config as any);
  },
};
```

Note: pagination beyond 100 and accurate 30-day churn are deliberately deferred
(YAGNI for v1; values are directionally correct). Leave the `churned_30d: 0` TODO
comment so it is explicit.

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/_shared/connectors/stripe.ts
git commit -m "feat(connectors): Stripe connector module (pull + summary)"
```

---

## Task 5: `connector-sync` edge function (dual auth + dispatch)

**Files:**
- Create: `supabase/functions/connector-sync/index.ts`

Read the auth pattern in `supabase/functions/assistant-chat/index.ts:137-152` and
the service-role guard + `report-ingest` POST target in
`supabase/functions/report-ingest/index.ts`. Use `_shared/cors.ts`.

- [ ] **Step 1: Implement `index.ts`**

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { CONNECTORS } from "../_shared/connectors/registry.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ConnectorRow {
  id: string; type: string; name: string; config: Record<string, unknown>;
}

async function ingestMetrics(metrics: unknown[]): Promise<number> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/report-ingest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "metrics", payload: { metrics } }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `report-ingest ${res.status}`);
  return body.inserted ?? metrics.length;
}

// deno-lint-ignore no-explicit-any
async function runConnector(supabase: any, row: ConnectorRow) {
  const connector = CONNECTORS[row.type];
  if (!connector) throw new Error(`unknown connector type '${row.type}'`);
  const metrics = await connector.pull({ config: row.config ?? {}, env: Deno.env.toObject() });
  const keys = metrics.map((m) => m.key);

  let inserted = 0;
  if (metrics.length > 0) inserted = await ingestMetrics(metrics);

  const nextRun = new Date(Date.now() + 3600 * 1000).toISOString(); // v1: +1h
  await supabase.from("connectors").update({
    last_status: "ok", last_run_at: new Date().toISOString(),
    last_error: null, last_result: { inserted, keys }, next_run_at: nextRun,
  }).eq("id", row.id);
  return { id: row.id, status: "ok", inserted };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders(req), "Content-Type": "application/json" } });

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Mode A: trusted cron (exact service-role match) -> all enabled + due connectors.
  const isService = authHeader === `Bearer ${SERVICE_ROLE_KEY}`;

  let connectorId: string | undefined;
  if (!isService) {
    // Mode B: admin user JWT -> on-demand single connector.
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userData.user.id);
    const isAdmin = (roles ?? []).some((r: { role: string }) => r.role === "admin");
    if (!isAdmin) return json({ error: "forbidden: admin only" }, 403);
    const body = await req.json().catch(() => ({}));
    connectorId = body?.connector_id;
    if (!connectorId) return json({ error: "connector_id is required" }, 400);
  }

  // Load target connectors.
  let query = supabase.from("connectors").select("id, type, name, config").eq("enabled", true);
  if (connectorId) {
    query = supabase.from("connectors").select("id, type, name, config").eq("id", connectorId);
  } else {
    query = query.or(`next_run_at.is.null,next_run_at.lte.${new Date().toISOString()}`);
  }
  const { data: rows, error } = await query;
  if (error) return json({ error: error.message }, 500);

  const results: unknown[] = [];
  for (const row of (rows ?? []) as ConnectorRow[]) {
    try {
      results.push(await runConnector(supabase, row));
    } catch (err) {
      const message = err instanceof Error ? err.message : "sync failed";
      console.error(`[connector-sync] ${row.id}:`, message);
      await supabase.from("connectors").update({
        last_status: "error", last_run_at: new Date().toISOString(), last_error: message,
      }).eq("id", row.id);
      results.push({ id: row.id, status: "error", error: message });
    }
  }
  return json({ success: true, results });
});
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/connector-sync/index.ts
git commit -m "feat(connectors): connector-sync edge function (dual auth, dispatch)"
```

---

## Task 6: Deploy + live verification on the demo

**Files:** none (deploy + DB checks via Supabase MCP on `harbormill-aios-demo`).

- [ ] **Step 1: Deploy the function**

Use MCP `deploy_edge_function` (name `connector-sync`) with `index.ts` and the two
shared imports it pulls in (`_shared/cors.ts` is already deployed with other fns;
the MCP deploy must include `_shared/connectors/{types,registry,stripe,stripe-map}.ts`).
If the MCP deploy only takes the entrypoint, include all referenced files in the
files array. Confirm with `list_edge_functions` that `connector-sync` is ACTIVE.

- [ ] **Step 2: Seed a disabled test row and a temporary enabled one**

```sql
insert into public.connectors (type, name, enabled, config)
values ('stripe', 'Stripe (test)', false, '{}'::jsonb);
```

- [ ] **Step 3: Test the missing-secret path (no Stripe key set yet)**

Temporarily enable the row, then invoke on-demand. Since the demo has no
`CONNECTOR_STRIPE_SECRET_KEY`, expect `last_status='error'`,
`last_error='missing CONNECTOR_STRIPE_SECRET_KEY'`. Verify:

```sql
select last_status, last_error from public.connectors where name = 'Stripe (test)';
```
Expected: `error`, `missing CONNECTOR_STRIPE_SECRET_KEY`. (This proves the dispatch
+ error-capture path without needing real Stripe credentials.)

- [ ] **Step 4: (Optional, if a Stripe test key is available)** set
  `CONNECTOR_STRIPE_SECRET_KEY` as a function secret, invoke again, and confirm
  `metric_snapshots` gained `stripe_*` rows and `last_status='ok'`,
  `last_result.keys` lists the keys. Then disable the row and delete the test
  metric rows. If no test key is available, document that the happy path is
  verified once a client key is configured.

- [ ] **Step 5: Run the security advisor**

MCP `get_advisors` (type `security`). Expected: no NEW findings attributable to
`connectors` / `connector-sync` (pre-existing posture items are fine).

- [ ] **Step 6: Clean up the temporary row**

```sql
delete from public.connectors where name = 'Stripe (test)';
```
(The permanent disabled seed row is added to `seed.sql` in Task 10, not here.)

---

## Task 9 (scheduling — placed after deploy): pg_cron + pg_net + Vault

> Numbered out of order intentionally: the cron must point at a deployed function.
> Run this AFTER Task 6.

**Files:**
- Create: `supabase/migrations/20260617001000_connector_schedule.sql`

This is a **new pattern for the repo** (the existing pg_cron block calls a SQL
function, not an HTTP endpoint). The exact Vault read form must be confirmed live
before relying on it.

- [ ] **Step 1: Set the two Vault secrets on the demo (MCP `execute_sql`)**

```sql
select vault.create_secret('https://<PROJECT_REF>.supabase.co/functions/v1/connector-sync', 'connector_sync_url');
select vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key');
```
Confirm: `select name from vault.secrets where name in ('connector_sync_url','service_role_key');`
(Validate the `vault.create_secret` signature against the live project first; adjust
if the API differs.)

- [ ] **Step 2: Write the schedule migration**

```sql
-- Connector scheduling: hourly pg_cron job invokes the connector-sync edge fn via
-- pg_net, with URL + service-role key read from Vault (never a readable table).
-- NEW pattern for this repo (existing cron calls a SQL fn, not an HTTP endpoint).
-- If the Vault secrets are unset, the post is inert and nothing ingests — the
-- function and the admin "Sync now" still work.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule('connector-sync-hourly', '0 * * * *', $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'connector_sync_url'),
    headers := jsonb_build_object(
                 'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
                 'Content-Type', 'application/json'),
    body    := '{}'::jsonb
  );
$$);
```

- [ ] **Step 3: Apply to the demo and verify the job exists + fires**

Apply via MCP `apply_migration` (name `connector_schedule`). Verify:
```sql
select jobname, schedule from cron.job where jobname = 'connector-sync-hourly';
```
Optionally trigger the job body once manually to confirm `net.http_post` returns a
request id and (within a few seconds) `net._http_response` shows a 200 from
`connector-sync`. If Vault/pg_net behaves differently than written, fix the
migration here and note the correction.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260617001000_connector_schedule.sql
git commit -m "feat(connectors): hourly pg_cron+pg_net schedule via Vault creds"
```

---

## Task 7: Frontend types + status helper + hooks

**Files:**
- Create: `src/types/connector.ts`
- Modify: `src/lib/status.ts`
- Create: `src/hooks/useConnectors.ts`

Mirror `src/hooks/useAudits.ts` (query/mutation shape) and the auth'd fetch in
`src/hooks/useGoogleWorkspace.ts:25-38` for the function invoke.

- [ ] **Step 1: `src/types/connector.ts`**

```ts
export type ConnectorType = "stripe";
export type ConnectorRunStatus = "ok" | "error" | "never";

export const CONNECTOR_TYPE_LABELS: Record<ConnectorType, string> = { stripe: "Stripe" };
export const CONNECTOR_SECRET_ENV: Record<ConnectorType, string> = {
  stripe: "CONNECTOR_STRIPE_SECRET_KEY",
};

export interface Connector {
  id: string;
  type: ConnectorType;
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
  schedule_cron: string;
  next_run_at: string | null;
  last_run_at: string | null;
  last_status: ConnectorRunStatus;
  last_error: string | null;
  last_result: { inserted?: number; keys?: string[] } | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 2: Add `connectorStatusClass` to `src/lib/status.ts`**

Add an import of the type and a helper next to `auditStatusClass`:

```ts
import type { ConnectorRunStatus } from "@/types/connector";

/** Chip classes for a connector's last-run status. */
export function connectorStatusClass(status: ConnectorRunStatus): string {
  switch (status) {
    case "ok": return "border-success/50 bg-success/15 text-success";
    case "error": return "border-destructive/50 bg-destructive/15 text-destructive-foreground";
    default: return "border-border bg-muted text-muted-foreground"; // never
  }
}
```

- [ ] **Step 3: `src/hooks/useConnectors.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_URL } from "@/integrations/supabase/client"; // confirm export name; else inline import.meta.env
import type { Connector } from "@/types/connector";

const COLS =
  "id, type, name, enabled, config, schedule_cron, next_run_at, last_run_at, last_status, last_error, last_result, created_by, created_at, updated_at";

export function useConnectors() {
  return useQuery({
    queryKey: ["connectors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("connectors").select(COLS)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Connector[];
    },
  });
}

export function useSaveConnector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: Partial<Connector> }) => {
      if (id) {
        const { error } = await supabase.from("connectors").update(input).eq("id", id);
        if (error) throw error; return id;
      }
      const { data, error } = await supabase.from("connectors").insert(input).select("id").single();
      if (error) throw error; return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["connectors"] }),
  });
}

export function useSyncConnector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (connectorId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");
      const res = await fetch(`${SUPABASE_URL}/functions/v1/connector-sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ connector_id: connectorId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Sync failed");
      return body.results?.[0] as { status: string; inserted?: number; error?: string } | undefined;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["connectors"] }),
  });
}
```

Implementation note: confirm how `SUPABASE_URL` is exposed in
`src/integrations/supabase/client.ts`. If it is not exported, read it from
`import.meta.env.VITE_SUPABASE_URL` exactly as that file does. Do not hardcode.

- [ ] **Step 4: Gate**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types/connector.ts src/lib/status.ts src/hooks/useConnectors.ts
git commit -m "feat(connectors): types, status helper, data hooks"
```

---

## Task 8: Connectors page + components (feature flag, route, nav)

**Files:**
- Create: `src/pages/Connectors.tsx`
- Create: `src/components/connectors/ConnectorCard.tsx`
- Create: `src/components/connectors/ConnectorForm.tsx`
- Modify: `src/config/features.ts`, `src/App.tsx`, `src/components/layout/AppLayout.tsx`

Follow the `/audits` wiring exactly: `src/pages/Audits.tsx` for page shape,
`AppLayout.tsx:29` for the nav item, `App.tsx:52-57` for the gated route.
Token-based styling only — no hex, no `bg-white`/`text-gray-`. **Never** render or
accept a secret value in the UI.

- [ ] **Step 1: Feature flag** — in `src/config/features.ts` add `connectors: boolean;`
  to the interface and `connectors: true,` to the object.

- [ ] **Step 2: Route** — in `src/App.tsx` import `Connectors` and add, alongside the audits routes:

```tsx
{features.connectors && (
  <Route path="connectors" element={<ProtectedRoute tier="admin"><Connectors /></ProtectedRoute>} />
)}
```

- [ ] **Step 3: Nav** — in `src/components/layout/AppLayout.tsx` add to `NAV` (after the audits item):

```ts
{ to: "/connectors", label: "Connectors", adminOnly: true, feature: "connectors" },
```

- [ ] **Step 4: `ConnectorCard.tsx`** — props `{ connector }`. Render name +
  `CONNECTOR_TYPE_LABELS[type]`, an enabled toggle (`useSaveConnector`), a status
  chip via `connectorStatusClass(last_status)` with `last_run_at` relative time and
  `last_result.inserted` summary, a `last_error` line when present, and a **"Sync
  now"** button calling `useSyncConnector` that toasts the outcome
  (`sonner` `toast.success/error`, as other pages do). An "Edit" button opens the
  form. Show the required env var hint: `CONNECTOR_SECRET_ENV[type]`.

- [ ] **Step 5: `ConnectorForm.tsx`** — create/edit. Fields: `type` (select; only
  `stripe` for now), `name`, `schedule_cron` (text, default `0 * * * *`), enabled
  toggle, and a simple KPI multi-select + optional targets writing into `config`
  (`{ kpis?: string[], targets?: Record<string,string> }`). Saves via
  `useSaveConnector`. Reuse the dialog/field styling from `AuditOpportunityForm` /
  `ConnectorCard` siblings. Include the static note: "Set the API key as the
  Supabase secret `CONNECTOR_STRIPE_SECRET_KEY` — it is never entered here."

- [ ] **Step 6: `Connectors.tsx`** — `useConnectors()`; loading + error states; an
  **empty state** ("No connectors yet" + an Add button) when the list is empty; a
  header with an "Add connector" action opening `ConnectorForm`; map rows to
  `ConnectorCard`. Mirror `Audits.tsx` layout.

- [ ] **Step 7: Gate + brand-leak grep**

Run: `npm run typecheck && npm run lint && npm run build && npm run test`
Expected: all PASS.
Run: `grep -rEn "dc-|#[0-9a-fA-F]{3,6}|bg-white|text-gray-" src/components/connectors src/pages/Connectors.tsx`
Expected: no matches.

- [ ] **Step 8: Commit**

```bash
git add src/pages/Connectors.tsx src/components/connectors src/config/features.ts src/App.tsx src/components/layout/AppLayout.tsx
git commit -m "feat(connectors): admin Connectors page, route, nav, feature flag"
```

---

## Task 10: Demo seed

**Files:**
- Modify: `supabase/seed.sql`

- [ ] **Step 1: Append a disabled sample connector** (so a fresh clone shows the
  surface without needing a key). Match the file's existing insert style:

```sql
-- A disabled sample connector so the Connectors page renders on a fresh clone.
insert into public.connectors (type, name, enabled, config)
values ('stripe', 'Stripe', false, '{}'::jsonb);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/seed.sql
git commit -m "chore(connectors): seed a disabled sample Stripe connector"
```

---

## Task 11: Docs + wiki

**Files:**
- Modify: `docs/extending.md`, `docs/client-setup.md`
- Create: `docs/wiki/concepts/connector-library.md`
- Modify: `docs/wiki/index.md`, `docs/wiki/log.md`

- [ ] **Step 1: `docs/extending.md`** — add an "Add a connector" section: (1) write
  a module in `_shared/connectors/` implementing `Connector` (+ a pure mapping for
  tests), (2) register it in `registry.ts`, (3) add the `type` to the
  `connectors.type` check constraint via a migration, (4) set the
  `CONNECTOR_<TYPE>_SECRET_KEY` secret. Note Stripe is the reference.

- [ ] **Step 2: `docs/client-setup.md`** — under secrets: set each enabled
  connector's `CONNECTOR_*_SECRET_KEY`; and for scheduling, create the two Vault
  secrets `connector_sync_url` + `service_role_key` (note the deck still works
  without them — only auto-scheduling is inert).

- [ ] **Step 3: Wiki page `docs/wiki/concepts/connector-library.md`** — frontmatter
  (`title: Connector Library`, `type: concept`, `created: 2026-06-20`,
  `updated: 2026-06-20`, `sources: [...the new files...]`, `tags`), body covering
  the managed runtime, the registry seam, dual auth, metrics-only/ROI-integrity
  rationale, and per-client config. Add `[[wikilinks]]` to
  `[[Report-Ingest Seam]]`, `[[Extending AIOS]]`, `[[Operating Deck Data Model]]`,
  `[[AIOS Pages]]`, and a `## See Also`.

- [ ] **Step 4: `docs/wiki/index.md`** — add the Concepts entry (alphabetical:
  "Connector Library" sits after "Cost Ledger"? No — after "Calendly Booking Flow"
  and before "Cost Ledger". Place alphabetically.)

- [ ] **Step 5: `docs/wiki/log.md`** — prepend a `## [2026-06-20] ship | Connector
  Library` entry (mirror the existing `ship` entries): what shipped, pages
  created/updated.

- [ ] **Step 6: Add the audit pages' missing siblings? NO** — out of scope. Only
  touch what this feature requires.

- [ ] **Step 7: Commit**

```bash
git add docs/extending.md docs/client-setup.md docs/wiki
git commit -m "docs(connectors): extending + client-setup + wiki page"
```

---

## Task 12: Final review gate

- [ ] **Step 1: Full gate**

Run: `npm run typecheck && npm run lint && npm run build && npm run test`
Expected: all PASS (the 2 known react-refresh lint warnings on
`button.tsx`/`AuthContext.tsx` are acceptable per CLAUDE.md).

- [ ] **Step 2: Manual smoke (`npm run dev`)** — as admin: Connectors appears in
  nav; can add/edit/toggle a connector and see status; "Sync now" on the disabled
  seed (after enabling) surfaces the missing-secret error gracefully. As a
  stakeholder: no Connectors nav, `/connectors` redirects. Set
  `features.connectors=false`: nav + route disappear.

- [ ] **Step 3: Confirm demo state** — migrations applied (`connectors` +
  schedule), `connector-sync` deployed/ACTIVE, security advisor clean, no leftover
  test rows/metrics.

- [ ] **Step 4: Final dispatch** — hand to a final code-reviewer subagent for the
  whole branch, then proceed to `superpowers:finishing-a-development-branch`.

---

## Notes for the implementer

- **DRY:** reuse `useAudits`/`Audits.tsx` shapes; reuse the `report-ingest` seam —
  do NOT add a second write path to `metric_snapshots`.
- **YAGNI:** no generic field-mapper, no extra connectors, no `value_events` from
  connectors, no pagination/precise-churn for v1 (TODO-commented).
- **Security:** secrets only in env/Vault; `connector-sync` rejects non-admin JWTs;
  the table is admin-RLS; nothing secret is ever returned to the browser.
- **Deno files** (`supabase/functions/**`) are not covered by the local gate —
  validate them on the demo deploy (Task 6/9).
