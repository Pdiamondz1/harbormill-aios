# Onboarding SOP — Signed → Live

A repeatable checklist so onboarding is smooth and identical every client. Front-loads the usual
delivery-blocker (access). Pairs with `docs/per-client-workflow.md` and `docs/client-setup.md` for
the technical deploy.

**Staggering rule (capacity):** onboard project #2's *sales* while delivering project #1's *build*.
Never start two builds in the same week.

---

## Day 0 — same day as "yes"
- [ ] Send **welcome email** + **deposit invoice** (Stripe; 50% per proposal).
- [ ] Send the **access-intake checklist** (below) so they can start gathering before kickoff.
- [ ] Book the **kickoff call** (within 48h) and the **delivery/handoff call** (end of build).
- [ ] Set the **retainer-conversion review** date (at/just after delivery).
- [ ] Update [tracker](warm-50-tracker.md): status → `Project signed`.

## Day 1–2 — kickoff call (45 min)
- [ ] Confirm scope + the **one success metric** and the **one number** you'll move.
- [ ] Confirm what's explicitly out of scope (defer to retainer).
- [ ] Set check-in cadence (e.g. short async update mid-build + the delivery call).
- [ ] Walk the access checklist together; unblock anything missing.

## Access-intake checklist (the delivery-blocker — get all of it before building)
- [ ] **Data source** for the automation — invoicing/accounting system (AR), lead source, or metric feed.
- [ ] **Credentials / API access** to that source (least-access; you architect for it).
- [ ] **Google Workspace access** for export (deck uses `google-workspace-proxy`).
- [ ] **Client's own cloud + AI accounts** per the per-client model — you provision, **they own the keys**:
  - [ ] Supabase project created (you deploy schema + functions, ~30–45 min).
  - [ ] Anthropic + OpenAI keys set as function secrets.
- [ ] Brand inputs for white-label (name, logo, colors) if they want their own skin.

## Deploy their deck (technical — per `docs/per-client-workflow.md`)
- [ ] Clone base template → `client-x-aios`; add `upstream` remote.
- [ ] `supabase link` + `supabase db push`; seed demo data so the deck looks alive day one.
- [ ] Provision first admin (no public signup): add user + `insert into user_roles … 'admin'`.
- [ ] Deploy edge functions: `report-ingest`, `assistant-chat`, `knowledge-sync`, `google-workspace-proxy`.
- [ ] Set secrets (AI keys, `ASSISTANT_NAME`, `PRODUCT_NAME`); white-label `brand.ts` + `index.css`.
- [ ] Deploy frontend (Vercel/Netlify) with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.

## Hand-off principles
- **Customize in the config/data seams; never fork the shared engine.** Bespoke build = data into
  `report-ingest`, a deck page, or a tool in `assistant-chat/tools.ts`.
- Reusable improvements flow back to the base template → next client is faster.

## Definition of "onboarded"
Deck is live + branded, access secured, scope + metric agreed, deposit collected, build started.
