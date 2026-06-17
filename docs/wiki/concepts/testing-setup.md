---
title: Testing Setup
type: concept
created: 2026-06-17
updated: 2026-06-17
sources: [vite.config.ts, src/test/setup.ts, src/config/brand.test.ts, package.json]
tags: [testing, vitest, technical]
---

# Testing Setup

The unit-test harness for [[Harbormill AIOS]]. Stack: **Vitest** + **@testing-library/react**
+ **jsdom**.

## Configuration

`vite.config.ts` `test` block: `globals: true`, `environment: "jsdom"`,
`setupFiles: ["./src/test/setup.ts"]`, and **excludes** `supabase/functions/**`
(Deno ≠ Node). `src/test/setup.ts` imports `@testing-library/jest-dom/vitest` for
DOM matchers. Run via `npm run test` (`vitest run`) — part of the
[[Build & Verification Gate]].

## Current coverage

**One test file today:** `src/config/brand.test.ts` — guards the white-label
contract by asserting every required `brand.ts` field is non-empty (productName,
tagline, assistantName, assistantPersona, logos, company, tier labels). See
[[White-Label Architecture]].

## Flag (observation)

Coverage is **minimal** — the harness is ready but only the brand contract is
tested. Hooks (data layer), `ProtectedRoute` gating, and the report-ingest
validation logic are good candidates for future tests. Recorded as a coverage gap,
not acted on.

## See Also

- [[Build & Verification Gate]]
- [[White-Label Architecture]]
- [[AIOS App Shell]]
