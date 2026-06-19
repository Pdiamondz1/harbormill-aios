-- Phase: "Value Delivered" ROI surface.
-- A quantified, attributed value log that proves the engagement's ROI on the deck.
-- Value is REPORTED IN (admin-entered or pushed via report-ingest) — never
-- fabricated by the deck. Each event records its basis in `metadata` (e.g. hours
-- × rate, or which automation) so the ROI stays defensible.
--
-- ROI = this-month value / the configured monthly retainer (a dashboard setting,
-- so it's admin-editable and Aria-correctable via the corrections flow).

create table public.value_events (
  id           uuid primary key default gen_random_uuid(),
  occurred_at  timestamptz not null default now(),
  category     text not null check (category in ('hours_saved','revenue_captured','cost_avoided','other')),
  label        text not null,
  amount_cents integer not null check (amount_cents >= 0),
  source       text not null default 'manual',
  project_id   uuid references public.projects (id) on delete set null,
  metadata     jsonb not null default '{}',
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index idx_value_events_occurred on public.value_events (occurred_at desc);

alter table public.value_events enable row level security;

-- ROI is visible to the whole access tier (it sells/sustains the retainer);
-- only admins enter value; the service role writes via the ingest seam.
create policy "value readable by access tier" on public.value_events
  for select to authenticated using (public.has_access());
create policy "value managed by admin" on public.value_events
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));
create policy "service writes value" on public.value_events
  for all to service_role using (true) with check (true);

-- The retainer fee lives in the existing dashboard-settings table (reused), so it
-- is admin-editable and correctable through the same flow as other settings.
insert into public.aios_dashboard_settings (key, value)
values ('monthly_retainer_cents', '500000'::jsonb)
on conflict (key) do nothing;

-- Value summary for the Overview hero / Aria. SECURITY DEFINER with an explicit
-- has_access() gate (mirrors match_knowledge). Returns dollars-as-cents.
create or replace function public.deck_value_summary()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  this_start timestamptz := date_trunc('month', now());
  prev_start timestamptz := date_trunc('month', now()) - interval '1 month';
  this_cents bigint := 0;
  prev_cents bigint := 0;
  cum_cents  bigint := 0;
  retainer   bigint := 0;
  by_cat     jsonb;
begin
  if not public.has_access() then
    raise exception 'forbidden: access tier required';
  end if;

  select coalesce(sum(amount_cents), 0) into this_cents
    from public.value_events where occurred_at >= this_start;
  select coalesce(sum(amount_cents), 0) into prev_cents
    from public.value_events where occurred_at >= prev_start and occurred_at < this_start;
  select coalesce(sum(amount_cents), 0) into cum_cents
    from public.value_events;
  select coalesce((value #>> '{}')::bigint, 0) into retainer
    from public.aios_dashboard_settings where key = 'monthly_retainer_cents';

  select coalesce(jsonb_object_agg(category, cents), '{}'::jsonb) into by_cat
    from (
      select category, sum(amount_cents) as cents
      from public.value_events where occurred_at >= this_start group by category
    ) c;

  return jsonb_build_object(
    'this_month_cents', this_cents,
    'prev_month_cents', prev_cents,
    'cumulative_cents', cum_cents,
    'retainer_cents', retainer,
    'roi_multiple', case when retainer > 0 then round((this_cents::numeric / retainer), 1) else null end,
    'by_category', by_cat,
    'generated_at', now()
  );
end;
$$;

revoke execute on function public.deck_value_summary() from anon;
grant execute on function public.deck_value_summary() to authenticated, service_role;
