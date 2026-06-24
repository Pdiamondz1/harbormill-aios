# Harbormill Field Guide — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended)
> or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax
> for tracking.
>
> **This is a documentation + light-build plan, not a TDD code plan.** Most tasks produce **prose**
> (markdown docs) or **config/seed data**, not unit-tested functions. The task format is adapted: each
> task carries **Done-criteria** (an objective check) instead of a failing test. Only Phase 4 (website)
> touches typed code and uses the real `npm` gate. Commit after every task.

**Goal:** Build the *Harbormill Field Guide* — one documented operating system that lets the founder
understand the product cold, pitch and demo it, run a discovery call, and close — plus a live agency
demo deck and a website proof-pass, sequenced so he is ready for a real 1:1 call within days.

**Architecture:** A 7-file documentation system under `docs/gtm/field-guide/` that **threads the
existing `docs/gtm/` assets** (ladder, scripts, templates) into one deal-lifecycle path and fills the
confidence gaps. Two supporting builds follow: a configure-and-seed demo deployment (white-label seam,
no product code) and a focused marketing-site copy/component pass. Each phase is independently
shippable.

**Tech Stack:** Markdown (docs) · the AIOS product white-label seams (`src/config/brand.ts`,
`src/index.css`, `supabase/seed.sql`, `report-ingest`) for Build A · the `website/` Vite app
(React 18 + TS + Tailwind, copy in `src/config/site.ts`) for Build B.

**Source of truth & guardrails (read before any task):**
- `docs/superpowers/specs/2026-06-24-harbormill-field-guide-design.md` — this plan's spec.
- `docs/gtm/` — the ladder, scripts, templates. **Where this plan and `docs/gtm/` disagree on pricing
  or the sales ladder, `docs/gtm/` wins.** Pricing is **Loop Audit $500–$2,500 → Focused Project
  $5,000 (50/50) → Retainer Operate $3k / Operate+Build $5k / Embedded $8–10k**. **Never** write the
  dropped draft numbers ($3,500 / $3.5k / $6.5k / $15k / "exploration sprint").
- Product canon for Part 1 facts: `docs/PROJECT_CONTEXT.md`, `CLAUDE.md`, `docs/wiki/`,
  `supabase/functions/assistant-chat/tools.ts`, `src/pages/`, `supabase/functions/report-ingest/`.
- **Don't fabricate proof.** Case studies and quantified results are gated on the dogfood builds
  (GTM plan Tasks 2.2–2.4). Build B ships case-study *structure with placeholder copy*, not invented numbers.

**Branch:** `docs/gtm-field-guide` (already created off `main`). Commit after each task; push + PR at the
end of Phase 2 (call-ready core) and again after Phases 3–4.

---

## File Structure (decomposition)

```
docs/gtm/field-guide/
  00-index.md                 Entry point: "read this before you go to market" + lifecycle map + how-to-use
  01-know-the-product.md      Founder product mastery (thesis, surface tour, architecture story, Loop method, data→value)
  02-pitch-and-demo.md        Pitch ladder (30s/2m/5m) + positioning vs alternatives + demo run-of-show + fallback
  03-run-the-call.md          Generic discovery questionnaire + "prize as a number" worksheet + objection handling + close
  04-close-onboard-operate.md Threads proposal/onboarding/retainer + first-30-days cadence + retainer-at-delivery
  product-cheat-sheet.md      1-page pre-call glance card (exportable to PDF)
  one-pager.md                Leave-behind content (exportable to PDF)
```
Build A (Phase 3): `demo/agency-ops` branch (mirrors `demo/restaurant-ops`) + seed + `docs/gtm/field-guide/demo-runbook.md`.
Build B (Phase 4): edits to `website/src/config/site.ts` + new demo-tour step + a case-studies section component.

**Phases & shipping waves:**
- **Wave 1 (call-ready, days-away priority):** Phase 1 (Parts 1, 3, 2 + cheat-sheet + one-pager) → Phase 2 (Part 4 + index). Ship as a PR.
- **Wave 2 (immediate follow-on, separable):** Phase 3 (live agency demo deck) and Phase 4 (website pass).

