---
title: Plug-and-Play Client Compatibility
type: concept
created: 2026-06-19
updated: 2026-06-19
sources: [src/config/features.ts, src/config/brand.ts, src/integrations/supabase/client.ts, supabase/functions/assistant-chat/index.ts, scripts/setup-client.mjs, docs/client-setup.md, "https://developex.com/blog/building-scalable-white-label-saas/", "https://medium.com/koodoo/how-do-we-approach-theming-for-white-label-applications-672163019731", "https://medium.com/design-for-experience/white-labelling-ux-implementation-22d30233ff73"]
tags: [architecture, white-label, deployment, ops, plug-and-play]
---

# Plug-and-Play Client Compatibility

How a new client deployment is **config + data + flags, never a fork** — the
practical sum of the white-label keystones. Stands on [[White-Label Architecture]]
(branding) and [[Per-Client Deployment]] (isolation/clone), adding the two levers
that let an operator stand a client up without touching engine code: **feature
flags** and a **guided setup flow**.

## The four levers

1. **Config-driven branding** — `src/config/brand.ts` (names/logos/text) + the HSL
   variables in `src/index.css`. No component hardcodes brand or color. See
   [[White-Label Architecture]] and [[Design Tokens & Theming]].
2. **Per-client feature flags** — `src/config/features.ts` toggles modules
   (`projects`, `calendar`, `briefings`, `findings`, `strategy`, `workspace`,
   `assistant`). A disabled flag drops the item from the nav **and** stops its
   route resolving (`AppLayout` nav filter + conditional `<Route>`s in `App.tsx`);
   deep links fall back to Overview. Aria's tools toggle per deployment via the
   `DISABLED_TOOLS` edge-function secret (filtered in `assistant-chat/index.ts`
   alongside the admin-only gate).
3. **Env-only secrets & per-deployment isolation** — `src/integrations/supabase/client.ts`
   throws if `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are missing (no fallback
   creds), so each client runs on its **own** Supabase + Google Cloud + AI keys.
   Service-role/AI keys live as Supabase function secrets, never in the bundle.
   See [[Per-Client Deployment]].
4. **Guided onboarding** — `npm run setup:client` (`scripts/setup-client.mjs`)
   gathers the per-client basics, writes `.env`, and prints the exact ordered
   backend commands. It never runs destructive CLI commands itself, so it's
   safe to re-run. Backs the manual flow in `docs/client-setup.md`.

## Why this shape (external best practice)

Industry guidance on white-label SaaS converges on the same primitives this
template implements:

- **Tenant-level branding via dynamic config** (CSS/tokens/logos), not per-client
  code — and storing client theme/metadata as config delivered to the app rather
  than hardcoded, so new clients onboard with no dev effort.
- **Configurable feature sets** — the ability to toggle modules on/off **per
  tenant without modifying the core code** is called out as a core component of a
  robust white-label platform; `features.ts` is exactly that lever.
- **Single codebase, centralized updates** — one engine serving many clients
  streamlines maintenance; improvements flow base→clients (the upstream-merge
  discipline in [[Per-Client Deployment]]).
- **Data isolation + RBAC** — per-tenant data separation and role gating; here,
  separate Supabase projects + RLS ([[Access Model]]).

## Anti-patterns this avoids

- **Client-specific code in the engine.** Customization lives in the config/data
  seams ([[Extending AIOS]]); the shared engine is never forked.
- **Hardcoded brand/color.** Enforced by convention + a grep gate over component
  dirs (no `dc-`/raw palette classes).
- **Secrets in the bundle.** Only public anon values ship; everything sensitive is
  a function secret.

## See Also

- [[White-Label Architecture]]
- [[Per-Client Deployment]]
- [[Extending AIOS]]
- [[Design Tokens & Theming]]
- [[Access Model]]
- [[Harbormill AIOS]]
