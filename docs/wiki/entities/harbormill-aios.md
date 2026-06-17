---
title: Harbormill AIOS
type: entity
created: 2026-06-17
updated: 2026-06-17
sources: [docs/PROJECT_CONTEXT.md, CLAUDE.md]
tags: [product, platform, white-label]
---

# Harbormill AIOS

The product: a **white-label AI operating-deck template**. Gives a small-business
operator one place to see live metrics, read an AI-written weekly brief, track
findings, and talk to [[Aria]]. This repo is the **base template** — each client
gets their own clone, Supabase, Google Cloud, and AI keys.

## Pages

Overview (live KPI cards), Briefings (weekly operating briefs), Findings (issue /
risk tracker, admin-only), Strategy (knowledge-base docs), Workspace (Google
Workspace bridge), Assistant ([[Aria]] chat), Login. Shell at
`src/components/layout/AppLayout.tsx`.

## Capabilities

Live metrics · AI weekly briefings · meeting transcripts → summaries → next
action steps · daily top priorities from operations · "what to act on now"
(emails / messages / meetings) · Ask [[Aria]] · integrations & plugins with any
business software that has an API.

## How it's built

Stack: React 18 + Vite + TS (strict), Tailwind + shadcn/ui, TanStack Query,
Supabase. Four keystones: [[White-Label Architecture]], [[Report-Ingest Seam]],
the pluggable AI tool registry ([[Aria]]), and per-client env-only deploy.

## Key Decisions

- The deck never queries client business tables — only generic
  `metric_snapshots` / `briefings` / `findings` via the [[Report-Ingest Seam]].
- Sold by Harbormill Automation as the flagship of an education-first automation
  practice (see [[Project Context]]).

## See Also

- [[Project Context]]
- [[Aria]]
- [[Supabase]]
- [[Edge Functions]]
- [[AI Tool Registry]]
- [[Operating Deck Data Model]]
- [[Google Workspace Bridge]]
- [[White-Label Architecture]]
- [[Report-Ingest Seam]]
- [[Access Model]]
- [[Per-Client Deployment]]
- [[The Harbormill Ladder]]
- [[AIOS App Shell]]
- [[AIOS Pages]]
- [[Marketing Site]]
