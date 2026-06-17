-- Phase 3: AI assistant + RAG.
-- A chat assistant grounded in the business: conversations/messages, a pgvector
-- knowledge base, a similarity-search RPC, and a cost ledger for AI spend.

create extension if not exists vector with schema extensions;

-- ── Conversations & messages (per-user) ─────────────────────────────────────
create table public.conversations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);
create index idx_conversations_user on public.conversations (user_id, last_message_at desc);

alter table public.conversations enable row level security;

create policy "own conversations select" on public.conversations
  for select to authenticated using (user_id = auth.uid());
create policy "own conversations insert" on public.conversations
  for insert to authenticated with check (user_id = auth.uid());
create policy "own conversations update" on public.conversations
  for update to authenticated using (user_id = auth.uid());

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role            text not null check (role in ('user', 'assistant', 'tool')),
  content         text,
  tool_calls      jsonb,
  tool_result     jsonb,
  created_at      timestamptz not null default now()
);
create index idx_messages_conversation on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;

create policy "own messages select" on public.messages
  for select to authenticated
  using (conversation_id in (select id from public.conversations where user_id = auth.uid()));
create policy "own messages insert" on public.messages
  for insert to authenticated
  with check (conversation_id in (select id from public.conversations where user_id = auth.uid()));

-- ── Knowledge base (RAG) ─────────────────────────────────────────────────────
create table public.knowledge (
  id            uuid primary key default gen_random_uuid(),
  content       text not null,
  metadata      jsonb not null default '{}',
  embedding     extensions.vector(1536),
  source_type   text not null default 'document',
  search_vector tsvector generated always as (to_tsvector('english', content)) stored,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_knowledge_embedding on public.knowledge
  using hnsw (embedding extensions.vector_cosine_ops);
create index idx_knowledge_search on public.knowledge using gin (search_vector);

alter table public.knowledge enable row level security;

-- Readable by the access tier; written only by the service role (knowledge-sync).
create policy "knowledge readable by access tier" on public.knowledge
  for select to authenticated using (public.has_access());
create policy "service manages knowledge" on public.knowledge
  for all to service_role using (true) with check (true);

create trigger trg_knowledge_updated_at
  before update on public.knowledge
  for each row execute function public.handle_updated_at();

-- Cosine-similarity retrieval. SECURITY DEFINER so the assistant function can
-- search regardless of the caller; results are non-sensitive reference content.
create or replace function public.match_knowledge(
  query_embedding extensions.vector(1536),
  match_count int default 5
)
returns table (id uuid, content text, metadata jsonb, similarity float)
language sql stable security definer set search_path = public, extensions
as $$
  select k.id, k.content, k.metadata, 1 - (k.embedding <=> query_embedding) as similarity
  from public.knowledge k
  where k.embedding is not null
  order by k.embedding <=> query_embedding
  limit match_count;
$$;

revoke execute on function public.match_knowledge(extensions.vector, int) from anon;
grant execute on function public.match_knowledge(extensions.vector, int) to authenticated, service_role;

-- ── Cost ledger (AI spend) ───────────────────────────────────────────────────
create table public.cost_ledger (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users (id) on delete set null,
  edge_function text not null,
  model         text not null,
  input_tokens  integer not null default 0,
  output_tokens integer not null default 0,
  created_at    timestamptz not null default now()
);
create index idx_cost_ledger_time on public.cost_ledger (created_at desc);

alter table public.cost_ledger enable row level security;

create policy "cost ledger admin select" on public.cost_ledger
  for select to authenticated using (public.is_admin());
create policy "service writes cost ledger" on public.cost_ledger
  for all to service_role using (true) with check (true);
