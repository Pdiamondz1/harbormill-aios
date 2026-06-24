# wiki-gardener — design spec

- **Date:** 2026-06-24
- **Status:** approved design, pre-implementation
- **Surface:** A — dev-side automation (the maintenance loop that completes the self-improving-wiki cycle)
- **Origin:** the #1-ranked forgeable validator emitted by the `validator-forge` run of 2026-06-23 (`docs/validator-forge/2026-06-23-wiki-gardener-loop.proposal.md`). This spec is the human-reviewed result of running `brainstorming` on that proposal, as the proposal itself prescribed.

## 1. Context & problem

`autoresearch` is a **growth** loop — it adds verified pages to `docs/wiki/`. Nothing
currently **maintains** them: typo wikilinks accumulate, `index.md` falls behind, and
cross-references between related pages go missing. `wiki-gardener` is the **maintenance**
counterpart. Together they form the complete self-improving-wiki cycle
([[Self-Improving App]]).

This is the first loop **forged by `validator-forge`**: it promotes the existing
`wiki-ops lint` health check (a validator that already exists but only ever produced an
advisory report) into the **done-rule of a closed loop**. Building it closes the
validator-forge dogfood and produces the working proof reused by surface B (website
message) and surface C (Aria feature).

## 2. Goals / non-goals

**Goals**
- A new **standalone** advisory-but-autonomous skill `wiki-gardener`, sibling to
  `autoresearch`, that runs `lint → fix one auto-fixable defect → commit → re-lint` until
  the wiki is clean of gating-class defects or a budget `N` is exhausted.
- It **orchestrates existing `wiki-ops` operations** — no reimplementation, and **no code
  change to `wiki-ops`** (the loop is Claude following this SKILL.md, reading lint's
  structured report and acting on it).
- Each autonomous fix is its own **`git`-revertable commit**; human-gated defect classes
  are surfaced, never resolved.

**Non-goals (YAGNI)**
- **No stub auto-creation.** (Refinement from the proposal — see §4.) A genuine
  missing-page link routes to `autoresearch`, not an empty stub.
- **No dry-run/preview mode** and **no separate one-pass-vs-loop modes** — it is
  inherently a loop; one invocation with an optional budget arg is the product.
- **No change to `wiki-ops` code**, and **no Aria/product integration** (that is surface C).
- It never edits app code, schema, RLS, auth, other skills, or `docs/validator-forge/`.

## 3. Architecture

| Unit | Responsibility |
|------|----------------|
| `.claude/skills/wiki-gardener/SKILL.md` | **The deliverable.** The loop's instructions: the generator/validator definition, the class split, the iterate/stop condition, the ledger format, and guardrails. |
| `wiki-ops` (unchanged) | The toolbox the loop orchestrates: `lint` (the validator) and the ingest/update/cross-reference fix actions (the generator). Stays advisory — *"apply fixes only with user approval"* — when invoked directly. |
| `autoresearch` (unchanged) | Handoff target for human-gated defects that need research (missing concept pages, thin coverage). |
| `docs/wiki/log.md` (appended) | The shared ledger; `wiki-gardener` appends a per-run entry. |

**Why a standalone skill, not a `wiki-ops` operation:** the *loop* (budget, autonomy,
ledger, class-split governance) is a distinct concern from the wiki toolbox — exactly the
reason `autoresearch` is already separate from `wiki-ops`. Keeping it standalone also
preserves `wiki-ops lint`'s human-gated-by-default contract: the **autonomy to auto-apply
fixes lives only in the clearly-named `wiki-gardener`**, never silently inside `wiki-ops`.

## 4. The class split (the critical guardrail)

The boundary between what the loop resolves autonomously and what it must hand off.
**Refinement from the proposal:** the proposal permitted auto-creating stub pages for
broken links; this spec **drops that** — an empty stub immediately becomes a new
thin/orphan page that the next lint flags (churn), and it brushes the wiki's
"never invent content" rule. Genuine missing concepts route to `autoresearch` instead.

### Auto-fixable (gating classes — loop resolves, one per iteration, each its own commit)

| Defect class | Fix action | Why safe to automate |
|---|---|---|
| **Typo/duplicate wikilinks** | A `[[link]]` whose target page doesn't exist but clearly matches an existing page (typo, casing, duplicate name) → rewrite the link to the correct existing page. | Purely structural; no new content; target is an existing page. |
| **Missing `index.md` entries** | A page exists on disk but isn't in `index.md` → append it in the correct alphabetical section, in the existing `- [[Display Name]](path) — summary` format. | Pure structure; no editorial judgment. |
| **Missing cross-references** | Two pages already relate in prose (one names the other / they share a concept) but lack `## See Also` `[[wikilinks]]` → add the See-Also entries. | The relationship is already stated by existing page content; adds no new claims. |

### Human-gated (loop surfaces with specifics, never resolves)

| Defect class | Why human-gated | Handoff |
|---|---|---|
| **Missing pages (genuine new concept)** | A `[[link]]` to a concept that legitimately should exist but doesn't — filling it needs research, not a stub. | Hand to `autoresearch` with the concept as the topic. |
| **Orphan pages** (no inbound links, no clearly-related page to link from) | May be genuinely standalone or may need a home — judgment. *(If a clearly-related page exists, adding the cross-ref is the auto-fixable "missing cross-references" case.)* | Surface to the human with the page path. |
| **Contradictions** between pages | The wiki's "never silently overwrite" rule prohibits autonomous resolution. | Flag with specific quotes from each conflicting page. |
| **Stale claims** (superseded by newer sources) | Which source is authoritative requires judgment. | Flag with the newer source. |
| **Thin / single-source coverage** | Inventing content to fill a gap is forbidden; the only remedy is research. | Hand to `autoresearch` with the gap as the topic. |

