---
name: autoresearch
description: "Autonomous research loop that grows the Harbormill AIOS wiki (and, later, Aria's knowledge base). Use for '/autoresearch', 'research <topic> into the wiki', or 'run autoresearch loop'. On-demand mode researches one topic (web + repo), verifies it, and files a wiki page. Loop mode auto-detects wiki gaps and researches them until a budget is spent. Foundation of the self-improving 'smart app' architecture. Uses the built-in deep-research skill for web research — no Exa."
---

# Autoresearch

An autonomous research loop that improves the Harbormill knowledge base over time.
It is a domain-swap of Andrej Karpathy's `autoresearch` pattern (`autoresearch/program.md`
in this repo, MIT-licensed) — Karpathy himself calls that file "essentially a super
lightweight skill."

Karpathy's loop edits `train.py` to lower `val_bpb`. **This loop researches a knowledge gap,
verifies it, and ingests it into the wiki** at `docs/wiki/`. The wiki is the artifact that
improves each iteration, the way the model improves in his version.

This skill **orchestrates two existing skills** — do not reimplement them:
- **`deep-research`** — the built-in deep-research harness: fan-out web search, fetch sources,
  adversarial claim verification, cited synthesis. (This replaces the old Exa `search` skill —
  no external account needed.)
- **`wiki-ops`** — the 8-step ingest flow, query, and lint over `docs/wiki/`. Read its skill and
  `docs/KNOWLEDGE_WIKI.md` before writing pages.

Read `docs/wiki/index.md` **and `docs/wiki/memory.md`** before any run — `index.md` so you know
what already exists ("compound, don't duplicate"), and `memory.md` for the lessons carried from
prior runs (what to avoid, open flags to skip, what to try next). See **Loop memory** below.

## Research domains

Every finding is one of three domains — classify it, because it routes to a different wiki bucket:

| Domain | Typical sources | Wiki home |
|--------|-----------------|-----------|
| **technical / architecture** | repo: `src/`, `supabase/functions/`, `supabase/migrations/`, `docs/` | `entities/`, `concepts/` |
| **competitive / market** | external web (rivals, market data, benchmarks) | `sources/`, `analyses/` |
| **business / strategy / KPI** | internal strategy docs (`docs/PROJECT_CONTEXT.md`, the docs guides) + external benchmarks | `analyses/`, `concepts/` |

Both source types are in scope on every run: external web (via `deep-research`) **and** internal
repo/docs mining (Grep/Glob/Read).

## The acceptance gate (the `val_bpb` analog)

Karpathy keeps a change only if `val_bpb` improved. Here, a finding is **kept** only if it
passes an **independent verifier** (next section) — never on the producing agent's own say-so.
The verifier scores the candidate **1-10** against these criteria, and the outcome maps to the
ledger:

1. **Fills a real gap** — not already covered by an existing page (check `index.md` first).
   → verifier *gap_fit*.
2. **Verified** — backed by **≥2 independent external sources**, *or* grounded directly in repo
   code/docs with concrete file paths the verifier can open. → verifier *sourcing* (a gating floor).
3. **Non-contradictory** — or the contradiction with an existing page is **explicitly flagged**
   (never silently overwrite — wiki rule). → verifier *accuracy* + the verdict's `contradiction`.

- **`kept`** — verifier returns `verdict: pass` (`score >= 8`, sourcing & accuracy floors met)
  and `contradiction: none`. Only `kept` findings produce a wiki page.
- **`flagged`** — verifier names a contradiction to resolve (surfaced for a human, never merged).
- **`discarded`** — verifier returns `verdict: fail` (below threshold, or a floor tripped).

This independent gate is what stops the loop from grading its own homework and polluting the wiki.

## Independent verification (the verifier subagent)

The gate is applied by a **separate subagent with a fresh context window** — *not* the agent that
did the research — via the **`loop-verify`** skill (`.claude/skills/loop-verify/SKILL.md`). This
is distinct from `deep-research`'s adversarial checks, which run *during* production; this is the
*final, independent* gate on the assembled page.

