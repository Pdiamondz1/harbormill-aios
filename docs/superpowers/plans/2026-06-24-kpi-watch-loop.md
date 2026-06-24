# KPI-watch Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `kpi-watch`, a scheduled, unattended, deterministic Deno edge function that reads `metric_latest` and upserts an advisory finding (via the `report-ingest` seam) for every KPI whose latest `status` is `at_risk`/`off_track`, driven by a daily `pg_cron` job.

**Architecture:** A pure, import-free core (`derive.ts` → `deriveBreachFindings`) holds the validator + finding-shaping logic and is unit-tested with `deno test`. A thin shell (`index.ts`) does I/O: service-role auth, read `metric_latest`, call the core, POST findings to `report-ingest` (batched ≤50). A migration schedules a daily `pg_cron` job mirroring `connector-sync`. No schema change, no UI, no LLM.

**Tech Stack:** Deno (Supabase edge functions), `supabase-js@2`, Postgres `pg_cron` + `pg_net` + Vault. Deno 2.8.3 is available locally.

**Spec:** `docs/superpowers/specs/2026-06-24-kpi-watch-loop-design.md` (source of truth — read first).

**Worktree:** Execute in `C:\GIT\harbormill-aios\.claude\worktrees\hma-prod4`.

**Gate note (important):** Edge functions are Deno and are **NOT** covered by `npm run typecheck/lint/build/test` (per CLAUDE.md — "validate on deploy"). This change touches only `supabase/functions/` + `supabase/migrations/` — do **not** run the npm gate for it. Verification is `deno test` (Task 1) + `deno check` (Task 2) + inspection against the mirrored pattern (Task 3). The optional live deploy/integration test is explicitly **out of scope** (spec §8.3).

**Commit convention:** End each commit message with the repo trailer:
```
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PXhzcUxRqNEX5nbVkjKc5p
```

---

## File Structure

| File | Responsibility | Task |
|------|----------------|------|
| `supabase/functions/kpi-watch/derive.ts` | **Pure core** — `deriveBreachFindings(metrics) → FindingPayload[]`. No I/O, no imports. The validator + finding shaping (null-guarded). | 1 |
| `supabase/functions/kpi-watch/derive_test.ts` | **Deno unit tests** for the pure core (the real TDD target). | 1 |
| `supabase/functions/kpi-watch/index.ts` | **Shell** — service-role auth, read `metric_latest`, call the core, POST to `report-ingest` (batched ≤50), return a run summary. | 2 |
| `supabase/migrations/20260624000000_kpi_watch_schedule.sql` | Daily `pg_cron` job (mirrors `connector-sync`); reads `kpi_watch_url` + `service_role_key` from Vault; inert until the operator sets the secret. | 3 |

---

## Task 1: Pure core + Deno unit tests (TDD)

**Files:**
- Create: `supabase/functions/kpi-watch/derive.ts`
- Create (test): `supabase/functions/kpi-watch/derive_test.ts`

- [ ] **Step 1: Write the failing tests**

Create `supabase/functions/kpi-watch/derive_test.ts`:

