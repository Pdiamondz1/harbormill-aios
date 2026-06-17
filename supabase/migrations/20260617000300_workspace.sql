-- Phase 4: Google Workspace bridge.
-- Per-user Google connections. The token table is SERVICE-ROLE-ONLY by
-- construction: RLS is on and NO policies exist, so no client JWT can read or
-- write a row. The UI learns connection state only via google_connection_status(),
-- which never returns token columns.

create table public.google_workspace_accounts (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null unique references auth.users (id) on delete cascade,
  google_email            text not null,
  scopes                  text[] not null default '{}',
  refresh_token           text not null,
  access_token            text,
  access_token_expires_at timestamptz,
  folder_id               text,
  status                  text not null default 'active' check (status in ('active', 'needs_reconnect', 'revoked')),
  connected_at            timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.google_workspace_accounts enable row level security;
-- Deliberately NO policies: service-role access only.

create trigger trg_google_workspace_accounts_updated_at
  before update on public.google_workspace_accounts
  for each row execute function public.handle_updated_at();

-- Connection status for the CALLER only — no token columns in the return type.
create or replace function public.google_connection_status()
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  acct record;
begin
  if not public.has_access() then
    raise exception 'forbidden: access required';
  end if;

  select google_email, scopes, status, folder_id is not null as has_folder, connected_at
    into acct
    from public.google_workspace_accounts
   where user_id = auth.uid();

  if not found then
    return jsonb_build_object('connected', false);
  end if;

  return jsonb_build_object(
    'connected', acct.status = 'active',
    'needs_reconnect', acct.status = 'needs_reconnect',
    'google_email', acct.google_email,
    'scopes', to_jsonb(acct.scopes),
    'has_folder', acct.has_folder,
    'connected_at', acct.connected_at
  );
end;
$$;

revoke execute on function public.google_connection_status() from public, anon;
grant execute on function public.google_connection_status() to authenticated, service_role;
