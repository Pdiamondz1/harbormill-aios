# Harbormill GTM — Phase 1 Execution Plan (Direct-to-SMB → first case studies & clients)

> **For agentic workers:** This is a **GTM execution plan**, not a code plan. The standard
> TDD/pytest task format is adapted: each task carries an **Owner** and **Done-criteria** instead of
> a failing test. Steps use checkbox (`- [ ]`) syntax for tracking. Buildable-artifact tasks
> (**[Claude]**) can be executed by a subagent; founder tasks (**[Dame]**) cannot and are tracked as
> milestones. Use superpowers:subagent-driven-development for the **[Claude]** tasks.

**Goal:** Stand up Harbormill's Direct-to-SMB engine end-to-end — pick the beachhead agency
sub-type, produce two flagship case studies by dogfooding, build the sales toolkit, and close the
first founding client — so the model is *proven and templatized*, ready to scale in Phase 2.

**Approach:** Sequence the spec's GTM motion (audit → dogfood → sales assets → run the motion →
templatize) into bite-sized, independently-verifiable tasks. Claude builds every reusable
artifact (audit instrument, AIOS client builds, sales collateral, templates); Dame runs the
real-world relationship and selling actions. The Sweven channel removes cold-start CAC.

**Tools:** Harbormill white-label AIOS base (Claude Code + Cursor + per-client folder structure),
the existing restaurant demo skin, Markdown deliverables in `docs/gtm/`.

**Owner legend:** **[Claude]** = buildable now · **[Dame]** = founder real-world action · **[Both]**.

## Global Constraints

- **North star is SCALE.** Every task is judged by "does this make Phase-2 scaling more
  inevitable?" Concentration and templating are non-negotiable.
- **Pricing (verbatim from spec §4):** Exploration milestone **$3,500** (credited to month 1,
  refundable), a fast **3–6 DAY** sprint. Retainers: **Core $3,500/mo · Growth $6,500/mo · Full
  AIOS $15,000/mo.** Founding-client offer: **30–40% off the monthly retainer for the first 3–6
  months** (first 2–3 agencies), exploration fee **still charged in full**.
- **Concentrate on ONE agency sub-type** before serving a second type — template reuse is the
  scaling deposit.
- **Invariant:** local service businesses (restaurant + members) are **flagship proof**, not the
  paid beachhead; **agencies** are the paid beachhead + Phase-2 builder pipeline.
- **Data:** client context layers are **hosted locally**; anonymize client data in any published
  case study.
- All `docs/gtm/` deliverables are committed on branch `docs/gtm-business-model`.

---

## Phase 0 — Foundations & Decisions

### Task 0.1: Confirm partner buy-in
**Owner:** [Dame] · **Deliverable:** a written yes + a scheduled kickoff.
- [ ] **Step 1:** Ask the DragonCandy partner to confirm two things in writing (text/email):
  (a) their restaurant + Sweven are flagship clients #1–2, and (b) Sweven can be used as a demo/lead
  channel.
- [ ] **Step 2:** Schedule a 30-minute kickoff to gather discovery materials (Task 2.1 / 2.3 inputs).
- [ ] **Done-criteria:** written confirmation captured; kickoff on the calendar.

### Task 0.2: Lock the Phase-1 success bar + Phase-2 trigger metric
**Owner:** [Both] · **Files:** Modify `docs/superpowers/specs/2026-06-24-harbormill-gtm-business-model-design.md` (§9 Q5).
- [ ] **Step 1:** Adopt this default unless Dame overrides: **Phase-1 is "done" / Phase-2 starts when**
  → **3 paying agency clients** (Core or above) **+ 2 published case studies + ≥ $12,000 MRR.**
- [ ] **Step 2:** Write the chosen numbers into spec §9 Q5 (replace the open question with the decision).
- [ ] **Step 3:** Commit: `git add -A && git commit -m "docs(strategy): set Phase-1 bar + Phase-2 trigger metric"`
- [ ] **Done-criteria:** spec §9 Q5 states a concrete, numeric trigger.

### Task 0.3: Verify the AIOS base is client-ready
**Owner:** [Claude] · **Files:** read `docs/white-label.md`, `docs/per-client-workflow.md`, `docs/client-setup.md`.
- [ ] **Step 1:** Scaffold a throwaway client context layer (`_scratch-testclient/`) from the base
  using the documented per-client workflow.
- [ ] **Step 2:** Confirm the white-label skin + folder structure (context / data / intelligence /
  automation / software layers) generate cleanly.
- [ ] **Step 3:** Delete the scratch scaffold.
- [ ] **Done-criteria:** a fresh client scaffold generates without manual fixes; any gaps logged as
  follow-up issues. (No commit — scratch only.)

