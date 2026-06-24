-- KPI-watch scheduling: a DAILY pg_cron job invokes the kpi-watch edge fn via pg_net,
-- with URL + service-role key read from Vault (never a readable table). Mirrors the
-- connector-sync pattern (20260617001000_connector_schedule.sql).
--
-- Vault secrets:
--   kpi_watch_url     — the kpi-watch function URL. Set by the operator at deploy:
--                         select vault.create_secret(
--                           'https://<project-ref>.functions.supabase.co/kpi-watch',
--                           'kpi_watch_url', 'KPI-watch edge function URL');
--                       If missing, pg_net drops the null-URL request (inert).
--   service_role_key  — SHARED with connector-sync (same secret name). If connector-sync
--                       already set it, this job reuses it. Otherwise the operator sets it:
--                         select vault.create_secret('<service-role-key>',
--                           'service_role_key', 'Supabase service-role key');
--                       Until set, the scheduled POST is inert (empty Authorization header).
--
-- The edge function and any manual invoke remain fully functional regardless of the cron.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Daily at 13:00 UTC. cron.schedule upserts by job name, so re-applying is safe.
-- Adjust the cron expression per client to run shortly after KPIs are ingested.
select cron.schedule('kpi-watch-daily', '0 13 * * *', $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'kpi_watch_url'),
    headers := jsonb_build_object(
                 'Authorization', 'Bearer ' || coalesce(
                   (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
                   ''
                 ),
                 'Content-Type', 'application/json'),
    body    := '{}'::jsonb
  );
$$);
