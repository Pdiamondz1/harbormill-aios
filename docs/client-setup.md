# Client setup

How to stand up a new Harbormill AIOS deployment for a client. Each client runs on
**their own** Supabase project, Google Cloud OAuth app, and AI keys — they own their data.

Estimated time: ~30–45 min, most of it waiting on Google's OAuth consent screen.

---

## 0. Prerequisites

- Node 20+ and the [Supabase CLI](https://supabase.com/docs/guides/cli).
- An [Anthropic API key](https://console.anthropic.com/) (assistant chat).
- An [OpenAI API key](https://platform.openai.com/) (embeddings for RAG).
- A Google Cloud project (only if you want the Workspace bridge).

```bash
git clone <your-fork-of-this-repo> client-name-aios
cd client-name-aios
npm install
```

### Guided setup (recommended)

```bash
npm run setup:client
```

Walks you through the per-client basics, writes `.env`, and prints the exact
ordered backend commands tailored to your project. It does **not** run any
destructive Supabase command itself — you review and run those — so it's safe to
re-run. The manual steps below are the same flow, spelled out.

---

## 1. Create the Supabase project & apply the schema

1. Create a project at [supabase.com](https://supabase.com/dashboard) and note the **project ref**.
2. Link and push the migrations:

```bash
supabase link --project-ref <project-ref>
supabase db push          # applies everything in supabase/migrations
```

3. (Optional) Load the demo seed so the deck looks alive before agents are wired.
   `seed.sql` runs automatically on a *local* `supabase db reset`; for a remote project,
   paste `supabase/seed.sql` into the SQL editor and run it.

---

## 2. Seed the first admin

There is no public signup — access is provisioned. Create the operator's user, then grant `admin`:

1. In the Supabase dashboard → **Authentication → Users → Add user** (set email + password).
2. SQL editor:

```sql
insert into public.user_roles (user_id, role)
values ('<that-user-uuid>', 'admin');
```

Stakeholders get `'stakeholder'` the same way. (Admins can also grant roles once signed in.)

---

## 3. Deploy the edge functions

```bash
supabase functions deploy report-ingest
supabase functions deploy assistant-chat
supabase functions deploy knowledge-sync
supabase functions deploy google-workspace-proxy
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected by
Supabase automatically — you do **not** set those. Set the rest as secrets:

```bash
# AI (required for the assistant)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set OPENAI_API_KEY=sk-...
# Optional AI overrides
supabase secrets set ANTHROPIC_MODEL=claude-sonnet-4-6          # model id (default: claude-sonnet-4-6; Harbormill's own deploy uses an Opus id)
supabase secrets set ANTHROPIC_MAX_TOKENS=4096                  # max output tokens (default: 4096)
supabase secrets set ANTHROPIC_THINKING_BUDGET=0                # extended-thinking budget_tokens (default: 0 = off; e.g. 8000 enables it; auto-raises max_tokens above the budget, temperature stays default)
supabase secrets set ASSISTANT_NAME="Aria" PRODUCT_NAME="Acme Deck"
```

---

## 4. Connectors (optional)

Connectors pull live data from external SaaS (Stripe, GA4, …) into
`metric_snapshots` on an hourly schedule via the `connector-sync` edge function.

### Deploy the edge function

```bash
supabase functions deploy connector-sync
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

### Set per-connector secrets

For each enabled connector, set its API key as a Supabase edge-function secret.
The env var name is `CONNECTOR_<TYPE>_SECRET_KEY` — one per connector type:

```bash
supabase secrets set CONNECTOR_STRIPE_SECRET_KEY=sk_live_...
```

**The key is never stored in the database.** The `connectors` table holds only
non-secret config (KPI toggles, targets, schedule). The admin Connectors page
will show `error` with the missing-env message until the secret is set.

### Vault secrets for auto-scheduling

The hourly pg_cron job reads two values from Supabase Vault. Until they are set
the scheduled POST is inert — the function and the admin "Sync now" button
continue to work without them.

Set them once per project in the SQL editor:

```sql
-- The connector-sync function URL (find it in Dashboard → Edge Functions)
select vault.create_secret(
  'https://<project-ref>.supabase.co/functions/v1/connector-sync',
  'connector_sync_url',
  'connector-sync edge function URL'
);

-- The service-role key (Dashboard → Project Settings → API → service_role)
select vault.create_secret(
  '<your-service-role-key>',
  'service_role_key',
  'Supabase service-role key'
);
```

Once both are set the cron job fires on the hour and syncs every enabled
connector whose `next_run_at` is due.

### Enable connectors in the UI

`src/config/features.ts` has a `connectors` flag (default `true`). Flip it to
`false` to remove the nav entry and route for a client that does not use this
feature.

---

## 4b. Google Workspace bridge (optional)

1. In Google Cloud → **APIs & Services**: enable the **Google Drive API** and **Google Sheets API**.
2. **Credentials → Create OAuth client ID → Web application**. Add an authorized redirect URI:
   `https://<your-app-domain>/workspace/callback` (and `http://127.0.0.1:8080/workspace/callback` for local dev).
3. Set the function secrets:

```bash
supabase secrets set GOOGLE_OAUTH_CLIENT_ID=...apps.googleusercontent.com
supabase secrets set GOOGLE_OAUTH_CLIENT_SECRET=...
supabase secrets set GOOGLE_OAUTH_STATE_SECRET="$(openssl rand -hex 32)"
supabase secrets set GOOGLE_REDIRECT_URI=https://<your-app-domain>/workspace/callback
# Optional
supabase secrets set WORKSPACE_FOLDER_NAME="Acme Deck"      # Drive folder name
supabase secrets set GOOGLE_ALLOWED_DOMAIN=acme.com          # restrict to a Workspace domain
supabase secrets set GOOGLE_EXPORT_USER_ID=<admin-user-uuid> # for scheduled metric exports
```

Scope is `drive.file` only — the app sees just the files it creates.

---

## 4c. Toggle modules per client (optional)

`src/config/features.ts` is the plug-and-play lever: flip a flag off and that
module disappears from the nav **and** its routes stop resolving (deep links
fall back to Overview) — no code changes. Modules: `projects`, `calendar`,
`briefings`, `findings`, `strategy`, `workspace`, `assistant`.

To disable a specific Aria tool for a deployment, set the function secret:

```bash
supabase secrets set DISABLED_TOOLS=get_cost_stats,propose_correction
```

**Retainer / ROI:** the "Value delivered" surface shows value vs the client's fee.
Set the monthly retainer (cents) — admins can also edit it in-app:

```sql
update public.aios_dashboard_settings set value = '500000'::jsonb
  where key = 'monthly_retainer_cents';   -- $5,000/mo
```

Value is **reported in** (admins log it, or connectors/automations push it via
`report-ingest` `type:"value"`) — the deck never fabricates it.

---

## 5. Deploy the frontend

Any static host (Vercel, Netlify, Cloudflare Pages). Set the build env:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon/publishable key>
```

Build command `npm run build`, output `dist/`. (SPA — route all paths to `index.html`.)

For local dev: `cp .env.example .env`, fill those two values, `npm run dev`.

---

## 6. Wire the client's agents (ongoing)

Everything on the deck flows through **one** service-role endpoint. Point the client's
scheduled jobs at it (auth: `Authorization: Bearer <service-role-key>`):

```bash
# Push KPIs
curl -X POST "$URL/functions/v1/report-ingest" -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"metrics","payload":{"metrics":[{"key":"mrr","label":"MRR","value":"$52,000","status":"on_track"}]}}'

# Publish a weekly brief / file a finding — same endpoint, different `type`
# (see supabase/functions/report-ingest/index.ts for the full payload shapes)
```

To feed the assistant's knowledge base, push documents to `knowledge-sync`
(or sync the `documents` table — see `docs/extending.md`).

---

## Type generation (optional)

The shipped `src/integrations/supabase/types.ts` is a permissive stub. To get full typing:

```bash
supabase gen types typescript --project-id <project-ref> > src/integrations/supabase/types.ts
```
