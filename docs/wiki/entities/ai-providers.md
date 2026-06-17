---
title: AI Providers
type: entity
created: 2026-06-17
updated: 2026-06-17
sources: [supabase/functions/assistant-chat/index.ts, supabase/functions/knowledge-sync/index.ts, supabase/functions/assistant-chat/tools.ts, CLAUDE.md]
tags: [ai, anthropic, openai, integration, technical]
---

# AI Providers

The two external AI dependencies of [[Harbormill AIOS]]. Each client brings their
**own** keys ([[Per-Client Deployment]]); usage is metered to the [[Cost Ledger]].

## Anthropic — the assistant

Powers [[Aria]]'s chat. Default model **`claude-sonnet-4-6`** (overridable via the
`ANTHROPIC_MODEL` env var). Called from the [[Assistant Chat Loop]] with the
pluggable tool set and prompt caching on history. Key: `ANTHROPIC_API_KEY`.

## OpenAI — the embeddings

Powers retrieval. Model **`text-embedding-3-small` (1536-dim)**, used by
`knowledge-sync` to embed documents and by the `search_knowledge` tool to embed
queries ([[Knowledge & RAG]]). Key: `OPENAI_API_KEY`.

## Why split

Anthropic for grounded, tool-using reasoning; OpenAI purely for the vector space
behind hybrid RAG. Swapping either is a config/env change, not an engine fork
([[White-Label Architecture]]).

## See Also

- [[Aria]]
- [[Assistant Chat Loop]]
- [[Knowledge & RAG]]
- [[Cost Ledger]]