---

## Phase 1 — Sweven Membership Audit (pick the agency sub-type)

### Task 1.1: Build the audit instrument
**Owner:** [Claude] · **Files:** Create `docs/gtm/sweven-audit.md`.
- [ ] **Step 1:** Write a short member-categorization survey + manual tally framework with these fields:
  `business_type`, `agency_sub_type` (marketing/SMMA · creative/design · dev/technical · recruiting ·
  PR · other), `revenue_band` (<$250k · $250k–$1M · $1M+), `biggest_manual_pain` (free text),
  `tools_used`, `open_to_pilot` (Y/N).
- [ ] **Step 2:** Add a one-page tally sheet: counts per sub-type + a "warm pilot candidates" column.
- [ ] **Step 3:** Commit: `git add docs/gtm/sweven-audit.md && git commit -m "docs(gtm): Sweven membership audit instrument"`
- [ ] **Done-criteria:** instrument captures sub-type + pain + pilot-willingness in <5 min per member.

### Task 1.2: Run the audit
**Owner:** [Dame] · **Deliverable:** populated tally in `docs/gtm/sweven-audit.md`.
- [ ] **Step 1:** Categorize the membership using the survey + your own knowledge of members.
- [ ] **Done-criteria:** ≥ 60% of members categorized by sub-type; pain noted for the agency members.

### Task 1.3: Decide the beachhead sub-type
**Owner:** [Both] · **Files:** Create `docs/gtm/beachhead-decision.md`.
- [ ] **Step 1:** From the tally, name the dominant agency sub-type (highest count × clearest *own*
  lead-gen pain) and record the count.
- [ ] **Step 2:** List 3–5 warm pilot candidates (member name/business + the pain to lead with).
- [ ] **Step 3:** Commit: `git add docs/gtm/beachhead-decision.md && git commit -m "docs(gtm): beachhead agency sub-type decision + pilot shortlist"`
- [ ] **Done-criteria:** one page naming **Beachhead sub-type = X (n=Y)** + a named pilot shortlist.

---

## Phase 2 — Dogfood: two flagship case studies

### Task 2.1: Restaurant discovery
**Owner:** [Both] · **Deliverable:** a populated inbox folder of context docs.
- [ ] **Step 1:** Collect from the partner: business overview, a P&L snapshot, team roster, and the
  2–3 most painful manual tasks (e.g., reservations/lead follow-up, review requests, inventory).
- [ ] **Step 2:** Drop the docs into the client inbox folder per `docs/per-client-workflow.md`.
- [ ] **Done-criteria:** inbox folder holds enough context to build a context layer.

### Task 2.2: Build the restaurant AIOS (flagship #1)
**Owner:** [Claude] · **Files:** new per-client scaffold under the AIOS base (restaurant skin).
- [ ] **Step 1:** Run the one-prompt context-layer build from the inbox; verify the business report
  reconciles (summary, revenue, leaks, quantified problems).
- [ ] **Step 2:** Build a branded **command-center dashboard** for the restaurant.
- [ ] **Step 3:** Ship **one** end-to-end automation tied to the top pain (e.g., review-request or
  lead/reservation follow-up).
- [ ] **Step 4:** Commit the (anonymizable) build per the per-client workflow.
- [ ] **Done-criteria:** dashboard renders real data; the one automation runs end-to-end.

### Task 2.3: Build the Sweven AIOS (flagship #2)
**Owner:** [Both] · **Files:** new per-client scaffold under the AIOS base.
- [ ] **Step 1:** Discovery for Sweven's own ops (member billing, tour/lead follow-up, bookings,
  community comms, events); populate its inbox folder.
- [ ] **Step 2 [Claude]:** Build Sweven's context layer + command center.
- [ ] **Step 3 [Claude]:** Ship one high-value automation (recommend **tour/lead follow-up** — it
  doubles as proof for the agency lead-gen pitch).
- [ ] **Step 4:** Commit the build.
- [ ] **Done-criteria:** Sweven automation runs on real data; partner confirms it saves real time.

### Task 2.4: Write the two case studies
**Owner:** [Claude] · **Files:** Create `docs/gtm/case-studies/restaurant.md`, `docs/gtm/case-studies/sweven.md`, `docs/gtm/case-studies/_template.md`.
- [ ] **Step 1:** Write `_template.md` with sections: Client (anonymized) · Pain (quantified
  before) · Build (what AIOS did) · Result (quantified after: time/$/revenue) · Quote.
