# Wiki Index

## Sources

- [[Ditching Hourly (Jonathan Stark, 2026)]](sources/ditching-hourly-jonathan-stark.md) — Jonathan Stark × Nate (AIS LIVE, Hyperagent); why hourly is the wrong unit, and the percentage-of-value pricing formula
- [[Project Context]](sources/project-context.md) — Harbormill identity, strategy, architecture, and operating instructions (2026-06-17)
- [[What Actually Matters in AI Right Now (2026)]](sources/what-actually-matters-in-ai-2026.md) — Matt Wolfe × Nate (AIS LIVE, Hyperagent); corroborates the loop thesis and reveals the frontier labs shipping it natively

## Entities

- [[AI Providers]](entities/ai-providers.md) — Anthropic (claude-sonnet-4-6, chat) + OpenAI (text-embedding-3-small, RAG); per-client keys
- [[Aria]](entities/aria.md) — The operator's AI co-pilot; pluggable tool registry in assistant-chat/tools.ts
- [[Damon Williams]](entities/damon-williams.md) — Founder & AI Solutions Engineer; 15 yrs enterprise IT; education-first
- [[Edge Functions]](entities/edge-functions.md) — The Deno functions: report-ingest, assistant-chat, knowledge-sync, google-workspace-proxy + the scheduled loops connector-sync & kpi-watch
- [[Google Workspace Bridge]](entities/google-workspace-bridge.md) — Per-user OAuth gateway to Drive/Sheets; tokens stay server-side
- [[Harbormill AIOS]](entities/harbormill-aios.md) — The white-label AI operating-deck product
- [[Marketing Site]](entities/marketing-site.md) — harbormill.net; separate Vite app in website/, Vercel; Calendly + lead capture; Loop Audit offer + "leave it running" trust strip
- [[Supabase]](entities/supabase.md) — Backend: Postgres + RLS + Auth + Deno edge functions; per-client project

## Concepts

- [[Access Model]](concepts/access-model.md) — admin/stakeholder roles, user_roles, RLS helpers, findings admin-only
- [[AI Tool Registry]](concepts/ai-tool-registry.md) — Aria's pluggable TOOLS array in assistant-chat/tools.ts; six tools, add by appending
- [[AIOS App Shell]](concepts/aios-app-shell.md) — Front-end: React Router, AppLayout, AuthContext, ProtectedRoute, env-only client, data hooks
- [[AIOS Pages]](concepts/aios-pages.md) — The user-facing surfaces: Overview, Briefings, Findings, Strategy, Assistant, Workspace, Login
- [[Assistant Chat Loop]](concepts/assistant-chat-loop.md) — Aria's agentic loop: history, 8 tool rounds, model, injection defense, cost logging
- [[Build & Verification Gate]](concepts/build-and-verification-gate.md) — npm scripts + CI (Node 22, npm install vs ci/EBADPLATFORM); Deno excluded
- [[Calendly Booking Flow]](concepts/calendly-booking-flow.md) — Free 30-min intro via Calendly (Google Meet); popup + inline embed; lead funnel
- [[Connector Library]](concepts/connector-library.md) — Managed pg_cron + connector-sync runtime that pulls SaaS data (Stripe first) into metric_snapshots on an hourly schedule
- [[Cost Ledger]](concepts/cost-ledger.md) — Per-user × model × function AI-spend accounting; best-effort logCost
- [[Demo Seed Data]](concepts/demo-seed-data.md) — seed.sql: 8 KPIs, 2 briefings, 2 findings, 2 docs; powers a fresh clone + the demo tour
- [[Design Tokens & Theming]](concepts/design-tokens-and-theming.md) — The HSL palette/utilities (azure/amber, Inter, .glow/.glass); dark-first
- [[Education-First Philosophy]](concepts/education-first-philosophy.md) — Teach AI first, then automate; the differentiator, externally evidenced
- [[Extending AIOS]](concepts/extending-aios.md) — Add metrics/tools/knowledge/pages in the seams; never fork the engine
- [[Four-Condition Loop Test]](concepts/four-condition-loop-test.md) — Gate-then-rank methodology for deciding which repeating work to automate as a loop; reused by the loop-audit skill, a paid Loop Audit, and a future Aria feature
- [[Independent Verification]](concepts/independent-verification.md) — A loop's done-rule run as a separate fresh-context subagent that scores output 1-10 against a rubric (sourcing/accuracy floors, threshold 8); the loop-verify skill
- [[Knowledge & RAG]](concepts/knowledge-and-rag.md) — knowledge table (pgvector 1536 + tsvector hybrid), match_knowledge, knowledge-sync
- [[KPI-Watch Loop]](concepts/kpi-watch.md) — Deterministic daily loop: watches metric_latest, files a finding per breached KPI via report-ingest; the in-product Four-Condition Loop Test; live on both projects
- [[Loop Memory]](concepts/loop-memory.md) — Two files per run: log.md (append-only audit) + memory.md (curated lessons read back next run); makes a loop learn instead of repeating itself
- [[Media Ingest]](concepts/media-ingest.md) — The media→knowledge path: anything that plays → verified transcript → wiki → Aria's RAG; the signal gate, and the rule that third-party material stays local
- [[Operating Deck Data Model]](concepts/operating-deck-data-model.md) — The three generic tables: metric_snapshots, briefings, findings
- [[Per-Client Deployment]](concepts/per-client-deployment.md) — Clone-per-client off the template; upstream-merge discipline; config/data seams
- [[Plug-and-Play Client Compatibility]](concepts/plug-and-play-client-compatibility.md) — Config + data + flags, never a fork: feature flags (features.ts), guided setup, env-only isolation
- [[Report-Ingest Seam]](concepts/report-ingest-seam.md) — One service-role ingest endpoint; the deck never queries client tables
- [[ROI-Discovery Audit]](concepts/roi-discovery-audit.md) — Admin-only prospecting: capture a prospect's value opportunities → compute ROI vs the retainer → export a branded Opportunity Report; sells Rung 2/4 of the ladder
- [[Self-Improving App]](concepts/self-improving-app.md) — The autoresearch loop grows the wiki (+ later Aria's RAG); 5-phase smart-app roadmap
- [[Strategy Knowledge Library]](concepts/strategy-knowledge-library.md) — documents table + Strategy page; the human-authored side feeding Aria's RAG
- [[Testing Setup]](concepts/testing-setup.md) — Vitest + testing-library + jsdom; one brand-contract test today; harness ready
- [[The Harbormill Ladder]](concepts/harbormill-ladder.md) — Land-and-expand engagement + pricing ladder; externally benchmarked
- [[Value-Based Pricing]](concepts/value-based-pricing.md) — Price the outcome, not the effort: cost/value/price anchors, the why conversation, price as ~10-50% of first-year value in three options; the audit computes the input
- [[White-Label Architecture]](concepts/white-label-architecture.md) — One config (brand.ts + CSS vars) rebrands everything; per-client clone
- [[Wiki-to-Aria Sync]](concepts/wiki-to-aria-sync.md) — `npm run sync:wiki` loads docs/wiki/ into Aria's RAG via knowledge-sync; idempotent; sb_secret_ key on new projects

## Analyses

- [[SMB AI-Automation Landscape]](analyses/smb-ai-automation-landscape.md) — 2026 market scan; contradiction flagged 2026-07-15: the frontier labs are becoming the "AI OS" the page says doesn't exist
