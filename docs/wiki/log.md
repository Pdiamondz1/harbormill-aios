# Wiki Log

## [2026-06-17] autoresearch loop | budget 8 — 8 gaps closed

Ran `/autoresearch loop 8`. Lint of the seed wiki found core systems with no
page (Supabase, edge functions, the tool registry, the data model, Workspace, the
deploy flow) plus two thin strategy areas. Ranked and filled the top 8; all passed
the acceptance gate (6 repo-grounded with file paths, 2 backed by ≥2 external
sources). 8 kept, 0 discarded, 0 flagged-as-contradiction (one strategy *observation*
flag recorded on [[The Harbormill Ladder]]).

### Iteration 1 | Supabase (entity)
Status: kept · Domain: technical
Sources: supabase/migrations/*, supabase/functions/*, supabase/seed.sql
Pages created: [[Supabase]]

### Iteration 2 | Edge Functions (entity)
Status: kept · Domain: technical
Sources: supabase/functions/{report-ingest,assistant-chat,knowledge-sync,google-workspace-proxy}/index.ts, _shared/
Pages created: [[Edge Functions]]

### Iteration 3 | AI Tool Registry (concept)
Status: kept · Domain: technical
Sources: supabase/functions/assistant-chat/tools.ts + index.ts
Pages created: [[AI Tool Registry]]

### Iteration 4 | Operating Deck Data Model (concept)
Status: kept · Domain: technical
Sources: supabase/migrations/20260617000100_operating_deck.sql, report-ingest/index.ts, src/hooks/use{Metrics,Briefings,Findings}.ts
Pages created: [[Operating Deck Data Model]]

### Iteration 5 | Google Workspace Bridge (entity)
Status: kept · Domain: technical
Sources: supabase/functions/google-workspace-proxy/index.ts, _shared/google-workspace.ts, src/pages/Workspace.tsx, migrations/20260617000300_workspace.sql
Pages created: [[Google Workspace Bridge]]

### Iteration 6 | Per-Client Deployment (concept)
Status: kept · Domain: technical
Sources: docs/per-client-workflow.md, docs/client-setup.md, docs/white-label.md, docs/extending.md
Pages created: [[Per-Client Deployment]]

### Iteration 7 | The Harbormill Ladder (concept)
Status: kept · Domain: strategy
Sources: docs/PROJECT_CONTEXT.md, website/src/config/site.ts; external — consultingsuccess.com, manyrequests.com, assembly.com (≥2 independent)
Pages created: [[The Harbormill Ladder]]
Note: recorded a strategy observation — Rung 0 is hourly, not fixed-scope; a named fixed-price starter package would be more "productized."

### Iteration 8 | SMB AI-Automation Landscape (analysis)
Status: kept · Domain: competitive
Sources: external — ai-crescent.com (Gartner >50% SMB adoption, 67% saw 20%+ revenue growth), upwork.com state-of-AI, biztechmagazine.com (≥2 independent)
Pages created: [[SMB AI-Automation Landscape]]

### Budget exhausted (8/8). Wiki grew from 7 → 15 pages. Suggested next gaps: the
### front-end shell/routing (AppLayout, ProtectedRoute), the knowledge/RAG model
### (knowledge table + match_knowledge), and the marketing site (website/) entity.

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
