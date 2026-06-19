-- Phase: operating-deck internals (generalized from DragonCandy's internal AIOS).
-- Adds three capabilities, all domain-agnostic:
--   1. operating_expenses  — admin-editable recurring opex.
--   2. platform_weight     — daily DB/storage/row-count snapshots (scale trend).
--   3. corrections         — Aria PROPOSES, an admin APPROVES, the system APPLIES.
--
-- Access uses the template's gates: has_access() = admin OR stakeholder,
-- has_role(uid,'admin') = admin only. Corrections target generic `documents`
-- (the strategy/reference library), not any business table.

-- ── 1. Operating expenses (admin-only both directions) ───────────────────────
-- AI spend is NOT entered here — it lives in cost_ledger (see get_cost_stats).
create table if not exists public.operating_expenses (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  category              text not null default 'other',
  monthly_amount_cents  integer not null check (monthly_amount_cents >= 0),
  notes                 text,
  active                boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.operating_expenses enable row level security;

drop policy if exists "operating_expenses_admin_all" on public.operating_expenses;
create policy "operating_expenses_admin_all" on public.operating_expenses
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create trigger trg_operating_expenses_updated_at
  before update on public.operating_expenses
  for each row execute function public.handle_updated_at();

-- ── 2. Platform weight (daily scale snapshots) ───────────────────────────────
create table if not exists public.platform_weight (
  id            uuid primary key default gen_random_uuid(),
  captured_at   timestamptz not null default now(),
  db_bytes      bigint not null,
  storage_bytes bigint not null,
  users_total   integer not null,
  row_counts    jsonb not null default '{}'
);

create index if not exists idx_platform_weight_captured
  on public.platform_weight (captured_at);

alter table public.platform_weight enable row level security;

-- Access tier reads; writes only via the security-definer capture fn / service role.
drop policy if exists "platform_weight_select" on public.platform_weight;
create policy "platform_weight_select" on public.platform_weight
  for select to authenticated
  using (public.has_access());

-- Counts only generic template tables — no business/domain tables. Cron calls
-- this directly via SQL (no external API, so no Vault/bearer indirection).
create or replace function public.capture_platform_weight()
returns void
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.platform_weight (db_bytes, storage_bytes, users_total, row_counts)
  values (
    pg_database_size(current_database()),
    (select coalesce(sum((metadata->>'size')::bigint), 0) from storage.objects),
    (select count(*) from auth.users),
    jsonb_build_object(
      'metric_snapshots', (select count(*) from public.metric_snapshots),
      'briefings',        (select count(*) from public.briefings),
      'findings',         (select count(*) from public.findings),
      'documents',        (select count(*) from public.documents),
      'conversations',    (select count(*) from public.conversations),
      'messages',         (select count(*) from public.messages),
      'knowledge',        (select count(*) from public.knowledge),
      'cost_ledger',      (select count(*) from public.cost_ledger)
    )
  );
end;
$$;

revoke execute on function public.capture_platform_weight() from public, anon, authenticated;
grant execute on function public.capture_platform_weight() to service_role;

-- Daily snapshot. Requires pg_cron (available on Supabase; enable it if a fresh
-- project rejects the extension). cron.schedule upserts by job name (idempotent).
create extension if not exists pg_cron;
select cron.schedule(
  'platform-weight-capture',
  '30 8 * * *',                          -- daily 08:30 UTC
  $$select public.capture_platform_weight();$$
);

-- Seed the first snapshot so the trend renders immediately.
select public.capture_platform_weight();

-- ── 3. Corrections (Aria proposes → admin approves → system applies) ──────────
-- Correctable dashboard values (small, non-secret).
create table if not exists public.aios_dashboard_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);
alter table public.aios_dashboard_settings enable row level security;

drop policy if exists "dashboard_settings_select" on public.aios_dashboard_settings;
create policy "dashboard_settings_select" on public.aios_dashboard_settings
  for select to authenticated
  using (public.has_access());

drop policy if exists "dashboard_settings_admin_update" on public.aios_dashboard_settings;
create policy "dashboard_settings_admin_update" on public.aios_dashboard_settings
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));
-- No INSERT/DELETE policies: keys are seeded by migration, mutated only by the
-- admin-gated apply RPC (security definer) or a migration.

