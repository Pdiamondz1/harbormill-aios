---
title: Demo Seed Data
type: concept
created: 2026-06-17
updated: 2026-06-17
sources: [supabase/seed.sql]
tags: [demo, seed, onboarding, technical]
---

# Demo Seed Data

What makes a fresh [[Harbormill AIOS]] clone render a live-looking deck before a
client wires their own agents — `supabase/seed.sql` (idempotent
`on conflict do nothing`; safe to delete).

## What it seeds

- **8 metric snapshots:** MRR `$48,200` (at_risk, target $60k), Active clients
  37/40, NPS 62, Churn 3.1% (off_track), Pipeline $112k, Open tickets 8, Uptime
  99.96%, CSAT 4.7★.
- **2 briefings:** the current week's "Weekly operating brief" (published, with a
  MRR/Churn/NPS KPI set) and a prior-week draft.
- **2 findings:** a `high` "Checkout latency spike on mobile" (open) and a `low`
  "Stale cache header on /pricing" (acknowledged) — with `fingerprint` + `evidence`.
- **2 documents:** `strategy/positioning` and `playbooks/onboarding`.

## Why it matters

It demonstrates the whole [[Operating Deck Data Model]] (all three statuses,
publish gate, finding severities/fingerprints) and powers the marketing site's
**interactive demo tour** ([[Marketing Site]]), which reuses these exact values
labeled as illustrative. Per-client deployments replace it with real data via the
[[Report-Ingest Seam]].

## See Also

- [[Operating Deck Data Model]]
- [[Report-Ingest Seam]]
- [[Marketing Site]]
- [[Harbormill AIOS]]
