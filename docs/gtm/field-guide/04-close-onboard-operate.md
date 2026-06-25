# Part 4 — Close, Onboard & Operate

> **Audience: you, Damon — after the prospect says yes.** Part 3 ends the moment the Loop Audit
> is booked. This file picks up the thread from there and carries it through to a renewing
> retainer. It is mostly **connective tissue**: it threads the existing `docs/gtm/` assets into a
> single path and adds one net-new layer — the **first-30-days operating cadence**. It does not
> re-explain the proposal, the onboarding checklist, or the retainer tiers; those live in their
> own files and are linked here. Where this guide and `docs/gtm/` ever disagree on pricing,
> **`docs/gtm/` wins.**

This is file 4 in the [Field Guide](00-index.md). Pricing used here, all from `docs/gtm/`:
Focused Project **$5,000** fixed (audit credited, 50/50) · Retainer **Operate $3,000 /
Operate + Build $5,000 / Embedded $8–10k**.

---

## 1. The path after "yes"

It's one continuous path, not four separate documents. The audit produces the proposal; the signed
proposal triggers onboarding; onboarding ends at a live deck with the build shipping; the shipped
build's ROI is what you stand on to pitch the retainer. Each handoff hands the next step its raw
material.

1. **Loop Audit → Opportunity Report.** *(Where the path starts.)* The paid audit you sold on the
   call ([Part 3](03-run-the-call.md#5-the-close)) maps the prospect's repeating work, scores each
   task on the [Four-Condition Loop Test](01-know-the-product.md#4-the-loop-concept--the-four-condition-loop-test),
   and ranks the survivors. The deliverable is a branded **Opportunity Report** — produced from the
   in-product **Audits** tool ([Part 1 surface table](01-know-the-product.md#2-surface-by-surface-tour))
   and exported to a Google Doc. The #1 ranked loop and its dollar prize *are* the spine of the
   proposal that follows.

2. **Focused Project proposal.** The Opportunity Report **is** most of this proposal — keep it one
   page, fixed-scope, fixed-price, sent within 48h of the audit. It names the #1 loop, the one
   success metric, what's explicitly out of scope (deferred to the retainer), and plants the
   retainer *now* so it isn't a surprise later.
   → [`../project-proposal-template.md`](../project-proposal-template.md)

3. **Onboarding SOP (signed → live).** The moment they approve, this is the repeatable checklist
   that takes you from "yes" to a live, branded deck with the build started. It front-loads the
   usual delivery-blocker (access) and runs the same way every client: welcome email + deposit
   invoice on Day 0, kickoff within 48h, access-intake, then the technical deploy.
   → [`../onboarding-sop.md`](../onboarding-sop.md)

4. **Retainer (at delivery).** Once the build is live and the ROI is on screen, the engagement
   converts from a one-time project to a recurring retainer. Pitch it at the delivery/handoff
   moment, anchored on the proven number. Two fixed tiers keep it repeatable.
   → [`../retainer-tiers.md`](../retainer-tiers.md)

The whole arc in one breath: **audit ranks the work → proposal sells one loop → onboarding makes the
deck live and starts the build → delivery proves the ROI → that ROI converts the retainer.**

---

## 2. First-30-days operating cadence *(net-new)*

This is the one piece this file *adds* rather than links. It maps the engagement's first month onto
a week-by-week rhythm so a new client always knows what's coming and you always know what to ship
next. It's consistent with the [onboarding SOP](../onboarding-sop.md) — Week 1 here *is* the SOP's
Day 0 → kickoff → deploy sequence — and it ends where the retainer pitch begins.

| Week | Deliverable | Who's involved |
|------|-------------|----------------|
| **Week 1 — Stand it up** | Per the [onboarding SOP](../onboarding-sop.md): welcome email + deposit invoice (50%), kickoff call within 48h, run the access-intake checklist, then **deploy their branded deck** (clone template, `db push` + seed, provision first admin, deploy the four edge functions, white-label `brand.ts`/`index.css`, deploy frontend). End-of-week state: deck is live, branded, access secured. **Confirm the one success metric and the one number you'll move.** | You (deploy) + the client (access + brand inputs, scope/metric sign-off at kickoff). |
| **Week 2 — Ship the first Loop** | Build and wire the **#1 loop from the audit** (e.g. AR follow-up) on real client data — data flows in through `report-ingest`, the relevant view + weekly brief surface on the deck, anything customer-facing lands human-gated in the **Loops** approval queue. End-of-week state: the loop is running on live data. | You (build) + the client (one short async check-in mid-build; approves any gated actions). |
| **Week 3 — First ROI review** | The first review on the **Value-Delivered surface** (the **Value** page in [Part 1](01-know-the-product.md#2-surface-by-surface-tour)): **log value events** (hours saved / cash recovered / cost avoided) and look at the rolled-up total versus the fee, reconciled against what the audit promised. End-of-week state: a real ROI number is on screen. | You + the client (a working review of the number together). |
| **Week 4 — Demo-back + next loop** | The **delivery/handoff call**: walk the live deck and the ROI, hand it off, and **surface the next-loop idea** from the ranked audit (land-and-expand). This is the moment you make the **retainer-at-delivery** move (§3). End-of-week state: project delivered, retainer pitched, next loop teed up. | You + the client (and any partner/co-founder who green-lights the retainer). |

> **Packageable as a client-facing note.** Stripped of the internal build detail (left column,
> deliverables only), this table doubles as a "here's what to expect in your first month" note you
> send at kickoff — it sets the rhythm, removes surprises, and makes the Week-4 retainer
> conversation feel like the natural next step rather than an upsell.

A few rules that keep the cadence honest:

- **One metric, one loop, one month.** The scope is deliberately small (Part 3's close promised the
  first automation live in 2–3 weeks) so the ROI shows fast. Resist scope creep — extra loops are
  the retainer's job, named as out-of-scope in the proposal.
- **Capacity / staggering.** Per the SOP's staggering rule, onboard the *next* client's sale while
  delivering *this* client's build — never start two builds in the same week.
- **The review surface is the spine.** Weeks 3 and 4 both stand on the Value-Delivered surface. If
  the number isn't on screen by Week 3, the retainer pitch has nothing to anchor to — treat logging
  value events as a first-class deliverable, not an afterthought.

---

## 3. The retainer-at-delivery move

The retainer is **pitched at delivery, when the project's ROI is fresh on the screen** — the deck's
Value-Delivered surface. You're not negotiating from a blank page; you're pointing at a number the
client can see. The full tiers, the pitch wording, and the churn-defense logic already live in
[`../retainer-tiers.md`](../retainer-tiers.md) — **don't re-paste the tiers here.** This section is
just the move.

**The setup (already done by now):** the proposal named the retainer up front, so this isn't a
surprise; Week 3 put a real ROI number on the Value-Delivered surface; Week 4's demo-back is
happening with that number live on screen.

**The move:** at the handoff, with the Value-Delivered surface open, anchor on the proven ROI and
offer the recurring tier. Most clients start on **Operate + Build ($5,000/mo)** so something new
ships every month; **Operate ($3,000/mo)** keeps what you built running and reviewed; **Embedded
($8–10k/mo)** is for clients who've proven the model and want to move faster — *all within the
published $3,000–$10,000 band, no new tiers.* The exact pitch wording is in
[`retainer-tiers.md` → "The pitch (at delivery)"](../retainer-tiers.md) — use it verbatim; it's
already tuned to anchor on the proven number.

**Why this lands here and not earlier:** the screen is doing the selling. If the build is recovering
$X/mo and that's visible, a $3–5k/mo fee that *protects and grows* it is an easy yes — and the
deck's monthly value surface keeps re-proving ROI every cycle, so the retainer renews itself (see
[`retainer-tiers.md` → "Churn defense"](../retainer-tiers.md)).

**The land-and-expand hook:** you already surfaced the next-loop idea from the ranked audit in
Week 4. That's the natural bridge to **Operate + Build**: *"we just shipped loop #1 and it's
returning $X — your audit already ranked the next three; on the retainer we build the next one each
month so the system compounds instead of going stale."*

---

## See also

- [`../project-proposal-template.md`](../project-proposal-template.md) — the one-page Focused
  Project proposal (audit → proposal).
- [`../onboarding-sop.md`](../onboarding-sop.md) — the signed-→-live checklist (Week 1 of the
  cadence above).
- [`../retainer-tiers.md`](../retainer-tiers.md) — the tiers, the at-delivery pitch wording, and the
  churn-defense logic (§3).
- [Part 1 §2 — the surface table](01-know-the-product.md#2-surface-by-surface-tour) — the
  Value-Delivered surface and the deploy/white-label seams referenced here.
- [Part 3 §5 — the close](03-run-the-call.md#5-the-close) — where the path before this one ends
  (the Loop Audit, booked).
