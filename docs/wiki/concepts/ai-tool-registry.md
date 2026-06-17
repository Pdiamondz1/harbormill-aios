---
title: AI Tool Registry
type: concept
created: 2026-06-17
updated: 2026-06-17
sources: [supabase/functions/assistant-chat/tools.ts, supabase/functions/assistant-chat/index.ts]
tags: [architecture, ai, assistant, keystone, technical]
---

# AI Tool Registry

The third architecture keystone: **a pluggable AI tool registry**. [[Aria]]'s
tools live in one array, `TOOLS`, in `supabase/functions/assistant-chat/tools.ts`.
Adding a capability = appending one entry; no other code changes.

## Each tool

A `Tool` has a `definition` (name, description, Anthropic `input_schema`) and an
`execute(args, ctx)` that runs server-side with a service-role client. The
agentic loop in `index.ts` matches tool calls by name and runs them (max 8 rounds).

## The six tools

1. `search_knowledge` — embed the query (OpenAI), call `match_knowledge`, return top-5 chunks.
2. `read_metrics` — read the `metric_latest` view.
3. `get_latest_briefing` — latest row from `briefings`.
4. `create_finding` — insert a finding (`source: "assistant"`) for admin triage.
5. `export_to_drive` — markdown → Google Doc (validates ≥200 chars + headings). See [[Google Workspace Bridge]].
6. `list_drive_files` — list the user's Workspace folder.

## Adding a tool

Append `{ definition, execute }` to `TOOLS`; the loop discovers it by name. This
is the extension seam clients use for bespoke capabilities without forking the
engine (see [[Per-Client Deployment]]).

## See Also

- [[Aria]]
- [[Edge Functions]]
- [[Operating Deck Data Model]]
- [[Harbormill AIOS]]
