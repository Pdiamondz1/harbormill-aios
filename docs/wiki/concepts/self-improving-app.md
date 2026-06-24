---
title: Self-Improving App
type: concept
created: 2026-06-17
updated: 2026-06-24
sources: [.claude/skills/autoresearch/SKILL.md, autoresearch/program.md, docs/wiki/log.md, docs/wiki/memory.md]
tags: [architecture, autoresearch, ai, roadmap]
---

# Self-Improving App

The architecture behind the `autoresearch` skill: an autonomous loop that makes
the project's knowledge compound over time. It is a domain-swap of Andrej
Karpathy's MIT-licensed `autoresearch` pattern (vendored at `autoresearch/`,
see `autoresearch/program.md`).

## The loop

Karpathy's loop edits `train.py` and keeps a change only if `val_bpb` drops.
Here the loop **researches a knowledge gap → verifies it against an acceptance
gate → ingests a page into `docs/wiki/`**. The wiki is the artifact that improves
each iteration. It orchestrates two skills and reimplements neither:

- **`deep-research`** (built-in) — web search, fetch, adversarial verification,
  cited synthesis. Replaced the old Exa `search` skill — no external account.
- **`wiki-ops`** (skill) — the ingest / query / lint flow over the wiki.

## Acceptance gate (the `val_bpb` analog)

A finding is **kept** only if it (1) fills a real gap, (2) is verified by ≥2
independent external sources or grounded in repo code/docs with file paths, and
(3) is non-contradictory (or the contradiction is explicitly flagged). Otherwise
it is **discarded** or **flagged**. Only `kept` findings become pages — this is
what stops the loop from polluting the wiki.

The gate now runs as an **independent, fresh-context verifier** rather than the
producing agent self-grading: a separate subagent — the `loop-verify` skill
(`.claude/skills/loop-verify/SKILL.md`), dispatched via the Agent tool with a fresh
context — scores the candidate **1-10** and gates on a threshold (default 8, with
sourcing/accuracy floors). This is distinct from `deep-research`'s in-flow adversarial
checks, which run during *production*; `loop-verify` is the *final, independent* done-rule,
so the loop never grades its own homework. The score is recorded per iteration in `log.md`,
making each done-decision auditable. It is the reusable, concrete form of a `validator-forge`
validator and the condition-#2 validator any loop can adopt.

## Loop memory (two files per run)

Each run writes **two records**, mirroring and then extending Karpathy's pattern:

- **`docs/wiki/log.md`** — the append-only run **ledger** (his `results.tsv` analog): one raw
  row per iteration (status, verifier score, sources, note), never pruned. *What happened, when.*
- **`docs/wiki/memory.md`** — a curated, bounded **lessons file** (what works, what to avoid,
  open flags to skip, what to try next) that the loop **reads at the start of every run** to
  steer gap selection and **rewrites/prunes at the end**. *What the next run should do
  differently.* This is what makes the loop **learn over runs** instead of re-discovering the
  same dead-ends.

This goes **beyond** Karpathy's original, whose only forward-carried "memory" is the git history
of kept commits — the project adds an explicit, read-back prose memory. Both files are
operational (no frontmatter, excluded from Aria-sync and `index.md`), distinct from the knowledge
pages the loop produces.

## Roadmap

1. **Phase 1 (now):** grow the wiki across technical, competitive, and strategy domains.
2. **Phase 2 — Aria learns *(shipped)*:** `sync-aria` pushes verified pages into
   the AIOS knowledge base (RAG via OpenAI embeddings, behind the `knowledge-sync`
   edge function) so [[Aria]] reasons over them. One loop, two outputs: wiki for
   humans, RAG for the product. Implemented as [[Wiki-to-Aria Sync]]
   (`npm run sync:wiki`).
3. **Phase 3 — telemetry→wiki bridge:** `findings` (from the [[Report-Ingest Seam]]),
   error logs, and Supabase advisors drive gap detection.
4. **Phase 4 — fix proposals:** verified-issue remediation specs / draft PRs,
   human-gated, never auto-merged.
5. **Phase 5 — KPI/briefing autopilot:** a living KPI page tracked against the
   deck's `metric_snapshots` / `briefings`; flag when a target slips.

## Maintenance counterpart

The autoresearch loop *grows* the wiki; the **`wiki-gardener`** skill
(`.claude/skills/wiki-gardener/SKILL.md`) *prunes and validates* it — running
`wiki-ops lint` as the objective done-rule so it qualifies under condition #2 of
the [[Four-Condition Loop Test]]. This maintenance counterpart is now
**implemented**, completing the self-improving-wiki cycle: `autoresearch` grows
the wiki, `wiki-gardener` keeps it clean. It was emitted as a build-first
proposal by the **`validator-forge`** skill
(`.claude/skills/validator-forge/SKILL.md`), which identifies which existing
capability can become the validator that unblocks a blocked loop candidate.

## Guardrails

Writes only to `docs/wiki/` (Phase 1). Never edits app code, schema, RLS, or auth;
code/bug ideas become wiki *proposal* pages for human review. Flags empirical
claims for in-place verification rather than asserting them in codebase docs.

## See Also

- [[Harbormill AIOS]]
- [[Aria]]
- [[Wiki-to-Aria Sync]]
- [[Report-Ingest Seam]]
- [[Project Context]]
- [[Four-Condition Loop Test]]
- [[KPI-Watch Loop]]
- Maintenance companion skill: `.claude/skills/wiki-gardener/SKILL.md`
- Validator-forge (proposed the maintenance loop): `.claude/skills/validator-forge/SKILL.md`
- Independent verifier for the acceptance gate: `.claude/skills/loop-verify/SKILL.md`
