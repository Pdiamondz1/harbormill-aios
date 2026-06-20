# Loop Audit offer section (Phase 2b) — design spec

## Context & problem

The [[Four-Condition Loop Test]] is one framework reused across three surfaces. **Phase 1** shipped
the dev `loop-audit` skill; **Phase 2** shipped the paid **Loop Audit** as a sibling mode of the
ROI-Discovery Audit in the product (PR #17, on `main`) — the deliverable now exists. This spec is
**Phase 2b**, explicitly deferred from the Phase 2 spec: the **marketing/offer presence** for the
Loop Audit on the Harbormill Automation site (`website/`, harbormill.net), so prospects can discover
and book the engagement.

The marketing site is a **single-page, anchor-nav Vite app**. `src/App.tsx` renders a fixed list of
sections in order; `src/components/SiteNav.tsx` links to `#anchors`; **no router is installed**. The
site is **config-driven**: all copy lives in `src/config/site.ts`, and sections are presentational,
reusing shared primitives (`Section`/`SectionHeading`, `Reveal`, `Icon`, `CalendlyButton`). The
Loop Audit naturally slots into **Rung 2 — Paid audit ($500–$2,500)** of the Harbormill Ladder.

## Goals

- Add a **Loop Audit offer section** to the marketing site that pitches the signature paid audit.
- Lead with the **four-condition method** as the centerpiece (education-first: teach the rubric,
  not a black box), then state **what the prospect receives** (a ranked plan with one "build this
  first" recommendation).
- Tie it to **Rung 2 ($500–$2,500, fixed scope)** and drive a Calendly booking.
- Stay within the site's established pattern: copy in `site.ts`, a presentational section component,
  shared primitives — **no new dependencies, no routing, no new UI primitives.**

## Non-goals (explicitly deferred / out of scope)

- **A dedicated `/loop-audit` route.** Considered and rejected for now — it would require adding
  `react-router` to a currently router-free app. The offer rides the single-page flow as a section.
- **Phase 3 — the in-app Aria feature** (scoring a *client's* recurring work from deck signals).
  Unchanged by this spec; still fails condition #4 today (per-client task data not ingested).
- Any change to the **product app** (`src/`), Supabase, or the shipped Loop Audit deliverable.
- A lead-capture form specific to the Loop Audit — booking reuses the existing `CalendlyButton`.
- Any new imagery/asset — the section is type- and token-driven like `Services`/`Problem`.

## Users & access

Public marketing visitors. No auth, no data — static marketing copy rendered client-side.

## Design

### 1. Placement & wiring

- **New file:** `website/src/sections/LoopAudit.tsx` — a presentational section.
- **`website/src/App.tsx`:** import and render `<LoopAudit />` **immediately after `<Ladder />`**
  and before `<About />`. The Ladder introduces the rungs; the Loop Audit details its signature one.
- **`website/src/config/site.ts`:** add a `nav` entry `{ label: "Loop Audit", href: "#loop-audit" }`
  positioned **between the AIOS and Ladder entries** (becomes the 3rd nav link). Add a new
  `site.loopAudit` copy block (see §3). Export `type LoopAuditCondition` for the card array, mirroring
  the existing `ProblemItem` / `ServiceItem` exported types.

### 2. Section layout (`LoopAudit.tsx`)

One `<Section id="loop-audit">` (the `Section` primitive supplies `scroll-mt-20` so the fixed nav
doesn't overlap the anchor target). Optional `className` background to distinguish it from the
neighboring Ladder band (Ladder uses `bg-card/20`; this section uses the default `bg-background`,
giving visual alternation Ladder → LoopAudit → About).

Top to bottom:

1. **Heading** — `<SectionHeading eyebrow title subtitle />` from `site.loopAudit`.
2. **The four conditions** — a responsive grid of four cards from `site.loopAudit.conditions`,
   styled to match the `Services` card pattern (`rounded-xl border border-border bg-card p-6
   shadow-card-sm`, an icon tile, a title, a one-line body). Grid: `grid gap-4 sm:grid-cols-2
   lg:grid-cols-4`. Each card wrapped in `<Reveal delay={i * 0.05}>` for staggered entrance. Icons
   via `<Icon name={c.icon} />` (lucide names in the config).
3. **What you receive** — a single highlighted card/band rendering `site.loopAudit.receive.title`
   plus its `points` (3 bullets), each bullet with a `Check` accent (reuse the `lucide-react`
   `Check`, as `Ladder.tsx` does). Token-based accent (e.g. `border-primary/30 bg-primary/[0.04]`),
   never hardcoded color.
4. **Price + CTA** — a centered closing block: a pill or line stating
   `site.loopAudit.priceNote` (**"Rung 2 · $500–$2,500 · fixed scope"**), a one-line education-first
   close (`site.loopAudit.closer`), and `<CalendlyButton size="lg">{site.loopAudit.cta}</CalendlyButton>`
   (label "Book a Loop Audit"; the button already points at the standard Calendly intro URL).

The component reads **only** from `site.loopAudit` + shared primitives — no literals in the JSX
beyond layout classes, consistent with the other sections.

### 3. Copy block (`site.loopAudit` in `site.ts`)

Add `as const` data (final wording may be lightly polished during implementation, but these are the
shipping defaults):

- `eyebrow`: "The signature audit"
- `title`: "Find the one automation worth building first"
- `subtitle`: "Before we build anything, we map your repeating work and score each task on four
  conditions — then hand you a ranked plan with the single highest-ROI automation to build first."
- `conditionsTitle`: "How we decide what's worth automating" (optional sub-heading above the grid)
- `conditions`: four items, each `{ icon, title, body }` (lucide icon names):
  1. `{ icon: "Repeat", title: "It repeats", body: "It happens on a predictable cadence — the
     time it eats, week after week, is the prize." }`
  2. `{ icon: "CheckCircle2", title: "A rule decides \"done\"", body: "Success is checkable by a
     clear rule, not a matter of human taste." }`
  3. `{ icon: "ShieldCheck", title: "A wrong run is cheap", body: "A mistake is low-stakes and
     reversible — safe to let software try." }`
  4. `{ icon: "Plug", title: "AI has the data + tools", body: "The inputs are reachable and the
     actions already exist as tools we can wire in." }`
- `receive`: `{ title: "What you walk away with", points: [
  "Every repeating task scored by ROI — value per unit of effort.",
  "One clear \"build this first\" recommendation, with the reasoning.",
  "A plan you keep — whether you build it with us or not." ] }`
- `priceNote`: "Rung 2 · $500–$2,500 · fixed scope"
- `closer`: "You leave understanding the method — not dependent on us."
- `cta`: "Book a Loop Audit"

The `Icon` component resolves names from a **fixed `ICONS` map in `Icon.tsx`** (not the whole
lucide set) and falls back to `Workflow` for unknown names. The four card icons (`Repeat`,
`CheckCircle2`, `ShieldCheck`, `Plug`) are **not currently in that map**, so they must be **added**:
import each from `lucide-react` and register it in the `ICONS` record in `Icon.tsx`. All four are
valid `lucide-react` exports. Without this, every card would silently render the `Workflow` fallback.

### 4. Brand & token rules (preserve)

- No hardcoded hex or brand strings in the component — colors via semantic tokens
  (`bg-card`, `text-muted-foreground`, `border-primary/30`, `text-primary`, …), copy via `site.ts`.
- Match the existing section rhythm and card styling; reuse `Section`/`SectionHeading`/`Reveal`/
  `Icon`/`CalendlyButton` rather than introducing new structure.
- The price shown (**$500–$2,500**) deliberately matches the figure the `Ladder` section already
  displays publicly for Rung 2 — single source of truth in `site.ts`, no new pricing claim.

## Testing & verification

The `website/` app has **no test runner** (`package.json` scripts: `dev`, `build`, `lint`,
`typecheck`, `preview` — no `test`). The gate for this change, run from `website/`:

- `npm run typecheck` — `tsc --noEmit` clean (the new `LoopAuditCondition` type and `site.loopAudit`
  shape resolve; `Icon` name props are accepted).
- `npm run lint` — eslint clean for the new/changed files (no new warnings).
- `npm run build` — `vite build` succeeds.
- **Manual (`npm run dev`):** the section renders after the Ladder; the new "Loop Audit" nav link
  scrolls to it with correct offset; the four cards lay out 4-up on desktop and 2×2 on mobile; the
  `CalendlyButton` opens the scheduler; the section is visually consistent with neighbors.

The product app (`src/`) and its `npm run test` suite are untouched and unaffected.

## Files touched (summary)

- **New:** `website/src/sections/LoopAudit.tsx`.
- **Edited:** `website/src/config/site.ts` (add `site.loopAudit` block, `nav` entry, exported
  `LoopAuditCondition` type), `website/src/App.tsx` (import + render `<LoopAudit />` after `<Ladder />`),
  `website/src/components/Icon.tsx` (register `Repeat`, `CheckCircle2`, `ShieldCheck`, `Plug` in the
  `ICONS` map).
- **Docs (optional, low-cost):** a `docs/wiki/log.md` entry noting surface-2 now has a marketing
  presence; cross-link from the Loop Audit playbook if it references the offer page.
