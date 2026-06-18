# Wiki Log

## [2026-06-18] ship | sync-aria — wiki → Aria's RAG (Self-Improving App Phase 2)

Shipped Phase 2 of the [[Self-Improving App]] roadmap: the wiki now feeds the
product's RAG. Built `scripts/sync-wiki.mjs` + `npm run sync:wiki` (zero-dep Node;
reads `docs/wiki/`, skips index/log, strips frontmatter, idempotent on
`source_id = "wiki:<path>"`), docs at `docs/sync-aria.md`. Deployed the
`knowledge-sync` edge function to the live demo project and **embedded all 31 wiki
pages** into `public.knowledge` (`metadata.origin = wiki`); verified retrieval and
a grounded Aria answer in the deck.

Operational finding (generalized into the wiki): on Supabase's **new API-key
system**, service-role functions authenticate against the injected
`SUPABASE_SERVICE_ROLE_KEY` = the **`sb_secret_…`** key, not the legacy `eyJ…`
service_role JWT (the legacy JWT 401s despite decoding to `role=service_role`).

Pages created: [[Wiki-to-Aria Sync]] (concept).
Pages updated: [[Knowledge & RAG]], [[Self-Improving App]], [[Edge Functions]],
index.md (1 new concept entry). Wiki at 32 pages.

## [2026-06-17] autoresearch loop | budget 8 (run 3) — 8 gaps closed

Third `/autoresearch loop 8`, targeting the dev/ops, design-system, content, and
identity layers. 8 kept (all repo/internal-grounded with file paths; Damon Williams
also cites LinkedIn). 0 discarded, 0 contradictions. Wiki grew 23 → 31 pages.
Two coverage observations flagged (Testing Setup; carried Ladder flag).

### Iteration 1 | Design Tokens & Theming (concept)
Status: kept · Domain: technical
Sources: src/index.css, tailwind.config.ts
Pages created: [[Design Tokens & Theming]]

### Iteration 2 | Build & Verification Gate (concept)
Status: kept · Domain: technical
Sources: package.json, .github/workflows/ci.yml, vite.config.ts
Pages created: [[Build & Verification Gate]]

### Iteration 3 | Testing Setup (concept)
Status: kept · Domain: technical
Sources: vite.config.ts, src/test/setup.ts, src/config/brand.test.ts
Pages created: [[Testing Setup]]
Note: coverage observation — only 1 test file (brand contract); harness ready for hooks/route/ingest tests.

### Iteration 4 | Extending AIOS (concept)
Status: kept · Domain: technical
Sources: docs/extending.md + the four seams (tools.ts, report-ingest, knowledge-sync, App.tsx/AppLayout.tsx)
Pages created: [[Extending AIOS]]

### Iteration 5 | Strategy Knowledge Library (concept)
Status: kept · Domain: technical
Sources: migrations/...operating_deck.sql (documents), src/pages/Strategy.tsx, src/hooks/useDocuments.ts, knowledge-sync
Pages created: [[Strategy Knowledge Library]]

### Iteration 6 | Demo Seed Data (concept)
Status: kept · Domain: technical
Sources: supabase/seed.sql
Pages created: [[Demo Seed Data]]

### Iteration 7 | Calendly Booking Flow (concept)
Status: kept · Domain: technical
Sources: website/src/lib/calendly.ts, website/src/sections/Booking.tsx, website/src/components/CalendlyButton.tsx, website/src/config/site.ts
Pages created: [[Calendly Booking Flow]]

### Iteration 8 | Damon Williams (entity)
Status: kept · Domain: identity
Sources: docs/PROJECT_CONTEXT.md, website/src/config/site.ts; external — linkedin.com/in/damon-w-67882768
Pages created: [[Damon Williams]]

### Budget exhausted (8/8). Wiki at 31 pages. Remaining thinner gaps: the _shared
### edge utilities, the brand.ts config surface in depth, and the Workspace OAuth
### state/HMAC flow. Wiki now broadly covers product, backend, frontend, dev-ops,
### GTM, and identity — diminishing returns; a query-driven (not loop) approach
### fits better from here.

## [2026-06-17] autoresearch loop | budget 8 (run 2) — 8 gaps closed

Second `/autoresearch loop 8`. Lint showed the wiki was backend-heavy; targeted
the front-end + remaining cross-cutting systems + the marketing/strategy layer.
8 kept (7 repo-grounded with file paths, 1 — Education-First — internal + ≥2
external sources). 0 discarded, 0 contradictions. Wiki grew 15 → 23 pages.

### Iteration 1 | AIOS App Shell (concept)
Status: kept · Domain: technical
Sources: src/App.tsx, src/main.tsx, src/components/layout/AppLayout.tsx, src/contexts/AuthContext.tsx, src/components/ProtectedRoute.tsx, src/hooks/useAccess.ts, src/integrations/supabase/client.ts
Pages created: [[AIOS App Shell]]

### Iteration 2 | AIOS Pages (concept)
Status: kept · Domain: technical
Sources: src/pages/* (Overview, Briefings, Findings, Strategy, Assistant, Workspace, WorkspaceCallback, Login)
Pages created: [[AIOS Pages]]

### Iteration 3 | Knowledge & RAG (concept)
Status: kept · Domain: technical
Sources: supabase/migrations/20260617000200_assistant.sql, supabase/functions/knowledge-sync/index.ts, assistant-chat/tools.ts
Pages created: [[Knowledge & RAG]]

### Iteration 4 | Assistant Chat Loop (concept)
Status: kept · Domain: technical
Sources: supabase/functions/assistant-chat/index.ts, migrations/...assistant.sql, src/hooks/useAssistant.ts
Pages created: [[Assistant Chat Loop]]

### Iteration 5 | Cost Ledger (concept)
Status: kept · Domain: technical
Sources: supabase/migrations/20260617000200_assistant.sql, supabase/functions/_shared/cost-ledger.ts
Pages created: [[Cost Ledger]]

### Iteration 6 | AI Providers (entity)
Status: kept · Domain: technical
Sources: assistant-chat/index.ts + tools.ts, knowledge-sync/index.ts, CLAUDE.md
Pages created: [[AI Providers]]

### Iteration 7 | Marketing Site (entity)
Status: kept · Domain: technical
Sources: website/, website/src/config/site.ts, website/vercel.json, website/scripts/lead-capture.gs
Pages created: [[Marketing Site]]

### Iteration 8 | Education-First Philosophy (concept)
Status: kept · Domain: strategy
Sources: docs/PROJECT_CONTEXT.md, website/src/config/site.ts; external — grantthornton.com (70% of programs fall short on capability), vinsys.com / iternal.ai ($3.70/$1, 2.7x proficiency), salesforce.com (SMB hands-on) (≥2 independent)
Pages created: [[Education-First Philosophy]]

### Budget exhausted (8/8). Wiki at 23 pages. Suggested next gaps: the brand/theming
### token system detail, the Strategy/knowledge-library workflow, CI/CD + the gate
### (npm scripts), and an "Aria tools — extending" how-to.

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
