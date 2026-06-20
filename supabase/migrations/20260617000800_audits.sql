-- ROI-discovery audit: admin-only prospecting. Captures a prospect's value
-- opportunities and the proposed retainer; the UI computes ROI and exports a
-- branded Opportunity Report. PRIVATE sales data — admin-only, and deliberately
-- NOT logged to the access-tier-readable `activity` table (would leak prospect names).

create table public.audits (
  id                      uuid primary key default gen_random_uuid(),
  prospect_name           text not null,
  company                 text,
  status                  text not null default 'draft'
                          check (status in ('draft','presented','won','lost')),
  proposed_retainer_cents integer not null default 500000 check (proposed_retainer_cents >= 0),
  summary_notes           text,
  last_export_doc_id      text,
  created_by              uuid references auth.users (id) default auth.uid(),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index idx_audits_status on public.audits (status, created_at desc);

alter table public.audits enable row level security;
create policy "audits admin manage" on public.audits
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create trigger trg_audits_updated_at
  before update on public.audits
  for each row execute function public.handle_updated_at();

create table public.audit_opportunities (
  id                 uuid primary key default gen_random_uuid(),
  audit_id           uuid not null references public.audits (id) on delete cascade,
  title              text not null,
  description_md     text,
  category           text not null default 'other'
                     check (category in ('hours_saved','revenue_captured','cost_avoided','other')),
  annual_value_cents integer not null default 0 check (annual_value_cents >= 0),
  confidence         text not null default 'med' check (confidence in ('low','med','high')),
  effort             text not null default 'med' check (effort in ('low','med','high')),
  basis_md           text,
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index idx_audit_opportunities_audit on public.audit_opportunities (audit_id, sort_order);

alter table public.audit_opportunities enable row level security;
create policy "audit_opportunities admin manage" on public.audit_opportunities
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create trigger trg_audit_opportunities_updated_at
  before update on public.audit_opportunities
  for each row execute function public.handle_updated_at();
