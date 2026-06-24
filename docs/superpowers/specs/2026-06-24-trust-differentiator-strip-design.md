# Trust differentiator strip (harbormill.net) — design spec

- **Date:** 2026-06-24
- **Status:** approved design, pre-implementation
- **Surface:** B — the marketing-site "loops you can trust" differentiator
- **App:** `website/` (the separate, self-contained Vite + React + TS + Tailwind marketing site, dark-only, deployed on Vercel at harbormill.net). This never touches the AIOS product.

## 1. Context & problem

The "skills → validators → loops" work produced two real, merged loops Harbormill now
runs on itself (`validator-forge` → `wiki-gardener`, PRs #23/#24). Surface B turns that
into a marketing differentiator.

What the site already has (so we don't duplicate it):
- The **Loop Audit section** (`#loop-audit`, `website/src/sections/LoopAudit.tsx`, copy in
  `website/src/config/site.ts` → `loopAudit`) already presents the four-condition method,
  including condition #2 *"A rule decides 'done' — success is checkable by a clear rule,
  not a matter of human taste"* and condition #3 *"A wrong run is cheap … safe to let
  software try."*
- The **Philosophy strip** (`PhilosophyStrip.tsx`, `site.philosophy`) already carries the
  *"not a black box / education-first"* trust theme.

What the site does **not** have, and what B adds: a **trust claim** — that the automation
Harbormill builds is *safe to leave running unattended* — plus the **self-proof** that
Harbormill runs the same self-checking discipline on its own systems. The self-proof is
the genuinely new asset; without it B would merely restate the four conditions.

**Decision (locked with Damon):** include the self-proof at **principle altitude** — claim
the discipline and that we run it on ourselves, in plain language, with **no internal
jargon** (no "Rung", "validator", "wiki-gardener", "four-condition test").

## 2. Goals / non-goals

**Goals**
- Add one focused **trust differentiator strip** to harbormill.net stating that
  Harbormill's automation is safe to run unattended (a rule decides "done"; a wrong run is
  cheap to undo) and that Harbormill runs the same discipline on its own systems.
- Follow the site's established patterns exactly (content in `site.ts`, presentational
  component, dark-only, brand tokens).

**Non-goals (YAGNI)**
- No nav entry (strips aren't in the nav — matches `PhilosophyStrip`).
- No new route, no multi-card section, no interactive element.
- No internal jargon; no naming of the internal tools (principle altitude).
- No changes to the AIOS product, edge functions, or Aria (that is surface C).
- No change to the existing Loop Audit or Philosophy copy.

## 3. Architecture / units

| Unit | Responsibility |
|------|----------------|
| `website/src/config/site.ts` → new `trust` key | The strip's copy (eyebrow, title, body). Single source of truth, like every other section. |
| `website/src/sections/TrustStrip.tsx` (new) | Presentational strip. Reuses the `PhilosophyStrip` visual pattern (glass card, icon, eyebrow/title/body) — a sibling component, not a refactor of `PhilosophyStrip`. |
| `website/src/App.tsx` (the page composition — the only one; there is no `src/pages/`) | Insert `<TrustStrip />` immediately **after** `<LoopAudit />` (line 29) and **before** `<About />` (line 30). |

Follow existing patterns: components stay presentational and read from `site`; never
hardcode hex (use brand tokens like `text-primary`, `text-muted-foreground`, `border-border`).

## 4. Placement

Immediately **after** the Loop Audit section, before `<About />`, in `website/src/App.tsx`.
The actual render order is Hero → Credibility → Philosophy → Problem → AIOS → Services →
**Ladder → Loop Audit** → About → …, so Loop Audit is the *last* content section before
About; the strip slots between `<LoopAudit />` and `<About />`. (Note: the Ladder precedes
Loop Audit in render order, even though the nav lists "Loop Audit" before "Ladder" — placement
is by the App.tsx render order, not the nav.) Rationale: the four conditions the reader just
saw (esp. "a rule decides done" + "a wrong run is cheap") are the setup; this strip is the
payoff — *"that's exactly why what we build is safe to leave running."* The trust claim reads
as earned, not asserted, and reuses the concept just absorbed. No nav entry.

## 5. Copy (approved verbatim)

```
eyebrow: Why it's safe to automate
title:   Automation you can leave running
body:    Black-box automation is unnerving — you can't tell when it's quietly gone
         wrong. So we only build automation where a clear rule decides when the job is
         done, and a wrong run is cheap to undo. That's what makes it safe to leave
         running without watching it. It's the same discipline we run on our own
         systems: loops that check their own work against a rule, fix what they safely
         can, and flag the rest for a human. We don't sell a black box we wouldn't run
         ourselves.
```

(Emphasis on the word *done* may be rendered with the site's existing emphasis styling;
exact markup is an implementation detail. Keep the copy otherwise verbatim.)

This body deliberately **echoes** Loop Audit conditions #2 ("a rule decides done") and #3
("a wrong run is cheap") — it does **not** restate the four-condition rubric. The strip's
job is the *trust payoff* ("safe to leave running" + the self-proof), reusing those two
ideas as a springboard, per §1/§4.

## 6. Visual / styling

- Reuse the `PhilosophyStrip` layout (centered glass card, an icon tile, eyebrow +
  title + body). Icon: `ShieldCheck` (already used in the Loop Audit grid → visual
  consistency; imported from `lucide-react` like the other strips).
- Dark-only; brand tokens only. Match the existing strip's spacing/typography so it reads
  as part of the family, not a bolt-on.

## 7. Acceptance

This is a copy + small presentational component in the `website/` app. Verification:
- `npm run build` in `website/` compiles cleanly (and `npm run lint` if the site has it).
- The strip renders after the Loop Audit section, before About, in the dark theme,
  with the approved copy, styled consistently with `PhilosophyStrip`.
- No nav entry was added; no existing section's copy changed; no hardcoded colors.

(Optional visual confirmation via the dev server / a screenshot is nice-to-have, not
required for the build gate.)

## 8. Out of scope (enabled, not built here)

- **Surface C** — an in-app Aria "forge a validator / run a loop" capability (separate spec).
- Any change to the AIOS product, the Loop Audit section copy, or the four-condition
  wording.

## See Also

- `website/src/sections/PhilosophyStrip.tsx` — the visual pattern this reuses
- `website/src/sections/LoopAudit.tsx` + `site.loopAudit` — the section this follows (the setup to this payoff)
- `docs/wiki/entities/marketing-site.md` — the marketing site overview
- `docs/wiki/concepts/four-condition-loop-test.md` — the method behind the trust claim (internal; not surfaced in copy)
- PRs #23 (`validator-forge`) and #24 (`wiki-gardener`) — the self-proof this strip alludes to