-- The proposal queue. Admin-only both directions (proposals can quote internals).
create table if not exists public.aios_corrections (
  id              uuid primary key default gen_random_uuid(),
  target_type     text not null check (target_type in ('dashboard_setting','document')),
  target_ref      text not null,
  title           text not null,
  rationale_md    text not null,
  current_value   jsonb not null,
  proposed_value  jsonb not null,
  status          text not null
    check (status in ('proposed','approved','rejected','applied','superseded'))
    default 'proposed',
  proposed_by     text not null default 'assistant',
  proposed_by_user uuid references auth.users (id),
  reviewed_by     uuid references auth.users (id),
  reviewed_at     timestamptz,
  applied_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_aios_corrections_status
  on public.aios_corrections (status, created_at desc);

alter table public.aios_corrections enable row level security;

drop policy if exists "corrections_admin_select" on public.aios_corrections;
create policy "corrections_admin_select" on public.aios_corrections
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));
-- No authenticated INSERT/UPDATE/DELETE: rows arrive via the service-role
-- report-ingest choke point; the only app-user mutation path is the apply RPC.

create trigger trg_aios_corrections_updated_at
  before update on public.aios_corrections
  for each row execute function public.handle_updated_at();
create trigger trg_aios_dashboard_settings_updated_at
  before update on public.aios_dashboard_settings
  for each row execute function public.handle_updated_at();

-- Apply / reject a proposal. Admin-only (enforced in-body since security definer
-- bypasses RLS). Re-validates live state (optimistic concurrency): supersede on
-- drift or a missing target; never mark applied unless the change actually landed.
create or replace function public.aios_corrections_apply(p_id uuid, p_decision text)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $$
declare
  c public.aios_corrections;
  live_value jsonb;
  uid uuid := auth.uid();
begin
  if not public.has_role(uid, 'admin'::public.app_role) then
    raise exception 'forbidden: admin only';
  end if;
  if p_decision not in ('approve','reject') then
    raise exception 'p_decision must be approve or reject';
  end if;

  select * into c from public.aios_corrections where id = p_id for update;
  if not found then
    raise exception 'correction not found';
  end if;
  if c.status <> 'proposed' then
    return jsonb_build_object('status', c.status, 'message', 'already decided');
  end if;

  if p_decision = 'reject' then
    update public.aios_corrections
      set status = 'rejected', reviewed_by = uid, reviewed_at = now()
      where id = p_id;
    return jsonb_build_object('status', 'rejected');
  end if;

  if c.target_type = 'dashboard_setting' then
    select value into live_value
      from public.aios_dashboard_settings where key = c.target_ref for update;
    if not found or live_value is distinct from c.current_value then
      update public.aios_corrections
        set status = 'superseded', reviewed_by = uid, reviewed_at = now() where id = p_id;
      return jsonb_build_object('status', 'superseded', 'message', 'value changed or target missing; re-propose');
    end if;
    update public.aios_dashboard_settings
      set value = c.proposed_value, updated_at = now(), updated_by = uid
      where key = c.target_ref;
    update public.aios_corrections
      set status = 'applied', reviewed_by = uid, reviewed_at = now(), applied_at = now()
      where id = p_id;
    return jsonb_build_object('status', 'applied', 'target_type', 'dashboard_setting');

  elsif c.target_type = 'document' then
    -- document values are JSON strings (markdown). Reject malformed proposals.
    if jsonb_typeof(c.current_value) <> 'string' or jsonb_typeof(c.proposed_value) <> 'string' then
      raise exception 'document corrections require JSON string values';
    end if;
    -- Compare on normalized text so a benign no-op rewrite doesn't false-supersede.
    select to_jsonb(content_md) into live_value
      from public.documents where path = c.target_ref for update;
    if not found
       or btrim(coalesce(live_value #>> '{}', '')) is distinct from btrim(coalesce(c.current_value #>> '{}', '')) then
      update public.aios_corrections
        set status = 'superseded', reviewed_by = uid, reviewed_at = now() where id = p_id;
      return jsonb_build_object('status', 'superseded', 'message', 'doc changed or missing; re-propose');
    end if;
    update public.documents
      set content_md = c.proposed_value #>> '{}', updated_at = now()
      where path = c.target_ref;
    update public.aios_corrections
      set status = 'applied', reviewed_by = uid, reviewed_at = now(), applied_at = now()
      where id = p_id;
    return jsonb_build_object(
      'status', 'applied', 'target_type', 'document',
      'path', c.target_ref, 'corrected_md', c.proposed_value #>> '{}'
    );
  end if;

  raise exception 'unknown target_type %', c.target_type;
end;
$$;

revoke all on function public.aios_corrections_apply(uuid, text) from public, anon;
grant execute on function public.aios_corrections_apply(uuid, text) to authenticated;