```ts
import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { deriveBreachFindings, type MetricRow } from "./derive.ts";

const row = (over: Partial<MetricRow>): MetricRow => ({
  key: "rev",
  label: "Revenue",
  value: "$12,400",
  unit: null,
  target: "$15,000",
  status: "on_track",
  captured_at: "2026-06-24T00:00:00Z",
  ...over,
});

Deno.test("on_track rows produce no findings", () => {
  assertEquals(deriveBreachFindings([row({ status: "on_track" })]), []);
});

Deno.test("off_track -> high severity, correct fingerprint/title/source", () => {
  const out = deriveBreachFindings([row({ key: "rev", label: "Revenue", status: "off_track" })]);
  assertEquals(out.length, 1);
  assertEquals(out[0].severity, "high");
  assertEquals(out[0].fingerprint, "kpi-breach:rev");
  assertEquals(out[0].title, "KPI off target: Revenue");
  assertEquals(out[0].source, "kpi-watch");
});

Deno.test("at_risk -> medium severity", () => {
  const out = deriveBreachFindings([row({ status: "at_risk" })]);
  assertEquals(out.length, 1);
  assertEquals(out[0].severity, "medium");
  assertEquals(out[0].title, "KPI at risk: Revenue");
});

Deno.test("null unit and null target -> clean summary + evidence omits null fields", () => {
  const out = deriveBreachFindings([
    row({ key: "nps", label: "NPS", value: "12", unit: null, target: null, status: "off_track" }),
  ]);
  assertEquals(out.length, 1);
  const f = out[0];
  assertEquals(f.summary_md.includes("undefined"), false);
  assertEquals(f.summary_md.includes("null"), false);
  assertEquals(f.summary_md.includes("no target set"), true);
  assertEquals("unit" in f.evidence, false);
  assertEquals("target" in f.evidence, false);
  assertEquals(f.evidence.key, "nps");
});

Deno.test("unit is appended to the value when present", () => {
  const out = deriveBreachFindings([row({ value: "4.2", unit: "★", status: "at_risk" })]);
  assertEquals(out[0].summary_md.includes("**4.2 ★**"), true);
});

Deno.test("mixed batch: only breaching rows yield findings, in order", () => {
  const out = deriveBreachFindings([
    row({ key: "a", status: "on_track" }),
    row({ key: "b", status: "at_risk" }),
    row({ key: "c", status: "off_track" }),
    row({ key: "d", status: null }),
  ]);
  assertEquals(out.map((f) => f.fingerprint), ["kpi-breach:b", "kpi-breach:c"]);
});

Deno.test("empty input -> empty output", () => {
  assertEquals(deriveBreachFindings([]), []);
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `deno test supabase/functions/kpi-watch/derive_test.ts`
Expected: FAIL — `derive.ts` does not exist yet (module-not-found).

- [ ] **Step 3: Implement the pure core**

Create `supabase/functions/kpi-watch/derive.ts`:

```ts
// Pure, import-free breach-derivation for the KPI-watch loop.
// Maps metric_latest rows -> report-ingest finding payloads. No I/O — unit-tested in isolation.

export interface MetricRow {
  key: string;
  label: string;
  value: string;
  unit: string | null;
  target: string | null;
  status: string | null; // 'on_track' | 'at_risk' | 'off_track' | null
  captured_at: string;
}

export interface FindingPayload {
  severity: "high" | "medium";
  title: string;
  summary_md: string;
  evidence: Record<string, unknown>;
  source: "kpi-watch";
  fingerprint: string;
}

const STATUS_WORD: Record<string, string> = { off_track: "off target", at_risk: "at risk" };
const SEVERITY: Record<string, "high" | "medium"> = { off_track: "high", at_risk: "medium" };

