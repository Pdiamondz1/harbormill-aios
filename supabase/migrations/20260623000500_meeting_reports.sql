-- Meeting Transcript Reports: per-meeting AI summary. Action items extracted from
-- a transcript are filed separately as findings (linked via findings.evidence ->>
-- meeting_report_id); this table holds the summary. Raw transcript is NOT stored
-- (privacy) — only its character count, for cost/audit.
create table public.meeting_reports (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  meeting_date      date not null,
  summary_md        text not null,
  transcript_chars  integer not null default 0,
  action_item_count integer not null default 0,
  source            text not null default 'manual',
  created_by        uuid references auth.users (id) on delete set null,
  created_at        timestamptz not null default now()
);
create index idx_meeting_reports_date on public.meeting_reports (meeting_date desc);

alter table public.meeting_reports enable row level security;
create policy "meeting_reports admin all" on public.meeting_reports
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