---

## PHASE 1 — Field Guide core (call-ready)

Build order within the phase mirrors the spec's sequencing: **mastery first, then run-the-call, then
pitch/demo** — so the founder gains confidence in the order a call needs it.

### Task 1.1: Scaffold the field-guide directory + index stub

**Files:**
- Create: `docs/gtm/field-guide/00-index.md` (stub now; finalized in Task 2.2)

- [ ] **Step 1:** Create `docs/gtm/field-guide/00-index.md` with a title, a one-line purpose
  ("The Harbormill Field Guide — read this before you go to market"), and a placeholder table of the 7
  files with one-line descriptions (copy the File Structure list above). Mark it `Status: in progress`.
- [ ] **Step 2 — Done-criteria:** the directory exists and `00-index.md` lists all 7 planned files.
- [ ] **Step 3 — Commit:**
```bash
git add docs/gtm/field-guide/00-index.md
git commit -m "docs(field-guide): scaffold directory + index stub"
```

### Task 1.2: Part 1 — Know the Product (founder mastery)

**Files:**
- Create: `docs/gtm/field-guide/01-know-the-product.md`
- Read for facts: `docs/PROJECT_CONTEXT.md`, `CLAUDE.md`, `docs/wiki/` (Harbormill AIOS, Aria,
  Report-Ingest Seam, White-Label Architecture, Four-Condition Loop Test), `src/pages/`,
  `supabase/functions/assistant-chat/tools.ts`, `supabase/functions/report-ingest/`.

- [ ] **Step 1 — Outline the doc** with these sections:
  1. **The thesis in one breath** — education-first; one ingest seam; you own your data; Loops; honest
     ROI; the moat = a *persistent, compounding context layer* (not a chatbot/workflow).
  2. **Surface-by-surface tour** — a table with a row per page. For each: *what the operator sees/does*
     · *why it exists* · *the one sentence you say to a prospect.* Pages to cover (verify against
     `src/pages/` and `src/config/features.ts`): Overview, Briefings, Findings, Strategy,
     Assistant (Aria), Workspace, Calendar, Projects, Audits, Loops, Value, Connectors, Login.
  3. **The architecture story in plain English** — the `report-ingest` seam (the deck never queries
     client business tables; any pipeline can feed it via `metric_snapshots`/`briefings`/`findings`);
     white-label by config; Aria grounded in metrics + knowledge base, not arbitrary table queries.
  4. **The Loop concept + the Four-Condition Loop Test** — the four conditions (repeats · a rule
     decides "done" · a wrong run is cheap · AI has data + tools), plus a worked example. Link
     `[[Four-Condition Loop Test]]`. State that this is the founder's signature method and the spine of
     the Loop Audit.
  5. **"How a client's data becomes value" — end-to-end narrative** — one worked example:
     ingest → `metric_snapshots` → weekly briefing → KPI-watch files a finding on a breach → a Loop
     acts → the Value-Delivered surface shows the ROI multiple.
  6. **Aria's toolbelt** — list her tools from `assistant-chat/tools.ts` (search_knowledge,
     read_metrics, get_latest_briefing, create_finding, get_document, export_to_drive, list_drive_files,
     compose_email_link, get_value_summary, propose_correction, …) with a one-line "what it lets her do."
  7. **References** — pointers to `PROJECT_CONTEXT.md`, `docs/wiki/`, `docs/extending.md`.
- [ ] **Step 2 — Draft** each section in plain, founder-readable language (no jargon without a
  plain-English gloss). Keep the surface tour to one tight line per cell.
