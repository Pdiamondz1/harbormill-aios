---
title: Extending AIOS
type: concept
created: 2026-06-17
updated: 2026-06-17
sources: [docs/extending.md, supabase/functions/assistant-chat/tools.ts, supabase/functions/report-ingest, supabase/functions/knowledge-sync, src/App.tsx, src/components/layout/AppLayout.tsx]
tags: [how-to, extension, technical]
---

# Extending AIOS

How to add capability to [[Harbormill AIOS]] **in the seams**, without forking the
shared engine (`docs/extending.md`). The four extension points:

## 1. New metric / briefing / finding

No schema change — push new keys through the [[Report-Ingest Seam]]
(`report-ingest`). Overview renders the latest snapshot per `key`; `status`
(`on_track`/`at_risk`/`off_track`) drives card colors. See [[Operating Deck Data Model]].

## 2. New AI tool

Append a `{ definition, execute }` object to `TOOLS` in
`assistant-chat/tools.ts` (the [[AI Tool Registry]]); `ctx` provides
`{ supabase (service role), userId, openaiKey }`. Deploy
`supabase functions deploy assistant-chat`. The model decides when to call it from
the description.

## 3. New knowledge

POST documents to `knowledge-sync` (`{ source_id, content, metadata }`); idempotent
on `source_id`. Feeds [[Knowledge & RAG]] for [[Aria]].

## 4. New page / route

Add `src/pages/Thing.tsx`, a `<Route path="thing">` inside the protected layout in
`src/App.tsx`, and a `NAV` entry in `AppLayout.tsx` (`adminOnly: true` to hide from
stakeholders). See [[AIOS App Shell]].

## See Also

- [[AI Tool Registry]]
- [[Report-Ingest Seam]]
- [[Knowledge & RAG]]
- [[Per-Client Deployment]]
