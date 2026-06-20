---
name: loop-audit
description: "Audit the Harbormill workspace and conversation history for repeating work, score each candidate with the Four-Condition Loop Test, rank the survivors, and recommend which automation 'loop' to build first. Use for '/loop-audit', 'audit my workspace for loops', 'what should I automate next', or 'find loop candidates'. Advisory only — it proposes loops, it never builds them. The dev-side surface of the [[Four-Condition Loop Test]]."
---

# Loop Audit

Decide **what to automate next** by auditing the Harbormill workspace itself — the
repo, its git history, and this Claude Code conversation history — for work that
repeats, then scoring each candidate against the **Four-Condition Loop Test** and
ranking the survivors.

This is the **dev-side surface** of one shared framework. Read the canonical
definition first: `docs/wiki/concepts/four-condition-loop-test.md`
([[Four-Condition Loop Test]]). This skill applies that gate/rank to *Harbormill's own
dev work*; the same framework also powers a paid "Loop Audit" deliverable and a future
in-app Aria feature.

It is a sibling of the `autoresearch` skill (`.claude/skills/autoresearch/SKILL.md`):
where autoresearch keeps a *knowledge finding* if it passes an acceptance gate, this
keeps a *task* as a loop candidate if it passes the four conditions. **Mirror
autoresearch's posture** — bounded, ledgered, advisory, no metered spend.

## The framework, in one screen

**Stage 1 — the gate (all four required):**

1. **Repeats** — recurs on a predictable cadence; frequency × time-per-run = the prize. *(scored: strong/partial/weak)*
2. **A rule decides "done"** — an objective acceptance check exists; if "done" needs human taste, it is not loop-ready. ***(hard blocker)***
3. **Afford wasted runs** — failure is cheap and reversible; advisory or easily reverted, not high-blast-radius. *(scored: strong/partial/weak)*
4. **AI has data + tools** — inputs are reachable and the actions exist as tools/integrations. ***(hard blocker)***

Per-candidate outcome (echoes autoresearch's `kept`/`discarded`/`flagged`):
- **`candidate`** — passes all four → rank it.
- **`blocked`** — fails #2 or #4 → record the one thing that would unblock it.
- **`not-a-loop`** — fails #1 or #3 → leave it manual.

**Stage 2 — the rank (gate-passers only),** using the [[ROI-Discovery Audit]]
vocabulary (`src/lib/audit.ts`, `audit_opportunities`):
- `category`: `hours_saved | revenue_captured | cost_avoided | other`
- value = annualized prize (frequency × minutes saved per run) weighted by `confidence` (`low|med|high`)
- ÷ build `effort` (`low|med|high`)
- **build first = highest value-per-effort.**

## What to audit (data sources — all read-only)

Both internal source types are in scope on every run:

1. **The repo** (Glob / Grep / Read) — to find repeating handwork *and to avoid
   recommending automation that already exists*:
   - existing automations: `.claude/skills/` (esp. `autoresearch`, `wiki-ops`),
     `package.json` scripts, `supabase/functions/`, and pg_cron jobs in
     `supabase/migrations/` (e.g. `connector-sync`). **Never propose a loop that
     duplicates one of these.**
   - docs and process: `docs/`, `CLAUDE.md`, `docs/PROJECT_CONTEXT.md`.
2. **Git history** — recurring manual commit patterns that signal repeated handwork
   (e.g. repeated `docs(wiki)`, `chore`, hand-edited seed/config). Use read-only git
   log inspection.
3. **Conversation history** (the slide's explicit input) — Claude Code transcripts
   under `C:\Users\dwill\.claude\projects\C--GIT-harbormill-aios\`. Grep for recurring
   *request shapes*: what Damon repeatedly asks Claude to do. Recurrence here is the
   strongest condition-#1 evidence — it is observed, not assumed.

## `/loop-audit` — one pass (default)

1. **Enumerate** repeating tasks from all three sources above. Dedupe; describe each
   in one line (the task, its cadence, its rough time-per-run).
2. **Gate** each task against the four conditions → `candidate` / `blocked` /
   `not-a-loop`, with a one-line reason. Note the unblock step for every `blocked`.
3. **Rank** the `candidate`s by value-per-effort (Stage 2 vocabulary).
4. **Recommend the single first build** — name it and explain *why it wins the
   ranking* (cite which conditions it passes strongly and its value/effort).
5. **Persist** a dated report to `docs/loop-audits/YYYY-MM-DD-loop-audit.md` (create
   the folder if absent) using the report format below, and present the ranked table +
   recommendation in-session.

## `/loop-audit loop [N]` — bounded refine (optional)

A small bounded re-audit (default `N=3`) that re-runs the pass and refines the ranking
as new evidence accrues (e.g. more transcript history). Autonomous *within* the budget,
then stops and summarizes — same "NEVER STOP mid-budget, but bounded by N" rule as
autoresearch. **YAGNI:** only reach for this if the one-pass output is unstable run to
run; otherwise a single pass is the product.

## Report format (the persisted artifact)

`docs/loop-audits/YYYY-MM-DD-loop-audit.md`:

```
# Loop Audit — YYYY-MM-DD

Sources audited: <repo paths / git range / transcript scope>
Tasks enumerated: <n>   Candidates: <n>   Blocked: <n>   Not-a-loop: <n>

## Recommended first build
<name> — <one paragraph: why it wins on value-per-effort and which conditions it passes strongly>

## Ranked candidates
| Rank | Task | Category | Value (annualized) | Confidence | Effort | Why first / why not |
|------|------|----------|--------------------|------------|--------|---------------------|
| 1 | … | hours_saved | … | high | low | … |

## Ledger (every task, including blocked / not-a-loop)
### <task name>
Outcome: candidate | blocked | not-a-loop
Gate: repeats=<strong/partial/weak> · rule-decides-done=<yes/no> · afford-wasted=<strong/partial/weak> · has-data+tools=<yes/no>
Note: <one line — for `blocked`, the single unblock step; otherwise why>
```

## Hard guardrails (mirror autoresearch)

- **Advisory only.** This skill *recommends* loops; it **never** builds one, and never
  edits app code, schema, RLS, or auth. A recommended loop is a proposal for human
  action — consistent with "customize in the config/data seams, don't fork the shared
  engine." Its **only** write is the report under `docs/loop-audits/`.
- **No metered/client spend.** Runs in the local Claude Code session, not through any
  client edge function or AI key. The `loop N` budget bounds cost.
- **Read-only against transcripts and git history.** Never modify the transcript
  store; use read-only git inspection.
- **Don't duplicate existing automation.** If a task is already handled by a skill,
  npm script, or pg_cron job, mark it `not-a-loop` with a pointer to the existing
  automation — never re-recommend it.

## Relationship to the other surfaces

The Four-Condition Loop Test is defined once in
`docs/wiki/concepts/four-condition-loop-test.md` and reused by three surfaces. This
skill is **Phase 1** (dev dogfood). The other two — a paid **Loop Audit** sales
deliverable (reusing the [[ROI-Discovery Audit]] page + Google Doc export) and an
**in-app Aria feature** (scoring client work from deck signals via the
[[Report-Ingest Seam]]) — are on the roadmap and should be specced *after* this skill
has run, since its output informs which signals actually predict good loops.
