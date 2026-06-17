---
title: Supabase
type: entity
created: 2026-06-17
updated: 2026-06-17
sources: [supabase/migrations, supabase/functions, supabase/config.toml]
tags: [backend, postgres, rls, edge-functions, technical]
---

# Supabase

The backend of [[Harbormill AIOS]]: Postgres + Row-Level Security + Auth + Deno
edge functions. Each client deployment runs its **own** Supabase project (the
env-only client has no fallback creds — see [[White-Label Architecture]]).

## Schema (migrations)

Four versioned migrations under `supabase/migrations/`:

- `20260617000000_access_roles.sql` — `app_role` enum, `user_roles`, RLS helpers
  (`has_role`, `is_admin`, `has_access`). See [[Access Model]].
- `20260617000100_operating_deck.sql` — `metric_snapshots`, `briefings`,
  `findings`, `documents`, and the `metric_latest` view. See [[Operating Deck Data Model]].
- `20260617000200_assistant.sql` — `conversations`, `messages`, `knowledge`
  (pgvector 1536-dim + tsvector hybrid search), the `match_knowledge` RPC, and
  `cost_ledger` (AI spend). Powers [[Aria]].
- `20260617000300_workspace.sql` — `google_workspace_accounts` (service-role-only,
  no RLS policies) + `google_connection_status()`. See [[Google Workspace Bridge]].

`supabase/seed.sql` provides demo metrics/briefings/findings/documents so a fresh
clone renders a live-looking deck.

## Security patterns

- **RLS on every table**; sensitive tables (tokens, `cost_ledger`) are
  service-role-only — no client JWT can read them.
- **`SECURITY DEFINER`** helper functions (`has_role`, `is_admin`,
  `match_knowledge`) so policies don't recurse.
- Append-only / upsert designs: `metric_snapshots` indexed `(key, captured_at desc)`;
  `briefings` unique on `week_start`; `findings` unique on `fingerprint`.

## See Also

- [[Harbormill AIOS]]
- [[Edge Functions]]
- [[Operating Deck Data Model]]
- [[Access Model]]
- [[Aria]]