- [ ] **Step 3 — Self-check Done-criteria:**
  - Every page in `src/pages/` (minus Login if trivial) has a row with all three columns filled.
  - The Four-Condition Test is stated verbatim-accurate to `docs/wiki/` / `loop-audit` skill.
  - Aria's tool list matches `assistant-chat/tools.ts` (no invented tools).
  - No pricing/ladder numbers contradict `docs/gtm/` (Part 1 shouldn't price at all).
- [ ] **Step 4 — Commit:**
```bash
git add docs/gtm/field-guide/01-know-the-product.md
git commit -m "docs(field-guide): Part 1 — Know the Product (founder mastery)"
```

### Task 1.3: product-cheat-sheet.md (1-page pre-call glance card)

**Files:**
- Create: `docs/gtm/field-guide/product-cheat-sheet.md`

- [ ] **Step 1 — Draft a single page** (must fit one printed page) with: the 1-breath thesis · the
  ladder in one line (Loop Audit → Project → Retainer with prices from `docs/gtm/retainer-tiers.md`) ·
  the 4 Loop conditions as 4 bullets · the 6 surfaces a prospect cares about most (Overview, Briefings,
  Aria, Loops, Value, Connectors) one line each · the single closing line ("we find the one automation
  worth building first").
- [ ] **Step 2 — Done-criteria:** fits one page; every price matches `docs/gtm/`; usable as a
  10-second glance before dialing.
- [ ] **Step 3 — Commit:**
```bash
git add docs/gtm/field-guide/product-cheat-sheet.md
git commit -m "docs(field-guide): 1-page product cheat-sheet"
```

### Task 1.4: Part 3 — Run the Call (discovery + objections)

**Files:**
- Create: `docs/gtm/field-guide/03-run-the-call.md`
- Read & cross-link (do NOT duplicate): `docs/gtm/intro-call-script.md`, `docs/gtm/retainer-tiers.md`,
  `docs/gtm/project-proposal-template.md`.

- [ ] **Step 1 — Outline** these sections:
  1. **Generic discovery questionnaire** — a structured flow that takes *any* repeating task the
     prospect names and runs it through the Four-Condition Test, ending in a dollar prize. Provide
     ~8–12 probing questions grouped (the work · the cadence · the cost · the data/tools · the
     decision). Explicitly note it *extends* `intro-call-script.md` (which listens for AR/leads/
     reporting) to catch any other pain.
  2. **"Make the prize a number" worksheet** — the live math: `frequency × minutes × loaded $/min`
     for time saved, or recoverable-cash for AR. Two worked examples (one agency lead-gen, one AR).
  3. **Objection-handling playbook** — a table: *Objection · The reframe · The one-liner.* Cover at
     minimum: price ("$5k vs a VA"), "why not Zapier/Make," "why not a junior dev," "isn't this just
     ChatGPT," "I need to ask my partner," "how long until I see it," "is my data safe," "I'm not
     technical." Anchor the safety answer to the product's data-ownership + the "Automation you can
     leave running" discipline.
  4. **The close** — book the **paid Loop Audit** ($500–$2,500, fee credited) before hangup;
     cross-link the existing script's close + after-call tracker update (`warm-50-tracker.md`).
- [ ] **Step 2 — Draft.** Keep the objection table tight (one line per cell).
- [ ] **Step 3 — Done-criteria:**
  - The discovery flow maps a *non*-AR/leads/reporting pain end-to-end (test it against an example
    like "client onboarding paperwork").
  - Every objection has a reframe + a one-liner.
  - The close names the Loop Audit with the correct price + fee-credit, cross-linking `intro-call-script.md`.
  - No duplication of the intro script — it links, not copies.
- [ ] **Step 4 — Commit:**
```bash
git add docs/gtm/field-guide/03-run-the-call.md
git commit -m "docs(field-guide): Part 3 — Run the Call (discovery + objections)"
```

### Task 1.5: Part 2 — Pitch & Demo (with screenshot-fallback demo)

**Files:**
- Create: `docs/gtm/field-guide/02-pitch-and-demo.md`
- Read: `website/src/config/site.ts` (existing pitch language to stay consistent), `docs/gtm/sweven-channel.md`
  (the demo-night run-of-show to stay consistent with).

- [ ] **Step 1 — Outline** these sections:
  1. **The pitch ladder** — three scripts: **30-second**, **2-minute**, **5-minute**, agency-tuned.
     Each: repeating-pain → dollar prize → "AI agents run it, you watch the ROI on one screen."
  2. **Positioning vs. alternatives** — a short table vs. VA · Zapier/Make · junior dev · ChatGPT.
     The differentiator line: persistent compounding context + self-checking Loops you can leave running.
  3. **The demo run-of-show (live deck)** — the 6-beat script from the spec (boring-on-purpose open →
     command center → a Loop running → the Value-Delivered ROI moment → Aria grounded → "this runs
     itself" close → Loop Audit offer). Mark which beat maps to which deck surface.
  4. **The fallback demo** — the SAME 6 beats keyed to a **screenshot sequence**, so a call is never
     blocked if the live deck (Phase 3) isn't ready. List exactly which screenshots are needed
     (Overview, a Briefing, a Loop/finding, the Value surface, an Aria answer). Note: until Phase 3,
     pull fallback screenshots from the existing website demo tour and/or `demo/restaurant-ops`, clearly
     labeled "illustrative."
- [ ] **Step 2 — Draft** the three pitch scripts to be *spoken* (short sentences), and the run-of-show
  as numbered beats with a "say this / show this" split.
- [ ] **Step 3 — Done-criteria:**
  - All three pitch lengths exist and are spoken-style.
  - The run-of-show and the fallback cover the same 6 beats; the fallback names the exact screenshots.
  - Pricing/ladder references match `docs/gtm/`.
  - Demo-night consistency: the run-of-show doesn't contradict `sweven-channel.md`.
- [ ] **Step 4 — Commit:**
```bash
git add docs/gtm/field-guide/02-pitch-and-demo.md
git commit -m "docs(field-guide): Part 2 — Pitch & Demo (+ screenshot fallback)"
```

### Task 1.6: one-pager.md (leave-behind content)

**Files:**
- Create: `docs/gtm/field-guide/one-pager.md`

- [ ] **Step 1 — Draft** the single-page leave-behind content: a headline ("Stop doing the work your
  software should do for you" or the site's hero line, kept consistent with `site.ts`), the
  "kill the busywork" thesis (2–3 sentences), 3 proof bullets (what the AIOS deck does: live KPIs +
  weekly brief + a self-running Loop + ROI you can see), the ladder in one line, and the CTA
  (book a free 30-min intro → the Calendly link in `site.ts`; or a Loop Audit).
- [ ] **Step 2 — Note the render path** at the top as a comment: *"Render to PDF via a standalone
  markdown→PDF template (default); see Phase 2 note. Do not depend on the live deck."*
- [ ] **Step 3 — Done-criteria:** fits one page; CTA + Calendly link correct; messaging consistent with
  `website/src/config/site.ts`; no fabricated metrics.
- [ ] **Step 4 — Commit:**
```bash
git add docs/gtm/field-guide/one-pager.md
git commit -m "docs(field-guide): one-pager leave-behind content"
```

---

## PHASE 2 — Close/Operate layer + index (completes the call-ready core)

### Task 2.1: Part 4 — Close, Onboard & Operate

**Files:**
- Create: `docs/gtm/field-guide/04-close-onboard-operate.md`
- Cross-link (do NOT duplicate): `docs/gtm/project-proposal-template.md`, `docs/gtm/onboarding-sop.md`,
  `docs/gtm/retainer-tiers.md`.

- [ ] **Step 1 — Outline:**
  1. **The path after "yes"** — short connective prose linking proposal → onboarding → retainer, with
     a one-line "what each asset is for" and a link to each existing file.
  2. **First-30-days operating cadence** *(net-new)* — a week-by-week table (Week 1 deploy + access;
     Week 2 first Loop live; Week 3 first ROI review on the Value surface; Week 4 demo-back + next-Loop
     idea). Packageable as a client-facing "what to expect" note.
  3. **The retainer-at-delivery move** — the script for pitching the retainer with ROI live on the
     Value-Delivered surface; cross-link `retainer-tiers.md` (tiers + the pitch wording already there).
- [ ] **Step 2 — Done-criteria:** links (not copies) the three existing assets; the first-30-days table
  has a concrete deliverable per week; retainer prices match `retainer-tiers.md`.
- [ ] **Step 3 — Commit:**
```bash
git add docs/gtm/field-guide/04-close-onboard-operate.md
git commit -m "docs(field-guide): Part 4 — Close, Onboard & Operate"
```

### Task 2.2: Finalize the index (00-index.md) + wire cross-links

**Files:**
- Modify: `docs/gtm/field-guide/00-index.md`
- Modify: `docs/gtm/README.md` (add a link to the Field Guide as the founder's go-to-market entry point)

- [ ] **Step 1 — Finalize `00-index.md`:** a "read this before you go to market" intro; the deal
  **lifecycle map** (Know the Product → Pitch & Demo → Run the Call → Close/Onboard/Operate) with each
  step linking its file; a "if you have a call tomorrow, read these three" quick-start (cheat-sheet +
  Part 1 + Part 3); and a one-line "how to export to PDF for your phone." Set `Status: complete`.
- [ ] **Step 2 — Add a Field Guide pointer to `docs/gtm/README.md`** (one line/section; additive, no
  pricing changes).
- [ ] **Step 3 — Done-criteria:** every one of the 7 files is linked from the index; all intra-guide
  links resolve (no 404s); `docs/gtm/README.md` points to the guide.
- [ ] **Step 4 — Verify links:**
```bash
cd /c/GIT/harbormill-aios/.claude/worktrees/hma-AIOS-prod-6
grep -o '](.*\.md)' docs/gtm/field-guide/00-index.md
ls docs/gtm/field-guide/
```
Expected: every linked file exists in the listing.
- [ ] **Step 5 — Commit:**
```bash
git add docs/gtm/field-guide/00-index.md docs/gtm/README.md
git commit -m "docs(field-guide): finalize index + link from gtm README"
```

### Task 2.3: Ship Wave 1 — push + open PR

- [ ] **Step 1 — Push & PR:**
```bash
cd /c/GIT/harbormill-aios/.claude/worktrees/hma-AIOS-prod-6
git push -u origin docs/gtm-field-guide
gh pr create -R Pdiamondz1/harbormill-aios --base main --head docs/gtm-field-guide \
  --title "docs(field-guide): Harbormill Field Guide — call-ready founder GTM system" \
  --body "Wave 1 (call-ready core): the 4-part Field Guide + cheat-sheet + one-pager. Builds A (live demo deck) and B (website pass) follow in Wave 2. Docs-only; no code gate. See spec: docs/superpowers/specs/2026-06-24-harbormill-field-guide-design.md"
```
- [ ] **Step 2 — Done-criteria:** PR open, base `main`, docs-only diff. Report the PR URL to Dame.

> **Wave 1 stops here.** The founder is call-ready. Phases 3–4 are the immediate second wave and can be
> a continuation of this branch/PR or split into their own PR — decide at execution time.

---

## PHASE 3 — Build A: live agency demo deck (configure-and-seed, separable)

> **Dependency:** needs access to the `harbormill-aios-demo` Supabase (service-role `sb_secret_` key —
> see memory `project-harbormill-supabase-keys`). Deploy steps that touch the live project are
> **[Dame]-gated** (require his keys). The skin/seed authoring is buildable now.
> **Beachhead caveat:** the agency sub-type is not yet locked (gated on the Sweven audit, GTM Task 1.3),
> so build a **general marketing/agency** skin, explicitly re-skinnable.

### Task 3.1: Create the `demo/agency-ops` brand skin

**Files (on a new `demo/agency-ops` branch off `main`, mirroring `demo/restaurant-ops`):**
- Modify: `src/config/brand.ts` (productName, assistantName, tagline, tiers, logo/emblem refs)
- Modify: `src/index.css` (`:root` / `.dark` token values — an agency palette)
- Modify: `src/config/features.ts` if needed (ensure Value, Loops, Connectors, Audits visible)

- [ ] **Step 1:** Branch: `git checkout -b demo/agency-ops main`.
- [ ] **Step 2:** Set an agency identity in `brand.ts` (e.g., productName + an assistant name); pick a
  distinct but on-brand palette in `index.css`. Follow the `demo/restaurant-ops` diff as the pattern.
- [ ] **Step 3 — Gate:** `npm run typecheck && npm run lint && npm run build` pass.
- [ ] **Step 4 — Done-criteria:** the app builds branded as the agency skin; no hardcoded hex; Value /
  Loops / Connectors / Audits pages reachable.
- [ ] **Step 5 — Commit:** `git commit -am "demo(agency-ops): agency brand skin + palette"`

### Task 3.2: Seed agency data (KPIs, a running Loop, Value events, Aria docs)

**Files:**
- Modify: `supabase/seed.sql` (agency metric_snapshots, briefings, findings, value_events, knowledge docs)
- Optional: a small seed script or `report-ingest` POST payloads documented in the runbook

- [ ] **Step 1 — Metrics:** seed believable agency KPIs with targets + statuses: client MRR, leads
  booked, proposals out, **days-to-pay / AR outstanding**, utilization, churn.
- [ ] **Step 2 — A running Loop (AR follow-up, the chosen default):** seed a finding (KPI-watch-style
  breach on days-to-pay) + a pending loop action so the Loops page shows automation in flight.
- [ ] **Step 3 — Value events:** seed `value_events` so the Value surface shows a real multiple
  (e.g., AR Loop recovering $X/mo vs a $5k retainer).
- [ ] **Step 4 — Aria knowledge:** seed 2–3 short agency playbook docs so Aria answers grounded.
- [ ] **Step 5 — Done-criteria (local):** running the deck against the seed shows: agency KPIs on
  Overview, a brief, a Loop in flight, a non-zero ROI multiple on Value, and Aria answering from the
  seeded docs. No fabricated *client* names (synthetic/anonymized only).
- [ ] **Step 6 — Commit:** `git commit -am "demo(agency-ops): seed agency KPIs, AR Loop, value events, Aria docs"`

### Task 3.3: Deploy to `harbormill-aios-demo` + write the demo runbook  [Dame-gated deploy]

**Files:**
- Create: `docs/gtm/field-guide/demo-runbook.md`

- [ ] **Step 1 [Dame]:** Deploy the `demo/agency-ops` build + seed to the `harbormill-aios-demo`
  Supabase per `docs/client-setup.md` (link project, `supabase db push`/seed, deploy edge functions,
  set secrets incl. the `sb_secret_` service-role key, provision a demo admin).
- [ ] **Step 2:** Write `demo-runbook.md`: the demo URL, login, the 6-beat path mapped to clicks, and a
  **reset procedure** (re-seed) so each demo starts clean. Cross-link it from Part 2's run-of-show.
- [ ] **Step 3 — Done-criteria:** a clean run of the 6-beat demo works on the live URL; Part 2's
  run-of-show now points at the live deck (replace the "fallback only" note). Capture fresh screenshots
  to upgrade Part 2's fallback set.
- [ ] **Step 4 — Commit:** `git add docs/gtm/field-guide/demo-runbook.md && git commit -m "docs(field-guide): agency demo runbook + live-deck run-of-show"`

---

## PHASE 4 — Build B: website proof & funnel pass (separable)

> Separate Vite app (`website/`). Gate on **its own** scripts: `cd website && npm run typecheck && npm
> run lint && npm run build`. Dark-only; match existing token styling; no hardcoded hex. Most copy lives
> in `website/src/config/site.ts` (single source of truth).

### Task 4.1: Emphasize the funnel + sharpen Aria-grounding copy (copy-only)

**Files:**
- Modify: `website/src/config/site.ts` (Ladder subtitle/section; AIOS/Aria feature copy; booking CTA labels)

- [ ] **Step 1:** In the Ladder section, state the **Loop Audit → Focused Project → Retainer** motion
  as the repeatable engine (additive copy; do not change the rung prices).
- [ ] **Step 2:** Update the Aria feature copy to emphasize *grounded in your live metrics, briefs, and
  knowledge base — not a generic chatbot.*
- [ ] **Step 3:** Clarify booking CTAs where it helps (free intro vs. Loop Audit vs. live walkthrough).
- [ ] **Step 4 — Gate:** `cd website && npm run typecheck && npm run build` pass.
- [ ] **Step 5 — Done-criteria:** copy renders; ladder funnel reads as the engine; prices unchanged; no hardcoded hex.
- [ ] **Step 6 — Commit:** `git commit -am "feat(website): emphasize Audit→Project→Retainer funnel + Aria grounding"`

### Task 4.2: Add a Value-Delivered beat to the interactive demo tour

**Files:**
- Modify: `website/src/components/demo/DemoTour.tsx` (add a step)
- Create: `website/src/components/demo/steps/ValueStep.tsx`
- Modify: `website/src/config/demoData.ts` (sample value-delivered data)

- [ ] **Step 1:** Add a 4th demo step "Value Delivered" showing a sample ROI surface (e.g., "AR Loop
  recovering $X/mo vs your retainer"), styled like the existing steps (OverviewStep/BriefingStep/AriaStep).
- [ ] **Step 2 — Gate:** `cd website && npm run typecheck && npm run lint && npm run build` pass; click
  through the tour locally and confirm the new step renders on desktop + mobile widths.
- [ ] **Step 3 — Done-criteria:** the demo tour now shows the ROI surface (the retainer closer); sample
  numbers are clearly "illustrative."
- [ ] **Step 4 — Commit:** `git commit -am "feat(website): add Value-Delivered step to AIOS demo tour"`

### Task 4.3: Case-study section scaffold (structure, placeholder copy — NO fabricated numbers)

**Files:**
- Create: `website/src/sections/CaseStudies.tsx`
- Modify: `website/src/config/site.ts` (a `caseStudies` data array — 2–3 entries with placeholder/
  "coming soon" copy), `website/src/App.tsx` (or the section list) to render the section, `SiteNav`/footer links.

- [ ] **Step 1:** Add a `caseStudies` shape to `site.ts` matching `docs/gtm/case-studies/_template.md`
  fields (industry, pain, the Loop, ROI multiple, pull-quote) with **placeholder** values labeled
  "Case study coming soon" — do not invent results.
- [ ] **Step 2:** Build `CaseStudies.tsx` to render them (graceful when entries are placeholders, e.g.
  a "First case studies publishing soon" state).
- [ ] **Step 3 — Gate:** `cd website && npm run typecheck && npm run lint && npm run build` pass.
- [ ] **Step 4 — Done-criteria:** the section renders with placeholders; real numbers can be dropped in
  later by editing `site.ts` only; nothing fabricated ships.
- [ ] **Step 5 — Commit:** `git commit -am "feat(website): case-study section scaffold (placeholder, no fabricated proof)"`

### Task 4.4: Ship Wave 2 — push + PR (or extend the Wave 1 PR)

- [ ] **Step 1:** Push the branch(es); open/extend the PR. If `demo/agency-ops` is a separate branch,
  open its own PR. Website changes go on `docs/gtm-field-guide` (or a `feat/website-proof-pass` branch).
- [ ] **Step 2 — Done-criteria:** PR(s) open; website diff passes its gate; report URLs to Dame.

---

## Self-Review (spec coverage)

- Part 1 (mastery) → Task 1.2 + cheat-sheet 1.3. Part 2 (pitch/demo + fallback) → Task 1.5 + one-pager 1.6.
  Part 3 (discovery + objections) → Task 1.4. Part 4 (close/onboard/operate) → Task 2.1. Index → Task 2.2.
- Build A (live agency demo) → Phase 3 (3.1 skin · 3.2 seed · 3.3 deploy+runbook), Dame-gated deploy, general-agency skin.
- Build B (website proof/funnel) → Phase 4 (4.1 funnel/Aria copy · 4.2 Value step · 4.3 case-study scaffold).
- **Guardrails honored:** extends `docs/gtm/` (links, never duplicates); no dropped pricing numbers;
  no fabricated proof (case studies = placeholders); each Vite app gated on its own scripts.
- **Sequencing:** Wave 1 (Phases 1–2) makes the founder call-ready in days; Wave 2 (Phases 3–4) follows
  and is separable so a stall on the live deck or website never blocks the documentation core.
- **Resolved decisions applied:** demo Loop = AR follow-up; one-pager = standalone PDF template;
  first call days-away → fallback-demo ships in Wave 1.
```