/** Pure: metric_latest rows -> finding payloads for every breaching KPI (status != on_track). */
export function deriveBreachFindings(metrics: MetricRow[]): FindingPayload[] {
  const findings: FindingPayload[] = [];
  for (const m of metrics ?? []) {
    const status = m.status ?? "";
    if (status !== "at_risk" && status !== "off_track") continue;

    const word = STATUS_WORD[status];
    const valueDisplay = m.unit ? `${m.value} ${m.unit}` : `${m.value}`;
    const targetClause = m.target ? ` vs target **${m.target}**` : " (no target set)";

    const evidence: Record<string, unknown> = {
      key: m.key,
      value: m.value,
      status,
      captured_at: m.captured_at,
    };
    if (m.unit) evidence.unit = m.unit;
    if (m.target) evidence.target = m.target;

    findings.push({
      severity: SEVERITY[status],
      title: `KPI ${word}: ${m.label}`,
      summary_md:
        `**${m.label}** is ${word}. Latest **${valueDisplay}**${targetClause} ` +
        `(as of ${m.captured_at}). Auto-maintained by the KPI-watch loop while the metric is off target.`,
      evidence,
      source: "kpi-watch",
      fingerprint: `kpi-breach:${m.key}`,
    });
  }
  return findings;
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `deno test supabase/functions/kpi-watch/derive_test.ts`
Expected: PASS (all tests, output pristine).

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/kpi-watch/derive.ts supabase/functions/kpi-watch/derive_test.ts
git commit -m "feat(kpi-watch): pure breach-derivation core + deno unit tests

deriveBreachFindings maps metric_latest rows to report-ingest finding
payloads for any KPI with status != on_track (off_track->high, at_risk->
medium, fingerprint kpi-breach:<key>), null-guarded for unit/target."
```

---

## Task 2: The shell (edge function entry)

**Files:**
- Create: `supabase/functions/kpi-watch/index.ts`
- Reference (read, don't modify): `supabase/functions/report-ingest/index.ts` (mirror its serve/auth/CORS structure and the internal report-ingest POST pattern used by `propose_correction`)

- [ ] **Step 1: Read the pattern**

Read `supabase/functions/report-ingest/index.ts` for the exact `serve` + `corsHeaders(req)` + exact-bearer service-role check, and note the `${SUPABASE_URL}/functions/v1/report-ingest` internal POST shape. Confirm `../_shared/cors.ts` exports `corsHeaders`.

- [ ] **Step 2: Create `index.ts`**

Create `supabase/functions/kpi-watch/index.ts`:

```ts
// kpi-watch
// Scheduled, unattended, deterministic KPI-watch loop (no LLM). Reads metric_latest,
// derives breach findings for any KPI whose status != on_track, and upserts them via the
// report-ingest service-role seam (fingerprint -> idempotent + reopen-on-recurrence).
// Invoked by a daily pg_cron job with the service-role bearer (mirrors connector-sync).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { deriveBreachFindings, type MetricRow } from "./derive.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const INGEST_BATCH = 50; // report-ingest caps findings at 50 per request

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });

  // Service-role only — exact match (mirrors report-ingest; prevents substring bypass).
  if (req.headers.get("Authorization") !== `Bearer ${SERVICE_ROLE_KEY}`) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data, error } = await supabase
    .from("metric_latest")
    .select("key, label, value, unit, target, status, captured_at");
  if (error) {
    console.error("[kpi-watch] read metric_latest:", error.message);
    return json({ error: error.message }, 500);
  }

  const metrics = (data ?? []) as MetricRow[];
  const findings = deriveBreachFindings(metrics);

  if (findings.length === 0) {
    return json({ checked: metrics.length, breaching: 0, upserted: 0 });
  }

  let upserted = 0;
  for (let i = 0; i < findings.length; i += INGEST_BATCH) {
    const batch = findings.slice(i, i + INGEST_BATCH);
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/report-ingest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "findings", payload: { findings: batch } }),
    });
    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      console.error("[kpi-watch] report-ingest:", resp.status, detail);
      return json({ error: `report-ingest failed (${resp.status})`, upserted }, 502);
    }
    upserted += batch.length;
  }

  return json({ checked: metrics.length, breaching: findings.length, upserted });
});
```

- [ ] **Step 3: Static-check the function**

Run: `deno check supabase/functions/kpi-watch/index.ts`
Expected: no type errors. (This resolves the remote `std`/`esm.sh` imports the same way `report-ingest` uses them; requires network on first run.) If `deno check` cannot fetch remote types in this environment, fall back to a careful read confirming the file mirrors `report-ingest`'s imports/structure exactly, and note that in the report.

- [ ] **Step 4: Re-run the core tests (ensure the import didn't break the core)**

Run: `deno test supabase/functions/kpi-watch/derive_test.ts`
Expected: PASS (unchanged).

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/kpi-watch/index.ts
git commit -m "feat(kpi-watch): edge function shell (read metric_latest -> report-ingest)

Service-role-auth entry that reads metric_latest, derives breach findings via
derive.ts, and upserts them through the report-ingest seam batched <=50;
no-ops on zero breaches. Mirrors report-ingest's serve/auth/CORS structure."
```

---