- [ ] **Step 2:** Fill both case studies from the dogfood builds with **quantified** before/after.
- [ ] **Step 3:** Commit: `git add docs/gtm/case-studies && git commit -m "docs(gtm): flagship case studies (restaurant + Sweven)"`
- [ ] **Done-criteria:** each case study has a concrete quantified result and a usable pull-quote.

---

## Phase 3 — Sales engine assets

### Task 3.1: Pricing one-pager
**Owner:** [Claude] · **Files:** Create `docs/gtm/pricing.md`.
- [ ] **Step 1:** Write the ladder verbatim from Global Constraints (exploration $3,500 / Core
  $3,500 / Growth $6,500 / Full $15,000) + the founding-client terms + a one-line ROI framing per tier.
- [ ] **Step 2:** Commit: `git add docs/gtm/pricing.md && git commit -m "docs(gtm): NYC pricing one-pager"`
- [ ] **Done-criteria:** a client-shareable page with no internal notes.

### Task 3.2: Discovery questionnaire
**Owner:** [Claude] · **Files:** Create `docs/gtm/discovery-questionnaire.md`.
- [ ] **Step 1:** Write the call script with these core questions: (1) "What's the one task that, if
  it vanished, would change your week?" (2) "Walk me through it end-to-end today." (3) "What does it
  cost you — hours/week, dollars, or missed revenue?" (4) **Magic-wand:** "If I could wave a wand and
  it was solved, what does it look like?" (5) "Who else touches this / what tools are involved?"
- [ ] **Step 2:** Add a "quantify the pain" worksheet (hours × loaded rate, or missed-revenue estimate).
- [ ] **Step 3:** Commit: `git add docs/gtm/discovery-questionnaire.md && git commit -m "docs(gtm): discovery + pain-quantification script"`
- [ ] **Done-criteria:** following the script yields a scoped build + a dollar pain figure.

### Task 3.3: Exploration-sprint SOW template
**Owner:** [Claude] · **Files:** Create `docs/gtm/exploration-sow.md`.
- [ ] **Step 1:** Write a 1-page SOW: **$3,500, 3–6 day sprint**; deliverables = API/data feasibility
  confirmed + workflow map + rough MVP/dashboard; **fee credited to month 1**; **refunded if
  undeliverable**; explicit "this is scoping, not the full build" clause.
- [ ] **Step 2:** Commit: `git add docs/gtm/exploration-sow.md && git commit -m "docs(gtm): exploration-sprint SOW template"`
- [ ] **Done-criteria:** a signable 1-pager with the fast-sprint terms and refund clause.

### Task 3.4: Proposal template
**Owner:** [Claude] · **Files:** Create `docs/gtm/proposal-template.md`.
- [ ] **Step 1:** Write the template: restate quantified pain → proposed AIOS solution → **expected
  ROI** → **tiered options** (Core/Growth/Full with prices) → founding-client terms → next step.
  Frame per Hormozi "offer so good they feel stupid saying no."
- [ ] **Step 2:** Commit: `git add docs/gtm/proposal-template.md && git commit -m "docs(gtm): ROI proposal template"`
- [ ] **Done-criteria:** filling the blanks from a discovery call yields a complete proposal.

### Task 3.5: Demo-night deck outline
**Owner:** [Claude] · **Files:** Create `docs/gtm/demo-night-deck.md`.
- [ ] **Step 1:** Write the slide-by-slide outline for an "AIOS for your business" Sweven event:
  hook (the operator trap) → the AIOS thesis (agents deliver the service) → **live demo from the two
  flagship case studies** → the offer (exploration sprint + tiers + founding rate) → CTA (book a
  discovery call tonight).
- [ ] **Step 2:** Commit: `git add docs/gtm/demo-night-deck.md && git commit -m "docs(gtm): Sweven demo-night deck outline"`
- [ ] **Done-criteria:** outline maps 1:1 to a ~20-minute talk ending in booked discovery calls.

### Task 3.6: Pipeline tracker
**Owner:** [Claude] · **Files:** Create `docs/gtm/pipeline.md`.
- [ ] **Step 1:** Define stages (Lead → Discovery booked → Discovery done → Exploration sold →
  Exploration delivered → Proposal sent → Won/Lost) and per-deal fields (member, sub-type, pain,
  pain $, tier, founding Y/N, next action, date).
- [ ] **Step 2:** Seed it with the Task 1.3 pilot shortlist.
- [ ] **Step 3:** Commit: `git add docs/gtm/pipeline.md && git commit -m "docs(gtm): sales pipeline tracker"`
- [ ] **Done-criteria:** every pilot candidate is a row with a next action.

---

## Phase 4 — Run the motion (first clients)

