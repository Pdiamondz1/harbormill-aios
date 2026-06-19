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
supabase secrets set ANTHROPIC_MODEL=claude-sonnet-4-6
supabase secrets set ASSISTANT_NAME="Aria" PRODUCT_NAME="Acme Deck"
```

---

## 4. Google Workspace bridge (optional)

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

## 4b. Toggle modules per client (optional)

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
