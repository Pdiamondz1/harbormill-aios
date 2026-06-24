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

**Wikilink extraction must be newline-tolerant** — a `[[...]]` split across a line break
(it occurs in `marketing-site.md`) is a valid link: neither falsely flagged as a typo nor
dropped from the link graph.

## The class split (the critical guardrail)

### Auto-fixable (gating — the loop resolves these autonomously, one per iteration)

| Defect class | Fix action |
|---|---|
| **Typo/duplicate wikilinks** | A `[[link]]` whose target page doesn't exist but clearly matches an existing page (typo, casing, duplicate name) → rewrite the link to the correct existing page. *Structural; no new content.* |
| **Missing `index.md` entries** | A page on disk not listed in `index.md` → append it in the correct alphabetical section, in the existing `- [[Display Name]](path) — summary` format. |
| **Missing cross-references** | Two pages already relate in prose (one names the other / they share a concept) but lack `## See Also` `[[wikilinks]]` → add the See-Also entries. *Relationship already stated; no new claims.*<br>**Trigger** = a page's own prose body names another existing page (a stated relationship) but that page is absent from that page's own `## See Also`. **Fix** = add the See-Also entry on that page only. **Out of scope → human-gated:** reciprocal back-linking (B linking A merely because A links B) and hub back-linking — those are curation calls, not stated-relationship gaps. Incidental/illustrative mentions where the See Also already curates the material targets are not defects. |

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
