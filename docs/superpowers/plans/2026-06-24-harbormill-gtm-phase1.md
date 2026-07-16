# Harbormill GTM — Phase 1 Execution Plan (Sweven + agency-niche layer on the existing ladder)

> **For agentic workers:** This is a **GTM execution plan**, not a code plan. The standard
> TDD/pytest task format is adapted: each task carries an **Owner** and **Done-criteria** instead of
> a failing test. Steps use checkbox (`- [ ]`) syntax. Buildable-artifact tasks (**[Claude]**) can be
> executed by a subagent; founder tasks (**[Dame]**) are tracked as milestones.

**Goal:** Layer the Sweven channel, the agency-niche concentration, dogfood case studies, and the
Phase-2 accelerator arc **onto Harbormill's existing 30-Day Playbook / Loop-Audit ladder** — so the
proven sales machine gains a warm channel, a target niche, and the proof it currently lacks, and the
model is ready to scale in Phase 2.

**Approach:** This plan **extends** `docs/gtm/` — it does **not** introduce new pricing or a new sales
process. It (a) builds net-new artifacts the existing system lacks, (b) makes light, clearly-flagged
edits to existing assets to wire in Sweven + the agency niche, and (c) runs the existing ladder
unchanged with Sweven feeding its top.

**Source of truth (do not contradict):** `docs/gtm/` for the ladder + pricing
(Loop Audit → Project → Retainer); `docs/per-client-workflow.md` + `docs/client-setup.md` for delivery.

**Owner legend:** **[Claude]** = buildable now · **[Dame]** = founder real-world action · **[Both]**.

## Global Constraints

- **North star is SCALE.** Every task is judged by "does this make Phase-2 scaling more inevitable?"
- **Pricing/ladder = existing `docs/gtm/`, verbatim:** **Loop Audit $500–$2,500** (fee credited,
  48h Opportunity Report) → **Focused Project $5,000** (50/50, 2–3 wks) → **Retainer** Operate
  $3,000 / Operate+Build $5,000 / Embedded $8–10k (band **$3–10k**). **Do not invent new tiers.**
- **Extend, don't duplicate:** never create a file that re-does an existing `docs/gtm/` asset
  (`retainer-tiers.md`, `intro-call-script.md`, `project-proposal-template.md`, `warm-50-tracker.md`,
  `outreach-templates.md`, `onboarding-sop.md`). Update the existing file instead, with a flagged note.
- **Concentrate on ONE agency sub-type** before serving a second — template reuse is the scaling deposit.
- **Invariant:** local service businesses (restaurant + members) are **flagship proof**, not the paid
  beachhead; **agencies** are the paid beachhead + Phase-2 builder pipeline.
- **Delivery = the deployable AIOS deck** (per-client repo, Aria, connectors, Value-Delivered surface)
  **+ one Loop**; *configure, don't fork*. Client data hosted on the client's own Supabase; anonymize
  in any published case study.
- All deliverables committed on branch `docs/gtm-business-model`.

---

## Phase 0 — Foundations & Decisions

### Task 0.1: Confirm partner buy-in
**Owner:** [Dame] · **Deliverable:** a written yes + a scheduled kickoff.
- [ ] **Step 1:** Get the DragonCandy partner's written confirmation (text/email) that (a) their
  restaurant + Sweven are flagship clients #1–2, and (b) Sweven can be used as a demo/lead channel.
- [ ] **Step 2:** Schedule a 30-min kickoff to gather discovery materials (Task 2.1 / 2.3 inputs).
- [ ] **Done-criteria:** written confirmation captured; kickoff on the calendar.

### Task 0.2: Lock the Phase-1 success bar + Phase-2 trigger metric
**Owner:** [Both] · **Files:** Modify spec §9 Q5.
- [ ] **Step 1:** Adopt unless Dame overrides: **Phase-2 starts when → 3 paying agency clients
  (Operate or above) + 2 published case studies + ≥ $12,000 MRR.**
- [ ] **Step 2:** Write the chosen numbers into spec §9 Q5.
- [ ] **Step 3:** Commit: `git commit -am "docs(strategy): set Phase-1 bar + Phase-2 trigger metric"`
- [ ] **Done-criteria:** spec §9 Q5 states a concrete, numeric trigger.

