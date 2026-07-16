---
title: Connector Library
type: concept
created: 2026-06-20
updated: 2026-06-20
sources: [supabase/migrations/20260617000900_connectors.sql, supabase/migrations/20260617001000_connector_schedule.sql, supabase/functions/connector-sync/index.ts, supabase/functions/_shared/connectors/types.ts, supabase/functions/_shared/connectors/registry.ts, supabase/functions/_shared/connectors/stripe.ts, supabase/functions/_shared/connectors/stripe-map.ts]
tags: [connectors, ingest, metrics, edge-functions, admin]
---

# Connector Library

**Shipped** (branch `feat/connector-library`, merged to `main` 2026-06-20). A
**managed in-template runtime** that pulls live data from external SaaS into
`metric_snapshots` on a schedule, making the Overview KPIs self-sustaining
without hand-entry or client-built automation. Stripe is the reference connector;
GA4, Google Sheets, and others follow the same four-step pattern.

## Data flow

```
pg_cron (hourly)
   └─► pg_net net.http_post ──► connector-sync (edge fn, service-role)
            1. load enabled connectors whose next_run_at <= now()
            2. for each: CONNECTORS[type].pull(ctx) ─► PulledMetric[]
            3. POST { type:"metrics", payload:{metrics} } ──► report-ingest
            4. write run status back onto the connector row
metric_snapshots ──► Overview KPIs (unchanged read path)
```

All data flows through the existing [[Report-Ingest Seam]], not a second write
path. This is architecture keystone #2: the deck never queries client business
tables directly.

## Pluggable connector registry

The connector registry (`supabase/functions/_shared/connectors/`) mirrors the
[[AI Tool Registry]] pattern: a `Record<string, Connector>` keyed by type, where
`Connector` is a small interface:

```ts
export interface Connector {
  type: string;
  secretEnvVar: string;  // e.g. "CONNECTOR_STRIPE_SECRET_KEY"
  pull(ctx: ConnectorContext): Promise<PulledMetric[]>;
}
```

Each connector module encodes its own response→metric mapping. The pure
mapping function (e.g. `mapStripe`) is kept in a separate import-free file so
it can be unit-tested with Vitest without any network I/O. Adding a new connector
is one module, one `CONNECTORS` line, one `alter table` migration, and one secret.
See [[Extending AIOS]] for the four-step walkthrough.

## Dual authentication

`connector-sync` accepts two caller modes:

- **Scheduled (service-role):** `Authorization: Bearer <SERVICE_ROLE_KEY>` — the
  pg_cron/pg_net call. Loads all enabled connectors due for a run
  (`next_run_at IS NULL OR next_run_at <= now()`).
- **On-demand (admin JWT):** the admin "Sync now" button invokes `connector-sync`
  with `{ connector_id }` via `supabase.functions.invoke`. The function validates
  the JWT, checks `user_roles` for `admin`, and runs that one connector only.

One connector's failure never aborts the others — each runs in its own try/catch
and records its own `last_status` / `last_error`. Failures are visible in the
Connectors admin page, never silent.

## Why connectors emit metrics only

Stripe → `metric_snapshots` (live KPIs). Stripe does **not** write `value_events`.
Raw client revenue is not value Harbormill delivered — conflating the two would
inflate the ROI surface and undermine the honest accounting the *Value Delivered*
widget depends on. The framework is generically value-capable, but the Stripe
connector maps only to metrics by design.

## Per-client DB-driven config

The `connectors` table (migration `20260617000900_connectors.sql`) holds one row
per connector with enabled flag, `config` JSONB (non-secret: KPI toggles, targets,
labels), `schedule_cron`, and run-status columns (`last_run_at`, `last_status`,
`last_error`, `last_result`). RLS is admin-only for all operations.

**API secrets are never stored here.** Each connector declares a `secretEnvVar`
(`CONNECTOR_<TYPE>_SECRET_KEY`) read from Deno's environment at runtime. An
enabled connector with a missing secret records `last_status='error'` and
`last_error='missing CONNECTOR_STRIPE_SECRET_KEY'` — visible in the UI.

The `connectors` feature flag (`src/config/features.ts`) removes the nav entry
and route for clients that do not use this module. See [[AIOS Pages]].

## Secrets + Vault

| Value | Where |
|---|---|
| `CONNECTOR_<TYPE>_SECRET_KEY` | Supabase edge-function secret (one per connector type) |
| `connector_sync_url` | Supabase Vault (`vault.decrypted_secrets`) |
| `service_role_key` | Supabase Vault — required only for the hourly auto-sync |

`connector-sync` also uses the auto-injected `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY`. The deck and the admin "Sync now" remain fully
functional without the Vault secrets — only the hourly cron is inert until they
are set (see `docs/client-setup.md`, step 4).

## See Also

- [[Report-Ingest Seam]]
- [[AI Tool Registry]]
- [[Extending AIOS]]
- [[Operating Deck Data Model]]
- [[AIOS Pages]]
