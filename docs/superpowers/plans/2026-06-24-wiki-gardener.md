# wiki-gardener Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `wiki-gardener`, a standalone autonomous maintenance-loop skill that runs `wiki-ops lint` as a validator (`lint → fix one auto-fixable defect → commit → re-lint`) until the wiki is clean of gating-class defects or a budget `N` is exhausted.

**Architecture:** A single prose `SKILL.md` under `.claude/skills/wiki-gardener/`, modeled on its sibling `.claude/skills/autoresearch/SKILL.md` (the loop + ledger pattern). It **orchestrates existing `wiki-ops` operations** — `lint` (validator) and the fix actions (generator) — and requires **no code change to `wiki-ops`**. Auto-applies only structural fixes (typo wikilinks, missing index entries, missing cross-refs), each as its own revertable commit; surfaces human-gated defects and routes research gaps to `autoresearch`. Writes only to `docs/wiki/`.

**Tech Stack:** Markdown only. No application code, schema, or edge functions. The repo's app gate (`npm run typecheck/lint/build/test`) does **not** apply to this docs/skill-only change.

**Testing approach (replaces unit tests):** A skill is agent instructions; its siblings have no automated tests. Verification:
1. **Structural checks** on `SKILL.md` — frontmatter, required sections, class split, loop, ledger, guardrails (Grep tool).
2. **Dogfood acceptance run** (Task 2) — invoke `/wiki-gardener` on the **real** `docs/wiki/` and verify it against the spec's §8 success criteria using the actual commits, the surfaced human-gated list, and `git status`. **This run mutates the wiki** (makes auto-fixes + commits), which is intended — each fix is its own revertable commit.

**Spec:** `docs/superpowers/specs/2026-06-24-wiki-gardener-design.md` (read it before starting — it is the source of truth).

**Worktree:** Execute in the current worktree `hma-prod4` (`C:\GIT\harbormill-aios\.claude\worktrees\hma-prod4`). Do not `cd` to the original repo root.

**Commit convention:** All commits end with the repo trailer:
```
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PXhzcUxRqNEX5nbVkjKc5p
```
(Commit messages below omit the trailer for brevity — append it to each.)

---

## File Structure

| File | Responsibility | Task |
|------|----------------|------|
| `.claude/skills/wiki-gardener/SKILL.md` | **The deliverable** — the loop's instructions: validator/generator, class split, iterate/stop, ledger, guardrails. | 1 |
| `docs/wiki/**` (edits + commits) | Produced *by running the skill* in Task 2 — real auto-fixes, one revertable commit each, plus a `log.md` ledger entry. | 2 |
| `docs/wiki/concepts/self-improving-app.md` | Modify — update the "wiki-gardener (forthcoming)" mention to reflect it now exists (additive/accurate). | 3 |

---

## Task 1: Author the `wiki-gardener` skill

**Files:**
- Create: `.claude/skills/wiki-gardener/SKILL.md`
- Reference (read, do not modify): `.claude/skills/autoresearch/SKILL.md` (structural model — the loop/ledger pattern), `.claude/skills/wiki-ops/SKILL.md` (the lint validator + fix actions this orchestrates), `docs/superpowers/specs/2026-06-24-wiki-gardener-design.md` (source of truth)

- [ ] **Step 1: Read the model and the spec**

Read `.claude/skills/autoresearch/SKILL.md` (the loop posture, the "NEVER STOP mid-budget" rule, the `log.md` ledger format) and `.claude/skills/wiki-ops/SKILL.md` (the `lint` defect classes and the fix actions). Re-read the spec. The skill below must not contradict any of them.

- [ ] **Step 2: Create the skill file with this exact content**

Create `.claude/skills/wiki-gardener/SKILL.md`:

````markdown
---
name: wiki-gardener
description: "Autonomous maintenance loop that keeps the Harbormill AIOS wiki internally consistent. Use for '/wiki-gardener', 'garden the wiki', 'maintain the wiki', or 'clean up the wiki'. Runs wiki-ops lint as a validator: lint → fix one auto-fixable defect → commit → re-lint, until clean or a budget N. Auto-fixes only structural defects (typo wikilinks, missing index entries, missing cross-references); surfaces human-gated defects (contradictions, stale claims, thin coverage, orphan/missing-concept pages) and routes research gaps to autoresearch. Advisory posture, autonomous within budget; writes only to docs/wiki/. The maintenance counterpart to autoresearch's growth loop."
---

# Wiki Gardener

An autonomous **maintenance** loop that keeps the knowledge wiki at `docs/wiki/`
internally consistent over time. It is the **maintenance counterpart** to `autoresearch`'s
**growth** loop: where `autoresearch` *adds* verified pages, this *keeps the existing set*
coherent. Together they form the complete self-improving-wiki cycle ([[Self-Improving App]]).