### Task 0.3: Verify the AIOS base is client-ready  ✅ (verified by docs)
**Owner:** [Claude] · **Status:** confirmed during planning — `setup:client` script, `brand.ts` +
`features.ts` config seams, the `demo/restaurant-ops` skin, and the documented per-client workflow all
exist. **Remaining live check is a [Dame] step** (a real `npm run setup:client` provision needs the
client's Supabase + AI keys).
- [ ] **Done-criteria (Dame, at first real client):** `npm run setup:client` scaffolds a client repo
  without manual fixes; log any gaps as base-template issues.

---

## Phase 1 — Sweven Membership Audit (pick the agency sub-type)

### Task 1.1: Build the audit instrument  *(net-new)*
**Owner:** [Claude] · **Files:** Create `docs/gtm/sweven-audit.md`.
- [ ] **Step 1:** Write a short member-categorization survey + tally with fields: `business_type`,
  `agency_sub_type` (marketing/SMMA · creative/design · dev/technical · recruiting · PR · other),
  `revenue_band` (<$250k · $250k–$1M · $1M+), `biggest_repeating_pain` (free text, nudged toward
  AR / leads / reporting / client-onboarding), `tools_used`, `open_to_pilot` (Y/N).
- [ ] **Step 2:** Add a one-page tally: counts per sub-type + a "warm pilot candidates" column. Note
  that confirmed members flow into `warm-50-tracker.md`.
- [ ] **Step 3:** Commit: `git add docs/gtm/sweven-audit.md && git commit -m "docs(gtm): Sweven membership audit instrument"`
- [ ] **Done-criteria:** captures sub-type + pain + pilot-willingness in <5 min/member.

### Task 1.2: Run the audit
**Owner:** [Dame] · **Deliverable:** populated tally in `docs/gtm/sweven-audit.md`.
- [ ] **Done-criteria:** ≥ 60% of members categorized; pain noted for agency members.

### Task 1.3: Decide the beachhead sub-type  *(net-new)*
**Owner:** [Both] · **Files:** Create `docs/gtm/beachhead-decision.md`.
- [ ] **Step 1:** Name the dominant agency sub-type (highest count × clearest *own* lead-gen pain) + count.
- [ ] **Step 2:** List 3–5 warm pilot candidates (member + the lead-with pain) and add them to
  `warm-50-tracker.md`.
- [ ] **Step 3:** Commit: `git add docs/gtm/beachhead-decision.md docs/gtm/warm-50-tracker.md && git commit -m "docs(gtm): beachhead agency sub-type + pilot shortlist"`
- [ ] **Done-criteria:** one page naming **Beachhead sub-type = X (n=Y)** + a seeded pilot shortlist.

---

## Phase 2 — Dogfood: two flagship case studies *(net-new proof)*

### Task 2.1: Restaurant discovery
**Owner:** [Both] · **Deliverable:** populated access-intake (per `docs/gtm/onboarding-sop.md`).
- [ ] **Step 1:** Collect: business overview, the top repeating pain (likely AR / reservations / review
  requests), data source + access, and brand inputs.
- [ ] **Done-criteria:** enough to deploy a deck + build one loop.

### Task 2.2: Build the restaurant AIOS deck + first loop (flagship #1)
**Owner:** [Claude] · **Files:** new per-client repo from the base (restaurant skin).
- [ ] **Step 1:** Deploy the deck per `docs/per-client-workflow.md` (white-label `brand.ts` + CSS;
  reuse the `demo/restaurant-ops` skin as the starting point).
- [ ] **Step 2:** Wire one connector / data feed; ship **one** Loop tied to the top pain.
- [ ] **Step 3:** Set the `monthly_retainer_cents` + report `type:"value"` so the **Value-Delivered**
  surface shows ROI.
- [ ] **Done-criteria:** deck live + branded; the one Loop runs end-to-end; ROI surface shows a number.

### Task 2.3: Build the Sweven AIOS deck + first loop (flagship #2)
**Owner:** [Both] · **Files:** new per-client repo from the base.
- [ ] **Step 1 [Both]:** Discovery for Sweven ops (member billing, **tour/lead follow-up**, events).
- [ ] **Step 2 [Claude]:** Deploy Sweven's deck; ship one high-value Loop — recommend **tour/lead
  follow-up** (it doubles as proof for the agency lead-gen pitch).
- [ ] **Done-criteria:** Sweven Loop runs on real data; partner confirms it saves real time.

### Task 2.4: Write the case-study template + the two case studies  *(net-new)*
**Owner:** [Claude] · **Files:** Create `docs/gtm/case-studies/_template.md`, `.../restaurant.md`, `.../sweven.md`.
- [ ] **Step 1:** Write `_template.md`: Client (anonymized) · Pain (quantified before) · Loop built ·
  Result (quantified after: time/$/recovered) · Value-Delivered ROI multiple · Quote.
- [ ] **Step 2:** Fill both from the dogfood builds with **quantified** before/after.
- [ ] **Step 3:** Commit: `git add docs/gtm/case-studies && git commit -m "docs(gtm): flagship case studies (restaurant + Sweven)"`
- [ ] **Done-criteria:** each case study has a concrete quantified result + a usable pull-quote.

---

## Phase 3 — Wire Sweven + the agency niche into the existing assets

> No new pricing/discovery/proposal/pipeline files — those exist. Build the one net-new channel asset,
> then make light, flagged edits to existing docs.

### Task 3.1: Sweven channel playbook  *(net-new)*
**Owner:** [Claude] · **Files:** Create `docs/gtm/sweven-channel.md`.
- [ ] **Step 1:** Document Sweven as the **Warm-50 engine + intro-generation channel**: how to mine the
  membership into the tracker, and a **demo-night run-of-show** ("kill the busywork" → the AIOS-deck
  thesis → live walk of the two flagship case studies → the offer = book a free intro call /
  Loop Audit → CTA tonight). Map each step to the existing ladder so it feeds, not replaces, the funnel.
- [ ] **Step 2:** Commit: `git add docs/gtm/sweven-channel.md && git commit -m "docs(gtm): Sweven channel playbook + demo-night run-of-show"`
- [ ] **Done-criteria:** a demo night maps 1:1 to booked intro calls in `warm-50-tracker.md`.

### Task 3.2: Light edits to existing assets (flagged)  *(update, do not duplicate)*
**Owner:** [Claude] · **Files:** Modify `docs/gtm/README.md`, `warm-50-tracker.md`, `intro-call-script.md`, `retainer-tiers.md`.
- [ ] **Step 1 — `README.md`:** add Sweven as the top-of-funnel warm source and the agency niche as the
  concentration target; link `sweven-channel.md` + `beachhead-decision.md`. (One added row/paragraph;
  keep the existing funnel math.)
- [ ] **Step 2 — `warm-50-tracker.md`:** add **Sweven members** as a first-class source bullet and an
  `agency_sub_type` column to the schema.
- [ ] **Step 3 — `intro-call-script.md`:** add agency-relevant loops alongside AR/leads/reporting —
  *their own lead-gen, client onboarding, client reporting* — with one quantification example each.
- [ ] **Step 4 — `retainer-tiers.md`:** add a short note: agency niche + the optional founding-client
  lever (within the $3–10k band). **Do not change the tier prices.**
- [ ] **Step 5:** Commit: `git add docs/gtm/*.md && git commit -m "docs(gtm): wire Sweven + agency niche into existing GTM assets"`
- [ ] **Done-criteria:** edits are additive; no existing price or ladder step changed; a `git diff`
  shows only insertions + the one schema column.

---

## Phase 4 — Run the existing ladder (Sweven-fed)

### Task 4.1: Host the Sweven demo night
**Owner:** [Dame] · **Inputs:** Task 3.1 run-of-show + Task 2.4 case studies.
- [ ] **Done-criteria:** event held; ≥ 3 intro calls booked (logged in `warm-50-tracker.md`).

### Task 4.2: Run intro calls + sell Loop Audits
**Owner:** [Both] · **Inputs:** `docs/gtm/intro-call-script.md`.
- [ ] **Step 1:** Run intros; make each pain a number; book the **paid Loop Audit** before hangup.
- [ ] **Done-criteria:** ≥ 2 Loop Audits sold (fee credited per the existing script).

### Task 4.3: Deliver the Loop Audit → close the Focused Project
**Owner:** [Both] · **Inputs:** `project-proposal-template.md`, `onboarding-sop.md`.
- [ ] **Step 1 [Both]:** Deliver the 48h Opportunity Report (Four-Condition Test, ranked loops).
- [ ] **Step 2 [Dame]:** Send the proposal; close the **$5,000 Focused Project** (50% deposit), audit
  fee credited; onboard per the SOP.
- [ ] **Done-criteria:** first project signed + deposit collected (tracker → `Project signed`).

### Task 4.4: Build & deliver the first paying client's deck + Loop
**Owner:** [Claude] · **Files:** new per-client repo from the base.
- [ ] **Step 1:** Build the deck + the ranked #1 Loop end-to-end; ROI on the Value-Delivered surface.
- [ ] **Step 2:** Run the delivery/handoff call; pitch the **Retainer** at delivery (ROI on screen).
- [ ] **Done-criteria:** Loop live; client on a retainer tier (founding lever optional).

---

## Phase 5 — Templatize (the scaling deposit)

### Task 5.1: Flow the first agency Loop back to the base  *(configure-don't-fork)*
**Owner:** [Claude] · **Files:** port the reusable Loop into the `harbormill-aios` base per
`docs/per-client-workflow.md` ("improvements flow UP").
- [ ] **Step 1:** Generalize the Task 4.4 Loop into a reusable component/tool in the base.
- [ ] **Step 2:** Dry-run: scaffold a hypothetical second same-sub-type client to confirm reuse.
- [ ] **Step 3:** Commit the base improvement.
- [ ] **Done-criteria:** a second same-sub-type client can be served materially faster.

### Task 5.2: Land-and-expand the first client
**Owner:** [Both].
- [ ] **Step 1:** Surface one next-Loop idea (let the client's "what else?" drive it); add to their
  ranked audit / `warm-50-tracker`.
- [ ] **Done-criteria:** one expansion opportunity logged (path to Operate+Build).

### Task 5.3: Phase-2 readiness check  *(net-new)*
**Owner:** [Both] · **Files:** Create `docs/gtm/phase2-readiness.md`.
- [ ] **Step 1:** Score current state vs the Task 0.2 trigger (clients / case studies / MRR).
- [ ] **Step 2:** Write a dated go/no-go: if met, the Phase-2 (builder/accelerator) spec is next.
- [ ] **Step 3:** Commit: `git add docs/gtm/phase2-readiness.md && git commit -m "docs(gtm): Phase-2 readiness check"`
- [ ] **Done-criteria:** a dated go/no-go against concrete numbers.

---

## Self-Review (spec coverage + reconciliation)

- Existing ladder preserved → Global Constraints + Phase 4 run it unchanged; Phase 3 only *wires in*
  Sweven + the niche (flagged, additive edits — no price/step changes).
- Sweven strategic engine → Task 1.1–1.3 (audit) + Task 3.1 (channel playbook) + Task 4.1 (demo night).
- Agency-niche concentration → Task 1.3 + Task 3.2 Step 3 + Task 5.1 (template).
- Dogfood flagships (the net-new proof) → Tasks 2.1–2.4.
- Delivery = deployable deck + Loop → Tasks 2.2, 2.3, 4.4 (per the base workflow docs).
- Phase-2 stub + trigger metric → Tasks 0.2, 5.3.
- **No duplicate files:** pricing/discovery/proposal/pipeline reuse existing `docs/gtm/` assets; only
  net-new files are created (`sweven-audit`, `beachhead-decision`, `sweven-channel`, `case-studies/*`,
  `phase2-readiness`).
- **Resolved spec open-questions:** sub-type (1.3), partner buy-in (0.1), Phase-2 trigger (0.2).
  Still deferred to the Phase-2 spec: who delivers at scale (5.1 templating is the first lever).
