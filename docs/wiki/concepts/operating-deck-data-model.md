---
title: Operating Deck Data Model
type: concept
created: 2026-06-17
updated: 2026-06-17
sources: [supabase/migrations/20260617000100_operating_deck.sql, supabase/functions/report-ingest/index.ts, src/hooks/useMetrics.ts, src/hooks/useBriefings.ts, src/hooks/useFindings.ts]
tags: [architecture, data-model, technical]
---

# Operating Deck Data Model

The three generic tables every [[Harbormill AIOS]] deck reads — defined in
`supabase/migrations/20260617000100_operating_deck.sql`, written **only** via the
[[Report-Ingest Seam]], read via `src/hooks/`. The genericity is the white-label
contract: the deck never knows a client's business schema.

## metric_snapshots (append-only time series)

`key`, `label`, `value` (text), `unit?`, `target?`, `status` (`on_track` |
`at_risk` | `off_track`), `captured_at`. Indexed `(key, captured_at desc)`; the
app reads the **`metric_latest`** view (`useMetrics.ts` → Overview page).

## briefings (weekly briefs, publish-gated)

`week_start` (unique), `title`, `body_md`, `kpis` (jsonb array), `generated_by`,
`published_at` (NULL = draft). RLS: admins see all; **stakeholders see published
only** (`useBriefings.ts`). See [[Access Model]].

## findings (issues/risks, admin-only)

`severity` (critical|high|medium|low), `title`, `summary_md`, `evidence` (jsonb),
`source`, `status` (open|acknowledged|resolved|wontfix), `fingerprint` (unique),
`occurrences`, `last_seen_at`. Upsert on `fingerprint`: a resolved finding that
recurs **reopens** (regression signal) and bumps `occurrences` (`useFindings.ts`).

## See Also

- [[Report-Ingest Seam]]
- [[Supabase]]
- [[Access Model]]
- [[Harbormill AIOS]]
