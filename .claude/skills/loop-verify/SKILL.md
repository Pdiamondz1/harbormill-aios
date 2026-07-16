---
name: loop-verify
description: "Independent, fresh-context verification for an automation loop's output. Use for '/loop-verify', 'verify this loop output', 'score this against the rubric', or whenever a loop must check its own work without grading its own homework. An orchestrator dispatches this as a SEPARATE subagent (fresh context, not the agent that produced the work), which scores the artifact 1-10 against a rubric and returns a pass/fail verdict gated on a threshold. This is the reusable, concrete form of a validator-forge validator and the independent done-rule for condition #2 of the Four-Condition Loop Test."
---

# Loop-Verify — independent verification for loops

A loop that grades its own homework isn't verified. This skill makes the **final
verification of a loop's output** run in a **separate subagent with a fresh context
window** — *not* the agent that produced the work — which scores the artifact **1-10**
against a rubric and returns a **pass/fail** verdict gated on a threshold. The loop marks
an iteration "done" (e.g. ingests the page) only on a **pass**.

It is the reusable, concrete form of a `validator-forge` *validator*, and the independent
done-rule that satisfies **condition #2 ("a rule decides done")** of the
[[Four-Condition Loop Test]]. First adopter: the `autoresearch` loop's acceptance gate.

## Why a separate subagent (read this first)

The producing agent has already convinced itself its output is good — that's why it
emitted it. Asking the *same* context to grade the work re-uses the same blind spots.
A **fresh-context** verifier sees only the artifact and the rubric, re-derives judgment
from scratch, and independently re-checks the claims. That independence is the whole point;
do not shortcut it by having the producer self-score.

## Dispatch contract (how an orchestrator invokes this)

The orchestrator (the loop skill, e.g. `autoresearch`) calls the **Agent tool** to spawn a
separate subagent — this is the only mechanism that yields a genuinely fresh context.

- **`subagent_type: Explore`** — it can Read/Grep/Glob and WebFetch/WebSearch to
  independently re-check sources and repo grounding, but has **no Write/Edit**, so a verifier
  can never pollute the wiki or any artifact. (Use `general-purpose` only if deeper full-file
  judgment is required, and then explicitly instruct it to never write.)
- **Pass to the subagent ONLY:**
  1. the candidate artifact (the full proposed page / output),
  2. the objective context it needs to judge (the target gap; titles + one-line excerpts of
     related existing pages so it can check redundancy/contradiction; the artifact's claimed
     sources),
  3. the rubric and threshold below (or a named profile).
- **Never pass** the producing agent's research transcript, chain-of-thought, or its own
  argument for why the artifact is good. Withholding it is what keeps the context fresh.
- **The subagent's final message must be the VERDICT block** (schema below) and nothing else
  the orchestrator must parse around.
- The orchestrator **parses the VERDICT and gates**: act on the artifact only if
  `verdict: pass`.

## The rubric (1-10, five criteria)

Score each criterion 1-10. Two of them are **gating sub-criteria**.

| # | Criterion | What a high score means | Gating? |
|---|-----------|-------------------------|---------|
| 1 | **Sourcing** | Backed by **≥2 independent external sources that actually exist and support the claims**, OR grounded directly in repo code/docs with **file paths that actually exist** (the verifier spot-checks them). | **Yes** — floor 7 |
| 2 | **Accuracy / non-contradiction** | Claims are correct and do **not** silently contradict an existing page (any contradiction is named explicitly). | **Yes** — floor 7 |
| 3 | **Gap-fit** | Actually fills the *targeted* gap — the artifact answers the question the loop set out to answer. | No |
| 4 | **Clarity & fit** | Well-written, correctly scoped and bucketed, valid frontmatter, proper `[[wikilinks]]`/`## See Also`. | No |
| 5 | **Non-redundancy** | Does not duplicate an existing page; if it overlaps, it compounds rather than repeats. | No |

### Scoring rule

- **`score`** is the verifier's **holistic** 1-10 for the artifact overall.
- **Floors override the holistic score:** if **Sourcing < 7 OR Accuracy < 7**, the verdict
  is **`fail`** regardless of `score`. A polished, well-written page built on fabricated or
  thin sources must never pass — verification protects truth before style.
- **Threshold:** `verdict: pass` requires `score >= MIN_SCORE` **and** both floors satisfied.
  **`MIN_SCORE` defaults to 8** (out of 10). It is a tunable constant — an orchestrator may
  raise it for high-stakes loops or pass a different value in the dispatch.
- **Contradiction:** if the artifact contradicts an existing page, set `contradiction` to a
  one-line description naming the page. The orchestrator routes a contradiction to its
  `flagged`/human-review path even if the score is otherwise passing — contradictions are
  surfaced, never silently merged.

## VERDICT schema (the subagent's entire final message)

```
VERDICT
score: <1-10 integer>
threshold: <MIN_SCORE used, e.g. 8>
verdict: pass | fail
contradiction: none | <one line: what it contradicts + which page>
criteria: sourcing <n> | accuracy <n> | gap_fit <n> | clarity <n> | non_redundancy <n>
rationale: <one line — the single most decisive reason for this verdict>
```

Rules the verifier subagent must follow:
- Apply the **floors**: if sourcing or accuracy < 7, `verdict` is `fail`.
- Otherwise `verdict` is `pass` iff `score >= threshold`.
- **Independently verify** before scoring sourcing/accuracy: open at least one cited source
  (WebFetch) or repo path (Read/Grep) and confirm it exists and supports the claim. If a
  cited source can't be reached or doesn't support the claim, that caps Sourcing below the
  floor.
- Be a skeptic, not a rubber stamp. Default to the *lower* score when genuinely uncertain —
  a wrongly-kept page costs more than a wrongly-discarded one (the loop can always retry).
- Emit **only** the VERDICT block as the final message.

## Rubric profiles

The default rubric above is the **`autoresearch` profile** (judging a candidate wiki page).
The skill is built to host more profiles without changing its contract:

- **`autoresearch`** *(built)* — the rubric above.
- **`wiki-gardener`** *(future)* — score "did this fix resolve the targeted defect **without
  introducing a new one** (broken wikilink, orphan, contradiction)?" Floors: no-new-defects.
  Not built yet; add here when `wiki-gardener` adopts independent verification.

When an orchestrator dispatches, it names the profile (or pastes the rubric inline). Only the
`autoresearch` profile exists today.

## Guardrails

- **Read-only verifier.** The verifier subagent never writes — it returns a verdict; the
  orchestrator owns the consequence. `Explore` enforces this structurally.
- **Fresh context is mandatory.** If the verification is ever done inside the producing
  agent's own context, it is *not* this skill — it's self-grading, and the loop's "done"
  claim is unearned.
- **Advisory toward humans on contradictions.** A `flagged` contradiction is surfaced for a
  human, never auto-resolved.

## See Also

- [[Four-Condition Loop Test]] — this is the reusable condition-#2 done-rule.
- `validator-forge` (`.claude/skills/validator-forge/SKILL.md`) — proposes which capability
  becomes a validator; this is one made concrete and reusable.
- [[Self-Improving App]] — the `autoresearch` loop that adopts this verifier first.
- Orchestrator that invokes it: `.claude/skills/autoresearch/SKILL.md`