### Task 4.1: Host the Sweven demo night
**Owner:** [Dame] · **Inputs:** Task 3.5 deck + Task 2.4 case studies.
- [ ] **Step 1:** Invite the member shortlist + broader membership; run the demo night.
- [ ] **Done-criteria:** event held; ≥ 3 discovery calls booked (logged in `pipeline.md`).

### Task 4.2: Run discovery calls
**Owner:** [Both] · **Inputs:** Task 3.2 questionnaire.
- [ ] **Step 1:** Run discovery with booked candidates; quantify each pain in dollars.
- [ ] **Step 2:** Update `pipeline.md`.
- [ ] **Done-criteria:** ≥ 2 qualified opportunities with a scoped build + a pain dollar-figure.

### Task 4.3: Sell + deliver the exploration sprint
**Owner:** [Both] · **Inputs:** Task 3.3 SOW.
- [ ] **Step 1 [Dame]:** Close the top opportunity on the **$3,500 exploration sprint** (SOW signed).
- [ ] **Step 2 [Claude]:** Run the 3–6 day sprint: confirm API/data feasibility, map the workflow,
  build the rough MVP/dashboard.
- [ ] **Done-criteria:** feasibility confirmed + a rough MVP the client has seen.

### Task 4.4: Close the first founding client
**Owner:** [Both] · **Inputs:** Task 3.4 proposal + Task 3.1 pricing.
- [ ] **Step 1:** Send the ROI proposal with tiered options + founding rate; credit the exploration fee.
- [ ] **Step 2 [Dame]:** Close on Core or Growth (founding discount applied).
- [ ] **Done-criteria:** signed retainer; `pipeline.md` shows first Won deal.

### Task 4.5: Build & deliver the first paying client's AIOS
**Owner:** [Claude] · **Files:** new per-client scaffold under the AIOS base.
- [ ] **Step 1:** Build the client's context layer + the one pain-point automation end-to-end.
- [ ] **Step 2:** Walk the client through it; capture their reaction for a future case study.
- [ ] **Done-criteria:** automation live in the client's hands; client confirms value.

---

## Phase 5 — Templatize (the scaling deposit)

### Task 5.1: Extract the first agency build into a reusable template
**Owner:** [Claude] · **Files:** new template under the AIOS base (the beachhead sub-type's starter kit).
- [ ] **Step 1:** Generalize the Task 4.5 build into a reusable template (parameterized for the next
  same-sub-type client).
- [ ] **Step 2:** Dry-run: scaffold a hypothetical second same-sub-type client from it.
- [ ] **Step 3:** Commit the template.
- [ ] **Done-criteria:** a second same-sub-type client can be scaffolded in a fraction of the time.

### Task 5.2: Land-and-expand the first client
**Owner:** [Both].
- [ ] **Step 1:** Surface one upsell idea (let the client's "what else can it do?" drive it); scope it.
- [ ] **Done-criteria:** one expansion opportunity logged in `pipeline.md`.

### Task 5.3: Phase-2 readiness check
**Owner:** [Both] · **Files:** Create `docs/gtm/phase2-readiness.md`.
- [ ] **Step 1:** Score current state against the Task 0.2 trigger metric (clients / case studies / MRR).
- [ ] **Step 2:** Write a go/no-go note: if met, the Phase-2 (builder/accelerator) spec is next.
- [ ] **Step 3:** Commit: `git add docs/gtm/phase2-readiness.md && git commit -m "docs(gtm): Phase-2 readiness check"`
- [ ] **Done-criteria:** a dated go/no-go against concrete numbers.

---

## Self-Review (spec coverage)

- Thesis / 5-layer AIOS / delivery stack → Tasks 0.3, 2.2, 2.3, 4.5 (built on the base).
- Sweven strategic engine → Phase 1 (audit) + Task 4.1 (demo night channel).
- Three-segment mapping → service biz = Phase 2 flagships; agencies = Phase 4 paid beachhead;
  solo founders = deferred to Phase 2 (out of this plan's scope, by design).
- Offer + NYC pricing + founding discount + 3–6 day exploration → Tasks 3.1, 3.3, 3.4, 4.3, 4.4.
- Delivery model + founder-bottleneck mitigation → concentration (Task 1.3) + templating (Task 5.1).
- GTM motion (discovery → quantify → magic-wand → exploration → proposal → land-and-expand) →
  Tasks 3.2, 4.2, 4.3, 4.4, 5.2.
- Phase-2 stub + trigger metric → Tasks 0.2, 5.3.
- **Open spec questions resolved here:** sub-type (Task 1.3), partner buy-in (Task 0.1), Phase-2
  trigger (Task 0.2). **Still deferred to the Phase-2 spec:** who delivers beyond Dame at scale
  (Task 5.1 templating is the first lever; hiring/builders are Phase-2).
