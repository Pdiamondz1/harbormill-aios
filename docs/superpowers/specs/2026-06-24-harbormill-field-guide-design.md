# Harbormill Field Guide — Founder Go-To-Market Enablement System (Design)

- **Date:** 2026-06-24
- **Status:** Approved design (brainstorming) — pending implementation plan
- **Owner:** Damon "Dame" Williams
- **Goal in one line:** Give the founder a single, documented operating system that lets him
  understand his product cold, pitch and demo it, run a discovery call, and close — so he can go to
  market with confidence.

## Relationship to existing assets (read first)

This design **extends**, and does not replace, the GTM system in `docs/gtm/` (merged via PR #30) and
the AIOS product in `src/` + `supabase/`. The **Loop Audit → Focused Project → Retainer** ladder and
its pricing remain the single source of truth (`docs/gtm/retainer-tiers.md`,
`docs/gtm/intro-call-script.md`, etc.). Where this document and `docs/gtm/` ever disagree on pricing
or the sales ladder, **`docs/gtm/` wins.**

The Field Guide **threads the existing assets into one deal-lifecycle path** and **fills the
confidence gaps** that the assets don't yet cover. It does not duplicate the intro-call script,
proposal template, onboarding SOP, retainer tiers, outreach templates, Sweven audit, Sweven channel
playbook, or case-study template — it links them and adds the missing connective + collateral layer.

## Problem statement

The founder has ~80% of a sales operation already built: a complete ladder/funnel, call-and-close
assets, a real product (the AIOS deck), and a website ~75% aligned to it. What's missing is **not the
machine — it's the confidence layer on top of it.** Specifically (from a gap audit of `docs/gtm/`,
`src/`, and `website/`):

1. No product-mastery walkthrough written *for the founder* — to speak to every surface, and *why*
   each exists, cold.
2. No tiered pitch (30s / 2m / 5m) and no structured **demo script** for "okay, show me."
3. No **generic discovery questionnaire** — today the intro script only listens for AR / leads /
   reporting; any other repeating pain can be missed.
