---
title: Four-Condition Loop Test
type: concept
created: 2026-06-20
updated: 2026-06-20
sources: [.claude/skills/autoresearch/SKILL.md, supabase/migrations/20260617000800_audits.sql, src/lib/audit.ts, website/src/sections/LoopAudit.tsx, docs/PROJECT_CONTEXT.md]
tags: [automation, methodology, loops, autoresearch, audits, framework]
---

# Four-Condition Loop Test

A methodology for deciding **which repeating work to turn into an automation
"loop"** — and which to leave alone. Audit everything done on a cadence, run each
candidate through four conditions, then rank the survivors and build the highest
value-per-effort one first.

It is the task-level sibling of the [[Self-Improving App]] pattern: where
`autoresearch` keeps a *finding* only if it passes an acceptance gate, this keeps a
*task* as a loop candidate only if it passes the four conditions. The framework is
reused across three surfaces — a dev skill, a paid sales deliverable, and (later) an
in-app feature — so it is defined **once, here**.

## The two stages

Selection is **gate, then rank**. The gate decides *whether* a task can be a loop at
all; the ranking decides *which* loopable task to build first.

### Stage 1 — the gate (the four conditions)

A task is a **loop candidate** only if it passes all four:

| # | Condition | Meaning | Maps to (in this repo) |
|---|-----------|---------|------------------------|
| 1 | **Repeats** | Recurs on a predictable cadence (daily / weekly / per-event). Frequency × time-per-run is the prize. | `findings.occurrences`, `metric_snapshots` cadence |
| 2 | **A rule decides "done"** | An objective acceptance check exists — the `val_bpb` analog. If "done" needs human taste/judgment, it is not loop-ready. | the `autoresearch` acceptance gate |
| 3 | **Afford wasted runs** | Failure is cheap and reversible; the loop is advisory or easily reverted, not high-blast-radius. | guardrail design (advisory-only) |
| 4 | **AI has data + tools** | The inputs are reachable and the actions exist as tools/integrations. Locked-away data or a missing API blocks it. | [[AI Tool Registry]], [[Connector Library]] |

Conditions **2 and 4 are hard blockers** — without an objective done-rule or without
the data/tools, a task is *not a loop yet*; record what would unblock it. Conditions
**1 and 3 are scored** strong / partial / weak. Each candidate gets an outcome,
echoing autoresearch's `kept` / `discarded` / `flagged`:

- **`candidate`** — passes all four; proceed to ranking.
- **`blocked`** — fails #2 or #4; record the one thing that would unblock it.
- **`not-a-loop`** — fails #1 or #3 enough that it should stay manual.

### Stage 2 — the ranking (among gate-passers)

Rank candidates with the **same vocabulary as the [[ROI-Discovery Audit]]**
(`audit_opportunities` / `src/lib/audit.ts`), so the scoring is identical whether a
dev, a salesperson, or Aria is running it:

- **`category`**: `hours_saved | revenue_captured | cost_avoided | other`
- **value** = annualized prize (frequency × minutes saved per run), weighted by
  **`confidence`** (`low | med | high`)
- divided by build **`effort`** (`low | med | high`)
- **"build first"** = the highest value-per-effort candidate.

This is the same high-value / low-effort ordering the Opportunity Report already
uses — a loop candidate is just an automation opportunity scored for *loop-ability*
first.

## Why it fits Harbormill

- **Education-first, not a black box.** The test is teachable: an operator can learn
  to spot their own loop candidates rather than be sold an opaque automation. See
  [[Education-First Philosophy]].
- **It reuses seams, it doesn't fork the engine.** Recurrence comes from
  `findings.occurrences`, ranking from the audit scoring, data/tools from the tool
  registry and connectors — consistent with [[Extending AIOS]].
- **It maps to the ladder.** The audit *is* the discovery step of
  [[The Harbormill Ladder]] (the Paid Audit rung): find the loops worth building
  before quoting a Focused Project.

## Three surfaces (one framework)

1. **Dev skill (`loop-audit`)** — audits the Harbormill workspace itself (repo, git
   history, Claude Code transcripts) to decide what dev automation to build next. The
   dogfood; also the tool used to prioritize surfaces 2 and 3. Its condition-#2
   companion is **`validator-forge`** (`.claude/skills/validator-forge/SKILL.md`),
   which analyzes existing capabilities to identify which can become the objective
   validator that unblocks a blocked loop candidate — the forge that turns a
   `blocked` finding into a `candidate`.
2. **Sales deliverable (shipped)** — the 4-Condition Test packaged as a paid "Loop
   Audit": run an in-deck audit in **Loop Audit** mode (`is_loop_audit`), score each
   opportunity against the four conditions, and export a branded build-first
   recommendation via the [[Google Workspace Bridge]]. Operationalizes the
   [[ROI-Discovery Audit]]. Engagement playbook: `docs/loop-audit-playbook.md`. The
   public-facing offer for this engagement is a **Loop Audit section** on the
   [[Marketing Site]] (`#loop-audit`, `website/src/sections/LoopAudit.tsx`) — the
   four-condition method as a teachable 4-card grid, the deliverable, and a Calendly
   CTA.
3. **In-app feature (future)** — [[Aria]] scores a client's recurring work from deck
   signals (`findings.occurrences`, metric cadence, connector activity) and surfaces
   ranked candidates. Deferred until the data contract is known — today it fails
   condition #4 (the per-client task data is not yet ingested).

## See Also

- [[Self-Improving App]]
- [[ROI-Discovery Audit]]
- [[The Harbormill Ladder]]
- [[AI Tool Registry]]
- [[Extending AIOS]]
- [[Marketing Site]]
- [[Harbormill AIOS]]
- Condition-#2 companion skill: `.claude/skills/validator-forge/SKILL.md`
