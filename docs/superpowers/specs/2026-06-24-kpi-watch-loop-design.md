# KPI-watch loop (in-product) — design spec

- **Date:** 2026-06-24
- **Status:** approved design, pre-implementation
- **Surface:** C — the in-product validator-closed loop (AIOS product). The first *production* loop in the "skills → validators → loops" arc.
- **Lineage:** A (`validator-forge` #23) forged the method; the dogfood's loop (`wiki-gardener` #24) proved it in dev; B (#26) marketed "automation you can leave running." C is that claim realized **inside the product**.

## 1. Context & problem

Today an off-target KPI shows only as a red `status` on the Overview. Nothing turns it
into a tracked, triageable item, so a slipping metric can sit unnoticed. The deck already
has every piece needed to close that gap:

- **The validator signal already lives in the data.** `metric_snapshots` (read via the
  `metric_latest` view) carries `status text check (status in
  ('on_track','at_risk','off_track'))`, set by whatever publishes the client's KPIs. So the
  breach rule is deterministic and needs no LLM: **`status != 'on_track'` is a breach.**
- **Idempotent upsert + reopen already exist.** `findings` has a `unique fingerprint`,
  `occurrences`, `last_seen_at`, and a `status` lifecycle; `report-ingest` upserts on
  fingerprint, bumps `occurrences`, and **reopens a resolved finding on recurrence**. The
  default `source` is `"sweep-agent"` — the table was built for exactly this recurring sweep.
- **The write seam already exists.** `report-ingest` (service-role choke point) accepts
  `{ type: "findings", payload: { findings: [{ severity, title, summary_md, evidence?,
  source?, fingerprint }] } }`. **It has no resolve/close path** — only insert / update /
  reopen. That constraint decides the resolution posture (§5).
- **The cron pattern already exists.** `connector-sync` (migration
  `20260617001000_connector_schedule.sql`) runs `cron.schedule(...) → net.http_post(url :=
  vault secret, Authorization := 'Bearer ' || vault service_role_key)` and is **inert until
  the operator sets the Vault `service_role_key`** — a safe default we mirror.

## 2. Goals / non-goals

**Goals**
- A scheduled, unattended, **deterministic** loop that converts breaching KPIs into
  advisory findings — the in-product expression of the Four-Condition Loop Test, all four
  conditions passing cleanly (see §4).
- Reuse existing seams (no schema change, no new UI, no LLM, near-zero metered spend).

**Non-goals (YAGNI)**
- No on-demand Aria chat tool (Aria can already roughly do read_metrics→reason→create_finding;
  the value here is *unattended autonomy*, not another manual tool).
- No Aria-narrated summaries — deterministic templating only (an LLM summary is a later option).
- **No auto-resolve** (§5).
- No event-after-ingest trigger (daily cron first).
- No new UI — the existing **Findings page** renders the output.
- The deferred "Aria scores a client's *work* for loop-audit" feature stays deferred — that
  per-client task data is still not ingested (fails condition #4).

## 3. Architecture (units)

| Unit | Responsibility | Depends on |
|------|----------------|------------|
| `supabase/functions/kpi-watch/derive.ts` — **pure core** (`deriveBreachFindings`) | Map `metric_latest` rows → finding payloads. **No I/O, no imports**, fully deterministic → unit-testable in isolation. The validator + finding-shaping logic. | nothing (pure) |
| `supabase/functions/kpi-watch/derive_test.ts` — **unit tests** | `deno test` over `deriveBreachFindings` (Deno 2.8.3 confirmed available locally). | `derive.ts` |
| `supabase/functions/kpi-watch/index.ts` — **shell** | Service-role auth (exact-bearer match, mirroring `report-ingest`); read `metric_latest`; call `deriveBreachFindings` from `./derive.ts`; POST the findings to `report-ingest` (batched ≤50/request); return a run summary. | `derive.ts`, `metric_latest`, `report-ingest` |
| `supabase/migrations/<ts>_kpi_watch_schedule.sql` — **schedule** | A daily `pg_cron` job that `net.http_post`s the `kpi-watch` function with the Vault service-role bearer; sets the `kpi_watch_url` Vault secret. Mirrors `connector-sync`; inert until the operator sets the `service_role_key` Vault secret. | pg_cron, pg_net, Vault (all already used by connector-sync) |

No change to `findings`, `metric_snapshots`/`metric_latest`, or any UI. Edge functions are
Deno (not covered by the npm gate).

## 4. The loop (flow)

The `kpi-watch` shell, per invocation (cron, daily):
1. **Auth:** require `Authorization: Bearer <SERVICE_ROLE_KEY>` (exact match, like report-ingest). Reject otherwise.
2. **Read** `metric_latest` (service-role): `key, label, value, unit, target, status, captured_at`.
3. **Derive** (`deriveBreachFindings`): for each row with `status ∈ {at_risk, off_track}`, build a finding payload (§5). On-track rows → ignored.
4. **Act:** if there are breach findings, POST `{ type: "findings", payload: { findings } }` to `report-ingest` with the service-role bearer (reusing its fingerprint upsert + reopen — DRY, single choke point), **batched in chunks of ≤50 per request** (`report-ingest` caps at 50; a client realistically has far fewer KPIs, but batch defensively so a large deck never 400s). If none → no POST.
5. **Return** a summary `{ checked, breaching, upserted }` and log it. "Done" for the cycle = every breaching KPI has an upserted finding (or there are none).

Four-Condition fit: **Repeats** (cron / KPI cadence) · **Rule decides done** (`status != on_track`, deterministic) · **Afford wasted runs** (advisory findings, idempotent, no AI, no business-table access) · **Has data + tools** (`metric_latest` + the `report-ingest` finding seam).

## 5. Finding shape & resolution posture

**Each breach → one finding payload:**
- `fingerprint`: `"kpi-breach:<key>"` — one finding per KPI; reopens on recurrence.
- `severity`: `off_track → "high"`, `at_risk → "medium"`. (Never `critical` — reserved for true emergencies.)
- `title`: e.g. `"KPI off target: <label>"` (off_track) / `"KPI at risk: <label>"` (at_risk).
- `summary_md`: **templated, no LLM** — e.g. `"**<label>** is <status>. Latest **<value><unit>** vs target **<target>** (as of <captured_at>). Auto-maintained by the KPI-watch loop while the metric is off target."`
- `evidence`: `{ key, value, target, status, captured_at }`.
- **Null-guard (required):** `unit` and `target` are nullable in the view. Omit a null `unit` (never emit a trailing `"undefined"`), and render a null `target` gracefully (e.g. "no target set"); the `evidence` object omits null fields rather than storing `null`. A unit test covers a breaching row with null `unit` + null `target` (§8.1).
- `source`: `"kpi-watch"`.

**Resolution posture — open/reopen, never auto-resolve.** While a KPI is breaching, each
cycle re-asserts (upserts) its finding — keeping `last_seen_at` fresh and letting
`occurrences` count breaching cycles (the intended sweep semantics). When a KPI returns to
`on_track`, the loop simply **stops re-asserting** that fingerprint; the open finding remains
for an **admin** to resolve. Rationale: (a) `report-ingest` has no close path; (b) resolving
is a human judgment — consistent with the advisory / human-gated posture used throughout
(`propose_correction` never auto-applies; the wiki-gardener never auto-resolved human-gated
defects). Auto-resolve is a possible later enhancement.

## 6. Cadence & config

- A **daily** `pg_cron` job (KPIs don't change hourly; daily keeps `occurrences` meaningful).
  Exact time configurable per client by editing the cron expression.
- Mirrors `connector-sync`: URL + `service_role_key` from Vault; **inert until the operator
  sets the `service_role_key` Vault secret** (the function and any manual invoke remain
  functional regardless). The migration sets the `kpi_watch_url` Vault secret (Step-1 pattern
  from connector-sync).

## 7. Per-client / template fit (keystones preserved)

Ships in the **base template**, flows to client clones via the per-client deploy; env-only,
uses the client's own Supabase. Preserves every keystone: the deck never queries client
business tables (reads only `metric_latest`, writes only `findings` via the seam); all writes
go through the `report-ingest` service-role choke point; it's an additive, self-contained
function + cron, not a fork of the engine.

## 8. Acceptance approach

Edge functions are Deno — **not** covered by `npm run typecheck/lint/build/test`; the repo
convention is "validate on deploy." So:
1. **Unit tests on the pure core** `deriveBreachFindings` (the real TDD target), run via
   **`deno test supabase/functions/kpi-watch/`** (Deno 2.8.3 confirmed available). Cases:
   on_track rows produce no finding; `at_risk → medium`; `off_track → high`; fingerprint is
   `kpi-breach:<key>`; summary/evidence populated from the row; **a breaching row with null
   `unit` and null `target` yields a clean summary (no `"undefined"`) and evidence without
   null fields**; empty / all-on_track input → empty output.
2. **Static Deno validation** of `kpi-watch/index.ts` (`deno check` / `deno lint` if the
   toolchain is available; otherwise inspection against the `report-ingest` patterns).
3. **Live integration test — deferred (not in this build).** Deploying `kpi-watch` to a real
   Supabase project, seeding an `off_track` metric, invoking, and confirming the finding
   upserts (and a second invoke bumps `occurrences`) is the only true end-to-end check, but
   it touches a real project — left to deploy time (or an explicit later request), per the
   repo's "validate on deploy" posture.

## 9. Success criteria

- `deriveBreachFindings` exists as a pure, exported function with passing unit tests covering
  the cases in §8.1.
- `kpi-watch/index.ts` reads `metric_latest`, derives breach findings via the pure core, and
  POSTs them to `report-ingest` with the service-role bearer; rejects non-service-role callers;
  no-ops cleanly on zero breaches.
- The migration schedules a daily `pg_cron` job mirroring `connector-sync` (Vault URL +
  service-role bearer, inert-until-secret-set), and sets the `kpi_watch_url` Vault secret.
- No schema change, no UI change, no LLM call; writes only `findings` (via report-ingest),
  reads only `metric_latest`.

## 10. Out of scope (enabled, not built here)

- On-demand Aria tool; Aria-narrated summaries; auto-resolve; event-after-ingest trigger; new UI.
- The deferred in-app loop-audit (Aria scoring client *work*) — still blocked on condition #4.
- The optional live integration test (§8.3).

## See Also

- `supabase/functions/report-ingest/index.ts` — the finding upsert seam this writes through
- `supabase/migrations/20260617000100_operating_deck.sql` — `metric_snapshots`/`metric_latest` + `findings` schema
- `supabase/migrations/20260617001000_connector_schedule.sql` — the pg_cron + Vault pattern this mirrors
- `supabase/functions/assistant-chat/tools.ts` — `propose_correction` (the advisory / human-gated precedent)
- `docs/wiki/concepts/four-condition-loop-test.md` — the framework this loop instantiates in-product
- `docs/wiki/concepts/self-improving-app.md` — Phase 5 (KPI/briefing autopilot) realized
