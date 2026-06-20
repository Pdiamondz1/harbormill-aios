-- Connector library: per-client config + last-run status for managed data pulls.
-- The connector-sync edge function reads enabled rows, pulls from each SaaS, and
-- writes metrics through report-ingest. API SECRETS ARE NEVER STORED HERE — they
-- live in edge-function env vars (CONNECTOR_<TYPE>_SECRET_KEY). Admin-only.

create table public.connectors (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in ('stripe')),  -- extend per connector
  name          text not null,
  enabled       boolean not null default false,
  config        jsonb not null default '{}'::jsonb,        -- non-secret: KPI toggles, targets, labels
  schedule_cron text not null default '0 * * * *',         -- advisory cadence
  next_run_at   timestamptz,                                -- NULL = due on next tick
  last_run_at   timestamptz,
  last_status   text not null default 'never' check (last_status in ('ok','error','never')),
  last_error    text,
  last_result   jsonb,                                      -- {inserted:N, keys:[...]}
  created_by    uuid references auth.users (id) default auth.uid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_connectors_due on public.connectors (enabled, next_run_at);

alter table public.connectors enable row level security;
create policy "connectors admin manage" on public.connectors
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create trigger trg_connectors_updated_at
  before update on public.connectors
  for each row execute function public.handle_updated_at();
