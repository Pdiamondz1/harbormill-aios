-- Phase: generalized work-management surfaces (domain-agnostic).
-- App-native interactive entities that sit alongside the read-only ingest deck:
--   projects   — initiatives with status/owner/dates/progress (admin-managed).
--   notes      — light internal notes, optionally attached to a project.
--   activity   — an append-only timeline, written only by DB triggers.
--
-- Access uses the template's gates: has_access() = admin OR stakeholder reads;
-- admins manage projects; either tier can add notes; activity is system-written.

-- ── Projects / initiatives ───────────────────────────────────────────────────
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  status      text not null default 'planned'
              check (status in ('planned', 'active', 'blocked', 'done')),
  owner       text,                        -- free-text owner label (domain-agnostic)
  start_date  date,
  due_date    date,
  progress    integer not null default 0 check (progress between 0 and 100),
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_projects_status on public.projects (status, due_date);

alter table public.projects enable row level security;

create policy "projects readable by access tier" on public.projects
  for select to authenticated using (public.has_access());
create policy "projects managed by admin" on public.projects
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.handle_updated_at();

-- ── Notes (light internal messaging) ─────────────────────────────────────────
create table public.notes (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references public.projects (id) on delete cascade,
  author      uuid not null references auth.users (id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index idx_notes_project on public.notes (project_id, created_at desc);

alter table public.notes enable row level security;

create policy "notes readable by access tier" on public.notes
  for select to authenticated using (public.has_access());
-- Either tier can add a note, but only as themselves.
create policy "notes insert own" on public.notes
  for insert to authenticated
  with check (author = auth.uid() and public.has_access());
-- Author (or an admin) can remove their own note.
create policy "notes delete own or admin" on public.notes
  for delete to authenticated
  using (author = auth.uid() or public.is_admin());

-- ── Activity timeline (append-only; written only by triggers) ────────────────
create table public.activity (
  id          uuid primary key default gen_random_uuid(),
  type        text not null,
  actor       uuid references auth.users (id) on delete set null,
  summary     text not null,
  entity_type text,
  entity_id   uuid,
  created_at  timestamptz not null default now()
);
create index idx_activity_time on public.activity (created_at desc);

alter table public.activity enable row level security;

create policy "activity readable by access tier" on public.activity
  for select to authenticated using (public.has_access());
create policy "service writes activity" on public.activity
  for all to service_role using (true) with check (true);
-- No authenticated insert: the timeline is written only by the triggers below
-- (security definer), so it stays a truthful record of what happened.

create or replace function public.log_project_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activity (type, actor, summary, entity_type, entity_id)
    values ('project_created', auth.uid(), 'Created project: ' || new.title, 'project', new.id);
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.activity (type, actor, summary, entity_type, entity_id)
    values ('project_status_changed', auth.uid(),
            'Project "' || new.title || '" → ' || new.status, 'project', new.id);
  end if;
  return new;
end;
$$;

create or replace function public.log_note_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.activity (type, actor, summary, entity_type, entity_id)
  values ('note_added', new.author, 'Added a note', 'note', new.id);
  return new;
end;
$$;

create trigger trg_projects_activity
  after insert or update on public.projects
  for each row execute function public.log_project_activity();
create trigger trg_notes_activity
  after insert on public.notes
  for each row execute function public.log_note_activity();
