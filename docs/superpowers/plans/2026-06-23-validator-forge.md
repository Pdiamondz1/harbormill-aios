# validator-forge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `validator-forge`, an advisory Claude Code skill that analyzes Harbormill's existing skills for "validator" potential (the objective rule that decides "done"), ranks the forgeable ones by value-per-effort, and emits a buildable loop proposal for the top pick.

**Architecture:** A single prose `SKILL.md` under `.claude/skills/validator-forge/`, modeled structurally on its sibling `.claude/skills/loop-audit/SKILL.md`. It is auto-discovered by Claude Code (creating the file is the only "install" step — no registry edit). It writes only to `docs/validator-forge/`. It is the condition-#2 surface of the Four-Condition Loop Test: where `loop-audit` gates *tasks*, this analyzes *capabilities* for the "a rule decides done" condition specifically.

**Tech Stack:** Markdown only. No application code, no schema, no edge functions. The repo's app gate (`npm run typecheck/lint/build/test`) does **not** apply to this docs-only change.

**Testing approach (read this — it replaces unit tests):** A skill is agent instructions, not code; its siblings have no automated tests. Verification here is two-part:
1. **Structural checks** on `SKILL.md` — valid frontmatter, required sections, guardrails present, no contradiction with the advisory-only posture. Done with the Grep tool against named patterns.
2. **Dogfood acceptance run** (Task 2) — actually invoke `/validator-forge` and verify the produced report + proposal satisfy the spec's §10 success criteria. This is the genuine acceptance gate.

**Spec:** `docs/superpowers/specs/2026-06-23-validator-forge-design.md` (read it before starting — it is the source of truth; this plan implements it).

**Worktree:** Execute in the current worktree `hma-prod4` (`C:\GIT\harbormill-aios\.claude\worktrees\hma-prod4`). Do not `cd` to the original repo root.

**Commit convention:** All commits end with the repo trailer:
```
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PXhzcUxRqNEX5nbVkjKc5p
```
(Commit messages shown below omit the trailer for brevity — append it to each.)

---

## File Structure

| File | Responsibility | Task |
|------|----------------|------|
| `.claude/skills/validator-forge/SKILL.md` | **The deliverable** — the skill's instructions: the validator lens, the one-pass flow, output formats, the wiki-gardener worked example, guardrails. | 1 |
| `docs/validator-forge/2026-06-23-validator-forge.md` | Produced *by running the skill* in Task 2 — the inaugural report (proof artifact). | 2 |
| `docs/validator-forge/2026-06-23-wiki-gardener-loop.proposal.md` | Produced *by running the skill* in Task 2 — the emitted top-pick loop proposal. | 2 |
| `docs/wiki/concepts/four-condition-loop-test.md` | Modify — add `validator-forge` as the condition-#2 companion skill (See Also + one line). Discoverability / no-orphan. | 3 |
| `docs/wiki/concepts/self-improving-app.md` | Modify — one line noting the wiki-gardener maintenance loop that this skill emits. | 3 |

---

## Task 1: Author the `validator-forge` skill

**Files:**
- Create: `.claude/skills/validator-forge/SKILL.md`
- Reference (read, do not modify): `.claude/skills/loop-audit/SKILL.md` (structural model), `docs/superpowers/specs/2026-06-23-validator-forge-design.md` (source of truth)

- [ ] **Step 1: Read the model and the spec**

Read `.claude/skills/loop-audit/SKILL.md` in full (the sibling whose structure, tone, and guardrail wording this mirrors) and re-read the spec. The skill below must not contradict either.

- [ ] **Step 2: Create the skill file with this exact content**

Create `.claude/skills/validator-forge/SKILL.md`:

````markdown
---
name: validator-forge
description: "Analyze Harbormill's existing skills/capabilities for validator potential — which can become the objective 'rule decides done' that closes an automation loop — then rank the forgeable ones by value-per-effort and emit a buildable loop proposal for the top pick. Use for '/validator-forge', 'which skills can become validators', 'what loop can I close next', or 'forge a validator'. Advisory only — it proposes validators and loops, it never builds them. The condition-#2 companion to the [[Four-Condition Loop Test]] and a sibling of loop-audit."
---

# Validator Forge

Decide **which existing capability can become a validator** — the objective rule that
decides "done" — and therefore **unblock a new automation loop**. This is the
condition-#2 surface of the [[Four-Condition Loop Test]]: where `loop-audit` gates
*tasks* on all four conditions, this analyzes *capabilities/skills* for condition #2
specifically (*"a rule decides done"* — the hard blocker most candidate loops die on)
and forges the missing rule.

Read the canonical framework first:
`docs/wiki/concepts/four-condition-loop-test.md` ([[Four-Condition Loop Test]]) — the
validator IS condition #2. Then this skill's design spec:
`docs/superpowers/specs/2026-06-23-validator-forge-design.md`.

