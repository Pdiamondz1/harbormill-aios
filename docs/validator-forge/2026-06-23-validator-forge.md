# Validator Forge — 2026-06-23

Capabilities analyzed: 4   Validators (existing): 2   Forgeable: 1   Taste-bound: 1   (+1 non-skill validator credited: the build-and-verification gate)

---

## Recommended first build

**wiki-gardener** — promote `wiki-ops lint` into a closed maintenance loop.

`autoresearch` grows the wiki (adds verified pages); nothing currently *maintains* them. The wiki-gardener loop closes this gap: `wiki-ops lint` identifies defects → `wiki-ops` fix actions auto-correct the highest-severity *machine-checkable* class → re-lint → repeat until clean or budget `N`. The done-rule is exact and machine-checkable: **zero defects of the gating classes** (orphan wikilinks, missing `index.md` entries, missing cross-references). This wins value-per-effort decisively — the validator (`wiki-ops lint`) already exists, the generator (`wiki-ops`) already exists, the loop wiring is the only build cost, and the annualized value (maintaining the coherence of the knowledge base that feeds both Aria's RAG and Damon's weekly research) is high relative to a low build effort. Together with `autoresearch`, the wiki-gardener completes the self-improving-wiki cycle: growth + maintenance in one system ([[Self-Improving App]]).

---

## Ranked forgeable validators

| Rank | Capability | Loop it closes | Done-rule (strength) | Category | Value | Confidence | Effort |
|------|-----------|----------------|----------------------|----------|-------|------------|--------|
| 1 | wiki-ops (lint op) | wiki-gardener: lint → fix highest-severity auto-fixable defect → re-lint → iterate until clean or budget N | Zero defects of gating classes (orphan links, missing index entries, missing cross-refs) (machine-checkable) | hours_saved | ~4 hrs/week wiki maintenance × 52 wks = ~$20K annualized at consultant rates | high | low |

---

## Ledger (every skill)

### autoresearch

Verdict: **validator**
Generates: Verified wiki pages ingested into `docs/wiki/`
Latent check: yes — the acceptance gate (fills a real gap + ≥2 independent sources or grounded in repo + non-contradictory)
Done-rule: All three acceptance conditions met → `kept`; otherwise `discarded` or `flagged`. Strength: **machine-checkable** (conditions are enumerable and verifiable)
Loop: deep-research → acceptance gate → ingest (if kept) / discard/flag (if not)
Note: Already a closed loop with an objective done-rule. **Credited as existing validator** — do not re-propose. Pointer: `.claude/skills/autoresearch/SKILL.md` §"The acceptance gate."

---

### loop-audit

Verdict: **validator**
Generates: Loop candidates with four-condition gate scores, ranked by value-per-effort
Latent check: yes — the Four-Condition Loop Test is itself an objective gate (conditions #2 and #4 are hard blockers; #1 and #3 are scored strong/partial/weak with enumerable criteria)
Done-rule: A task is `candidate` if all four conditions pass, `blocked` if #2 or #4 fails, `not-a-loop` if #1 or #3 fails. Strength: **heuristic-but-objective** (condition thresholds are named and consistent, though "strong/partial/weak" has some judgment)
Loop: enumerate tasks → gate each → rank candidates → recommend first build
Note: Already implements an objective gate on condition #2 specifically (rule-decides-done = yes/no). **Credited as existing validator** — do not re-propose. Pointer: `.claude/skills/loop-audit/SKILL.md` §"The framework, in one screen."

---

### wiki-ops

Verdict: **forgeable**
Generates: (a) ingested/updated wiki pages; (b) a structured lint report listing defects by class
Latent check: yes — the `lint` operation already identifies specific, named defect classes (contradictions, stale claims, orphan pages, missing pages, missing cross-refs, data gaps, index incompleteness)
Done-rule: **Zero defects of the gating classes** (orphan `[[wikilinks]]`, missing `index.md` entries, missing cross-references). Contradictions and thin coverage remain human-gated and do not block the loop. Strength: **machine-checkable** — each gating defect class is enumerable by file scan
Loop: `wiki-ops lint` → fix highest-severity auto-fixable defect → `wiki-ops lint` again → iterate until zero gating defects or budget `N`
Note: The `lint` operation is the latent validator. Specific tweak to forge it: (1) define the gating class vs human-gated class split explicitly; (2) wire an iterate/stop condition (budget `N`). The full proposal is in `2026-06-23-wiki-gardener-loop.proposal.md`. To be explicit: `wiki-ops lint` is credited as an existing validator (it already functions as a gate); the wiki-gardener does not propose it anew — it wires this existing validator into a generator→validator→iterate loop. The forgeable opportunity is the loop, not the validator.

---

### validator-forge

Verdict: **taste-bound**
Generates: A classification ledger (validator/forgeable/taste-bound verdict per skill) and a ranked forgeable set + top-pick proposal
Latent check: partial — the validator-lens four questions produce a verdict, but the verdict requires judgment (especially the "forgeable" vs "taste-bound" boundary for novel capabilities)
Done-rule: No fully objective done-rule. The closest objective proxy: **all skills have exactly one ledger row with a named verdict, and every `forgeable` entry names a strength-tagged done-rule**. These are checkable, but whether the verdict itself is *correct* requires human review. Strength: **needs-human-taste** for verdict correctness; **machine-checkable** for structural completeness
Loop: (none — taste-bound)
Note: Closest proxy = structural completeness check (every skill has one row, every forgeable has a done-rule). Verdict correctness requires a human to confirm the classification was not mechanically applied.

---

## Non-skill validators (repo-level, credited here)

### Build-and-verification gate (`npm run typecheck / lint / build / test`)

Not a skill — a repo-level gate defined in `CLAUDE.md`. Credited so it is never re-proposed.
Verdict: **validator** (existing)
Done-rule: All four commands exit 0 with no new errors beyond the two known `react-refresh` warnings on `button.tsx` / `AuthContext.tsx`. Strength: **machine-checkable**
Note: Pointer — `CLAUDE.md` §"Commands (the gate — run before claiming done)."
