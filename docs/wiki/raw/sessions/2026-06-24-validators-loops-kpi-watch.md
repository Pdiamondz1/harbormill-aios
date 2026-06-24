# Session extract — 2026-06-24 — Validators → Loops → KPI-watch

Raw, immutable session record. Captures the work; the structured knowledge is
ingested into `docs/wiki/` pages (see the session-end log entry of the same date).

## Origin

The session began from a user-shared slide whose prompt was: *"Analyze my
existing skills and tell me how some could potentially be tweaked to become
validators to allow me to create loops."* We mapped that prompt onto three
Harbormill surfaces and shipped all three plus a productized in-app loop:

- **A — dev-side method:** the `validator-forge` skill.
- **(loop A recommended):** the `wiki-gardener` maintenance loop.
- **(loop A surfaced):** the Harbormill Ladder rung-numbering contradiction → fixed.
- **B — marketing site:** a trust differentiator strip on harbormill.net.
- **C — in-product loop:** the `kpi-watch` scheduled, unattended, no-LLM loop.

The thread connecting all five: condition #2 of the [[Four-Condition Loop Test]]
("a rule decides 'done'") **is** a validator. A loop is only safe to run
unattended when an objective rule — not human taste — decides when each run is
finished. Everything shipped this session is an application of that single idea.

## What was built or fixed

### 1. `validator-forge` skill (PR #23)

