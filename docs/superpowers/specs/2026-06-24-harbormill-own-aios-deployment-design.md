# Harbormill's Own AIOS — Deployment Design

## Context

**Why this exists.** Harbormill Automation should run on its own product — the education-first,
"eat our own cooking" principle, and a real way for Damon to dogfood the AIOS (especially the new
Loop Engine + Meeting Reports) on Harbormill's actual business. Today there is one Supabase project,
`harbormill-aios-demo`, which now holds the **Meridian Field Services sales demo**. Harbormill needs
its **own, separate, persistent instance** with real data — not the prospect demo.

**Key fact that simplifies this:** the base template is *already Harbormill-branded*
(`src/config/brand.ts` = "Harbormill AIOS", assistant "Aria", harbormill.net). So this is **not a
rebrand** — it's a clean per-client deployment where the client is Harbormill itself, deployed
straight from the base template (no repo clone needed, since there are no bespoke customizations
beyond the base).

**Confirmed decisions (from brainstorming):**
- A **real, persistent** Harbormill-Automation instance (not a throwaway trial).
- **Hosted** at **`aios.harbormill.net`** (Vercel), reachable from any device.
- **Clean data start** — no fake/demo data (it's the real business). Ready to use **Meetings** and
  **AR/Loops** immediately; metrics/briefings wired later.
- AR invoices handled via a **`report-ingest` snippet** for now; an "Add invoice" admin UI is a
  flagged follow-on, not in this scope.

## Goal

Stand up a working, hosted, Harbormill-owned AIOS at `aios.harbormill.net` on its own Supabase
project, with all features deployed and reachable, that Damon can log into and start using — paste a
real meeting transcript, push real client invoices and approve AR reminders, ask Aria, log value.

## Architecture

Per-client model applied to Harbormill ("client zero"): **own Supabase project + own Vercel
frontend, deployed from the base template**, fully isolated from `harbormill-aios-demo`.

```
aios.harbormill.net  (Vercel project: harbormill-aios)
        │  VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (env-only client)
        ▼
Supabase project: harbormill-aios  (new, own DB + auth + keys)
  ├─ migrations: full set (access, operating deck, assistant, workspace, projects,
  │   value_delivered, audits, connectors+schedule, loops, ar_invoices,
  │   value_events_audit_link, loop_schedule, meeting_reports)
  ├─ edge functions: report-ingest, assistant-chat, knowledge-sync,
  │   google-workspace-proxy, connector-sync, loop-run, transcript-summarize
  ├─ secrets: ANTHROPIC_API_KEY, OPENAI_API_KEY, Google OAuth, ALLOWED_ORIGINS,
  │   ASSISTANT_NAME/PRODUCT_NAME (brand already matches), service vault secrets
  └─ data: clean — one enabled ar_followup loop (Harbormill sender), no fake rows
```

**Config locked to the URL:** Supabase Auth `site_url` + `additional_redirect_urls` =
`https://aios.harbormill.net`; edge-function secret `ALLOWED_ORIGINS=https://aios.harbormill.net`
(CORS). This keeps login redirects and browser calls correct in production.

## Components & division of labor

The work splits into **what the agent executes (via Supabase MCP / CLI)** and **what only Damon can
do (his accounts/credentials/DNS)**. The plan will sequence these; the spec records the split.

### Agent-executed
1. **Create the Supabase project** `harbormill-aios` in the org (confirm cost first — org already has
   3 projects, so this is likely billable; surface the price and get a go before creating).
2. **Apply all migrations** to the new project (same set proven on the demo, in order).
3. **Deploy all 7 edge functions** (CLI `--no-verify-jwt` to match the established pattern; functions
   self-authenticate).
4. **Set the non-secret config + vault secrets** reachable via tooling: `ALLOWED_ORIGINS`, and the
   three vault secrets the cron jobs read — **`service_role_key`** (REQUIRED: both
   `connector_sync_url`'s and `loop_run_url`'s pg_cron POSTs use it as the bearer; without it the AR
   hourly auto-run is inert), `loop_run_url`, and `connector_sync_url` (set once the function URLs
   exist). The cron schedules themselves come from migrations.
5. **Insert one real AR loop config** (enabled `ar_followup`, `sender_name` = Harbormill's choice),
   **no invoices**.
6. **Prep the Vercel build**: confirm `npm run build` output and the two `VITE_` env vars. The SPA
   rewrite already ships in the repo's `vercel.json` (applied automatically) — just confirm it's present.

### Damon-executed (runbook the plan produces)
1. **Provide AI keys**: `ANTHROPIC_API_KEY` (required for Meetings + Aria day one) and
   `OPENAI_API_KEY` (embeddings — only needed for Aria's RAG grounding, NOT a blocker for the
   AR/Meetings day-one path). Can reuse the demo's or issue new. Agent sets them as function secrets
   once provided (or Damon sets them in the dashboard).
2. **Supabase Auth**: set `site_url`/redirects to `https://aios.harbormill.net`; create the **admin
   user** (his email + password) and grant `admin` via `user_roles` (one SQL line the plan provides).
3. **Google OAuth client** (Google Cloud Console) for *this* project — needed for AR email send +
   Drive export (Meetings/Aria don't need it). Per `docs/client-setup.md` §4b:
   - **Enable the Google APIs**: Drive API, **Gmail API** (for `gmail.send`), and Sheets API.
   - **Authorized redirect URI** = the *frontend* callback route **`https://aios.harbormill.net/workspace/callback`**
     (NOT an edge-function URL).
   - Set **all four** function secrets: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`,
     `GOOGLE_OAUTH_STATE_SECRET` (e.g. `openssl rand -hex 32` — signs the OAuth state JWT; the flow
     breaks without it), and `GOOGLE_REDIRECT_URI=https://aios.harbormill.net/workspace/callback`.
4. **Vercel**: create the project from the repo, set the two `VITE_` env vars, deploy, add the custom
   domain `aios.harbormill.net`, and add the **DNS record** (`aios` CNAME → Vercel) in the
   harbormill.net zone.
5. **In-app consent**: after first login, connect Google on the Workspace page (grants Drive +
   gmail.send) so AR reminders can actually send.

## Data flow (day one)
- **Meetings**: paste transcript in the UI → `transcript-summarize` → summary + action items. Works
  as soon as `ANTHROPIC_API_KEY` is set. No Google needed.
- **AR/Loops**: Damon POSTs his real overdue invoices to `report-ingest` (`type:"invoices"`, snippet
  provided) → hourly cron (or manual trigger) runs `loop-run` → reminders queue in **Loops** → Damon
  approves → `gmail_send` (needs Google consent) → recovered value lands on **Value**.
- **Aria**: grounded once `ANTHROPIC_API_KEY` + `OPENAI_API_KEY` are set and (optionally) the wiki is
  synced via `npm run sync:wiki`.
- **Value**: admin "Log value" button works immediately; automation value accrues as loops deliver.

## Out of scope (flagged follow-ons)
- **"Add invoice" admin UI** — removes the snippet friction for AR. The first dogfood-driven feature.
- **Auto-wiring real data sources** (accounting/CRM → `report-ingest`) — a later integration project.
- **Real metric/briefing agents** — wire Harbormill's KPIs to the deck over time.
- Reusing vs. issuing fresh AI keys, and whether to sync the Harbormill wiki into Aria's RAG.
- **TypeScript type generation** + setting `monthly_retainer_cents` (per `client-setup.md`) — optional
  niceties, deferred; the deck runs without them.

## Verification (definition of done)
- Supabase project `harbormill-aios` exists; `list_migrations` shows the full set; `list_edge_functions`
  shows all 7 ACTIVE; `get_advisors` (security) shows no new issues (new tables have admin RLS).
- `https://aios.harbormill.net` loads the Harbormill-branded deck; Damon can log in as admin.
- **Meetings smoke test**: paste a short transcript → a `meeting_reports` row + linked findings appear.
- **AR smoke test**: push 1–2 real invoices → trigger `loop-run` → reminders appear in the Loops
  queue with correct estimates; after Google consent, approving one sends the email and logs value.
- Auth redirects and CORS work from the real domain (no localhost assumptions).

## Notes
- No repo clone: Harbormill's instance *is* the base template; future template improvements deploy
  straight here. (Client deployments still clone per `docs/per-client-workflow.md`.)
- This is primarily a **deployment**, so the implementation plan is a sequenced runbook — some steps
  the agent runs via MCP/CLI, some Damon runs — rather than a code-writing plan. The only data write
  is the single real AR loop config.
