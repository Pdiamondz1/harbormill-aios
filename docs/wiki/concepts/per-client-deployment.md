---
title: Per-Client Deployment
type: concept
created: 2026-06-17
updated: 2026-06-17
sources: [docs/per-client-workflow.md, docs/client-setup.md, docs/white-label.md, docs/extending.md]
tags: [architecture, deployment, white-label, ops]
---

# Per-Client Deployment

The fourth keystone in practice: each client runs an isolated clone of
[[Harbormill AIOS]] on their **own** Supabase + Google Cloud + AI keys.

## Clone-per-client

The base repo is a GitHub **template**. A client engagement = "Use this template"
→ a new repo (e.g. `client-x-aios`) → add the base as `upstream`. Improvements
flow **both ways**: base → clients via `git fetch upstream && git merge upstream/main`;
generic features built for one client get ported back to the base for the next.

## What changes vs. what stays

- **Config/data seams (per-client):** `src/config/brand.ts`, `src/index.css`
  theme vars, logos, `supabase/seed.sql`, knowledge docs, bespoke tools appended to
  the [[AI Tool Registry]], bespoke pages, function secrets. See [[White-Label Architecture]].
- **Shared engine (untouched):** contexts/hooks/layout, the [[Edge Functions]],
  core tables + RLS. Merge conflicts concentrate in the seams — take the client's
  side there, upstream elsewhere.

## Deploy steps (`docs/client-setup.md`, ~30–45 min)

1. Create Supabase project → `supabase link && supabase db push`.
2. Seed the first admin via a service-role `INSERT INTO user_roles` ([[Access Model]]).
3. `supabase functions deploy report-ingest assistant-chat knowledge-sync google-workspace-proxy`.
4. Set function secrets (AI keys, Google OAuth).
5. Deploy the frontend with `VITE_SUPABASE_URL` + anon key.
6. Wire the client's scheduled agents to `report-ingest` ([[Report-Ingest Seam]]).

## See Also

- [[White-Label Architecture]]
- [[Edge Functions]]
- [[Access Model]]
- [[Harbormill AIOS]]
