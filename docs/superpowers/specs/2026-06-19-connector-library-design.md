# Connector Library — Design Spec

**Date:** 2026-06-19
**Status:** Approved (brainstorm) → pending plan
**Branch:** `feat/connector-library`

## Goal

Let the AIOS pull live business data from external SaaS (Stripe first; GA4 /
Google Sheets / others later) into the operating deck automatically, so
`metric_snapshots` populate on a schedule instead of being hand-entered — a
base, white-label, per-client-configurable feature. This makes the Overview KPIs
self-sustaining and strengthens the $5k/mo "operating deck in a box" retainer.

## Decisions locked (from brainstorm)

1. **Execution model: managed in-template.** Harbormill ships the connector
   runtime; the client provides API keys and picks what's enabled. (Not BYO
   automation.)
2. **Config model: DB table + admin UI.** A `connectors` table (admin-RLS) holds
   enabled flag, config, schedule, and last-run status; an in-deck admin
   "Connectors" page manages it. No redeploy to add/tune a connector.
3. **Reference connector: Stripe.** Cleanest API (REST + bearer key), best ROI
   fit. Framework + Stripe ship together; GA4/Sheets are cheap follow-ons.
4. **Stripe emits metrics only.** Stripe → `metric_snapshots` (live KPIs). It does
   **not** write `value_events` — raw client revenue is not value Harbormill
   delivered, and conflating them would inflate the ROI surface. The framework is
   generically value-capable, but Stripe maps to metrics. (Integrity of the
   [[Value Delivered]] / ROI story is the reason.)
