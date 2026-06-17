---
title: Build & Verification Gate
type: concept
created: 2026-06-17
updated: 2026-06-17
sources: [package.json, .github/workflows/ci.yml, vite.config.ts]
tags: [ci, build, tooling, ops, technical]
---

# Build & Verification Gate

The checks that must pass before [[Harbormill AIOS]] work is "done" — local scripts
mirrored by CI.

## The gate

`package.json` scripts: `dev`, `build` (`vite build`), `build:dev`, `lint`
(`eslint .`), `preview`, `typecheck` (`tsc --noEmit -p tsconfig.app.json`),
`test` (`vitest run`), `test:watch`.

## CI

`.github/workflows/ci.yml` runs on push to `main` and all PRs, on **Node 22**,
sequence **typecheck → lint → build → test**. `build` gets placeholder
`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` for compilation.

**Why `npm install`, not `npm ci`:** esbuild ships per-platform optional deps; a
lockfile generated on one OS can list a sibling platform package that makes strict
`npm ci` fail with **EBADPLATFORM** on the runner. CI uses `npm install --no-audit
--no-fund` to sidestep it.

## Not covered

**Deno edge functions** (`supabase/functions/`) are excluded from Vitest
(`vite.config.ts`) — validate them on deploy. See [[Edge Functions]].

## See Also

- [[Testing Setup]]
- [[Edge Functions]]
- [[Per-Client Deployment]]
- [[Harbormill AIOS]]
