# Project Context

Single source of truth for Harbormill's identity, strategy, architecture, and
operating instructions. Auto-loaded by Claude Code via a `CLAUDE.md` import.
Mirrored into the knowledge wiki at `docs/wiki/sources/project-context.md`.

## 1. Identity

- **Harbormill AIOS** is a **white-label AI operating-deck template** — a
  ready-to-deploy dashboard that gives a small-business operator one place to
  see live metrics, read an AI-written weekly brief, track findings, and talk
  to an AI assistant grounded in their business.
- This repo is the **base template**. Each client gets their own clone with
  their own Supabase, Google Cloud, and AI keys (see `docs/per-client-workflow.md`).
- **Harbormill Automation** is the company that builds and sells it — a custom
  AI-automation consultancy for small businesses, at **harbormill.net**.
- **Founder:** Damon Williams — AI Solutions Engineer; 15 years in enterprise
  IT infrastructure / networking / security (Nike, Assurant, IAA, LEGACY Supply
  Chain); independent consultant since 2015; SUNY Delhi, Information Systems
  Security. LinkedIn: linkedin.com/in/damon-w-67882768.

## 2. North Star & Philosophy

- **Education-first:** teach the owner to use AI (with Claude) for their
  business *first*, then automate the busywork on top of that foundation.
  "Teach you to fish," not sell a black box.
- **One config rebrands everything.** A client deployment should be a config +
  data change, never a fork of the shared engine.
- **The deck never touches client business tables.** All client data enters
  through one generic ingest seam; the deck reads only generic
  `metric_snapshots` / `briefings` / `findings`.

## 3. Stack

React 18 + Vite + TypeScript (strict) · Tailwind + shadcn/ui · TanStack Query ·
React Router · Supabase (Postgres + RLS + Deno edge functions) · Anthropic chat
(default `claude-sonnet-4-6`) + OpenAI embeddings.

The marketing site (`website/`) is a separate self-contained Vite app, dark-only,
copying the product's brand tokens; deployed on Vercel at harbormill.net.

## 4. Architecture Keystones (preserve these)

1. **One config rebrands everything** — `src/config/brand.ts` (words/names/logos)
   + CSS variables in `src/index.css` (`:root`/`.dark`). Dark-first. No component
   hardcodes brand or color. See [[White-Label Architecture]].
2. **One service-role ingest seam** — `supabase/functions/report-ingest` pushes
   generic `metric_snapshots`/`briefings`/`findings` in. The deck NEVER queries
   client business tables. See [[Report-Ingest Seam]].
3. **Pluggable AI tool registry** — `supabase/functions/assistant-chat/tools.ts`;
   add tools here. The assistant is [[Aria]].
4. **Per-client deploy** — env-only Supabase client
   (`src/integrations/supabase/client.ts`), NO fallback creds. Each client =
   own Supabase + Google Cloud + AI keys.

## 5. Access Model

`app_role` = admin | stakeholder, provisioned via `user_roles` — no public
signup. RLS gates: `has_role`, `is_admin`, `has_access`. Findings are
admin-only. See [[Access Model]].

## 6. The Assistant — Aria

`Aria` is the operator's AI co-pilot — concise, candid, grounded in the
business's live metrics and knowledge base. Tools (in `assistant-chat/tools.ts`):
`search_knowledge`, `read_metrics`, `get_latest_briefing`, `create_finding`,
`export_to_drive`, `list_drive_files`. See [[Aria]].

## 7. Product Capabilities (AIOS)

Live metrics dashboard · AI weekly briefings · meeting transcripts → summaries →
next action steps · daily top priorities drawn from operations · "what to act on
now" (the emails / messages / meetings worth attention) · Ask Aria · integrations
& plugins with any business software that has an API.

## 8. Business Model — The Harbormill Ladder

Low-risk, climb-as-results-prove-out engagement ladder (and pricing):
1. **Loop Audit** — $500–$2,500, fixed scope, **fee credited toward the build**;
   map workflows, scope first build. This is the front door.
2. **Focused project** — $2,500–$10,000; ship one workflow, prove ROI.
3. **Retainer** — $3,000–$10,000/month; ongoing, after trust and results.