5. **Write path: `connector-sync` → `report-ingest`.** The sync engine writes to
   the deck *through the existing `report-ingest` seam* (architecture keystone #2),
   not via a second direct write path.
6. **Connector-coded mappings, not a generic field-mapper.** Each connector module
   encodes its own response→metric mapping. A generic mapping engine is deferred
   until a connector (e.g. Sheets) actually needs it (YAGNI).

## Architecture & data flow

```
pg_cron (hourly)
   └─► pg_net net.http_post ──► connector-sync (edge fn, service-role)
            1. load enabled connectors whose next_run_at <= now()
            2. for each: CONNECTORS[type].pull(ctx) ─► PulledMetric[]
            3. POST { type:"metrics", payload:{metrics} } ──► report-ingest
            4. write run status back onto the connector row
metric_snapshots ──► Overview KPIs (unchanged read path)
```

Four independently-testable units:
- **`connectors` table** — per-client config + last-run status (admin-RLS).
- **Connector registry** (`_shared/connectors/`) — `type → Connector`, mirroring
  the Aria tool registry. Stripe is the first entry.
- **`connector-sync` edge function** — scheduler/dispatcher; pulls, maps, writes
  through `report-ingest`. Also callable on-demand for "Sync now".
- **Admin Connectors page** — manage / enable / configure / trigger / view status.

## Data model — `supabase/migrations/20260617000900_connectors.sql`

```sql
create table public.connectors (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in ('stripe')),   -- extend the check per connector
  name          text not null,
  enabled       boolean not null default false,
  config        jsonb not null default '{}'::jsonb,         -- non-secret: which KPIs, targets, labels
  schedule_cron text not null default '0 * * * *',          -- advisory cadence (display/derive next_run)
  next_run_at   timestamptz,
  last_run_at   timestamptz,
  last_status   text not null default 'never' check (last_status in ('ok','error','never')),
  last_error    text,
  last_result   jsonb,                                       -- {inserted: N, keys:[...]}
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

- The API **secret is never stored in this table.** `config` is non-secret only.
- `service_role` reaches the table via its key bypassing RLS (as elsewhere); no
  explicit service-role policy is required (matches existing tables).

### Scheduling (same migration)

> **New pattern (no in-repo precedent).** The existing `pg_cron` block in
> `20260617000500_operating_deck_internal.sql` calls a plain SQL function
> (`capture_platform_weight()`) and uses `pg_cron` only. This connector schedule
> introduces a **new** pattern for this repo: `pg_cron` + `pg_net`
> (`net.http_post`) invoking a Deno edge function, with credentials from Vault.
> It is not a copy of an existing block. Because there is no precedent, the exact
> `pg_net` / `vault` call form **must be validated against the live Supabase
> project during implementation** before relying on it.

```sql
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

- The function URL + service-role key are read from **Supabase Vault**
  (`vault.decrypted_secrets`), never a readable app table.
- If those Vault secrets are unset, the cron post is inert (errors server-side and
  ingests nothing) — the function and "Sync now" still work. Documented as a
  deploy step; the deck does not break without it.
- The exact `vault.secrets` insert/select form must be validated against the live
  Supabase project during implementation (Vault API specifics).

**First-run / `next_run_at` contract.** `next_run_at` has no default, so a newly
inserted or seeded connector has `next_run_at = NULL`. Scheduled mode selects
`enabled AND (next_run_at IS NULL OR next_run_at <= now())`, so a null row is due
immediately on the next tick (or via "Sync now"); after a successful run
`next_run_at` is advanced (derive from `schedule_cron`, or simple +interval for
v1). The demo seed row is **disabled**, so it never runs and its `next_run_at`
stays null indefinitely — expected.

## Connector registry + Stripe module — `supabase/functions/_shared/connectors/`

```ts
// types.ts
export interface ConnectorContext {
  config: Record<string, unknown>;
  env: Record<string, string | undefined>;
}
export interface PulledMetric {
  key: string; label: string; value: string | number;
  unit?: string; target?: string; status?: "on_track" | "at_risk" | "off_track";
}
export interface Connector {
  type: string;
  secretEnvVar: string;                 // e.g. "CONNECTOR_STRIPE_SECRET_KEY"
  pull(ctx: ConnectorContext): Promise<PulledMetric[]>;
}

// registry.ts
export const CONNECTORS: Record<string, Connector> = { stripe: stripeConnector };
```

**Stripe module** (`stripe.ts`):
- `secretEnvVar = "CONNECTOR_STRIPE_SECRET_KEY"`.
- `pull(ctx)` reads `ctx.env[secretEnvVar]`; if missing, throws a clear
  `missing CONNECTOR_STRIPE_SECRET_KEY` error (surfaced as `last_error`).
- Calls Stripe's REST API and returns a fixed, known KPI set:
  `stripe_mrr`, `stripe_active_subscriptions`, `stripe_new_customers_30d`,
  `stripe_churned_30d` (initial set; refine during implementation).
- `config` only toggles which KPIs are enabled and supplies optional
  `target` / `label` overrides — **no generic field-mapper.**
- The pure response→metric transform is a separate exported function
  `mapStripe(raw): PulledMetric[]` so it is unit-testable without network I/O.

Adding GA4/Sheets later = one module + one `CONNECTORS` line + one allowed
`type` value in the check constraint. That is the entire "library" extension story.

## `connector-sync` edge function — `supabase/functions/connector-sync/index.ts`

- Service-role only — exact bearer match (`Authorization === Bearer <SERVICE_ROLE_KEY>`),
  same guard as `report-ingest`.
- **Scheduled mode** (empty / `{}` body): load `enabled` connectors where
  `next_run_at` is null or `<= now()`.
- **On-demand mode** (`{ connector_id }`, from the admin "Sync now"): that one only,
  ignoring schedule.
- For each connector:
  1. `CONNECTORS[type].pull(ctx)` where `ctx.env = Deno.env.toObject()`.
  2. **Empty-pull guard:** if `metrics.length === 0` (e.g. all KPIs toggled off, or
     an account with no data), **skip the POST** and record a benign success —
     `last_status='ok'`, `last_result={inserted:0, keys:[]}`. (Posting `[]` to
     `report-ingest` would 400 on its non-empty-array check and falsely log an error.)
  3. Otherwise POST `{ type:"metrics", payload:{ metrics } }` to `report-ingest`
     with the service-role bearer.
  4. On success: `last_status='ok'`, `last_run_at=now()`, `last_result={inserted, keys}`,
     `next_run_at` advanced (derive from `schedule_cron`, or simple +interval for v1).
     **`inserted`** is read from the `report-ingest` response (`{success, inserted}`);
     **`keys`** is `metrics.map(m => m.key)` captured in `connector-sync` *before* the
     POST (report-ingest does not return keys).
  5. On failure: `last_status='error'`, `last_error=<message>`. **One connector's
     failure never aborts the others** (per-connector try/catch).
- Returns a per-connector summary `{ results: [{ id, status, inserted?, error? }] }`.
- Needs `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (auto-injected) to reach
  `report-ingest`, plus each connector's `CONNECTOR_*` secret.

## Frontend — admin Connectors page

- `src/config/features.ts` — add `connectors: boolean` (default `true`).
- `src/App.tsx` — `/connectors` + (if needed) detail route, gated
  `features.connectors` and `<ProtectedRoute tier="admin">` (same pattern as `/audits`).
- `src/components/layout/AppLayout.tsx` — nav `{ to:"/connectors", label:"Connectors",
  adminOnly:true, feature:"connectors" }`.
- `src/types/connector.ts` — `Connector`, `ConnectorType`, `ConnectorRunStatus`.
- `src/hooks/useConnectors.ts` — `useConnectors` (list), `useSaveConnector`
  (upsert enabled/config/schedule), `useSyncConnector` (invokes `connector-sync`
  with `{connector_id}` via `supabase.functions.invoke`).
- `src/lib/status.ts` — add `connectorStatusClass(last_status)` chip helper
  (`ok` success, `error` destructive, `never` muted).
- `src/pages/Connectors.tsx` + `src/components/connectors/`:
  - **Empty state** — when no connectors are configured, show a "No connectors yet"
    prompt with an add action (consistent with other admin pages' empty states).
  - `ConnectorCard` — name, type, enabled toggle, last-run chip, last-run time,
    result summary, **"Sync now"** (shows run outcome via toast).
  - `ConnectorForm` — type, name, schedule, per-connector KPI toggles/targets from
    `config`; a static note states which env secret the type needs.
- Token-based styling only. **No secret is ever displayed or entered in the UI** —
  keys are set as Supabase secrets out-of-band.

## Secrets & config conventions

- One env var per connector type, by convention `CONNECTOR_<TYPE>_SECRET_KEY`
  (Stripe → `CONNECTOR_STRIPE_SECRET_KEY`); declared on the module as `secretEnvVar`.
- `connector-sync` also uses auto-injected `SUPABASE_URL` /
  `SUPABASE_SERVICE_ROLE_KEY`.
- Vault: `connector_sync_url`, `service_role_key` for the cron job.
- `enabled` connector with a missing secret → `last_status='error'`,
  `last_error='missing CONNECTOR_STRIPE_SECRET_KEY'` (visible in UI, never a blind throw).

## Docs & wiki

- `docs/extending.md` — "Add a connector" (module → register → extend `type` check →
  set secret). The 4-step extension story.
- `docs/client-setup.md` — connector secrets + the two Vault values for scheduling.
- Wiki: new `docs/wiki/concepts/connector-library.md`; update `index.md`; link from
  `[[Report-Ingest Seam]]`, `[[Extending AIOS]]`, `[[Operating Deck Data Model]]`;
  add a `ship` entry to `log.md`.

## Demo seed — `supabase/seed.sql`

Append one **disabled** sample Stripe connector row so a fresh clone shows the
surface without needing a key.

## Testing & verification

- **Unit (vitest, TDD):** `mapStripe(raw) → PulledMetric[]` (pure mapping) and the
  `next_run_at` / due-selection helper.
- **Gate:** `npm run typecheck && npm run lint && npm run build && npm run test`;
  brand-leak grep over `src/components/connectors/**` (no `dc-`/raw palette/`bg-white`/`text-gray-`).
- **Live on `harbormill-aios-demo` (MCP):** apply the migration; insert a disabled
  sample Stripe connector; deploy `connector-sync`; invoke on-demand with a test
  key (or a safe/mocked path) and confirm `metric_snapshots` rows land via
  `report-ingest` and the run-status columns update; run the security advisor
  (expect no new findings).
- **Manual (`npm run dev`):** admin sees Connectors, can toggle/configure/"Sync now"
  and see status; a stakeholder cannot; `features.connectors=false` removes nav + route.
- **Deploy note:** deploy `connector-sync` (Deno; MCP or CLI). `report-ingest` is
  unchanged (it already accepts `type:"metrics"`).

## Critical files

New: `supabase/migrations/20260617000900_connectors.sql`,
`supabase/functions/connector-sync/index.ts`,
`supabase/functions/_shared/connectors/{types.ts,registry.ts,stripe.ts}`,
`src/types/connector.ts`, `src/hooks/useConnectors.ts`, `src/pages/Connectors.tsx`,
`src/components/connectors/{ConnectorCard,ConnectorForm}.tsx`,
`docs/wiki/concepts/connector-library.md`.
Modify: `src/App.tsx`, `src/components/layout/AppLayout.tsx`, `src/config/features.ts`,
`src/lib/status.ts`, `supabase/seed.sql`, `docs/extending.md`, `docs/client-setup.md`,
`docs/wiki/index.md`, `docs/wiki/log.md`.

## Out of scope (deferred)

- GA4, Google Sheets, and other connectors (follow-on modules).
- A generic field-mapping engine (until a connector needs it).
- `value_events` emission from connectors (framework supports it; no connector uses it yet).
- BYO-automation docs (the raw ingest contract is already documented in `report-ingest`).
