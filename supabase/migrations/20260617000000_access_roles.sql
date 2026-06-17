-- Phase 1: tiered access model.
-- Two tiers — `admin` (operator) and `stakeholder` (view-only) — provisioned via
-- user_roles. There is no self-service signup; the first admin is seeded by hand
-- (see docs/client-setup.md).

create type public.app_role as enum ('admin', 'stakeholder');

create table public.user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- SECURITY DEFINER role check. Defined as a function so RLS policies can call it
-- without recursing into user_roles' own policies.
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- Convenience gates used by app RLS and stats/ingest endpoints.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select public.has_role(auth.uid(), 'admin'::public.app_role); $$;

create or replace function public.has_access()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.has_role(auth.uid(), 'admin'::public.app_role)
      or public.has_role(auth.uid(), 'stakeholder'::public.app_role);
$$;

-- Users may read their own role rows (the frontend access hook needs this).
create policy "users read own roles"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid());

-- Admins manage role grants. The very first admin is seeded out-of-band via the
-- service role (which bypasses RLS) — see docs/client-setup.md.
create policy "admins manage roles"
  on public.user_roles for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke execute on function public.has_role(uuid, public.app_role) from anon;
revoke execute on function public.is_admin() from anon;
revoke execute on function public.has_access() from anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;
grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.has_access() to authenticated, service_role;
