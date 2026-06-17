# Wiki Log

## [2026-06-17] update | Autoresearch loop replaces the Exa search skill

Added the `autoresearch` skill — a domain-swap of Karpathy's autonomous loop
(vendored at `autoresearch/`, MIT) that researches a gap → verifies it → ingests
a page, orchestrating the built-in `deep-research` harness + `wiki-ops`. Removed
the Exa-based `search` skill (no external account needed now). Rewired wiki-ops
and CLAUDE.md references accordingly.
Pages created: [[Self-Improving App]] (concept).
Pages updated: index.md (1 new concept entry).

## [2026-06-17] ingest | Initial seeding — Project Context + architecture keystones

Stood up the knowledge wiki and the `wiki-ops` + `search` skills (ported and
adapted from the DragonCandy pattern). Wrote the canonical `docs/PROJECT_CONTEXT.md`
(Harbormill identity, stack, architecture keystones, access model, the Harbormill
Ladder) and seeded the wiki from it plus `CLAUDE.md`.

Pages created: [[Project Context]] (source); [[Harbormill AIOS]], [[Aria]]
(entities); [[White-Label Architecture]], [[Report-Ingest Seam]], [[Access Model]]
(concepts).
Pages updated: index.md (initial seeding).
