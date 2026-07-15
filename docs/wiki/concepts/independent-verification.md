---
title: Independent Verification
type: concept
created: 2026-06-24
updated: 2026-07-15
sources: [.claude/skills/loop-verify/SKILL.md, raw/sessions/2026-06-24-loop-verify-and-loop-memory.md, external:what-actually-matters-in-ai-2026]
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

## External corroboration — and one correction (2026-07-15)

Matt Wolfe's public **BuseyBench** independently reaches this page's core premise from the
opposite direction ([[What Actually Matters in AI Right Now (2026)]]). It scores model output
with **LLM-as-judge, but three judges drawn from three different labs**, averaged, with ties
broken by a pairwise vote. His stated reason is precisely the blind-spot argument above: **a
model is biased toward output it created**, so a single judge — especially one from the lab that
produced the artifact — cannot be trusted.

That is a **stronger** independence guarantee than this page currently specifies. Harbormill's
verifier is independent by *context* (a fresh window, no producer transcript) but not by
*model* — the same model family produces and grades. Wolfe's design says fresh context may not
be sufficient where the producing lab has a house style to reward. **Recorded as an open
question, not a change:** whether `loop-verify` should require a different model for the
verifier than the producer. Cheap to test, not yet tested.

His second point cuts the other way and is worth keeping honest: he trusts **his own eye over
his own scoreboard**, and reports that the model winning on score is not the one that looks best
to him. A rubric score is a proxy. Where the artifact is a matter of taste,
condition #2 of the [[Four-Condition Loop Test]] is not really satisfied, and a human still
decides. Independent verification protects against *self-flattery*, not against *the rubric
measuring the wrong thing*.

## See Also
- [[Four-Condition Loop Test]]
- [[Self-Improving App]]
- [[Loop Memory]]
- [[Build & Verification Gate]]
- [[What Actually Matters in AI Right Now (2026)]]
- Skill: `.claude/skills/loop-verify/SKILL.md`
