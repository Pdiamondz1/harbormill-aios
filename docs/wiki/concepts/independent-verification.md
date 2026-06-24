---
title: Independent Verification
type: concept
created: 2026-06-24
updated: 2026-06-24
sources: [.claude/skills/loop-verify/SKILL.md, raw/sessions/2026-06-24-loop-verify-and-loop-memory.md]
tags: [loops, verification, autoresearch, quality, architecture]
---

# Independent Verification

A loop that grades its own work isn't verified. **Independent verification** runs the *final*
check on a loop's output in a **separate subagent with a fresh context window** — not the agent
that produced the output — which scores the artifact **1-10** against a rubric and gates "done"
on a threshold. It is the reusable, concrete form of a `validator-forge` validator and the
*independent* done-rule for **condition #2** of the [[Four-Condition Loop Test]].

Implemented as the `loop-verify` skill (`.claude/skills/loop-verify/SKILL.md`); first adopter is
the [[Self-Improving App]]'s `autoresearch` acceptance gate.

## Why a separate subagent
The producing agent already convinced itself its output is good — re-using that context re-uses
its blind spots. A fresh-context verifier sees only the artifact + rubric, re-derives judgment,
and independently re-checks claims (opens cited sources / repo paths). Independence is the point.

## The mechanism
- The orchestrator dispatches the verifier via the **Agent tool** (`subagent_type: Explore` — it
  can Read/Grep/WebFetch to re-check sources, but cannot Write, so it can never pollute the
  artifact store).
- It is passed **only** the artifact + objective context + rubric — never the producer's
  transcript.
- It returns a `VERDICT` block: `score` (1-10), `verdict` (pass/fail), `contradiction`,
  per-criterion scores, and a one-line `rationale`.

## The rubric (autoresearch profile)
Five criteria scored 1-10: **sourcing** and **accuracy** are gating floors (default 7), plus
gap-fit, clarity, and non-redundancy. `verdict: pass` requires `score >= MIN_SCORE` (default 8)
**and** both floors met — a polished page on weak sources fails, because verification protects
truth before style.

## Distinct from in-flow checks
`deep-research`'s adversarial checks run *during* production; independent verification is the
*final* gate on the assembled artifact. Two complementary layers.

## See Also
- [[Four-Condition Loop Test]]
- [[Self-Improving App]]
- [[Loop Memory]]
- [[Build & Verification Gate]]
- Skill: `.claude/skills/loop-verify/SKILL.md`
