---
title: Self-Improving App
type: concept
created: 2026-06-17
updated: 2026-06-17
sources: [.claude/skills/autoresearch/SKILL.md, autoresearch/program.md]
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
- **[[wiki-ops]]** — the ingest / query / lint flow over the wiki.

## Acceptance gate (the `val_bpb` analog)

A finding is **kept** only if it (1) fills a real gap, (2) is verified by ≥2
independent external sources or grounded in repo code/docs with file paths, and
(3) is non-contradictory (or the contradiction is explicitly flagged). Otherwise
it is **discarded** or **flagged**. Only `kept` findings become pages — this is
what stops the loop from polluting the wiki.

## Roadmap

1. **Phase 1 (now):** grow the wiki across technical, competitive, and strategy domains.
2. **Phase 2 — Aria learns:** `sync-aria` pushes verified pages into the AIOS
   knowledge base (RAG via OpenAI embeddings, behind the `knowledge-sync` edge
   function) so [[Aria]] reasons over them. One loop, two outputs: wiki for humans,
   RAG for the product.
3. **Phase 3 — telemetry→wiki bridge:** `findings` (from the [[Report-Ingest Seam]]),
   error logs, and Supabase advisors drive gap detection.
4. **Phase 4 — fix proposals:** verified-issue remediation specs / draft PRs,
   human-gated, never auto-merged.
5. **Phase 5 — KPI/briefing autopilot:** a living KPI page tracked against the
   deck's `metric_snapshots` / `briefings`; flag when a target slips.

## Guardrails

Writes only to `docs/wiki/` (Phase 1). Never edits app code, schema, RLS, or auth;
code/bug ideas become wiki *proposal* pages for human review. Flags empirical
claims for in-place verification rather than asserting them in codebase docs.

## See Also

- [[Harbormill AIOS]]
- [[Aria]]
- [[Report-Ingest Seam]]
- [[Project Context]]