This skill **orchestrates two operations that already exist in `wiki-ops`** — do not
reimplement them, and do not change `wiki-ops`:
- **Validator:** `wiki-ops lint` (`.claude/skills/wiki-ops/SKILL.md` §`/wiki-ops lint`) —
  the health check whose "clean" verdict is this loop's **done-rule**.
- **Generator:** `wiki-ops` fix actions (ingest / update / cross-reference) — applied to
  resolve one defect at a time.

It is the **first loop forged by `validator-forge`** and mirrors the loop posture of
`autoresearch` (`.claude/skills/autoresearch/SKILL.md`): **bounded, ledgered, autonomous
within budget, no metered spend.**

Read `docs/KNOWLEDGE_WIKI.md` and the `wiki-ops` skill before any run.

## The validator (the done-rule)

`wiki-ops lint` reports defects in named classes. **"Done" = zero defects of the *gating*
(auto-fixable) classes.** Human-gated classes do **not** block "done" and do **not**
consume budget — they are surfaced for a human and (where applicable) routed to
`autoresearch`.

## The class split (the critical guardrail)

### Auto-fixable (gating — the loop resolves these autonomously, one per iteration)

| Defect class | Fix action |
|---|---|
| **Typo/duplicate wikilinks** | A `[[link]]` whose target page doesn't exist but clearly matches an existing page (typo, casing, duplicate name) → rewrite the link to the correct existing page. *Structural; no new content.* |
| **Missing `index.md` entries** | A page on disk not listed in `index.md` → append it in the correct alphabetical section, in the existing `- [[Display Name]](path) — summary` format. |
| **Missing cross-references** | Two pages already relate in prose (one names the other / they share a concept) but lack `## See Also` `[[wikilinks]]` → add the See-Also entries. *Relationship already stated; no new claims.* |

**Never auto-create stub pages.** A genuine missing-concept link is human-gated (below) — an
empty stub just becomes the next lint's thin/orphan defect.

### Human-gated (the loop surfaces with specifics, never resolves)

