# Harbormill AIOS

A white-label **AI operating deck** — the reusable base template behind Harbormill
Automation's client deployments. Clone it, rebrand it in one config file, point it at the
client's own backend and keys, and ship.

## What's in the box

Four pillars on a tiered-access shell (Admin / Stakeholder):

1. **Operating deck** — live metrics, AI-written weekly briefs, and a findings/issue tracker.
2. **AI assistant** — a chat assistant with a RAG knowledge base and a pluggable tool registry.
3. **Google Workspace bridge** — connect Google, browse Drive, export metrics/briefs to Sheets & Docs.
4. **White-label core** — rebrand the whole product from `src/config/brand.ts` + theme variables.

Everything data-facing flows through **one service-role ingest endpoint** (`report-ingest`),
so the deck stays domain-agnostic: each client wires their own scheduled agent to push KPIs,
briefs, and findings in. The app never queries client business tables directly.

## Tech

React 18 · Vite · TypeScript (strict) · Tailwind + shadcn/ui · TanStack Query · React Router ·
Supabase (Postgres + RLS + Deno Edge Functions) · Anthropic (chat) + OpenAI (embeddings).

## Tenancy model

**Per-client deploy.** Each client gets their own clone wired to their own Supabase project,
Google Cloud OAuth app, and AI keys. They own their data. Setup = clone → fill `.env` → run
migrations → deploy functions → deploy the frontend.

## Quick start (local dev)

```bash
npm install
cp .env.example .env      # fill in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev               # http://127.0.0.1:8080
```

`npm run build` · `npm run typecheck` · `npm run lint` · `npm run test`

## Rebranding (white-label)

Two touchpoints, no component edits:

- **Words, names, logos** → `src/config/brand.ts` (product name, tagline, assistant name, company, tier labels).
- **Colors** → the `:root` / `.dark` HSL variables in `src/index.css`.
- Swap `/public/logo.svg` + `/public/emblem.svg`, and the `<title>`/`<meta>` in `index.html`.

## Docs

- `docs/client-setup.md` — provision Supabase, deploy functions, set secrets, Google Cloud OAuth, deploy frontend.
- `docs/white-label.md` — the full rebrand checklist.
- `docs/extending.md` — add an AI tool, a metric source, or a page.

---

Built and maintained by [Harbormill Automation](https://harbormill.net).
