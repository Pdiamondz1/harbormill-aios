-- Loop-run scheduling: hourly pg_cron job invokes the loop-run edge fn via
-- pg_net, with URL + service-role key read from Vault (never a readable table).
--
-- Mirrors the idiom in 20260617001000_connector_schedule.sql exactly.
-- Extensions (pg_cron, pg_net) are already installed by the connector migration;
-- the `create extension if not exists` guards are retained for safety.
--
-- Vault secrets:
--   loop_run_url     — MUST be set by the human operator after the loop-run
--                      edge function is deployed:
--                        select vault.create_secret(
--                          'https://<ref>.supabase.co/functions/v1/loop-run',
--                          'loop_run_url');
--                      Until it is set, pg_net drops the null-URL request
--                      (inert — no error, no side-effect).
--   service_role_key — shared with the connector schedule; already set if
--                      that migration is deployed. If missing, the POST fires
--                      with a null/empty Authorization header (also inert).

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule('loop-run-hourly', '15 * * * *', $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'loop_run_url'),
    headers := jsonb_build_object(
                 'Authorization', 'Bearer ' || coalesce(
                   (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
                   ''
                 ),
                 'Content-Type', 'application/json'),
    body    := '{}'::jsonb
  );
$$);