It is a sibling of `loop-audit` (`.claude/skills/loop-audit/SKILL.md`) and mirrors the
posture of `autoresearch` (`.claude/skills/autoresearch/SKILL.md`): **bounded, ledgered,
advisory, no metered spend.** Where `autoresearch` keeps a *finding* that passes an
acceptance gate and `loop-audit` keeps a *task* that passes four conditions, this keeps
a *capability* as a `forgeable` validator if a specific tweak gives it an objective
done-rule.

## The validator lens (the method, in one screen)

For each capability, answer four questions:

1. **Generates** — what output does it produce?
2. **Latent check** — is there already an acceptance check inside it (a gate, lint,
   test, threshold)?
3. **Done-rule** — what rule would decide "done" *objectively*, and how strong is it?
   - `machine-checkable` (strong) / `heuristic-but-objective` (partial) /
     `needs-human-taste` (none).
4. **Loop** — what loop would that validator close: *generator → validator →
   iterate-until-done*?

**Verdict** per capability (echoes autoresearch's `kept/discarded/flagged` and
loop-audit's `candidate/blocked/not-a-loop`):

- **`validator`** — already has an objective done-rule. **Credit it and point at it;
  never re-propose.** (The four already in the repo: the `autoresearch` acceptance gate,
  `wiki-ops lint`, the build-and-verification gate (`npm run typecheck/lint/build/test`),
  and `loop-audit`'s own four-condition gate.)
- **`forgeable`** — a **specific, named tweak** converts it into a validator → rank it.
- **`taste-bound`** — "done" needs human judgment; not forgeable. Record the closest
  objective proxy, if any.

## What to analyze (read-only)

- **Primary — the skills in `.claude/skills/`.** Each skill is one unit of
  classification: every skill gets exactly one ledger row with a
  `validator | forgeable | taste-bound` verdict.
- **Secondary — repo-level validator logic that is not a skill** (notably the
  build-and-verification gate). Credit it so you don't re-propose it; it does **not** get
  a per-skill ledger row.

## `/validator-forge` — one pass (the product)

1. **Enumerate** every skill in `.claude/skills/`; note the existing non-skill validators.
2. **Apply the validator lens** to each → verdict + proposed done-rule + one-line
   rationale.
3. **Rank** the `forgeable` set by **value-per-effort**, reusing the [[ROI-Discovery Audit]]
   / loop-audit vocabulary (`category` = `hours_saved | revenue_captured | cost_avoided |
   other`; value = annualized prize weighted by `confidence` (`low|med|high`); ÷ build
   `effort` (`low|med|high`); **build first = highest value-per-effort**).
4. **Emit the top pick as a buildable loop proposal** — generator, validator (the
   done-rule + which output/defect classes gate it), iterate/stop condition, guardrails,
   and the human-gated boundary.
5. **Persist** the report and the proposal (see below), then present the ranked table +
   recommendation in-session.

**No `loop N` mode.** The skill set is small and static; one pass is the product (YAGNI).

## Outputs (the only writes)

1. **Report** → `docs/validator-forge/YYYY-MM-DD-validator-forge.md` (create the folder
   if absent). Format:

```
# Validator Forge — YYYY-MM-DD

Capabilities analyzed: <n>   Validators (existing): <n>   Forgeable: <n>   Taste-bound: <n>

## Recommended first build
<pick> — <one paragraph: the loop it closes, why it wins value-per-effort, the done-rule>

## Ranked forgeable validators
| Rank | Capability | Loop it closes | Done-rule (strength) | Category | Value | Confidence | Effort |
|------|-----------|----------------|----------------------|----------|-------|------------|--------|
| 1 | … | … | … (machine-checkable) | hours_saved | … | high | low |

## Ledger (every skill)
### <skill name>
Verdict: validator | forgeable | taste-bound
Generates: <output>   Latent check: <yes/no — what>
Done-rule: <the objective rule, or why none exists>   Strength: machine-checkable | heuristic | none
Loop: <generator → validator → iterate>  (omit if taste-bound)
Note: <one line — the specific tweak if forgeable; the proxy if taste-bound; the pointer if already a validator>
```

2. **Top build proposal** → `docs/validator-forge/YYYY-MM-DD-<pick>-loop.proposal.md`.
   A **proposal**, deliberately **not** a spec in `docs/superpowers/specs/` (reserved for
   human-approved specs). A human runs `brainstorming` / `writing-plans` on it to build
   the loop. This is what keeps "advisory skills never build" intact.

## The expected first run — the wiki-gardener (worked example)

On the current repo, the lens yields an unambiguous #1: **promote `wiki-ops lint` into a
closed maintenance loop.** `autoresearch` is a *growth* loop (it *adds* verified pages);
nothing *maintains* them. The emitted proposal:

- **Generator:** `wiki-ops` fix/ingest actions. **Validator:** `wiki-ops lint` — "done"
  = zero defects of the *gating* classes. **Loop:** lint → fix highest-severity
  auto-fixable defect → re-lint → repeat until clean or budget `N`.
- **Class split (critical guardrail):**
  - *auto-fixable* (loop may act): orphan `[[wikilinks]]`, missing `index.md` entries,
    missing cross-references.
  - *human-gated* (loop surfaces, never resolves): **contradictions** (stay flagged per
    the wiki's "never silently overwrite" rule); **thin/single-source coverage** (handed
    to `autoresearch`, never invented).
- wiki-gardener is the **maintenance** counterpart to autoresearch's **growth** loop —
  together, the complete self-improving-wiki cycle ([[Self-Improving App]]).

## Relationship to loop-audit (non-redundancy contract)

- `loop-audit` gates *tasks* on **all four** conditions and ranks them.
- `validator-forge` analyzes *capabilities* for **condition #2** and forges the rule.
- **Handoff:** a loop-audit candidate marked `blocked` on #2 is a referral *into* this
  skill; a validator forged here feeds *back* as a high-confidence loop-audit `candidate`.
- Shared scoring vocabulary; shared advisory/ledgered/no-spend posture.

## Hard guardrails (mirror loop-audit / autoresearch)

- **Advisory only.** Writes **only** the report + proposal under `docs/validator-forge/`.
  Never edits app code, schema, RLS, auth, or other skills. Never builds the loop.
- **No metered/client spend.** Runs in the local Claude Code session.
- **Read-only** against skills and repo.
- **Don't duplicate existing validators.** Mark already-objective gates `validator` and
  point at them.
- **One pass is the product** — no `loop N` mode.

## See Also

- [[Four-Condition Loop Test]] — the validator is condition #2
- [[Self-Improving App]] — wiki-gardener completes its growth+maintenance cycle
- `.claude/skills/loop-audit/SKILL.md` — the task-level sibling
- `.claude/skills/autoresearch/SKILL.md` — the proven loop + acceptance gate
- `.claude/skills/wiki-ops/SKILL.md` — `lint` is the wiki-gardener validator
````

- [ ] **Step 3: Verify the structure (the "test")**

Using the Grep tool against `.claude/skills/validator-forge/SKILL.md`, confirm each pattern matches at least once. Expected: **all present**.

| Pattern | Why it matters |
|---|---|
| `^name: validator-forge$` | valid frontmatter name (skill is discoverable) |
| `/validator-forge` | trigger phrase in description |
| `## The validator lens` | the core method section |
| `validator \| forgeable \| taste-bound` (or the three words as headers) | the verdict vocabulary |
| `docs/validator-forge/` | the only write target |
| `Advisory only` | the primary guardrail |
| `No .loop N. mode` / `one pass is the product` | YAGNI guardrail present |
| `wiki-gardener` | the worked example / emitted proposal |
| `Don't duplicate existing validators` | non-duplication guardrail |

- [ ] **Step 4: Verify no posture contradiction**

Confirm the file contains **no** instruction to edit app code, schema, RLS, auth, or other skills, and no instruction to *build* a loop. The guardrails section must restrict writes to `docs/validator-forge/`. (Read the "Hard guardrails" section and confirm.)

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/validator-forge/SKILL.md
git commit -m "feat(skill): add validator-forge advisory skill

Analyzes existing skills for validator potential (condition #2 of the
Four-Condition Loop Test), ranks forgeable ones by value-per-effort, and
emits a buildable loop proposal. Sibling of loop-audit; advisory-only."
```

---

## Task 2: Dogfood acceptance run

This is the genuine acceptance test: run the skill and verify its output against the spec's §10 success criteria.

**Files:**
- Produced by the run: `docs/validator-forge/2026-06-23-validator-forge.md`, `docs/validator-forge/2026-06-23-wiki-gardener-loop.proposal.md`

- [ ] **Step 1: Invoke the skill**

Invoke the `validator-forge` skill (Skill tool, `skill: validator-forge`) — or follow its `/validator-forge` one-pass flow directly. Let it enumerate the skills in `.claude/skills/`, apply the validator lens, rank, and emit outputs into `docs/validator-forge/`.

- [ ] **Step 2: Verify the report against §10 success criteria**

Open `docs/validator-forge/2026-06-23-validator-forge.md` and confirm **all** of:

- [ ] Every skill in `.claude/skills/` (`autoresearch`, `loop-audit`, `wiki-ops`, `validator-forge` itself, and any other present) has exactly one ledger entry with a `validator | forgeable | taste-bound` verdict.
- [ ] Each `forgeable` entry names an **objective done-rule** with a strength tag.
- [ ] The four existing validators (autoresearch gate, `wiki-ops lint`, build-and-verification gate, loop-audit's gate) are **credited as `validator`, not re-proposed**.
- [ ] The `forgeable` set is ranked using the ROI vocabulary (`category` / `value` / `confidence` / `effort`).
- [ ] The recommended first build is the **wiki-gardener** loop (promoting `wiki-ops lint`).

If any assertion fails, fix `SKILL.md` (return to Task 1), re-run, re-verify. Do not proceed until all pass.

- [ ] **Step 3: Verify the emitted proposal**

Open `docs/validator-forge/2026-06-23-wiki-gardener-loop.proposal.md` and confirm:

- [ ] It defines generator (`wiki-ops` fixes), validator (`wiki-ops lint`, done = zero gating-class defects), and a bounded iterate/stop condition.
- [ ] It contains the **class split**: auto-fixable (orphan links, missing index entries, missing cross-refs) vs human-gated (contradictions stay flagged; thin coverage → autoresearch).
- [ ] It is a `.proposal.md` under `docs/validator-forge/` — **not** written into `docs/superpowers/specs/`.

- [ ] **Step 4: Verify nothing was written outside the sandbox**

Run:
```bash
git status --porcelain
```
Expected: only files under `docs/validator-forge/` are new/modified. **If anything under `src/`, `supabase/`, other `.claude/skills/`, or app config changed, the guardrail failed** — revert those changes and tighten `SKILL.md`.

- [ ] **Step 5: Commit the inaugural run (proof artifact)**

```bash
git add docs/validator-forge/
git commit -m "docs(validator-forge): inaugural run — report + wiki-gardener proposal

First dogfood pass of validator-forge: classifies the existing skills and
recommends the wiki-gardener loop (wiki-ops lint as validator) as the first
build. Proof artifact for surfaces B (website) and C (Aria)."
```

---

## Task 3: Discoverability — wiki cross-references (no orphan)

Mirror how `loop-audit` is referenced from concept pages; do **not** create a new wiki page (the method is already canonical in `four-condition-loop-test.md` + the spec). Keep edits minimal.

**Files:**
- Modify: `docs/wiki/concepts/four-condition-loop-test.md`
- Modify: `docs/wiki/concepts/self-improving-app.md`

- [ ] **Step 1: Cross-reference from the framework page**

In `docs/wiki/concepts/four-condition-loop-test.md`, add `validator-forge` as the condition-#2 companion. Add one line near the "Three surfaces" / dev-skill mention and a `See Also` bullet, e.g.:

> Condition #2 ("a rule decides done") has its own dev skill: **`validator-forge`** (`.claude/skills/validator-forge/SKILL.md`) analyzes existing capabilities for which can become the validator that unblocks a loop — the forge that complements `loop-audit`'s gate.

And add to **See Also**: `- [[Self-Improving App]]` is already present; append a line referencing the validator-forge skill path (skills are referenced by path, like `loop-audit`).

- [ ] **Step 2: Cross-reference from the self-improving-app page**

In `docs/wiki/concepts/self-improving-app.md`, add one forward-looking line noting that a **wiki-gardener maintenance loop** (validator: `wiki-ops lint`) is the maintenance counterpart to the autoresearch growth loop, to be emitted as a proposal by `validator-forge`. Keep it to one or two sentences; mark it as forthcoming (proposal, not built).

- [ ] **Step 3: Verify the cross-references resolve**

Using the Grep tool, confirm `validator-forge` now appears in both `docs/wiki/concepts/four-condition-loop-test.md` and `docs/wiki/concepts/self-improving-app.md`. Confirm you did **not** silently alter any existing claim on those pages (only added; the wiki rule: never overwrite — additions only here).

- [ ] **Step 4: Commit**

```bash
git add docs/wiki/concepts/four-condition-loop-test.md docs/wiki/concepts/self-improving-app.md
git commit -m "docs(wiki): cross-reference validator-forge from loop-test + self-improving-app

Register the new condition-#2 companion skill in the knowledge graph so it
isn't an orphan; note the forthcoming wiki-gardener maintenance loop."
```

---

## Done criteria (whole plan)

- [ ] `.claude/skills/validator-forge/SKILL.md` exists, passes structural checks, contradicts no sibling guardrail.
- [ ] `/validator-forge` runs and produces a report + wiki-gardener proposal that meet spec §10.
- [ ] `git status` after a run shows writes only under `docs/validator-forge/`.
- [ ] The skill is cross-referenced from the wiki (not an orphan).
- [ ] No application code, schema, or edge functions were touched (this is a docs/skill-only change; the app gate is N/A).
