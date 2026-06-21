# Session extract — Loop Audit marketing offer (Phase 2b) + "Rung" branding rule

**Date:** 2026-06-20
**Branches/PRs:** `feat/loop-audit-offer-page` (PR #18), `fix/loop-audit-price-pill-copy` (PR #19) — both merged to `main`.

## What was built

**Phase 2b — the Loop Audit offer section on the marketing site (`website/`).**
The third and final marketing/product surface of the [[Four-Condition Loop Test]]:
Phase 1 shipped the dev `loop-audit` skill, Phase 2 (PR #17) shipped the paid Loop
Audit deliverable in the product, and this gives that deliverable a public offer page.

- A new presentational section `website/src/sections/LoopAudit.tsx`, rendered in
  `App.tsx` immediately after `<Ladder />` and before `<About />`, anchor `#loop-audit`.
- Centerpiece is the **four-condition method** as a 4-card grid (It repeats / A rule
  decides "done" / A wrong run is cheap / AI has the data + tools), followed by a
  "What you walk away with" deliverable card (ranked plan + one "build this first"
  pick) and a price/CTA close ("Book a Loop Audit" → Calendly).
- Config-driven per the site's pattern: all copy in a new `site.loopAudit` block in
  `website/src/config/site.ts`; four lucide icons (`Repeat`, `CheckCircle2`,
  `ShieldCheck`, `Plug`) registered in `website/src/components/Icon.tsx`; a new
  "Loop Audit" nav link (3rd, between AIOS and Ladder). No new deps, no routing.

## Key decisions

- **"Rung" is internal-only vocabulary — never shown to clients.** The price pill
  originally read `Rung 2 · $500–$2,500 · fixed scope`; a follow-up (PR #19) changed
  it to `$500–$2,500 · fixed scope`. The instruction was explicit: the word "Rung"
  must not appear in the app or be said to clients. The [[Marketing Site]]'s Ladder
  section already follows this — it shows a numeric badge + tier name ("Paid audit"),
  never the word "Rung." Internal code identifiers (`rungs` array key,
  `LadderRungItem` type) and internal docs (playbook/specs/wiki) still use "Rung"
  because they are never client-facing — but anything that feeds client-facing output
  (notably [[Aria]]'s RAG) should describe tiers by name/number, not as "Rung N."
- **Offer lives as an in-page section, not a `/loop-audit` route.** Rejected adding
  `react-router` to the currently router-free single-page site; the section rides the
  existing single-page flow behind the `#loop-audit` anchor.
- **Dropped the spec's optional `conditionsTitle` sub-heading** (YAGNI — the
  `SectionHeading` already frames the grid).

## Verification

`website/` has no test runner; the gate is `npm run typecheck` + `npm run lint`
(only the known pre-existing `button.tsx` react-refresh warning) + `npm run build`,
all green. Built via subagent-driven development (two tasks, each spec+quality
reviewed, plus a final whole-branch review on the most capable model — ready to
merge, zero Critical/Important findings). Visually confirmed in `npm run dev`: four
distinct card icons (no `Workflow` fallback), the deliverable card, the corrected
price pill, and the nav order Services · AIOS · Loop Audit · Ladder · About · FAQ.

## Learnings / gotchas

- `website/src/components/Icon.tsx` resolves icons from a **fixed `ICONS` map**, not
  the whole lucide set — new card icons must be registered there or they silently
  fall back to `Workflow`. (Caught in spec self-review.)
- Browser-eyeball nuance: the test environment's ~1.5× device-pixel-ratio capped the
  CSS viewport near 766px, so the `lg:grid-cols-4` desktop layout couldn't be forced;
  the `sm` 2×2 layout was verified instead. Same-hash `navigate` does not reload — a
  cache-busting query param was needed to see the hot-reloaded copy.
