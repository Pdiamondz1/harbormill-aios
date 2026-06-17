---
title: White-Label Architecture
type: concept
created: 2026-06-17
updated: 2026-06-17
sources: [src/config/brand.ts, src/index.css, docs/white-label.md, docs/per-client-workflow.md]
tags: [architecture, white-label, keystone]
---

# White-Label Architecture

The first architecture keystone: **one config rebrands everything**. A client
deployment is a config + data change, never a fork of the shared engine.

## How it works

- **Words / names / logos:** `src/config/brand.ts` (product name, tagline,
  assistant name — [[Aria]], company, tier labels, logo/emblem paths).
- **Color / theme:** CSS variables in `src/index.css` (`:root` light + `.dark`).
  Dark-first. No component hardcodes brand or color — everything reads tokens
  (`bg-primary`, `text-muted-foreground`, …).
- **Per-client deploy:** env-only Supabase client
  (`src/integrations/supabase/client.ts`) with **no fallback creds**. Each client
  brings their own Supabase + Google Cloud + AI keys.

## Per-client workflow

Each client = a clone of this base template (`docs/per-client-workflow.md`).
Reusable improvements go back into the base template, then flow to client repos
via the `upstream` remote. Customize only in the config/data seams.

## Key Decisions

- Two known react-refresh lint warnings (button.tsx / AuthContext.tsx) are OK.
- The marketing site (`website/`) deliberately *copies* these brand tokens rather
  than importing them, so it stays out of the per-client clone flow.

## See Also

- [[Harbormill AIOS]]
- [[Project Context]]
- [[Access Model]]