## Task 3: The pg_cron schedule (migration)

**Files:**
- Create: `supabase/migrations/20260624000000_kpi_watch_schedule.sql`
- Reference (read, don't modify): `supabase/migrations/20260617001000_connector_schedule.sql` (the exact pattern to mirror)

- [ ] **Step 1: Read the precedent**

Read `20260617001000_connector_schedule.sql`. The new migration mirrors it: `pg_cron` + `pg_net`, `net.http_post` with URL + bearer from `vault.decrypted_secrets`, inert (coalesce to `''` / null URL) until the operator sets the secret.

- [ ] **Step 2: Create the migration**

Create `supabase/migrations/20260624000000_kpi_watch_schedule.sql`:

```sql
-- KPI-watch scheduling: a DAILY pg_cron job invokes the kpi-watch edge fn via pg_net,
-- with URL + service-role key read from Vault (never a readable table). Mirrors the
-- connector-sync pattern (20260617001000_connector_schedule.sql).
--
-- Vault secrets:
--   kpi_watch_url     — the kpi-watch function URL. Set by the operator at deploy:
--                         select vault.create_secret(
--                           'https://<project-ref>.functions.supabase.co/kpi-watch',
--                           'kpi_watch_url', 'KPI-watch edge function URL');
--                       If missing, pg_net drops the null-URL request (inert).
--   service_role_key  — SHARED with connector-sync (same secret name). If connector-sync
--                       already set it, this job reuses it. Otherwise the operator sets it:
--                         select vault.create_secret('<service-role-key>',
--                           'service_role_key', 'Supabase service-role key');
--                       Until set, the scheduled POST is inert (empty Authorization header).
--
-- The edge function and any manual invoke remain fully functional regardless of the cron.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Daily at 13:00 UTC. cron.schedule upserts by job name, so re-applying is safe.
-- Adjust the cron expression per client to run shortly after KPIs are ingested.
select cron.schedule('kpi-watch-daily', '0 13 * * *', $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'kpi_watch_url'),
    headers := jsonb_build_object(
                 'Authorization', 'Bearer ' || coalesce(
                   (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
                   ''
                 ),
                 'Content-Type', 'application/json'),
    body    := '{}'::jsonb
  );
$$);
```

- [ ] **Step 3: Verify (inspection — no DB in this env)**

Confirm the migration mirrors `connector_schedule.sql` exactly except: job name `kpi-watch-daily`, schedule `'0 13 * * *'` (daily, not hourly), and secret name `kpi_watch_url`. Confirm it introduces no readable secret table and that the `service_role_key` secret name matches connector-sync (shared). There is no automated DB test here — the migration is validated on deploy (per CLAUDE.md); applying it live is out of scope for this build.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260624000000_kpi_watch_schedule.sql
git commit -m "feat(kpi-watch): daily pg_cron schedule (mirrors connector-sync)

Schedules kpi-watch-daily to POST the edge fn via pg_net with Vault URL +
shared service_role_key bearer; inert until the operator sets kpi_watch_url.
No readable secret table; reuses connector-sync's service_role_key secret."
```

---

## Done criteria (whole plan)

- [ ] `deno test supabase/functions/kpi-watch/derive_test.ts` passes (all cases, incl. the null unit/target case), output pristine.
- [ ] `supabase/functions/kpi-watch/index.ts` exists, passes `deno check` (or is confirmed by inspection to mirror `report-ingest`), service-role-auths, reads `metric_latest`, derives via `derive.ts`, POSTs to `report-ingest` batched ≤50, and no-ops on zero breaches.
- [ ] `supabase/migrations/20260624000000_kpi_watch_schedule.sql` schedules the daily cron, mirrors connector-sync, and is inert-until-secret-set.
- [ ] No schema change, no UI change, no LLM; reads only `metric_latest`, writes only `findings` via `report-ingest`.
- [ ] The npm gate was **not** run (this change is Deno/SQL only — out of its scope); no files outside `supabase/functions/kpi-watch/` and `supabase/migrations/` changed.
