# Harbormill's Own AIOS — Deployment Runbook

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to work this runbook task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a real, persistent, hosted Harbormill-Automation AIOS at `https://aios.harbormill.net` on its own Supabase project, with all features deployed, clean of demo data, ready for Damon to log in and use Meetings + AR + Aria.

**Architecture:** Per-client deployment applied to Harbormill ("client zero"): a new Supabase project (`harbormill-aios`) + a new Vercel project building from the base-template repo (already Harbormill-branded), wired to `aios.harbormill.net`. No repo clone, no rebrand, no fake data.

**Tech Stack:** Supabase (Postgres + RLS + Deno edge functions, pg_cron/pg_net) · Vite/React build on Vercel · Supabase CLI + Supabase MCP tools · Google Cloud OAuth.

**Spec:** `docs/superpowers/specs/2026-06-24-harbormill-own-aios-deployment-design.md`
**Reference runbook:** `docs/client-setup.md` (the canonical per-client process this mirrors).

---

## Conventions & ownership

Each task is tagged **[AGENT]** (the agent executes via Supabase MCP tools or the Supabase CLI) or
**[DAMON]** (requires his accounts, credentials, secrets, or DNS — the agent provides exact steps and
verifies the result). Some are **[BOTH]**.

- **CLI auth:** the agent runs `supabase` via `npx --yes supabase@latest ...` with
  `SUPABASE_ACCESS_TOKEN` set in the command (Damon's token). MCP tools need no token.
  **Every CLI invocation below — including all `supabase secrets set` lines — uses this same
  `SUPABASE_ACCESS_TOKEN=<token> npx --yes supabase@latest ...` wrapper** even where the bare
  `supabase ...` form is shown for brevity.
- **Project ref:** created in Task 1; referred to below as `<REF>`. Function base URL:
  `https://<REF>.supabase.co/functions/v1/<fn>`.
- **Secrets stay out of the transcript:** sensitive *values* (AI keys, Google creds, the
  service-role key) are set by **Damon** in the dashboard / SQL editor, OR he pastes them and accepts
  transcript exposure. The agent never echoes a secret value into a command.
- This is a deployment, so most "verification" is MCP queries (`list_migrations`, `list_edge_functions`,
  `get_advisors`, `execute_sql`) and HTTP probes — not unit tests.

---

## Task 0: Confirm cost & authorize project creation  **[DAMON]**

The org already has 3 Supabase projects, so a 4th is likely billable.

- [ ] **Step 1:** Agent calls `get_cost` (MCP) for a new project in org `jqoccazvwztzbzdumibm` and reports the exact price.
- [ ] **Step 2:** Damon approves the cost (or picks the org/plan). **Do not create the project until approved.**

---

## Task 1: Create the Supabase project  **[AGENT]**

**Depends on:** Task 0 approval.

- [ ] **Step 1:** `confirm_cost` (MCP) with the amount from Task 0 → capture the `confirmation_id`.
- [ ] **Step 2:** `create_project` (MCP): name `harbormill-aios`, org `jqoccazvwztzbzdumibm`, region `us-east-1` (match the demo), passing the `confirmation_id`.
- [ ] **Step 3:** Poll `list_projects` until status `ACTIVE_HEALTHY`. Record `<REF>`.
- [ ] **Step 4 (verify):** `get_project_url` and `get_publishable_keys` (MCP) — record the project URL and the anon/publishable key (needed for the Vercel env in Task 9).

---

## Task 2: Apply all migrations  **[AGENT]**

The full schema, in order. Source files live in `supabase/migrations/`.

- [ ] **Step 1:** Link the CLI and push every migration at once:

```bash
SUPABASE_ACCESS_TOKEN=<token> npx --yes supabase@latest link --project-ref <REF>
SUPABASE_ACCESS_TOKEN=<token> npx --yes supabase@latest db push --yes
```

(`--yes` keeps it non-interactive. If `db push` is blocked or prompts for a DB password in this
environment, fall back to applying each migration file via MCP `apply_migration` in filename order —
the exact path proven on the demo this session.)

- [ ] **Step 2 (verify):** `list_migrations` (MCP) shows the full set ending with `meeting_reports`; `list_tables` shows `loops`, `loop_actions`, `ar_invoices`, `meeting_reports`, `value_events` (with `audit_opportunity_id`).
- [ ] **Step 3 (verify):** `execute_sql` → `select jobname from cron.job;` includes `connector-sync-hourly` and `loop-run-hourly`.

**Do NOT run `seed.sql`** — this is Harbormill's real instance; it starts clean.

---

## Task 3: Deploy all edge functions  **[AGENT]**

- [ ] **Step 1:** Deploy each (CLI auto-bundles `_shared`; `--no-verify-jwt` matches the established pattern — functions self-authenticate):

```bash
for fn in report-ingest assistant-chat knowledge-sync google-workspace-proxy connector-sync loop-run transcript-summarize; do
  SUPABASE_ACCESS_TOKEN=<token> npx --yes supabase@latest functions deploy "$fn" --project-ref <REF> --no-verify-jwt
done
```

- [ ] **Step 2 (verify):** `list_edge_functions` (MCP) shows all **7** ACTIVE.

---

## Task 4: Set AI key secrets  **[DAMON]** (agent-assist optional)

Required for Aria; `ANTHROPIC_API_KEY` also powers Meetings.

- [ ] **Step 1:** Damon sets, in **Dashboard → Edge Functions → Secrets** (keeps values out of chat), OR pastes values for the agent to run via CLI:

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...   --project-ref <REF>
supabase secrets set OPENAI_API_KEY=sk-...          --project-ref <REF>
# Optional override; brand already matches so ASSISTANT_NAME/PRODUCT_NAME can be omitted
supabase secrets set ANTHROPIC_MODEL=claude-sonnet-4-6 --project-ref <REF>
```

- [ ] **Step 2 (verify):** Agent — after Damon confirms — checks `assistant-chat` works once a user exists (Task 8 smoke). `OPENAI_API_KEY` is Aria-RAG-only; not a blocker for Meetings/AR.

---

## Task 5: Auth config + admin user  **[DAMON]** + grant role **[AGENT]**

- [ ] **Step 1 [DAMON]:** Dashboard → **Authentication → URL Configuration**: set **Site URL** = `https://aios.harbormill.net` and add it to **Redirect URLs** (add `http://127.0.0.1:8080` too if he wants local dev).
- [ ] **Step 2 [DAMON]:** Dashboard → **Authentication → Users → Add user**: Damon's email + a password. Copy the new user's UUID.
- [ ] **Step 3 [AGENT]:** Grant admin (MCP `execute_sql`, substituting the UUID):

```sql
insert into public.user_roles (user_id, role) values ('<damon-user-uuid>', 'admin');
```

- [ ] **Step 4 (verify):** `execute_sql` → `select role from public.user_roles where user_id = '<uuid>';` returns `admin`.

---

## Task 6: Google Workspace OAuth  **[DAMON]** + set secrets **[BOTH]**

Needed for AR email send (`gmail.send`) + Drive export. Meetings/Aria don't need it — this task can run in parallel with first use.

- [ ] **Step 1 [DAMON]:** Google Cloud Console → **APIs & Services → Enable APIs**: enable **Drive API**, **Gmail API**, **Sheets API**.
- [ ] **Step 2 [DAMON]:** **Credentials → Create OAuth client ID → Web application**. Authorized redirect URI: **`https://aios.harbormill.net/workspace/callback`** (add `http://127.0.0.1:8080/workspace/callback` for local dev). Copy the client id + secret.
- [ ] **Step 3 [BOTH]:** Set the four secrets (Damon in dashboard, or pastes for agent CLI):

```bash
supabase secrets set GOOGLE_OAUTH_CLIENT_ID=...apps.googleusercontent.com --project-ref <REF>
supabase secrets set GOOGLE_OAUTH_CLIENT_SECRET=...                       --project-ref <REF>
supabase secrets set GOOGLE_OAUTH_STATE_SECRET="$(openssl rand -hex 32)"  --project-ref <REF>
supabase secrets set GOOGLE_REDIRECT_URI=https://aios.harbormill.net/workspace/callback --project-ref <REF>
```

- [ ] **Step 4 (verify):** After Vercel is live (Task 9) and Damon logs in, the **Workspace** page "Connect Google" flow completes without a redirect/state error.

---

## Task 7: Set the CORS origin + vault secrets  **[BOTH]**

- [ ] **Step 1 [BOTH]:** Lock CORS to the production domain:

```bash
supabase secrets set ALLOWED_ORIGINS=https://aios.harbormill.net --project-ref <REF>
```

- [ ] **Step 2 [AGENT]:** Set the two function-URL vault secrets (MCP `execute_sql`):

```sql
select vault.create_secret('https://<REF>.supabase.co/functions/v1/loop-run',       'loop_run_url',       'loop-run edge function URL');
select vault.create_secret('https://<REF>.supabase.co/functions/v1/connector-sync',  'connector_sync_url', 'connector-sync edge function URL');
```

- [ ] **Step 3 [DAMON]:** Set the **service-role key** vault secret in the **SQL editor** (keeps the key out of the agent's commands). Get it from Dashboard → Project Settings → API → `service_role`:

```sql
select vault.create_secret('<service-role-key>', 'service_role_key', 'Supabase service-role key');
```

- [ ] **Step 4 (verify) [AGENT]:** `execute_sql` → `select array_agg(name order by name) from vault.secrets;` returns all three (`connector_sync_url`, `loop_run_url`, `service_role_key`). Without #3 the AR hourly cron is inert.

---

## Task 8: Insert the real AR loop config  **[AGENT]**

One enabled loop so the Loops page works; **no invoices** (Damon adds his real ones).

- [ ] **Step 1:** MCP `execute_sql`:

```sql
insert into public.loops (type, enabled, config)
values ('ar_followup', true, '{"cadence_days":[7,14,30],"sender_name":"Harbormill Automation"}'::jsonb);
```

- [ ] **Step 2 (verify):** `select type, enabled, config from public.loops;` shows one enabled `ar_followup`.

---

## Task 9: Deploy the frontend to Vercel  **[DAMON]** (agent provides values)

Builds from the base-template repo (Harbormill-branded; full feature set is on `main` via PR #22).

- [ ] **Step 1 [AGENT]:** Provide the two build env values from Task 1:
  - `VITE_SUPABASE_URL=https://<REF>.supabase.co`
  - `VITE_SUPABASE_ANON_KEY=<publishable/anon key>`
  - Confirm the repo's `vercel.json` SPA rewrite ships (it does — applied automatically; no manual rewrite config).
- [ ] **Step 2 [DAMON]:** Vercel → **New Project** from the `harbormill-aios` repo, branch `main`. Build command `npm run build`, output `dist/`. Add the two env vars above.
- [ ] **Step 3 [DAMON]:** Deploy. Then **Project → Settings → Domains → Add** `aios.harbormill.net`, and add the **DNS record** Vercel shows (CNAME `aios` → Vercel) in the harbormill.net zone.
- [ ] **Step 4 (verify):** `https://aios.harbormill.net` loads the Harbormill-branded login; Damon signs in as the admin from Task 5.

---

## Task 10: Smoke tests & advisors  **[BOTH]**

- [ ] **Step 1 [DAMON] — Meetings (no Google needed):** On the deck → **Meetings**, paste a short real transcript → submit.
- [ ] **Step 2 [AGENT] verify:** `execute_sql` → a `meeting_reports` row + its linked `findings` (`source='transcript-agent'`) exist.
- [ ] **Step 3 [DAMON] — AR:** Push 1–2 real overdue invoices (agent provides this snippet; `$SERVICE_KEY` = service-role key, run by Damon so the key stays out of chat):

```bash
curl -X POST "https://<REF>.supabase.co/functions/v1/report-ingest" \
  -H "Authorization: Bearer $SERVICE_KEY" -H "Content-Type: application/json" \
  -d '{"type":"invoices","payload":{"invoices":[
    {"external_id":"<your-inv-id>","customer_name":"<client>","customer_email":"<ap@client>",
     "amount_cents":<cents>,"due_date":"<YYYY-MM-DD past>","status":"open"}]}}'
```

- [ ] **Step 4 [AGENT] — trigger + verify the loop:** `execute_sql` runs the vault-based `net.http_post` to `loop_run_url` (as the cron does), then confirms `loop_actions` rows are `proposed` with sensible estimates and AR metrics appear on Overview.
- [ ] **Step 5 [DAMON] — send path (after Task 6 + Google consent):** On **Workspace**, connect Google; then on **Loops**, approve a reminder → confirm the email sends and a `value_event` lands on **Value**.
- [ ] **Step 6 [AGENT] — security:** `get_advisors` (security) shows no new issues (new tables carry admin RLS).

---

## Definition of done
- Project `harbormill-aios` ACTIVE; full migrations; 7 functions ACTIVE; all 3 vault secrets set.
- `https://aios.harbormill.net` serves the Harbormill deck; Damon logs in as admin.
- Meetings smoke test produces a report + findings; AR smoke test queues reminders; (post-consent) a reminder sends and logs value.
- `get_advisors` clean for the new objects.

## Flagged follow-ons (not in this runbook)
- An **"Add invoice" admin UI** (removes the curl snippet friction) — first dogfood-driven feature.
- Wiring real metric/briefing/connector data sources to `report-ingest`.
- Optional: `supabase gen types`, sync the Harbormill wiki into Aria's RAG, set `monthly_retainer_cents`.
