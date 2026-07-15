---
title: Project Context
type: source
created: 2026-06-17
updated: 2026-06-17
sources: [docs/PROJECT_CONTEXT.md]
tags: [strategy, identity, north-star]
---

# Project Context

Single source of truth for Harbormill's identity, strategy, and operating
instructions. Auto-loaded by Claude Code via a `CLAUDE.md` import.

## Key Claims

- [[Harbormill AIOS]] is a white-label AI operating-deck template; this repo is
  the base template, cloned per client with the client's own Supabase, Google
  Cloud, and AI keys.
- Harbormill Automation is the company (harbormill.net) — a custom AI-automation
  consultancy for small businesses. Founder: Damon Williams (AI Solutions
  Engineer; 15 yrs enterprise IT infra/security; Nike, Assurant, IAA, LEGACY).
- North star: **education-first** — teach the owner to use AI with Claude first,
  then automate.
- Four architecture keystones: one config rebrands everything
  ([[White-Label Architecture]]); one service-role ingest seam
  ([[Report-Ingest Seam]]); pluggable AI tool registry ([[Aria]]); per-client
  env-only deploy with no fallback creds.
- Access model: `app_role` = admin | stakeholder via `user_roles`, no public
  signup; findings are admin-only ([[Access Model]]).
- Stack: React 18 + Vite + TS (strict), Tailwind + shadcn/ui, TanStack Query,
  Supabase (Postgres + RLS + Deno edge functions), Anthropic `claude-sonnet-4-6`
  + OpenAI embeddings.
- Business model: the Harbormill Ladder — $250 AI Setup Session → $500–2.5k audit
  (fee credited) → $5k fixed project → $3–10k/mo retainer; every rung a fixed price,
  no published hourly rate; free 30-min Google Meet intro via Calendly.
- Marketing site lives in `website/` (separate Vite app, Vercel, harbormill.net).

## Notable Principles

- The deck NEVER queries client business tables — all data enters via the
  generic ingest seam.
- Customize in config/data seams; never fork the shared engine. Improvements
  flow back to the base template, then to client repos via `upstream`.
- Match token-based styling; never hardcode hex.

## See Also

- [[Harbormill AIOS]]
- [[Aria]]
- [[White-Label Architecture]]
- [[Report-Ingest Seam]]
- [[Access Model]]