After research assembles a candidate page, **dispatch the verifier with the Agent tool**
(`subagent_type: Explore`), passing it **only**: the candidate page, the target gap, and the
titles + one-line excerpts of related existing pages (so it can check redundancy/contradiction).
**Do not pass your research transcript or your argument for the page** — withholding it is what
keeps the verification independent. The subagent re-checks the cited sources/paths itself and
returns a `VERDICT` block (`score` 1-10, `verdict` pass/fail, `contradiction`, per-criterion
scores, one-line `rationale`). Default threshold **`MIN_SCORE = 8`** (tunable). Read `loop-verify`
for the rubric, floors, and schema; then ingest / flag / discard per the mapping above and record
the score in the ledger.

## `/autoresearch <topic>` — on-demand (one pass)

1. **Scope** the topic and classify its domain.
2. **Gather** from both source types:
   - External: invoke `deep-research` (web search → fetch → adversarial verify → cited synthesis).
   - Internal: Grep/Glob/Read over `src/`, `supabase/functions/`, `supabase/migrations/`, `docs/`.
3. **Verify (independent gate)**: dispatch the **`loop-verify`** subagent (Agent tool,
   `subagent_type: Explore`, fresh context) on the candidate; parse its `VERDICT` →
   `kept` / `flagged` / `discarded` per the mapping above. Pass only the artifact + gap +
   related-page titles — never your research transcript.
4. **Ingest** (if `kept`): follow the wiki-ops 8-step ingest flow — write the page into the correct
   bucket with valid frontmatter (`title`, `type`, `created`, `updated`, `sources`, `tags`), add
   `[[wikilinks]]` and a `## See Also`, update `index.md` (alphabetical), and append to `log.md`.
5. **Write the run's two records** — (a) append the outcome to `docs/wiki/log.md` (ledger format
   below; includes discards/flags, which produce no page but are still recorded), and
   (b) **update `docs/wiki/memory.md`** with this run's distilled lesson — what worked / failed,
   any new open flag, what to try next — pruning stale lines. See **Loop memory** below.

## `/autoresearch loop [N]` — autonomous (Karpathy adaptation)

**Setup:** confirm scope and set an **iteration budget** `N` (default 8; `loop 20` overrides). The
loop is autonomous *within* the budget, then stops and summarizes. The budget is the cost bound.

**LOOP** (until budget exhausted or the user interrupts):

1. Run the wiki-ops **`lint`** check. Rank gaps: missing concept pages referenced by `[[wikilinks]]`,
   orphan pages, thin/single-source coverage, stale claims.
