-- Add a nullable external reference to conversations so an external front-end
-- (e.g. the Google Chat bot) can key its own threads to a conversation row.
-- Deck-created conversations leave this null; behaviour is unchanged for them.
alter table public.conversations add column if not exists external_ref text;

-- Partial index: fast lookup of (user, external_ref) for rows that set it.
create index if not exists idx_conversations_external_ref
  on public.conversations (user_id, external_ref)
  where external_ref is not null;