Every engagement starts with a free 30-minute intro (Calendly →
calendly.com/dwilliams-harbormill/30min, Google Meet).

**Sell against the labour line, never the "AI budget."** This is the load-bearing
pricing rule. Primary data (Atlanta Fed 2026; Ramp, 70k+ businesses) shows more
than half of firms expect to spend **≤$200/employee/year** on AI — a ~40-person
business has a *total* annual AI budget of roughly $1k–$8k. Priced into that
pocket, a $2,500/mo retainer is 200x over and the conversation is dead. Priced
against the $4,500/mo part-time hire they didn't make, it is cheap. Same number,
20x deeper pocket. Never say "AI budget" on a call.

**Decisions on the record** (see `docs/vetting/2026-07-15-harbormill-entry-rung-reprice/`):
- **Hourly is retired** (2026-07-15). It was an unconsidered default, not a
  loss-leader. It capped delivery at the calendar, crowded out the outbound time
  that actually fills the pipeline, and let engagements be sold with no defined
  deliverable. Not replaced by a workshop tier — the audit already *is* the
  low-friction entry.
- **The audit price screens; it does not earn.** Ashraf, Berry & Shapiro (2010,
  *AER*) — a field RCT built to separate the mechanisms — finds paying produces
  "economically important screening effects… no consistent evidence of sunk-cost
  effects." So the fee only needs to be non-zero enough to filter tyre-kickers.
  Raising it buys nothing and costs volume. Being paid also preserves the right to
  say "AI is the wrong answer here," which a free audit financially forbids.
- **Sub-$10k on the first build is deliberate**, not timid — it keeps the decision
  inside one owner's signature and a 30–60 day cycle.
- **No outcome guarantees** ("if it isn't doing X by day 30, don't pay me").
  Rejected on three independent grounds: a solo's refund forfeits 100% of sunk
  labour, so the guarantee fails as a separating signal (Moorthy & Srinivasan,
  1995); consulting is a *credence* good, where the model doesn't transfer; and it
  inverts adverse selection — the clients who self-select in are the worst-
  instrumented, hence likeliest to dispute. In practice the argument is never
  "did it work," it's **"did you use it"** — and you cannot invoice a client's
  staff for ignoring the tool.
- **Sell one vertical's number, not the automation.** In the RPA wave, boutiques
  selling "bots" were commoditized; those selling "AP invoice cycle time"
  survived. A vendor can ship an AR *feature* (Intuit Assist already does) but
  cannot be accountable for a named client's DSO.

## 9. Repo Layout

- Product app: `src/` (pages: Overview, Projects, Calendar, Briefings, Findings,
  Strategy, Workspace, Assistant, Login). Shell: `src/components/layout/AppLayout.tsx`.
  Per-client module toggles: `src/config/features.ts`.
- Edge fns: `report-ingest`, `assistant-chat` (+ `tools.ts`), `knowledge-sync`,
  `google-workspace-proxy`; shared in `_shared/`.
- Migrations: `supabase/migrations/`. Demo data: `supabase/seed.sql`.
- Marketing site: `website/` (separate Vite app, Vercel).
- Docs: `docs/client-setup.md`, `docs/white-label.md`, `docs/extending.md`,
  `docs/per-client-workflow.md`. Knowledge wiki: `docs/wiki/`.

## 10. Operating Principles

- Customize in the config/data seams; don't fork the shared engine.
- Reusable improvements go back into this base template, then flow to client
  repos via `upstream`.
- Match existing token-based styling (`bg-primary`, `text-muted-foreground`) —
  never hardcode hex.
- Gate before "done": `npm run typecheck`, `npm run lint`, `npm run build`,
  `npm run test`. Edge functions are Deno — validate on deploy.
- Decide what to automate with the [[Four-Condition Loop Test]] — gate repeating
  work (repeats; a rule decides "done"; afford wasted runs; AI has data + tools),
  then rank by value-per-effort. The `loop-audit` skill applies it to dev work.

## See Also

- [[Harbormill AIOS]]
- [[Aria]]
- [[White-Label Architecture]]
- [[Report-Ingest Seam]]
- [[Access Model]]