| Defect class | Handoff |
|---|---|
| **Missing pages (genuine new concept)** — a `[[link]]` to a concept that should exist | Route to `autoresearch` with the concept as the topic. |
| **Orphan pages** — exist with no inbound links and no clearly-related page to link from | Surface the page path. *(If a clearly-related page exists, it's the auto-fixable "missing cross-references" case instead.)* |
| **Contradictions** between pages | Flag with specific quotes from each page (the wiki's "never silently overwrite" rule). |
| **Stale claims** — superseded by newer sources | Flag with the newer source. |
| **Thin / single-source coverage** | Route to `autoresearch` with the gap as the topic. |

## `/wiki-gardener [N]` — one autonomous run (default budget `N=10`)

1. Run `wiki-ops lint`. Map each finding to a class above.
2. **Zero gating-class defects** → **stop: done** (go to step 6). Human-gated-only results
   stop here too — those don't block "done" or consume budget.
3. **Budget `N` exhausted** → **stop: budget** (go to step 6). `N` counts **auto-fixes
   applied**; lint/re-lint and surfacing are free.
4. Pick **one** auto-fixable defect (deterministic order: typo/duplicate wikilinks →
   missing `index.md` entries → missing cross-references; order is immaterial to the end
   state since the loop is exhaustive). Apply the fix via the matching `wiki-ops` action.
   **Commit it** as its own revertable commit:
   `docs(wiki): wiki-gardener — fix <class> on <page edited>` (for a typo-link fix, the
   source page where the link was rewritten).
5. **Re-lint** → return to step 1. **One defect per iteration — never batch.**
6. **Summarize** in-session (fixes applied with commit SHAs; every human-gated defect with
   its specifics/handoff) and append the run's ledger entry to `docs/wiki/log.md`.

**Do not pause for per-fix approval mid-run** (mirrors autoresearch's "NEVER STOP
mid-budget, bounded by `N`"). The human invoked the run and reviews the summary; the safety
net is `git revert`, not a mid-loop gate.

## Ledger (appended to `docs/wiki/log.md`)

```
## [YYYY-MM-DD] wiki-gardener | run (budget N=<n>)
Iterations: <n>   Stop reason: done | budget
Fixed (auto):
  - <class> on [[Page]] — <commit sha7>
Surfaced (human-gated):
  - <class> on [[Page]] — <one-line specifics / handoff>
Note: <one line>
```

## Hard guardrails (inherited from wiki-ops / autoresearch)

- **Writes only to `docs/wiki/`.** Never edits app code, schema, RLS, auth, other skills,
  or `docs/validator-forge/`. **Read-only against `docs/wiki/raw/`** (sources are immutable).
- **No metered/client spend.** Runs in the local Claude Code session.
- **Flag, don't overwrite** — contradictions are surfaced, never autonomously resolved.
- **One defect per iteration** — fix one auto-fixable defect, then re-lint; never batch.
- **Human-gated classes are never auto-resolved.**
- **Budget `N` bounds cost** (default 10).

## Relationship to siblings

- `autoresearch` (growth) + `wiki-gardener` (maintenance) = the complete
  self-improving-wiki cycle. This loop routes missing-concept and thin-coverage defects
  *to* `autoresearch`.
- `wiki-ops` stays the advisory toolbox; this is the autonomous loop that orchestrates it.
  `wiki-ops lint` remains human-gated when invoked directly — auto-apply lives only here.
- `validator-forge` forged this loop
  (`docs/validator-forge/2026-06-23-wiki-gardener-loop.proposal.md`).

## See Also

- [[Self-Improving App]] — wiki-gardener is the maintenance half
- [[Four-Condition Loop Test]] — `wiki-ops lint` is the condition-#2 validator
- `.claude/skills/wiki-ops/SKILL.md` — generator + validator live here
- `.claude/skills/autoresearch/SKILL.md` — the growth loop + loop/ledger pattern
- `.claude/skills/validator-forge/SKILL.md` — forged this loop
````

- [ ] **Step 3: Verify the structure (the "test")**

Using the Grep tool against `.claude/skills/wiki-gardener/SKILL.md`, confirm each pattern matches at least once. Expected: **all present**.

| Pattern | Why it matters |
|---|---|
| `^name: wiki-gardener$` | valid frontmatter name (discoverable) |
| `/wiki-gardener` | trigger phrase in description |
| `## The class split` | the core guardrail section |
| `Auto-fixable` and `Human-gated` | both sides of the split present |
| `Never auto-create stub pages` | the dropped-scope guardrail (spec §4 refinement) |
| `Writes only to .docs/wiki/.` | write-scope guardrail |
| `One defect per iteration` | batching guardrail |
| `stop: done` and `stop: budget` | both stop conditions |
| `docs/wiki/log.md` | ledger target |
| `autoresearch` | the handoff target / sibling |

- [ ] **Step 4: Verify no posture contradiction**

Confirm the file contains **no** instruction to edit app code, schema, RLS, auth, `wiki-ops`, other skills, or `docs/validator-forge/`; that it routes missing-concept/thin-coverage to `autoresearch` rather than inventing content; and that contradictions are flagged, never resolved. (Read the "Hard guardrails" and class-split sections and confirm.)

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/wiki-gardener/SKILL.md
git commit -m "feat(skill): add wiki-gardener maintenance-loop skill

Standalone autonomous loop (sibling of autoresearch) that runs wiki-ops lint
as a validator: lint -> fix one auto-fixable structural defect -> commit ->
re-lint, until clean or budget N. Surfaces human-gated defects and routes
research gaps to autoresearch. Writes only to docs/wiki/."
```

---

## Task 2: Dogfood acceptance run

The genuine acceptance test: run the loop on the **real** wiki and verify it against the spec's §8 success criteria. **This run makes real edits + commits to `docs/wiki/`** — that is intended; each auto-fix is its own revertable commit.

**Files:**
- Produced by the run: edits + per-fix commits under `docs/wiki/`, plus a ledger entry appended to `docs/wiki/log.md`.

- [ ] **Step 1: Record the pre-run HEAD (and confirm a clean tree)**

```bash
git status --porcelain   # expected: empty — start from a clean tree
git rev-parse --short HEAD
```
Note this SHA — it's the base for verifying which commits the run created. If the tree is **not** clean before starting, stop and commit/stash the unrelated changes first, so the Step 4 post-run cleanliness check is unambiguous.

- [ ] **Step 2: Run the loop**

Read `.claude/skills/wiki-gardener/SKILL.md` in full, then execute its `/wiki-gardener` flow directly (do not depend on the Skill-tool registry listing the freshly-created skill). Use default budget `N=10`. Let it: run `wiki-ops lint`, classify findings, and for each auto-fixable defect (in the deterministic order) apply the `wiki-ops` fix, commit it as its own commit, and re-lint — until zero gating-class defects or budget exhausted. Then append the ledger entry to `docs/wiki/log.md` and commit that.

**Do not resolve any human-gated defect** (contradictions, stale claims, thin coverage, orphan pages, genuine missing-concept links) — surface them in the summary and route missing-concept/thin-coverage to `autoresearch` as topics (named, not researched here).

- [ ] **Step 3: Verify against §8 success criteria**

Confirm **all** that apply:

- [ ] The run ran `wiki-ops lint` and classified findings into the auto-fixable vs human-gated classes from spec §4.
- [ ] **Only auto-fixable classes were changed.** Inspect each new commit since the pre-run SHA (`git log --oneline <preSHA>..HEAD` and `git show` each): every change is a typo-link rewrite, a missing `index.md` entry, or an added `## See Also` cross-reference. **No** contradiction was resolved, no stale claim rewritten, no stub page created, no thin-coverage content invented.
- [ ] **One defect per commit** (not batched) — each fix is its own commit with a `docs(wiki): wiki-gardener — fix <class> on <page>` message.
- [ ] **Human-gated defects were surfaced, not resolved**, and missing-concept/thin-coverage were named as `autoresearch` handoffs.
- [ ] A ledger entry was appended to `docs/wiki/log.md` in the spec's format (Iterations, Stop reason, Fixed (auto), Surfaced (human-gated)).
- [ ] The run **stopped** correctly: either zero gating defects (done) or budget `N` exhausted (budget).

**Note the clean-wiki case:** if `lint` finds **no** auto-fixable defects, the run correctly stops `done` with no fix commits — that still validates the loop's detection + stop path. In that case, verify the summary lists any human-gated defects and the ledger records `Iterations: 0, Stop reason: done`, and skip the per-commit checks above.

If any assertion fails (e.g. a human-gated defect was auto-resolved, or a write landed outside `docs/wiki/`), fix `SKILL.md` (return to Task 1), **`git revert` or reset the bad commits**, and re-run.

- [ ] **Step 4: Verify writes stayed in `docs/wiki/`**

```bash
git diff --name-only <preSHA>..HEAD
```
Expected: **every** path is under `docs/wiki/`. If anything under `src/`, `supabase/`, other `.claude/skills/`, `docs/validator-forge/`, or app config changed, the guardrail failed — revert those changes and tighten `SKILL.md`.

Also confirm the working tree is clean afterward:
```bash
git status --porcelain
```
Expected: empty (all fixes committed).

- [ ] **Step 5: (Commits already made during the run)**

The run committed each fix and the ledger as it went (Step 2), so there is nothing extra to commit here. Confirm `git log --oneline <preSHA>..HEAD` shows the per-fix commits + the ledger commit.

---

## Task 3: Discoverability — mark wiki-gardener as built

`self-improving-app.md` currently mentions the wiki-gardener loop as *forthcoming/proposed* (added during the validator-forge work). Update it to reflect that the skill now exists. Additive/accurate edit; follow the wiki's "never silently overwrite a claim's meaning" rule — you are updating a forthcoming→built status, not deleting content.

**Files:**
- Modify: `docs/wiki/concepts/self-improving-app.md`

- [ ] **Step 1: Read the page and locate the wiki-gardener mention**

Read `docs/wiki/concepts/self-improving-app.md` fully. Find the "Maintenance counterpart" / wiki-gardener line added during the validator-forge work (it marks the loop as forthcoming/proposed).

- [ ] **Step 2: Update the status from forthcoming → built**

Reword that line so it states the `wiki-gardener` skill is now implemented (`.claude/skills/wiki-gardener/SKILL.md`) as the maintenance counterpart to `autoresearch`'s growth loop, completing the self-improving-wiki cycle. Keep it 1–2 sentences; reference the skill by path (as siblings are referenced). Do not alter any other claim on the page.

- [ ] **Step 3: Verify**

Using the Grep tool, confirm `wiki-gardener` appears in `docs/wiki/concepts/self-improving-app.md` and that the wording now reflects "built/implemented" rather than "forthcoming/proposed". Re-read your `git diff` to confirm the edit is a status update only — no other claim changed.

- [ ] **Step 4: Commit**

```bash
git add docs/wiki/concepts/self-improving-app.md
git commit -m "docs(wiki): mark wiki-gardener maintenance loop as built

Update self-improving-app.md from 'forthcoming' to implemented now that the
wiki-gardener skill exists."
```

---

## Done criteria (whole plan)

- [ ] `.claude/skills/wiki-gardener/SKILL.md` exists, passes structural checks, contradicts no sibling guardrail.
- [ ] `/wiki-gardener` ran on the real wiki and met spec §8: auto-fixed only auto-fixable classes (one revertable commit each), surfaced/routed human-gated defects, appended a `log.md` ledger entry, stopped at clean-or-budget.
- [ ] `git diff --name-only <preSHA>..HEAD` for the run shows writes only under `docs/wiki/`.
- [ ] `self-improving-app.md` reflects wiki-gardener as built (not an orphan; status accurate).
- [ ] No application code, schema, edge functions, or `wiki-ops`/`autoresearch` source were touched (docs/skill-only; app gate N/A).
