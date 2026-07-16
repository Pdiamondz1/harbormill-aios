---
title: Report-Ingest Seam
type: concept
created: 2026-06-17
updated: 2026-06-17
sources: [supabase/functions/report-ingest/index.ts, CLAUDE.md]
tags: [architecture, data-ingest, keystone, security]
---

# Report-Ingest Seam

The second architecture keystone: **one service-role ingest seam**. All client
data enters [[Harbormill AIOS]] through a single edge function,
`supabase/functions/report-ingest`, which pushes generic `metric_snapshots`,
`briefings`, and `findings` rows in.

## Why it matters

- **The deck NEVER queries client business tables.** It reads only the three
  generic tables. This makes the deck safe, audit-friendly, and backend-agnostic
  — it works with any client data pipeline (scheduled jobs, CI, custom agents).
- Clients wire their own metric/brief/finding agents to this one endpoint — no
  schema to learn, no direct DB coupling.
- [[Aria]] is grounded only in what enters here plus the knowledge base.

## Key Decisions

- Runs as the service role (privileged write), separate from the RLS-gated read
  path the deck uses (see [[Access Model]]).
- Generic shape (`metric_snapshots` / `briefings` / `findings`) is intentional —
  it's the white-label contract, parallel to [[White-Label Architecture]].

## See Also

- [[Harbormill AIOS]]
- [[White-Label Architecture]]
- [[Aria]]
- [[Access Model]]
- [[Project Context]]
