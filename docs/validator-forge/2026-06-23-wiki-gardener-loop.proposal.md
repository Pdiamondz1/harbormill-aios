# Proposal: wiki-gardener loop
Date: 2026-06-23
Status: proposal (human review required before build)
Emitted by: validator-forge run 2026-06-23
Source report: `docs/validator-forge/2026-06-23-validator-forge.md`

---

## What this closes

`autoresearch` is a *growth* loop — it adds verified pages to `docs/wiki/`. Nothing currently *maintains* those pages: orphan links accumulate, `index.md` falls behind, cross-references go missing. The wiki-gardener is the *maintenance* counterpart. Together they form the complete self-improving-wiki cycle ([[Self-Improving App]]).

---

## Loop definition

**Generator:** `wiki-ops` fix actions — the ingest, update, and cross-reference operations already defined in `.claude/skills/wiki-ops/SKILL.md`.

**Validator:** `wiki-ops lint` — the existing health-check operation in `.claude/skills/wiki-ops/SKILL.md` §`/wiki-ops lint`. The done-rule: **zero defects of the gating classes** (see class split below).

**Iterate/stop condition:** Run lint → pick the single highest-severity auto-fixable defect → apply the fix → re-lint. Repeat until either:
- (a) **Stop: done** — zero gating-class defects remain, or
- (b) **Stop: budget** — `N` iterations exhausted (default `N = 10` per run; configurable). On budget exhaustion, surface remaining defects as a summary for human review.

Never loop indefinitely. Budget `N` is the cost bound.

---

## Class split (critical guardrail)

This is the boundary between what the loop may resolve autonomously and what it must hand off.

### Auto-fixable (loop may act)

The loop generator may fix these without human approval:

| Defect class | Fix action | Why auto-fixable |
|---|---|---|
| Orphan `[[wikilinks]]` | Create a stub page in the correct bucket, or add the missing cross-reference; delete the link only when its target is a confirmed typo or duplicate of an existing page — any "is this topic obsolete?" judgment is human-gated, not auto-fixable | Link targets are enumerable; stubs are low-blast-radius |
| Missing `index.md` entries | Append the missing entry in alphabetical position | Pure structural; no editorial judgment |
| Missing cross-references between related pages | Add `## See Also` entries with `[[wikilinks]]` | Relationship is stated by existing page content; no new claims |

### Human-gated (loop surfaces, never resolves)

The loop flags these and stops; a human decides:

| Defect class | Why human-gated | Handoff |
|---|---|---|
| **Contradictions** between pages | The wiki's "never silently overwrite" rule prohibits autonomous resolution; the contradiction may reflect a real ambiguity or a policy decision | Flag with specific quotes from each conflicting page; present to Damon |
| **Thin / single-source coverage** | Inventing content to fill a gap is forbidden; the only remedy is more research | Hand off to `autoresearch` with the gap as the topic |
| **Stale claims** (content superseded by newer sources) | Whether a claim is stale requires judgment about which source is authoritative | Flag with the newer source; present to Damon |

---

## Guardrails (inherited from wiki-ops / autoresearch)

- **Writes only to `docs/wiki/`.** Never edits app code, schema, RLS, auth, other skills, or `docs/validator-forge/`.
- **No metered/client spend.** Runs in the local Claude Code session.
- **Flag, don't overwrite** contradictions — consistent with the wiki's "never silently overwrite" rule.
- **Read-only against `docs/wiki/raw/`.** Sources in `raw/` are immutable.
- **One defect per iteration.** Fix the single highest-severity auto-fixable defect per loop pass, then re-lint. Do not batch-fix; batching makes it harder to audit each change.
- **Advisory stop.** If the loop would need to make an editorial judgment to continue, it surfaces the question and waits.

---

## Value-per-effort rationale

This is the #1 ranked forgeable validator from the 2026-06-23 validator-forge run:

- **Value:** ~4 hrs/week of wiki-maintenance handwork (orphan-link triage, index updates, cross-ref additions) × 52 wks ≈ $20K annualized at consultant rates. High confidence — the defect classes are already visible in the current wiki on every `lint` run.
- **Effort:** Low. Both the generator (`wiki-ops`) and the validator (`wiki-ops lint`) already exist. The only build work is wiring the iterate/stop condition and defining the class split (done above).
- **Risk:** Low. Writes are scoped to `docs/wiki/`; human-gated classes are never autonomously resolved; budget `N` bounds cost.

---

## How to build this loop

This is a proposal, not a spec. A human runs `brainstorming` / `writing-plans` on it to produce a full implementation spec. Suggested next steps:

1. Review this proposal with Damon — confirm the class split and the default budget `N`.
2. Invoke `brainstorming` to stress-test the guardrails and edge cases.
3. Invoke `writing-plans` to produce the implementation plan (likely a new skill or an extension to `wiki-ops`).
4. Spec goes to `docs/superpowers/specs/` after human approval.
5. Build the loop as a new `/wiki-gardener` operation (or `/wiki-ops maintain`) following the plan.

---

## See Also

- [[Four-Condition Loop Test]] — the validator is condition #2
- [[Self-Improving App]] — wiki-gardener completes the growth + maintenance cycle
- `.claude/skills/wiki-ops/SKILL.md` — generator and validator both live here
- `.claude/skills/autoresearch/SKILL.md` — the growth loop this complements
- `docs/validator-forge/2026-06-23-validator-forge.md` — the full run report
