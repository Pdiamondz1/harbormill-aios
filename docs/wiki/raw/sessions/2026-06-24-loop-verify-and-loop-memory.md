---
title: "Session 2026-06-24 — loop-verify & loop-memory"
type: source
created: 2026-06-24
updated: 2026-06-24
sources: []
tags: [session, autoresearch, loops, verification, memory]
---

# Session 2026-06-24 — Independent verification + loop memory

Two enhancements to the `autoresearch` loop orchestration skill, both shipped to `main`.
Each was evaluated from a prompt-card concept, found to be a real gap, then built and shipped.

## What was built

### 1. Independent verification (`loop-verify`) — PR #29 (merged cd95071)
- New reusable skill `.claude/skills/loop-verify/SKILL.md`. The autoresearch acceptance gate now
  runs as a **separate subagent with a fresh context window** (dispatched via the Agent tool,
  `subagent_type: Explore`), not the agent that produced the page.
- The verifier scores the candidate **1-10** against a 5-criterion rubric (sourcing, accuracy,
  gap-fit, clarity, non-redundancy), with **gating floors** on sourcing & accuracy (floor 7).
  Default threshold `MIN_SCORE = 8`. Outcome maps to the existing `kept`/`discarded`/`flagged`
  ledger.
- Closes condition #2 ("a rule decides done") of the Four-Condition Loop Test with an
  *independent* done-rule — the reusable, concrete form of a `validator-forge` validator.

### 2. Loop memory (lessons learned) — PR #31 (merged f67970c)
- New `docs/wiki/memory.md`: a curated, bounded lessons file the loop **reads at the start of
  every run** (to steer gap selection — skip dead-ends, honor open flags, prefer "try next") and
  **rewrites/prunes at the end**.
- Distinct from the append-only `log.md` audit ledger. This is the "two files per run" pattern:
  Output (the wiki page) + Memory (the lessons).
- `memory.md` excluded from Aria's RAG sync (operational, not knowledge) via `scripts/sync-wiki.mjs`.

## Key decisions
- **Reusable-first, autoresearch-first.** Both built as reusable patterns proven on autoresearch
  (the genuine learning loop); `wiki-gardener` adoption deferred.
- **Verifier reads only the artifact + rubric**, never the producer's transcript — independence is
  the point. `Explore` subagent (read-only) so a verifier can never write to the wiki.
- **`memory.md` is curated + bounded**, not append-only — otherwise it would just duplicate
  `log.md`.
- **Beyond Karpathy.** His original carries lessons only in git history (kept commits); this adds
  an explicit read-back prose memory.

## Verification
- `loop-verify` proven live: a deliberately unsourced candidate scored **3/10 → verdict fail**
  (floors tripped); the verifier independently web-searched and caught the false claims.
- `memory.md` confirmed excluded from `npm run sync:wiki --dry-run` (40 pages synced, memory.md
  not among them).
- Gate green on both PRs (typecheck/lint/build/30 tests); Vercel production deploys green.

## Patterns worth preserving
- [[Independent Verification]] — a fresh-context scored verifier as a loop's done-rule.
- [[Loop Memory]] — two files per run; distilled lessons read back to make a loop learn.
