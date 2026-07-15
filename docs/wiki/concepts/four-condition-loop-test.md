---
title: Four-Condition Loop Test
type: concept
created: 2026-06-20
updated: 2026-07-15
sources: [.claude/skills/autoresearch/SKILL.md, .claude/skills/validator-forge/SKILL.md, supabase/migrations/20260617000800_audits.sql, src/lib/audit.ts, website/src/sections/LoopAudit.tsx, website/src/sections/TrustStrip.tsx, supabase/functions/kpi-watch/index.ts, docs/PROJECT_CONTEXT.md, external:what-actually-matters-in-ai-2026]
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
| 2 | **A rule decides "done"** | An objective acceptance check exists — the `val_bpb` analog. If "done" needs human taste/judgment, it is not loop-ready. | the `autoresearch` gate, run as an independent `loop-verify` subagent |
| 3 | **Afford wasted runs** | Failure is cheap and reversible; the loop is advisory or easily reverted, not high-blast-radius. | guardrail design (advisory-only) |
| 4 | **AI has data + tools** | The inputs are reachable and the actions exist as tools/integrations. Locked-away data or a missing API blocks it. | [[AI Tool Registry]], [[Connector Library]] |

Conditions **2 and 4 are hard blockers** — without an objective done-rule or without
the data/tools, a task is *not a loop yet*; record what would unblock it. Conditions
**1 and 3 are scored** strong / partial / weak. Each candidate gets an outcome,
echoing autoresearch's `kept` / `discarded` / `flagged`:

- **`candidate`** — passes all four; proceed to ranking.
- **`blocked`** — fails #2 or #4; record the one thing that would unblock it.
- **`not-a-loop`** — fails #1 or #3 enough that it should stay manual.

When condition #2's done-rule is an LLM judgment rather than a deterministic check (e.g.
"is this research finding good enough?"), it should run as an **independent, fresh-context
verifier** — a separate subagent that did not produce the work, scoring the output and gating
on a threshold — not the producing agent grading its own homework. The reusable form is the
`loop-verify` skill (`.claude/skills/loop-verify/SKILL.md`); `autoresearch` is its first
adopter. A deterministic comparison (like the [[KPI-Watch Loop]]'s `status != on_track`) needs
no such subagent — it is already objective.

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

## External corroboration (2026-07-15)

The method was arrived at independently, by someone with no exposure to Harbormill. In
[[What Actually Matters in AI Right Now (2026)]], Matt Wolfe describes dictating an unstructured
~20-minute account of his business to a frontier model and getting his work back triaged three
ways: **stop doing it / hand it to a person / let the model do it**. He then connected the model
to his messaging, mail, file storage, and meeting-notes tools so it reviews those surfaces
continuously, points out the work he repeats, and offers to take it over.

Mapped onto this page: that is **condition #1 (repeats)** detected from live surface data, and
an **approve-first action queue** as the guardrail for **condition #3 (afford wasted runs)** —
he approves, rewords, or archives each draft. Notably his setup has **no condition #2** at all:
no objective done-rule, no independent verifier. A human reads every draft. That is a coherent
design — it trades automation for taste — and it is the honest comparison point for Harbormill's
insistence on a validator. Harbormill's claim is not *we thought of this*; it is *we close the
loop where he leaves a human in it.*

Two cautions, recorded so this isn't read as a win:

- **He needed no consultant to build it.** The same evidence corroborating the method threatens
  the business model around it — see the contradiction flag on [[SMB AI-Automation Landscape]].
- **Discovery is the commoditizing half.** His closing advice to an audience of AI agency owners
  was to run that same self-dictated audit themselves. The Loop Audit's *finding* step is now
  free; see [[The Harbormill Ladder]].

## Scope flag: the gate cannot see new capability (2026-07-15)

From [[The Client Didn't Ask for AI (2026)]]. **Observation about this test's boundary — no
change to the gate is proposed, and none should be.**

Amy Simpson's best-paid engagement was a visual quote configurator for a yacht maker
(~$3k grown to ~$10k, then reused as a vertical framework). Run it through this page:

| Condition | Verdict |
|---|---|
| #1 Repeats | **Fails** — nobody was doing this work. The buying experience didn't exist to recur. |
| #2 Rule decides "done" | **Fails** — no objective acceptance check for "a buyer felt confident choosing a hull colour." |
| #3 Afford wasted runs | Passes. |
| #4 AI has data + tools | Passes. |

Outcome: `not-a-loop` on #1, `blocked` on #2. **The Loop Audit could not have proposed it.**

The temptation is to read this as a missing revenue category. It isn't — Stage 2 already scores
`revenue_captured`. The boundary is **upstream, in Stage 1**. Revenue from *automating existing
repeating work* passes the gate cleanly ([[KPI-Watch Loop]] and AR follow-up both do: the work
recurs, and "invoice paid" is a done-rule). Revenue from **capability the business does not yet
have** can never reach the ranking, because there is no recurrence to detect and no done-rule to
write.

**This is the test working as specified.** It is a test for *which repeating work to turn into a
loop*, and it says so in the first line. Loosening #1 or #2 to admit capability work would
destroy the thing that makes a loop a loop — condition #2 is the whole difference between
Harbormill's position and the human-reads-every-draft setup described in
[[What Actually Matters in AI Right Now (2026)]].

The flag is narrower and worth holding: this gate is Harbormill's **only discovery instrument**,
and the [[ROI-Discovery Audit]] is the front door. So the front door is structurally blind to a
category that demonstrably pays — and the blindness is by construction, not by oversight. If
Harbormill ever wants that work, it needs a **second instrument**, not a wider gate. Nothing
here argues that it should; `docs/gtm/case-studies/` is still empty and the source is a
practitioner, not a buyer.

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

**A first in-product loop has shipped** (distinct from surface 3's Aria-scoring
feature): the [[KPI-Watch Loop]] — a deterministic, no-LLM scheduled loop that
watches `metric_latest` and files a finding for any breached KPI. It is the
textbook condition-#2 loop: the `status != on_track` comparison *is* the
validator, so no human taste decides when a run is done. It is live on both
Supabase projects and is the live proof point behind the [[Marketing Site]] trust
strip.

## See Also

- [[Self-Improving App]]
- [[Independent Verification]]
- [[Loop Memory]]
- [[ROI-Discovery Audit]]
- [[The Harbormill Ladder]]
- [[AI Tool Registry]]
- [[Extending AIOS]]
- [[Marketing Site]]
- [[Harbormill AIOS]]
- [[KPI-Watch Loop]]
- [[SMB AI-Automation Landscape]]
- [[What Actually Matters in AI Right Now (2026)]]
- [[The Client Didn't Ask for AI (2026)]]
- Condition-#2 companion skill: `.claude/skills/validator-forge/SKILL.md`
- Independent condition-#2 verifier skill: `.claude/skills/loop-verify/SKILL.md`