A loop-audit sibling advisory skill (`.claude/skills/validator-forge/SKILL.md`).
It analyzes existing capabilities (skills, scripts, checks) and classifies each
by whether it can serve as the **objective validator** that unblocks a *blocked*
loop candidate (one that fails condition #2 of the Four-Condition Loop Test).

- Verdicts: **`validator`** (already an objective done-rule), **`forgeable`**
  (could become one with a small tweak), **`taste-bound`** (decides "done" only
  by human judgment — not forgeable without changing what it does).
- It does not build loops; it emits a buildable, ranked spec for the loop a
  forged validator would unblock.
- Important clarification baked into the skill: **crediting an existing
  validator ≠ leaving its loop unbuilt.** A capability that already qualifies as
  a validator still implies an unbuilt loop worth proposing.
- Dogfood outputs: `docs/validator-forge/2026-06-23-validator-forge.md` and
  `2026-06-23-wiki-gardener-loop.proposal.md`. The forge's own build-first pick
  was the wiki-gardener loop.

### 2. `wiki-gardener` loop (PR #24)

The maintenance counterpart to `autoresearch`
(`.claude/skills/wiki-gardener/SKILL.md`). Where autoresearch *grows* the wiki,
wiki-gardener *prunes and validates* it, using `wiki-ops lint` as its objective
done-rule (so it passes condition #2). It splits findings into:

- **Auto-fixable:** typo/duplicate wikilinks, missing index entries, missing
  cross-references (one-way See-Also edges where a page's own prose names a
  *material* relationship its See Also omits).
- **Human-gated:** contradictions, stale claims, thin/single-source coverage
  (→ autoresearch handoff), orphan/missing-concept pages.

**Bug found and fixed during the dogfood run (critical):** the first run
classified ~85 one-way See-Also edges as human-gated and produced **0**
auto-fixes — it under-reached. The reviewer traced the spec's real trigger (a
page's own prose names a page absent from its own See Also) and found ~42 genuine
matches, including `roi-discovery-audit → four-condition-loop-test`. Fix: clarify
the "missing cross-references" class in both SKILL.md and the spec, then re-run.
The corrected run applied **3** real, clear-cut cross-reference fixes (one commit
each, page-only):
- ROI-Discovery Audit → Four-Condition Loop Test
- Connector Library → AI Tool Registry
- Report-Ingest Seam → White-Label Architecture

The boundary held on the rest (incidental/parenthetical mentions and deliberate
hub spokes stayed human-gated). Lesson: an auto-fix class definition must name
its trigger precisely enough that a fresh agent applies it the same way — "looks
related" is not a rule; "prose names a material relationship the page's own See
Also omits" is.

### 3. Harbormill Ladder rung-numbering fix (PR #25)

The wiki-gardener run surfaced a real internal contradiction on
[[The Harbormill Ladder]]: the main list numbered tiers **1–4** ("1. Get
started … 4. Retainer") but the "Flag" section used **0–3** ("Rungs 1–3 are
fixed-scope; Rung 0 is hourly") — "Get started" was Rung 1 in the list yet Rung 0
in the Flag (off-by-one). Canonical source `docs/PROJECT_CONTEXT.md` §8 numbers
the ladder 1–4, so the main list was canonical; the Flag wording was the outlier
and was aligned to "Rungs 2–4 are scoped engagements; Rung 1 (Get started) is
hourly." Human-directed (Damon), per the never-overwrite rule.

### 4. harbormill.net trust strip (PR #26)

A trust differentiator strip on the marketing site
(`website/src/sections/TrustStrip.tsx`, content in
`website/src/config/site.ts` under `site.trust`, mounted in `website/src/App.tsx`
between `<LoopAudit />` and `<About />`). It states the loop-trust thesis at
**"principle altitude"** — plain language, no internal jargon ("Loop Test",
"condition #2", "validator"):

- eyebrow: *"Why it's safe to automate"*
- title: *"Automation you can leave running"*
- body: black-box automation is unnerving because you can't tell when it's
  quietly gone wrong; so Harbormill only builds automation where a clear rule
  decides when the job is done and a wrong run is cheap to undo — that's what
  makes it safe to leave running unwatched. *"It's the same discipline we run on
  our own systems: loops that check their own work against a rule, fix what they
  safely can, and flag the rest for a human. We don't sell a black box we
  wouldn't run ourselves."*

The self-proof ("the same discipline we run on our own systems") is exactly what
`wiki-gardener` and `kpi-watch` are — the strip is honest because those loops
exist.

**Spec bug found and fixed (issues-found):** the spec said insert "after Loop
Audit AND before the Ladder" — impossible, since the real `App.tsx` order is
Ladder → LoopAudit → About. Corrected to insert between `<LoopAudit />` and
`<About />`; re-reviewed → approved.

### 5. `kpi-watch` in-product loop (PR #27) + deployed to both projects

A scheduled, unattended, **deterministic (no LLM)** loop in
`supabase/functions/kpi-watch/`. It is the in-product embodiment of the
Four-Condition Loop Test and the live proof point behind the trust strip.

- **Pure core** (`derive.ts`): `deriveBreachFindings(metrics: MetricRow[]):
  FindingPayload[]`. For any KPI whose `status` is `at_risk` or `off_track` it
  emits a finding — severity `off_track → high`, `at_risk → medium`; title
  `KPI {off target|at risk}: {label}`; fingerprint `kpi-breach:{key}`; source
  `kpi-watch`. Null-guards `unit`/`target` (clean summary, evidence omits null
  fields). Import-free, unit-tested in isolation — **8/8 deno tests**.
- **Shell** (`index.ts`): exact-bearer service-role auth (mirrors report-ingest,
  prevents substring bypass), reads the `metric_latest` view, calls the pure
  core, POSTs `{ type:"findings", payload:{ findings } }` to `report-ingest`
  batched ≤50, no-ops on zero, returns `{ checked, breaching, upserted }`.
- **Schedule** (`20260624000000_kpi_watch_schedule.sql`): pg_cron job
  `kpi-watch-daily` at `0 13 * * *`, invoking the function via `pg_net`
  `net.http_post` with the URL + service-role key read from **Vault**
  (`kpi_watch_url`, `service_role_key` — the latter shared with connector-sync).
  Mirrors the `connector-sync` cron pattern exactly. Re-applying is safe
  (`cron.schedule` upserts by job name); the function and any manual invoke work
  regardless of the cron.

**Why it passes the Four-Condition Loop Test cleanly:**
1. *Repeats* — daily cron.
2. *A rule decides "done"* — `status != on_track` is the objective validator; no
   taste involved. This is condition #2 satisfied by construction.
3. *Afford wasted runs* — advisory findings, idempotent (fingerprint upsert +
   reopen-on-recurrence via the existing seam), reversible.
4. *AI has data + tools* — reads `metric_latest`, writes only via the
   [[Report-Ingest Seam]]. Zero AI spend (no model call at all).

**Deployment (both Supabase projects):**
- `harbormill-aios-demo`: function ACTIVE, cron live (`0 13 * * *`), live invoke
  `200`, **4 findings filed** (the demo seed data has breaching KPIs).
- `harbormill-aios` (`znkoxpwvocxxvrvajmza`): function ACTIVE (identical
  `ezbr_sha256`), cron live, live invoke `200` → `{checked:2, breaching:0,
  upserted:0}` — a **correct clean no-op** (only 2 KPIs, none breaching), which
  still exercises the full path and proves the function runs.

**Secret-handling discipline (security):** the service-role key value was never
handled by the assistant — it lives encrypted in Vault and is read by `pg_net`
inside the database at cron time. The assistant only read the non-sensitive
`kpi_watch_url`. This also resolved an earlier mystery: the user's SQL-editor
`vault.create_secret('…/kpi-watch', 'kpi_watch_url', …)` had actually landed on
`harbormill-aios` (correct), not the demo — which is why the demo initially had
no URL set.

## Key decisions and why

- **Sequence A → B → C, dogfood first.** Build the dev-side validator method
  first, let it recommend a real loop (wiki-gardener), build that, *then* put the
  claim on the website, *then* ship the in-product version. The marketing claim
  ("we run these loops on our own systems") is only honest once the loops exist —
  the order enforces the honesty.
- **`kpi-watch` is deterministic, not an Aria feature.** The Four-Condition Loop
  Test page lists a *future* in-app surface where Aria scores a client's
  recurring work. `kpi-watch` is **not** that — it's a separate, simpler, no-LLM
  loop. Keeping it LLM-free makes it cheap, auditable, and a textbook condition-#2
  loop. The Aria-scoring surface remains future (still blocked on the per-client
  task-data contract — condition #4).
- **Reuse the connector-sync pattern wholesale** for kpi-watch's schedule (pg_cron
  + pg_net + Vault, shared `service_role_key`), rather than inventing a new
  scheduling seam. One scheduling idiom for all in-template loops.
- **Trust strip at "principle altitude."** No internal vocabulary on the public
  page — the visitor gets the *principle* (a rule decides done; a wrong run is
  cheap to undo), not the framework name. Consistent with the existing rule that
  "Rung" is client-invisible.
- **Fold validator-forge and wiki-gardener into existing concept pages**
  (Four-Condition Loop Test, Self-Improving App) rather than minting thin new
  pages — compound, don't duplicate.

## Patterns / learnings worth preserving

- **A loop = a validator + a cadence + cheap failure + reachable data/tools.**
  The whole session is one idea applied five ways. The scarce ingredient is
  almost always the validator (condition #2); `validator-forge` is the tool for
  manufacturing it.
- **Auto-fix rules need a precise trigger, or an agent under-reaches.** The
  wiki-gardener dogfood bug is the cautionary tale: "fix missing cross-references"
  was too vague and produced zero fixes until the trigger was pinned to "prose
  names a material relationship the page's own See Also omits."
- **A clean no-op is a valid, valuable verification.** kpi-watch returning
  `{breaching:0}` on the production deck is *correct behavior* and still proves
  the function, its dependencies, and its auth all work. Don't mistake "filed
  nothing" for "didn't run."
- **Keep secrets in the database.** Invoking via pg_net + Vault means the
  service-role key never transits the assistant — the right pattern for any
  scheduled service-role loop.