2. Pick the highest-value gap as this iteration's "experiment" — **steered by `memory.md`**: skip
   its "avoid / dead-end" gaps, honor its "Open flags" (don't re-research), prefer its "Try next".
3. Research it (web + repo, exactly as on-demand).
4. Apply the gate via the **independent `loop-verify` subagent** (fresh context, scores 1-10,
   threshold 8) → `kept` / `discarded` / `flagged`.
5. If `kept`, ingest via wiki-ops; else record the reason. Append a ledger line to `log.md`,
   **and update `memory.md`** with this iteration's distilled lesson (pruned, bounded).
6. **Do not pause to ask permission mid-budget** (Karpathy's "NEVER STOP" — but bounded by `N`).

**On exhaustion:** print a results summary — gaps closed, pages created/updated, items flagged,
iterations spent — and ensure `memory.md` reflects the run's net lessons (what worked/failed,
open flags carried forward, what to try next).

## Results ledger (the `results.tsv` analog)

Every iteration — kept, discarded, or flagged — appends to `docs/wiki/log.md`. The `Score`
line is the **independent verifier's** number, which makes every iteration's done-decision
auditable:

```
## [YYYY-MM-DD] autoresearch | <gap or topic>
Status: kept | discarded | flagged
Score: <n>/10 (threshold 8)
Domain: technical | competitive | strategy
Sources: <urls / file paths used>
Pages created: [[Page]]   (omit if none)
Pages updated: [[Page]]   (omit if none)
Note: <verifier's one-line rationale — why kept / discarded / flagged>
```

## Loop memory (lessons learned)

The loop writes **two records every run**: (1) the **Output** — the wiki page(s) it produced via
the wiki-ops ingest flow — and (2) **`docs/wiki/memory.md`**, a curated, forward-carrying record
of *what worked, what failed, and what to remember next run*. `memory.md` is what makes the loop
**learn over time** instead of re-discovering the same dead-ends each run.

Keep `memory.md` and `log.md` distinct:
- **`log.md`** = the **append-only audit** (the `results.tsv` analog): one raw row per iteration,
  never pruned. Answers *"what happened, when."*
- **`memory.md`** = the **distilled lessons**, rewritten and **pruned each run**, bounded (~60
  lines). Answers *"what should the next run do differently."* Sections: *What works*,
  *What fails / avoid*, *Open flags — don't re-research*, *Well-covered*, *Try next*.

**Protocol:**
- **Read** `memory.md` at the **start** of every run (with `index.md`) and let it steer gap
  selection — skip "avoid / dead-end" gaps, honor "Open flags", prefer "Try next".
- **Update** `memory.md` at the **end** of every run / iteration: fold in the run's lesson, add
  any new open flag, set "Try next", and **prune** stale or resolved lines so it stays bounded.

Operational file like `log.md`: no frontmatter, never ingested into Aria's RAG, never in
`index.md`. (The same memory convention is available to other loops, e.g. `wiki-gardener`, which
would keep its own `memory.md`-style lessons — not wired yet.)

## `/autoresearch sync-aria` — teach the assistant (Phase 2, future)

Pushes verified wiki knowledge into the AIOS knowledge base so [[Aria]] reasons over it — the second
learner on the same loop. Aria retrieves it through her existing `search_knowledge` tool; no
retrieval change is needed.

- **Scope:** only `concepts/`, `entities/`, `analyses/`. **Never** `raw/`, `sources/`, session pages,
  `index.md`, `log.md`, or `memory.md` (too granular/noisy/operational for retrieval).
- **How (adapt before enabling):** for each in-scope page, push `{ title, content, path, tags }` into
  the knowledge base via the **`knowledge-sync`** edge function (`supabase/functions/knowledge-sync`),
  which embeds with OpenAI and upserts idempotently. **Verify that function's exact input contract,
  auth (service-role), and target table before running** — do not assume the DragonCandy
  `donny-knowledge-sync` shape; this repo's function may differ.
- **Target:** default to a non-production/client-test environment first; promote only after verifying
  Aria retrieves wiki knowledge correctly. Never commit a key.

This is the **only** place the loop writes outside `docs/wiki/`, and it writes **only** through the
gated `knowledge-sync` edge function — never app code, schema, or other tables.

## Hard guardrails

- **Writes only to `docs/wiki/`.** Never edit app code, schema, RLS, or auth. Never touch
  `docs/wiki/raw/` (immutable sources). A code or bug-fix idea is written as a wiki *proposal*
  page for human review — consistent with "customize in the config/data seams, don't fork the engine."
- **No metered/client spend.** This runs in the user's Claude Code session, not through a client's
  edge functions or AI keys. The iteration budget bounds cost.
- **Flag, don't overwrite.** Contradictions are surfaced explicitly, never silently resolved.
- **Flags stay in the wiki — do not fold them into codebase docs.** When the loop surfaces an
  *empirical* claim about code or data (a possible bug, schema-vs-reality mismatch, migration drift,
  or "schema-only" feature), record it as a **wiki flag** on the relevant page and **verify it**
  (live DB via the Supabase MCP, repo via Grep). Resolve/reclassify the flag **in place** on the wiki
  page — never edit `CLAUDE.md`, `PROJECT_CONTEXT.md`, or other codebase docs to assert a finding that
  hasn't been confirmed, and never write a code fix from this loop (that is a separate, human-gated,
  non-wiki change). The *only* exception is an **editorial** ambiguity in a human-owned strategy doc
  (e.g. an unstated unit or scope) — those may be folded into that doc, and only after the human
  decides. Empirical → verify in the wiki; editorial → human decides, then fold.

## Roadmap (recorded in `docs/wiki/concepts/self-improving-app.md`)

- **Phase 1 (now):** this loop → grows the wiki across the three domains.
- **Phase 2 — Aria learns:** `sync-aria` mode pushes verified pages into the AIOS knowledge base
  (RAG via OpenAI embeddings, behind `knowledge-sync`) — dual output, one loop: wiki for humans,
  Aria's RAG store for the product. Adapt to this repo's `knowledge-sync` contract first.
- **Phase 3 — telemetry→wiki bridge:** real signals (`findings` from the report-ingest seam,
  edge-function/error logs, Supabase advisors) drive gap detection — "learn about issues from usage."
- **Phase 4 — fix proposals:** verified-issue remediation specs / draft PRs, human-gated, never auto-merged.
- **Phase 5 — KPI/briefing autopilot:** maintain a living strategy/KPI page against the deck's
  `metric_snapshots` and `briefings`; flag when a target slips.
