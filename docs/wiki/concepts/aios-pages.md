---
title: AIOS Pages
type: concept
created: 2026-06-17
updated: 2026-06-17
sources: [src/pages/Overview.tsx, src/pages/Briefings.tsx, src/pages/Findings.tsx, src/pages/Strategy.tsx, src/pages/Assistant.tsx, src/pages/Workspace.tsx, src/pages/WorkspaceCallback.tsx, src/pages/Login.tsx]
tags: [frontend, product, pages]
---

# AIOS Pages

The user-facing surfaces of [[Harbormill AIOS]], under `src/pages/`. Gating is
enforced server-side by RLS ([[Access Model]]) and mirrored by the route guard
([[AIOS App Shell]]).

| Page | File | Reads | Access |
|------|------|-------|--------|
| **Overview** | `Overview.tsx` | `useMetrics` (`metric_latest`) | all tiers |
| **Briefings** | `Briefings.tsx` | `useBriefings` + `usePublishBriefing` | all (stakeholders: published only; admins publish) |
| **Findings** | `Findings.tsx` | `useFindings` + `useUpdateFindingStatus` | **admin only** (`tier="admin"`) |
| **Strategy** | `Strategy.tsx` | `useDocuments` (`documents`) | all tiers |
| **Assistant** | `Assistant.tsx` | `useAssistant` → `assistant-chat` fn | all tiers |
| **Workspace** | `Workspace.tsx` | `useGoogleWorkspace` → proxy fn | all tiers |
| **WorkspaceCallback** | `WorkspaceCallback.tsx` | `useCompleteGoogleConnection` | post-login (OAuth redirect) |
| **Login** | `Login.tsx` | `supabase.auth.signInWithPassword` | public — **no signup** |

Notes: Overview is the post-login home and is empty until agents push metrics via
the [[Report-Ingest Seam]]. Findings shows severity badges + evidence; Briefings
shows KPI chips + a publish toggle. Assistant is the [[Aria]] chat (quick-prompts,
optimistic send). Workspace is the [[Google Workspace Bridge]] file hub. Login has
no self-serve signup by design — access is provisioned via `user_roles`.

## See Also

- [[AIOS App Shell]]
- [[Operating Deck Data Model]]
- [[Aria]]
- [[Harbormill AIOS]]
