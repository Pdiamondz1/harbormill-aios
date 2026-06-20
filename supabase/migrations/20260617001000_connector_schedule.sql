-- Connector scheduling: hourly pg_cron job invokes the connector-sync edge fn via
-- pg_net, with URL + service-role key read from Vault (never a readable table).
--
-- NEW pattern for this repo (existing cron calls a SQL fn; this uses pg_net HTTP +
-- Vault). Validated live before writing:
--   - vault.decrypted_secrets EXISTS; column is `decrypted_secret` (confirmed)
--   - vault.create_secret signature: (new_secret, new_name, ...) (confirmed)
--   - pg_cron 1.6.4 already installed; pg_net 0.20.3 available, not yet installed
--
-- Vault secrets:
--   connector_sync_url  — SET by this migration script (Step 1, via execute_sql)
--   service_role_key    — MUST be set by the human operator:
--                           select vault.create_secret('<your-service-role-key>',
--                                  'service_role_key', 'Supabase service-role key');
--                         Until it is set, the scheduled POST is inert (returns a
--                         pg_net request with a null/empty Authorization header).
--                         The edge function and admin "Sync now" remain fully
--                         functional regardless.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule('connector-sync-hourly', '0 * * * *', $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'connector_sync_url'),
    headers := jsonb_build_object(
                 'Authorization', 'Bearer ' || coalesce(
                   (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
                   ''
                 ),
                 'Content-Type', 'application/json'),
    body    := '{}'::jsonb
  );
$$);
