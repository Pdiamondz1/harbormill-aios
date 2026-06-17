# Per-client workflow (for Harbormill maintainers)

This repo is the **base template**. Each client engagement is a fresh repo cloned from it,
rebranded and configured, deployed on the client's own backend. This doc is the playbook for
turning "one product" into "many deployments" without it becoming "many one-off forks."

## Start a new client

This repo is a **GitHub Template**. For each client:

1. On GitHub → **Use this template** → new repo `client-x-aios` (private).
2. Clone it, then add the base as an upstream remote so you can pull future improvements:

```bash
git clone https://github.com/Pdiamondz1/client-x-aios.git
cd client-x-aios
git remote add upstream https://github.com/Pdiamondz1/harbormill-aios.git
```

3. Provision + deploy: follow `docs/client-setup.md` (Supabase, keys, functions, frontend).
4. Rebrand: follow `docs/white-label.md` (`brand.ts` + theme variables + logos).
5. Add only what's bespoke: follow `docs/extending.md` (metrics keys, knowledge docs, custom tools, pages).
6. Wire the client's scheduled agents to `report-ingest`.

## What changes per client vs stays generic

Keep customization in the **config/data seams** below. Everything else is the shared engine —
leave it untouched so `upstream` merges stay low-conflict.

| Changes per client (expected) | Stays generic (don't fork) |
|---|---|
| `src/config/brand.ts` (names, logos, persona, tier labels) | `src/contexts/AuthContext.tsx`, `useAccess`, `ProtectedRoute` |
| `src/index.css` theme variables | `src/components/layout/AppLayout.tsx` shell mechanics |
| `/public/logo.svg`, `/public/emblem.svg`, `index.html` meta | `report-ingest`, `assistant-chat` loop, `knowledge-sync`, `google-workspace-proxy` |
| `supabase/seed.sql` (their demo/starter data) | the migrations' core tables + RLS |
| The metric **keys** they push to `report-ingest` | the ingest seam itself |
| Their knowledge docs (synced to `knowledge`) | `match_knowledge`, the RAG plumbing |
| Bespoke AI tools appended to `assistant-chat/tools.ts` | the existing generic tools |
| Bespoke pages in `src/pages/` + routes/nav | the six base pages |
| Function secrets: `ASSISTANT_NAME`, `PRODUCT_NAME`, Google creds, AI keys | `_shared/*` helpers |

Rule of thumb: **configure, don't fork.** The more a client lives in config + data + the
tool registry, the cheaper the build and the cleaner the merges. When real custom code is
unavoidable, isolate it (new files / new tool-registry entries), don't edit shared engine files.

## Pulling base improvements into a client

When you improve the base template (a reusable tool, a bug fix, a better component), commit it
to `harbormill-aios` first, then flow it to clients:

```bash
git fetch upstream
git merge upstream/main      # resolve conflicts (should be confined to the seams above)
npm install && npm run build # re-verify
git push
```

Because per-client change is concentrated in the config/data seams, conflicts are usually only
in `brand.ts` / theme vars / `seed.sql` — take the client's side there, take upstream elsewhere.

## Improvements flow UP, too

If you build something generic for a client that every deployment would want, **port it back to
the base** (`harbormill-aios`) so the next client inherits it. That discipline is what keeps this
a product rather than N diverging forks.

## Demo skins

The `demo/*` branches (e.g. `demo/restaurant-ops`) are per-vertical reskins used as sales assets —
full rebrands + industry seed data, deployable as standalone demo instances. They're worked
examples of the customization seams above; not consumed by `Use this template` (which copies `main`).
