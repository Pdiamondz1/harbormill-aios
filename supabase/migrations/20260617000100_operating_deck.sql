-- Phase 2: the operating deck — metrics, weekly briefs, findings, documents.
--
-- Keystone design: the deck NEVER queries the client's business tables. Instead,
-- a single service-role ingest endpoint (report-ingest) pushes generic rows in.
-- That keeps this template domain-agnostic — each client wires their own
-- scheduled agent to publish KPIs/briefs/findings.

-- Shared updated_at trigger.
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Metrics ────────────────────────────────────────────────────────────────
-- Append-only time series. The dashboard reads the latest row per key via the
-- metric_latest view. `value` is text so any KPI shape works ("$12,400", "3", "4.8★").
create table public.metric_snapshots (
  id          uuid primary key default gen_random_uuid(),
  key         text not null,
  label       text not null,
  value       text not null,
  unit        text,
  target      text,
  status      text check (status in ('on_track', 'at_risk', 'off_track')),
  captured_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create index idx_metric_snapshots_key_time on public.metric_snapshots (key, captured_at desc);

alter table public.metric_snapshots enable row level security;

create policy "metrics readable by access tier"
  on public.metric_snapshots for select to authenticated
  using (public.has_access());

-- Latest snapshot per key — what the Overview renders. security_invoker so the
-- view enforces the base table's RLS as the querying user (not the view owner).
create view public.metric_latest with (security_invoker = true) as
  select distinct on (key) id, key, label, value, unit, target, status, captured_at
  from public.metric_snapshots
  order by key, captured_at desc;

-- ── Briefings ────────────────────────────────────────────────────────────────
-- Written only by the service-role ingest function. Admins see drafts + publish;
-- stakeholders see published only (the publish gate).
create table public.briefings (
  id           uuid primary key default gen_random_uuid(),
  week_start   date not null unique,
  title        text not null,
  body_md      text not null,
  kpis         jsonb not null default '[]',
  generated_by text not null default 'weekly-brief-agent',
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.briefings enable row level security;

create policy "briefings admin select"
  on public.briefings for select to authenticated
  using (public.is_admin());

create policy "briefings stakeholder select published"
  on public.briefings for select to authenticated
  using (public.has_access() and published_at is not null);

create policy "briefings admin update"
  on public.briefings for update to authenticated
  using (public.is_admin());

create trigger trg_briefings_updated_at
  before update on public.briefings
  for each row execute function public.handle_updated_at();

-- ── Findings ─────────────────────────────────────────────────────────────────
-- Admin-only in both directions (may carry stack traces / internal detail).
-- Upserted on fingerprint by the ingest function; a resolved finding that
-- recurs reopens (regression signal).
create table public.findings (
  id           uuid primary key default gen_random_uuid(),
  severity     text not null check (severity in ('critical', 'high', 'medium', 'low')),
  title        text not null,
  summary_md   text not null,
  evidence     jsonb not null default '{}',
  source       text not null default 'sweep-agent',
  status       text not null default 'open' check (status in ('open', 'acknowledged', 'resolved', 'wontfix')),
  fingerprint  text unique,
  occurrences  integer not null default 1,
  last_seen_at timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index idx_findings_status on public.findings (status, severity);

alter table public.findings enable row level security;

create policy "findings admin select"
  on public.findings for select to authenticated
  using (public.is_admin());

create policy "findings admin update"
  on public.findings for update to authenticated
  using (public.is_admin());

create trigger trg_findings_updated_at
  before update on public.findings
  for each row execute function public.handle_updated_at();

-- ── Documents ────────────────────────────────────────────────────────────────
-- Markdown strategy/reference library. Readable by the access tier; also the
-- corpus the assistant's knowledge sync embeds (Phase 3).
create table public.documents (
  id          uuid primary key default gen_random_uuid(),
  path        text not null unique,
  title       text not null,
  content_md  text not null,
  tags        text[] not null default '{}',
  source_hash text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "documents readable by access tier"
  on public.documents for select to authenticated
  using (public.has_access());

create trigger trg_documents_updated_at
  before update on public.documents
  for each row execute function public.handle_updated_at();
