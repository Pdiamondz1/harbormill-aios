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
  and `loop-audit`'s own four-condition gate.) Crediting an existing validator ≠ leaving
  its loop unbuilt: a credited validator may still be the gate of a newly-forged loop —
  that loop is the `forgeable` opportunity, scored on the skill whose output it closes.
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
