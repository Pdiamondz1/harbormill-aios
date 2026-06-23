-- Phase: "Promised-vs-delivered" proof for the Loop Engine.
-- Link delivered value events to the audit opportunity that promised them, and
-- extend deck_value_summary() with a reconciliation (promised vs delivered)
-- WITHOUT changing any of its existing output — the reconciliation object is a
-- strict, additive superset.

alter table public.value_events
  add column audit_opportunity_id uuid references public.audit_opportunities (id) on delete set null;

-- Re-create deck_value_summary() verbatim, only ADDING the reconciliation.
-- The original returned its result inline via `return jsonb_build_object(...)`;
-- here that object is assigned to a local `result` variable first so the
-- reconciliation can be appended, then returned — existing keys/values are
-- byte-for-byte identical.
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
  promised_cents bigint;
  delivered_cents bigint;
  result     jsonb;
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

  result := jsonb_build_object(
    'this_month_cents', this_cents,
    'prev_month_cents', prev_cents,
    'cumulative_cents', cum_cents,
    'retainer_cents', retainer,
    'roi_multiple', case when retainer > 0 then round((this_cents::numeric / retainer), 1) else null end,
    'by_category', by_cat,
    'generated_at', now()
  );

  select coalesce(sum(o.annual_value_cents), 0) into promised_cents
  from public.audit_opportunities o
  join public.audits a on a.id = o.audit_id
  where a.status = 'won';

  select coalesce(sum(v.amount_cents), 0) into delivered_cents
  from public.value_events v
  where v.audit_opportunity_id is not null;

  result := result || jsonb_build_object(
    'reconciliation', jsonb_build_object(
      'promised_annual_cents', promised_cents,
      'delivered_cents', delivered_cents,
      'pct_of_promise',
        case when promised_cents > 0
          then round((delivered_cents::numeric / promised_cents) * 100, 1)
          else null end
    )
  );

  return result;
end;
$$;

revoke execute on function public.deck_value_summary() from anon;
grant execute on function public.deck_value_summary() to authenticated, service_role;