4. No **objection-handling** playbook (price; "why not a VA / Zapier / a junior dev / ChatGPT"; "I
   need to ask my partner"; timeline; data safety; "I'm not technical").
5. No **one-pager / leave-behind** and no **competitive positioning** the founder can recite.
6. Website **proof & funnel gaps**: no case studies, the Audit→Project→Retainer funnel isn't
   emphasized, the demo tour doesn't show the **Value-Delivered ROI surface** (the retainer closer),
   and Aria's "grounded, not generic" differentiator is under-stated.

## Non-goals (YAGNI)

- **Not** rebuilding or re-pricing the ladder — it's done and authoritative.
- **Not** a CRM or new pipeline tooling — `warm-50-tracker.md` is the tracker.
- **Not** a separate Notion/Slides source of truth — the repo is the source; we *export* PDFs from it.
- **Not** Phase-2 (accelerator/builder) material — out of scope until the Phase-2 trigger is met
  (see `docs/superpowers/specs/2026-06-24-harbormill-gtm-business-model-design.md` §9 Q5).
- **Not** writing the flagship case studies' *contents* — those are gated on the dogfood builds
  (GTM plan Tasks 2.2–2.4). We build the website *slots* and the template usage, not fabricated proof.

## Design overview

One operating system — **The Harbormill Field Guide** — living in `docs/gtm/field-guide/`, ordered
the way a deal actually flows, plus two supporting builds.

```
docs/gtm/field-guide/
  00-index.md                 ← "Read this before you go to market" + lifecycle map + how to use
  01-know-the-product.md      ← Part 1: founder product mastery
  02-pitch-and-demo.md        ← Part 2: pitch ladder + positioning + demo run-of-show
  03-run-the-call.md          ← Part 3: discovery questionnaire + objection handling + close
  04-close-onboard-operate.md ← Part 4: threads proposal/onboarding/retainer + first-30-days
  product-cheat-sheet.md      ← 1-page pre-call glance card (exportable to PDF)
  one-pager.md                ← leave-behind content spec (exportable to PDF)
```

Supporting builds:
- **Build A — Live agency demo deck** (config + seed on the `harbormill-aios-demo` Supabase).
- **Build B — Website proof & funnel pass** (`website/`, mostly `src/config/site.ts`).

### Part 1 — Know the Product *(founder mastery layer)*

Audience: the founder. Purpose: speak to the product cold, including the *why*. Contents:

- **The thesis in one breath** — education-first; one ingest seam; you own your data; Loops; honest
  ROI. The moat = a persistent, compounding context layer, not a chatbot/workflow.
- **Surface-by-surface tour** — for each page (Overview, Briefings, Findings, Strategy, Assistant/Aria,
  Workspace, Calendar, Projects, Audits, Loops, Value, Connectors): one line on *what the operator
  sees/does* + *why it exists* + *the one sentence you say about it to a prospect.*
- **The architecture story in plain English** — the `report-ingest` seam (the deck never queries
  client business tables; any pipeline can feed it); white-label by config; Aria grounded in
  metrics + knowledge base, not arbitrary queries.
- **The Loop concept + the Four-Condition Loop Test** — cold. This is the founder's signature method
  and the spine of the Loop Audit; he must own it. Links `[[Four-Condition Loop Test]]`.
- **"How a client's data becomes value" end-to-end narrative** — ingest → `metric_snapshots` →
  weekly briefing → KPI-watch files a finding on a breach → a Loop acts → the Value-Delivered surface
  shows the ROI multiple. One worked example.
- **References** — points to `docs/PROJECT_CONTEXT.md`, `docs/wiki/` concept pages, `docs/extending.md`.

### Part 2 — Pitch & Demo

- **The pitch ladder** — 30-second, 2-minute, and 5-minute versions, agency-tuned. Each anchors on a
  repeating-pain → dollar prize → "AI agents run it, you watch the ROI."
- **Positioning vs. alternatives** — VA, Zapier/Make, junior dev, ChatGPT-and-a-prompt. The
  differentiator: persistent compounding context + self-checking Loops you can leave running
  (ties to the website Trust Strip, "Automation you can leave running").
- **The one-pager / leave-behind** — content spec for a single page (logo, the "kill the busywork"
  thesis, 3 proof bullets, the ladder in one line, CTA = book a free intro / Loop Audit). Rendered to
  PDF (via the deck's `export_to_drive` path or a simple template) so it's emailable/printable.
- **The demo run-of-show** — a tight 5–10 min script on the **live agency deck** (Build A):
  1. The boring-on-purpose open (this is your business, one screen).
  2. The command center (live KPIs the agency owner recognizes).
  3. A **Loop running** (AR follow-up or lead-intake) — "this works while you sleep."
  4. The **Value-Delivered ROI moment** — "$X recovered this month vs. your $Y retainer."
  5. **Aria** answering an agency question grounded in those metrics (not ChatGPT).
  6. The "this runs itself / here's what we'd build first for *you*" close → the Loop Audit offer.
  - **Fallback:** the same run-of-show keyed to a screenshot deck, so a call is never blocked if the
    live deck isn't ready.

### Part 3 — Run the Call *(discovery + objections)*

- **Generic discovery questionnaire** — a structured flow that maps *any* repeating pain (not just
  AR/leads/reporting) → the Four-Condition Loop Test → a dollarized prize. Extends, and cross-links,
  `docs/gtm/intro-call-script.md` (does not replace it).
- **"Make the prize a number" worksheet** — the live ROI math to reflect pain back as dollars on the
  call (frequency × time × rate, or recoverable cash).
- **Objection-handling playbook** — price; VA vs. Zapier vs. junior dev vs. ChatGPT; "ask my partner";
  timeline; data safety (ties to the security/ownership story); "I'm not technical." Each: the
  objection, the reframe, the one-liner.
- **The close** — book the **paid Loop Audit** before hangup; cross-links the existing script's
  close + after-call tracker update.

### Part 4 — Close, Onboard & Operate

- **Threads existing assets** — `project-proposal-template.md`, `onboarding-sop.md`,
  `retainer-tiers.md` — into one path with short connective text (mostly links, no duplication).
- **First-30-days operating cadence** *(net-new, the flagged gap)* — a week-by-week template for the
  retainer's first month (first ROI review, first build loop, first demo-back), packageable as a
  client-facing "here's what to expect" note.
- **The retainer-at-delivery move** — pitch the retainer with the ROI live on the Value-Delivered
  surface (cross-links `retainer-tiers.md`).

### Build A — Live agency demo deck

A **configure-and-seed** deployment (not a code build) on the existing `harbormill-aios-demo`
Supabase, following the white-label seam (`brand.ts` + `src/index.css` + `supabase/seed.sql` +
`report-ingest` posts) — mirroring how `demo/restaurant-ops` was built.

- **Brand skin** — a general *marketing/agency* identity (re-skinnable in ~an hour once the beachhead
  sub-type is locked; that decision is gated on the pending Sweven audit, GTM Task 1.3).
- **Agency KPIs** — e.g. client MRR, leads booked, proposals out, **days-to-pay / AR outstanding**,
  utilization, churn — seeded with believable values + targets + statuses.
- **One running Loop** — AR follow-up *or* lead-intake — visible end-to-end (KPI-watch finding +
  the Loop's action queue), so the demo shows automation, not a static dashboard.
- **Seeded Value-Delivered events** — so the ROI surface shows a real multiple (value vs. retainer).
- **Aria knowledge** — a few agency playbook docs so Aria answers grounded.
- **Artifacts:** a `demo/agency-ops` branch (mirrors `demo/restaurant-ops`), a seed script, and a
  short **demo runbook** (URL, login, reset steps) referenced from Part 2's run-of-show.
- **Gate:** the deck app's `npm run typecheck/lint/build/test` must pass for any code touched;
  edge-function changes validated on deploy (Deno).

### Build B — Website proof & funnel pass

Targeted edits to the marketing site (`website/`), most via the single source of truth
`website/src/config/site.ts`:

- **Case-study slots** — a section + data shape for 2–3 anonymized, quantified case studies
  (industry, pain, the Loop, ROI multiple, pull-quote). Ships as *structure with placeholder/"coming
  soon" copy* until the dogfood studies exist — no fabricated numbers.
- **Emphasize the funnel** — make the Ladder section state the Loop Audit → Focused Project →
  Retainer motion as the repeatable engine.
- **Value-Delivered beat in the demo tour** — add a step/tab to the interactive demo showing the ROI
  surface (e.g., "AR Loop recovering $X/mo"), the thing that closes retainers.
- **Sharpen Aria grounding** — copy: grounded in *your* live metrics, briefs, and knowledge base,
  not a generic chatbot.
- **Clarify booking CTAs** — distinguish "free intro" vs. "Loop Audit" vs. "live walkthrough" where
  it helps the funnel.
- **Gate:** website `npm run typecheck/lint/build` (its own Vite app) must pass; dark-only; match
  existing token styling; no hardcoded hex.

## Sequencing (for the implementation plan)

Optimize for **"ready for a real 1:1 prospect call"** (the founder's stated first target). Suggested
order — finalized in the plan:

1. **Part 1 (Know the Product)** + **product-cheat-sheet** — mastery first.
2. **Part 3 (Run the Call)** — discovery questionnaire + objection handling (usable with or without a
   demo).
3. **Part 2 (Pitch & Demo)** pitch + one-pager + the **demo run-of-show with the screenshot
   fallback** — so the founder is call-ready even before Build A lands.
4. **Build A (live agency demo deck)** — upgrades the demo from fallback to live.
5. **Part 4** + **Build B (website pass)** — the close/operate layer and the public proof surface.
6. **00-index** written last to tie it together.

This way every item is independently usable as it lands, and the founder is prospect-ready after
steps 1–3.

## Decisions made (with rationale)

- **Demo = a live, agency-flavored deck (Build A), with a screenshot fallback in the script.** Most
  captivating in a 1:1 (prospect sees their own world + a live ROI number + a self-running Loop);
  cheap because the product is white-label by config; reusable for every agency prospect and the
  Sweven demo night. Restaurant skin is off-niche; the website tour lacks the ROI/Loop surface; video
  lands soft live.
- **Packaging = one integrated Field Guide in `docs/gtm/`, exportable to PDF** (Approach A), over a
  lean call-kit-only (under-delivers the "documented system") or an external Slides/Notion playbook
  (splits the source of truth). A absorbs the portability of an external doc via PDF export without
  the maintenance split.
- **Field Guide is ordered by deal lifecycle**, not by artifact type — so it reads as a path, not a
  pile of files.

## Dependencies & gotchas

- **Agency sub-type not yet locked** — `docs/gtm/beachhead-decision.md` is gated on the Sweven audit
  (GTM Tasks 1.2–1.3). Build A ships as a *general agency* skin, re-skinnable once decided. The Field
  Guide's agency examples stay sub-type-neutral until then.
- **Flagship case studies don't exist yet** — gated on the dogfood builds (GTM Tasks 2.2–2.4). Build B
  ships case-study *structure*, not invented results. Don't fabricate proof.
- **Pricing drift guard** — never reintroduce dropped draft numbers (the $3,500/$3.5k/$6.5k/$15k
  "exploration sprint" line). Use `docs/gtm/` numbers verbatim.
- **Two Vite apps** — `website/` is separate from the product `src/`; gate each on its own scripts.

## Open questions (for the plan / founder)

1. **Demo Loop choice for Build A** — AR follow-up vs. lead-intake as the one running Loop? (Default:
   AR follow-up — clearest dollar story; confirm with Dame.)
2. **One-pager render path** — generate via the deck's `export_to_drive` (Google Doc → PDF) or a
   standalone HTML/markdown→PDF template? (Default: standalone template; simplest, no live deck
   dependency.)
3. **How imminent is the first call?** — if days away, the plan front-loads Parts 1–3 + the screenshot
   fallback and defers Build A; if weeks, Build A can land inside the first pass.

## See Also

- `docs/gtm/` — the existing ladder, scripts, templates (source of truth for pricing/process).
- `docs/superpowers/specs/2026-06-24-harbormill-gtm-business-model-design.md` — the GTM model this sits inside.
- `docs/PROJECT_CONTEXT.md`, `docs/wiki/` — product canon (Harbormill AIOS, Aria, Four-Condition Loop Test).
- `docs/per-client-workflow.md`, `docs/client-setup.md`, `docs/white-label.md` — the deploy/skin seams (Build A).
