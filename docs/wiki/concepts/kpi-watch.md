---
title: KPI-Watch Loop
type: concept
created: 2026-06-24
updated: 2026-06-24
sources: [supabase/functions/kpi-watch/index.ts, supabase/functions/kpi-watch/derive.ts, supabase/functions/kpi-watch/derive_test.ts, supabase/migrations/20260624000000_kpi_watch_schedule.sql]
tags: [loops, edge-functions, findings, cron, automation, deterministic]
---

# KPI-Watch Loop

**Shipped + deployed** (PR #27, live on both `harbormill-aios-demo` and
`harbormill-aios`, 2026-06-24). A scheduled, unattended, **deterministic
(no-LLM)** loop in `supabase/functions/kpi-watch/` that reads the latest KPIs,
files a [[Operating Deck Data Model|finding]] for any KPI that has breached its
target, and does nothing otherwise. It is the **in-product embodiment of the
[[Four-Condition Loop Test]]** and the live proof point behind the
[[Marketing Site]] trust strip ("the same discipline we run on our own systems").

## What it does

```
pg_cron (daily 13:00 UTC)
   └─► pg_net net.http_post ──► kpi-watch (edge fn, service-role)
            1. read metric_latest (key,label,value,unit,target,status,captured_at)
            2. deriveBreachFindings(metrics)  ← pure, no I/O
            3. POST { type:"findings", payload:{findings} } ──► report-ingest  (batched ≤50)
            4. return { checked, breaching, upserted }   (no-op on zero)
findings ──► Findings page (admin-only, unchanged read path)
```

It is a **read-derive-write** loop with no model call at all — cheap, auditable,
and idempotent.

## The validator (condition #2, by construction)

A KPI is "breaching" iff its `status` is `at_risk` or `off_track`. That status
comparison **is** the objective done-rule — the validator that makes the work
loop-safe. No human taste decides whether a run is finished, which is precisely
what condition #2 of the [[Four-Condition Loop Test]] requires.

| status | finding? | severity |
|---|---|---|
| `on_track` / `null` | no | — |
| `at_risk` | yes | `medium` (title `KPI at risk: {label}`) |
| `off_track` | yes | `high` (title `KPI off target: {label}`) |

The breach logic lives in a pure, import-free core (`derive.ts`,
`deriveBreachFindings(metrics): FindingPayload[]`) so it is unit-tested in
isolation with Vitest-style deno tests (**8/8**) — null-guarding `unit`/`target`
so a metric with no target still yields a clean summary and evidence that omits
the null fields. Each finding uses fingerprint `kpi-breach:{key}` and source
`kpi-watch`, so the existing [[Report-Ingest Seam]] upsert handles idempotency
and **reopens** a resolved finding when a KPI breaches again.

## Why it passes all four conditions

1. **Repeats** — daily cron (`0 13 * * *`).
2. **A rule decides "done"** — `status != on_track`; the validator above.
3. **Afford wasted runs** — advisory findings only, idempotent via fingerprint,
   reversible; nothing destructive.
4. **AI has data + tools** — reads `metric_latest`, writes only through the
   [[Report-Ingest Seam]]. (No AI, in fact — it's deterministic.)

It is distinct from the *future* in-app surface on the
[[Four-Condition Loop Test]] page (where [[Aria]] would score a client's
recurring work): kpi-watch is the simpler, LLM-free loop, built now.

## Shell, auth, scheduling

- **Auth** (`index.ts`): exact-bearer service-role match
  (`Authorization !== \`Bearer ${SERVICE_ROLE_KEY}\`` → 401), mirroring
  report-ingest to prevent substring bypass. Uses the auto-injected
  `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`.
- **Schedule** (`20260624000000_kpi_watch_schedule.sql`): a pg_cron job
  `kpi-watch-daily` calls the function via `pg_net` with the URL + service-role
  key read from **Vault** (`kpi_watch_url`; `service_role_key`, shared with
  [[Connector Library|connector-sync]]). This mirrors the connector-sync cron
  pattern exactly — one scheduling idiom for all in-template loops. Re-applying is
  safe (`cron.schedule` upserts by job name); the function and manual invokes work
  regardless of the cron. If the Vault URL is unset, pg_net drops the null-URL
  request (inert) — the deck is unaffected.

**Secret-handling:** the service-role key value lives encrypted in Vault and is
read by pg_net *inside the database* at cron time — it never transits the client
or the assistant. Adjust the cron expression per client to run shortly after KPIs
are ingested.

## Deployment status

| Project | Function | Cron | Live invoke |
|---|---|---|---|
| `harbormill-aios-demo` | ACTIVE | `0 13 * * *` | `200` · **4 findings filed** (seed data breaches) |
| `harbormill-aios` | ACTIVE (same `ezbr_sha256`) | `0 13 * * *` | `200` · `{checked:2, breaching:0, upserted:0}` — correct **clean no-op** (0 of 2 KPIs breaching) |

A clean no-op is a valid verification: it exercises the full read-derive-write
path and proves the function, its dependencies, and its auth all work — "filed
nothing" is not "didn't run."

## See Also

- [[Four-Condition Loop Test]]
- [[Report-Ingest Seam]]
- [[Operating Deck Data Model]]
- [[Connector Library]]
- [[Edge Functions]]
- [[Marketing Site]]
- [[Self-Improving App]]
