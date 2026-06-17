---
title: Strategy Knowledge Library
type: concept
created: 2026-06-17
updated: 2026-06-17
sources: [supabase/migrations/20260617000100_operating_deck.sql, src/pages/Strategy.tsx, src/hooks/useDocuments.ts, supabase/functions/knowledge-sync/index.ts]
tags: [knowledge, documents, rag, content]
---

# Strategy Knowledge Library

The human-authored side of [[Aria]]'s knowledge: the `documents` table and the
Strategy page. (The machine/retrieval side is [[Knowledge & RAG]].)

## The `documents` table

Defined in `…_operating_deck.sql`: `path`, `title`, `content_md` (markdown), `tags`,
`updated_at`. It's the living library of positioning, playbooks, and reference
material — readable by both tiers ([[Access Model]]).

## The Strategy page

`src/pages/Strategy.tsx` (read via `src/hooks/useDocuments.ts`) is a two-pane
markdown browser (doc list + content), sorted by title. No in-app editor — docs
are authored out-of-band and loaded.

## The content lifecycle

Author a doc → it lands in `documents` → push it into the `knowledge` table via
`knowledge-sync` (`source_id: "doc:" + path`) → [[Aria]]'s `search_knowledge`
retrieves it. So the same library humans read on the Strategy page becomes Aria's
grounded context. The autoresearch `sync-aria` phase extends this same pipe with
wiki pages ([[Self-Improving App]]).

## See Also

- [[Knowledge & RAG]]
- [[AIOS Pages]]
- [[Aria]]
- [[Operating Deck Data Model]]