## 5. The loop (flow)

`/wiki-gardener [N]` — one autonomous run (default budget `N=10`):

1. Run `wiki-ops lint`. Read its structured findings; map each to a class (§4).
2. If **zero gating-class defects** → **stop: done**. Go to step 6.
3. If budget `N` is exhausted → **stop: budget**. Go to step 6.
4. Pick the **single highest-severity auto-fixable defect**. Apply its fix via the
   appropriate `wiki-ops` action. **Commit it** as its own revertable commit
   (`docs(wiki): wiki-gardener — fix <class> on <page>`).
5. **Re-lint** (return to step 1). One defect per iteration — never batch.
6. **Summarize:** print fixes applied (with commit SHAs) and **every human-gated defect**
   surfaced (with its specifics/handoff). Append the run's ledger entry to
   `docs/wiki/log.md`.

**Autonomous within budget** — do not pause for per-fix approval mid-run (mirrors
`autoresearch`'s "NEVER STOP mid-budget, bounded by `N`"). The human invoked the run and
reviews the summary; the safety net is `git revert`, not a mid-loop gate.

### Ledger format (appended to `docs/wiki/log.md`)

```
## [YYYY-MM-DD] wiki-gardener | run (budget N=<n>)
Iterations: <n>   Stop reason: done | budget
Fixed (auto):
  - <class> on [[Page]] — <commit sha7>
Surfaced (human-gated):
  - <class> on [[Page]] — <one-line specifics / handoff>
Note: <one line — e.g. "2 missing-concept links routed to autoresearch">
```

## 6. Guardrails (inherited from `wiki-ops` / `autoresearch`)

- **Writes only to `docs/wiki/`.** Never edits app code, schema, RLS, auth, other skills,
  or `docs/validator-forge/`. **Read-only against `docs/wiki/raw/`** (sources are immutable).
- **No metered/client spend.** Runs in the local Claude Code session.
- **Flag, don't overwrite** — contradictions are surfaced, never autonomously resolved.
- **One defect per iteration** — fix the single highest-severity auto-fixable defect, then
  re-lint; never batch (keeps each change auditable and individually revertable).
- **Human-gated classes are never auto-resolved** — the loop surfaces them and continues
  with the next auto-fixable defect (or stops if none remain).
- **Budget `N` bounds cost.** Default `N=10`.

## 7. Relationship to siblings

- **`autoresearch` (growth) + `wiki-gardener` (maintenance) = the complete
  self-improving-wiki cycle.** Handoff: `wiki-gardener` routes missing-concept and
  thin-coverage defects *to* `autoresearch` as research topics.
- **`wiki-ops`** stays the advisory toolbox; `wiki-gardener` is the autonomous loop that
  orchestrates it. `wiki-ops lint` remains human-gated when invoked directly.
- **`validator-forge`** forged this loop; `wiki-gardener` is the realized output of that
  proposal.

## 8. Success criteria

- `/wiki-gardener` runs one autonomous pass against the real `docs/wiki/` and:
  - finds real defects via `wiki-ops lint` and classifies each per §4;
  - **auto-fixes only the auto-fixable classes**, one per iteration, each as its own
    revertable commit;
  - **surfaces every human-gated defect** (contradiction / stale / thin / orphan / missing
    concept) without touching it, routing missing-concept and thin coverage to
    `autoresearch`;
  - **writes nothing outside `docs/wiki/`** (verified via `git status`);
  - **stops** at zero gating defects or budget `N`, and appends a `log.md` ledger entry.
- The SKILL.md passes structural checks (valid frontmatter `name: wiki-gardener` +
  `/wiki-gardener` trigger; the class split, loop, ledger format, and guardrails present).

## 9. Acceptance approach (for the build)

Prose skill (like its siblings — no unit tests, app gate N/A). Verification is:
1. **Structural checks** on `SKILL.md` (Grep for required sections/frontmatter).
2. **Dogfood run** — invoke `/wiki-gardener` on the live wiki and verify §8 against the
   actual commits, the surfaced human-gated list, and `git status`. This is the genuine
   acceptance gate.

## 10. Out of scope (enabled, not built here)

- **Surface B** (website "loops you can trust" message) and **surface C** (in-app Aria
  loop) — separate specs; this loop is their proof/template.
- Any change to `wiki-ops` or `autoresearch` source.
- A `--dry-run`/preview mode — trivially addable later if desired, but omitted now (the
  per-fix-commit + `git revert` net already covers the risk; YAGNI).

## See Also

- [[Self-Improving App]] — `docs/wiki/concepts/self-improving-app.md` (wiki-gardener is the maintenance half)
- [[Four-Condition Loop Test]] — `wiki-ops lint` is the condition-#2 validator this loop closes on
- `.claude/skills/wiki-ops/SKILL.md` — generator (fix actions) + validator (`lint`) both live here
- `.claude/skills/autoresearch/SKILL.md` — the growth loop this complements + the loop/ledger pattern this mirrors
- `.claude/skills/validator-forge/SKILL.md` — forged this loop
- `docs/validator-forge/2026-06-23-wiki-gardener-loop.proposal.md` — the proposal this spec realizes
