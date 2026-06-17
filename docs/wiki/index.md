# Wiki Index

## Sources

- [[Project Context]](sources/project-context.md) — Harbormill identity, strategy, architecture, and operating instructions (2026-06-17)

## Entities

- [[Aria]](entities/aria.md) — The operator's AI co-pilot; pluggable tool registry in assistant-chat/tools.ts
- [[Edge Functions]](entities/edge-functions.md) — The four Deno functions: report-ingest, assistant-chat, knowledge-sync, google-workspace-proxy
- [[Google Workspace Bridge]](entities/google-workspace-bridge.md) — Per-user OAuth gateway to Drive/Sheets; tokens stay server-side
- [[Harbormill AIOS]](entities/harbormill-aios.md) — The white-label AI operating-deck product
- [[Supabase]](entities/supabase.md) — Backend: Postgres + RLS + Auth + Deno edge functions; per-client project

## Concepts

- [[Access Model]](concepts/access-model.md) — admin/stakeholder roles, user_roles, RLS helpers, findings admin-only
- [[AI Tool Registry]](concepts/ai-tool-registry.md) — Aria's pluggable TOOLS array in assistant-chat/tools.ts; six tools, add by appending
- [[Operating Deck Data Model]](concepts/operating-deck-data-model.md) — The three generic tables: metric_snapshots, briefings, findings
- [[Per-Client Deployment]](concepts/per-client-deployment.md) — Clone-per-client off the template; upstream-merge discipline; config/data seams
- [[Report-Ingest Seam]](concepts/report-ingest-seam.md) — One service-role ingest endpoint; the deck never queries client tables
- [[Self-Improving App]](concepts/self-improving-app.md) — The autoresearch loop grows the wiki (+ later Aria's RAG); 5-phase smart-app roadmap
- [[The Harbormill Ladder]](concepts/harbormill-ladder.md) — Land-and-expand engagement + pricing ladder; externally benchmarked
- [[White-Label Architecture]](concepts/white-label-architecture.md) — One config (brand.ts + CSS vars) rebrands everything; per-client clone

## Analyses

- [[SMB AI-Automation Landscape]](analyses/smb-ai-automation-landscape.md) — 2026 market scan; fragmented tool ecosystem; Harbormill's deck + education-first wedge
