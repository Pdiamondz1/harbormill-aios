---
title: AIOS App Shell
type: concept
created: 2026-06-17
updated: 2026-06-17
sources: [src/App.tsx, src/main.tsx, src/components/layout/AppLayout.tsx, src/contexts/AuthContext.tsx, src/components/ProtectedRoute.tsx, src/hooks/useAccess.ts, src/integrations/supabase/client.ts]
tags: [frontend, routing, auth, technical]
---

# AIOS App Shell

The front-end skeleton of [[Harbormill AIOS]]: routing, the layout chrome, auth,
and the data-hook pattern.

## Routing & layout

`src/App.tsx` sets up React Router + the TanStack Query `QueryClientProvider`
(30s stale time, 1 retry, no refetch-on-focus). `/auth` is public ([[AIOS Pages|Login]]);
everything else nests under `src/components/layout/AppLayout.tsx` (header, logo,
desktop + mobile nav, sign-out, `<Outlet/>`). `main.tsx` mounts React 18 and a
global error handler. The nav array filters Findings out for non-admins via
`useAccess`.

## Auth & access

- `src/contexts/AuthContext.tsx` — holds `user`/`session`, subscribes to
  `onAuthStateChange`, and `signOut()` clears both the Supabase session and the
  Query cache.
- `src/hooks/useAccess.ts` — reads `user_roles`, returns `{ isAdmin, isStakeholder }`.
  See [[Access Model]].
- `src/components/ProtectedRoute.tsx` — redirects to `/auth` if signed out; if
  signed in but lacking the tier, renders an inline access-denied card (no
  redirect, offers account switch). `tier="admin"` gates Findings.
- `src/integrations/supabase/client.ts` — **env-only** (`VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY`), **no fallback creds** — missing env throws at startup.
  This is the per-client isolation guarantee ([[Per-Client Deployment]]).

## Data-hook pattern

Every read is a TanStack Query hook in `src/hooks/` over the [[Supabase]] client:
`useMetrics` (the `metric_latest` view), `useBriefings` (+ `usePublishBriefing`),
`useFindings` (+ `useUpdateFindingStatus`), `useDocuments`, `useAssistant`
(conversations/messages + the `assistant-chat` function), `useGoogleWorkspace`.
Mutations `invalidateQueries` to refetch. RLS does the gating server-side.

## See Also

- [[AIOS Pages]]
- [[Access Model]]
- [[Supabase]]
- [[Harbormill AIOS]]
