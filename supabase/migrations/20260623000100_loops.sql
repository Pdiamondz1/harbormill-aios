-- Loop Engine: per-client automation loop configs + approve-first action queue.
-- Mirrors the public.connectors framework — admin-only, single updated_at trigger.
-- loop_actions FKs to public.audit_opportunities (defined in 20260617000800_audits.sql).

-- ── Loops ─────────────────────────────────────────────────────────────────────
-- One row per automation type. The loop-run edge function reads enabled rows,
-- executes the loop module, and writes results back here. API secrets are NEVER
-- stored here — they live in edge-function env vars.

create table public.loops (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in ('ar_followup')),
  enabled       boolean not null default false,
  config        jsonb not null default '{}'::jsonb,
  schedule_cron text,
  last_run_at   timestamptz,
  last_status   text,
  last_error    text,
  next_run_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Loop Actions ──────────────────────────────────────────────────────────────
-- Approve-first queue + outbound audit log. Every proposed action stays here
-- until an admin approves it; sent/skipped/failed records remain for audit.

create table public.loop_actions (
  id                   uuid primary key default gen_random_uuid(),
  loop_id              uuid not null references public.loops (id) on delete cascade,
  type                 text not null check (type in ('email_reminder')),
  status               text not null default 'proposed'
                         check (status in ('proposed','approved','sent','skipped','failed')),
  target               jsonb not null default '{}'::jsonb,
  payload              jsonb not null default '{}'::jsonb,
  value_estimate_cents integer not null default 0 check (value_estimate_cents >= 0),
  value_category       text not null default 'revenue_captured'
                         check (value_category in ('hours_saved','revenue_captured','cost_avoided','other')),
  audit_opportunity_id uuid references public.audit_opportunities (id) on delete set null,
  metadata             jsonb not null default '{}'::jsonb,
  approved_by          uuid references auth.users (id),
  approved_at          timestamptz,
  sent_at              timestamptz,
  last_error           text,
  created_at           timestamptz not null default now()
);
create index idx_loop_actions_status on public.loop_actions (status, created_at desc);
create index idx_loop_actions_loop   on public.loop_actions (loop_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table public.loops enable row level security;
alter table public.loop_actions enable row level security;

create policy "loops admin all" on public.loops
  for all using (public.is_admin()) with check (public.is_admin());

create policy "loop_actions admin all" on public.loop_actions
  for all using (public.is_admin()) with check (public.is_admin());

-- ── Triggers ──────────────────────────────────────────────────────────────────

create trigger trg_loops_updated_at
  before update on public.loops
  for each row execute function public.handle_updated_at();
