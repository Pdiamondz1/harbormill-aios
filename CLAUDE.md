# Harbormill AIOS — agent guide

A **white-label AI operating-deck template** Harbormill clones per client. This is the base
template; client deployments are separate repos cloned from it (see `docs/per-client-workflow.md`).

**Project context & knowledge wiki:** the canonical identity, strategy, and architecture live in
@docs/PROJECT_CONTEXT.md (auto-imported). The knowledge wiki is at `docs/wiki/` — query or extend it
with the `wiki-ops` skill; pull external research with the `search` skill.

## Stack
React 18 + Vite + TypeScript (strict) · Tailwind + shadcn/ui · TanStack Query · React Router ·
Supabase (Postgres + RLS + Deno edge functions) · Anthropic chat (default `claude-sonnet-4-6`) +
OpenAI embeddings.

## Commands (the gate — run before claiming done)
```bash
npm run dev         # http://127.0.0.1:8080
npm run typecheck   # tsc strict
npm run lint        # eslint (2 known react-refresh warnings on button.tsx/AuthContext.tsx are OK)
npm run build       # vite
npm run test        # vitest
```
Edge functions (`supabase/functions/*`) are Deno — NOT covered by the above; validate them on deploy.

## Architecture keystones (preserve these)
1. **One config rebrands everything** — `src/config/brand.ts` (words/names/logos) + CSS variables in
   `src/index.css` (`:root`/`.dark`). No component hardcodes brand or color. Dark-first.
2. **One service-role ingest seam** — `supabase/functions/report-ingest` pushes generic
   `metric_snapshots`/`briefings`/`findings` in. The deck NEVER queries client business tables.
3. **Pluggable AI tool registry** — `supabase/functions/assistant-chat/tools.ts`; add tools here.
4. **Per-client deploy** — env-only Supabase client (`src/integrations/supabase/client.ts`), NO
   fallback creds. Each client = own Supabase + Google Cloud + AI keys.

## Access model
`app_role` = admin | stakeholder (provisioned via `user_roles`, no public signup). RLS gates:
`has_role`, `is_admin`, `has_access`. Findings are admin-only.

## Where things live
- Pages: `src/pages/` (Overview, Briefings, Findings, Strategy, Workspace, Assistant, Login).
- Shell/nav: `src/components/layout/AppLayout.tsx`. Hooks: `src/hooks/`.
- Edge fns: `report-ingest`, `assistant-chat` (+ `tools.ts`), `knowledge-sync`, `google-workspace-proxy`; shared in `_shared/`.
- Migrations: `supabase/migrations/`. Demo data: `supabase/seed.sql`.

## Docs
`docs/client-setup.md` (deploy) · `docs/white-label.md` (rebrand) · `docs/extending.md` (add tools/metrics/pages) ·
`docs/per-client-workflow.md` (clone-per-client + upstream-merge discipline).

## Conventions
- Customize in the config/data seams; don't fork the shared engine (see per-client-workflow.md).
- Reusable improvements go back into this base template, then flow to client repos via `upstream`.
- Match existing token-based styling (`bg-primary`, `text-muted-foreground`, …) — never hardcode hex.
