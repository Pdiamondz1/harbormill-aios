# Teaching Aria — syncing the wiki into RAG

Aria (the AIOS assistant) answers from two sources: live business data pushed in
through the [report-ingest seam](../CLAUDE.md), and a **knowledge base** it
searches with `search_knowledge`. This guide loads the `docs/wiki/` knowledge
base into that store so Aria can reason over how Harbormill AIOS actually works.

It's the bridge between the **wiki** (`docs/KNOWLEDGE_WIKI.md`, built by the
`wiki-ops` / `autoresearch` skills) and the **product** (`knowledge` table +
`match_knowledge` RPC, defined in `supabase/migrations/20260617000200_assistant.sql`).

## What it does

`scripts/sync-wiki.mjs` reads every page under `docs/wiki/` (skipping the
`index.md` catalog and `log.md` ledger — navigation, not knowledge), strips the
YAML frontmatter, and POSTs each page to the **`knowledge-sync`** edge function,
which embeds it with OpenAI `text-embedding-3-small` (1536d) and upserts one row
into `public.knowledge`.

- **Idempotent.** Each page is keyed on `metadata.source_id = "wiki:<path>"`, so
  re-running updates pages in place instead of duplicating. Run it on every wiki
  change.
- **Zero-dependency.** Plain Node (the repo targets Node 22) using native
  `fetch` — no extra install.

## Prerequisites

1. The `knowledge-sync` edge function is deployed to your Supabase project.
2. The project has `OPENAI_API_KEY` set as a function secret (the function
   embeds with it). See `docs/client-setup.md`.
3. You have the project's **service-role key** (Supabase dashboard → Project
   Settings → API). This is a server secret — it bypasses RLS. Never commit it
   or expose it to the browser (no `VITE_` prefix).

## Run it

```bash
# Preview what would sync — no network calls, no credentials needed:
node scripts/sync-wiki.mjs --dry-run

# Sync for real (credentials via environment):
SUPABASE_URL=https://<ref>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
npm run sync:wiki
```

Or drop the two vars into a repo-root `.env` (already gitignored) and just run
`npm run sync:wiki`:

```dotenv
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Output reports `inserted / updated / errors` per batch and exits non-zero if any
page failed.

## Verify

After a sync, ask Aria something only the wiki knows, e.g. *"What are the four
architecture keystones?"* or *"How does the report-ingest seam work?"* — the
answer should ground in the synced pages. You can also check the row count
directly:

```sql
select count(*) from public.knowledge where metadata->>'origin' = 'wiki';
```

## Per-client note

This base template's wiki documents **Harbormill AIOS itself** — useful for
Harbormill's own internal deck, where Aria should know the product cold. A
client deployment would instead sync *its own* knowledge (their playbooks,
policies, strategy docs) the same way: point `source_id`s at the client's
content and run the same script. The seam is identical; only the corpus changes.
