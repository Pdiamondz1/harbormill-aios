---
title: Ditching Hourly (Jonathan Stark, 2026)
type: source
created: 2026-07-15
updated: 2026-07-15
sources: [external:ditching-hourly-jonathan-stark]
tags: [strategy, pricing, business-model, gtm, external-validation, value-pricing]
---

# Ditching Hourly (Jonathan Stark, 2026)

A 47-minute presentation + Q&A presented by Hyperagent (AIS LIVE, GA Access, "Day 2 Video
Assets"), published 2026-07-13: **Jonathan Stark** — 20 years specialising in pricing for
solo consultants and small firms — presenting to an audience of AI agency owners and
freelancers, with **Nate** (founder, AIS) hosting and relaying chat questions.

Unlike the sibling sessions, this is **methodology, not market signal**. It makes no claims
about what SMBs are paying; it is a framework for setting a price. Read it that way — its
value is the method, not evidence about buyers.

> **Restricted source — summarized, not reproduced.** Distributed by AIS behind a gated,
> download-disabled, expiring share. This page records **Harbormill's conclusions** and the
> facts needed to reason about them, **in Harbormill's own words, with no verbatim quotes and
> no blow-by-blow account**. The raw transcript is local-only in `docs/wiki/raw/external/` —
> gitignored, excluded from Aria's RAG, never committed: this repo is public. Do not re-add
> quotes or repackage the session as Harbormill content. See [[Media Ingest]] for the rule.

## What it establishes (in our words)

- **Hourly billing inverts the incentive, which is the argument — not that the rate is low.**
  The origin story is an agency where every developer billed one blended rate: the slow junior
  was roughly three times more profitable than the fast senior, because he took twice as long
  at the same rate. Hourly pays you more for being worse and punishes you for getting faster.
  This is the load-bearing claim, and it lands hardest on Harbormill, which **sells the
  elimination of billable hours** — see [[The Harbormill Ladder]].

- **Cost and value are the two anchors; price sits between them.** Defined precisely: *cost*
  is the floor — the least the **seller** would accept before walking away. *Value* is the
  ceiling — the most the **buyer** would pay. A price below cost is refused by the seller; a
  price above value is refused by the buyer. Cost-based pricing anchors on the wrong end. The
  underlying frame is credited to Ron Baker (*Implementing Value-Based Pricing*): price
  justifies cost, not the reverse.

- **Buyers don't care about seller costs, and hourly leaks them.** An hourly invoice can
  exceed what the work was ever worth to the client — surprises, scope drift, and overruns
  become the client's problem instead of the seller's. The seller's costs are the seller's to
  manage.

- **The sales call should uncover value, not scope.** Scope is *your* cost. The prescribed
  structure is a "why" conversation — **why this / why now / why me** — the last of which is
  the one people avoid, and the one that surfaces every objection before a proposal exists.
  Urgency raises value. The buyer is usually not the expert and may have asked for the wrong
  solution, so their requested scope is a starting point, not a specification. The
  current-state → desired-future-state → why-you structure is credited to Alan Weiss
  (*Value-Based Fees*).

- **The formula: price as a percentage of first-year value, scope chosen last.** Take the
  value of the client's desired future state, conservatively estimated in first-year dollars.
  **10% is the floor** — the no-brainer option. Then build **exactly three incremental options
  at roughly 10% / 25% / 50%**, which pushes buyers toward the middle. Only *then* pick a scope
  for each: work you'd be genuinely glad to do at that number, and still fine with if it took
  twice as long. Options must be **good/better/best increments, not either/or alternatives** —
  so the client chooses *how* to work with you, not *whether*. A variant with narrowing jumps
  steers to the top option instead. Presented as a rule of thumb, not a law.

- **Undifferentiated sellers cannot escape price competition.** If you look like every other
  option, buyers pick the cheapest and margins race to zero regardless of pricing model.
  Specialisation — by vertical, or by being the recognised expert in one narrow thing — is what
  makes value pricing possible at all. Supports [[Education-First Philosophy]] and the
  [[Four-Condition Loop Test]] as differentiators.

- **Value pricing cuts both ways, and it caps small clients.** The same expertise applied to a
  small business and a large one produces wildly different value; the small shop's entire upside
  may be modest, and by definition it will not pay more than the work is worth to it. His stated
  path for a soloist to scale is **bigger clients for the same expertise**, not more hours.
  This corroborates the $3–10M-revenue targeting in the AIOS Outcome Edition spec and cautions
  against moving downmarket.

- **Retainers are easy to price, hard to run.** He treats a recurring engagement as a
  productized service or an all-you-can-eat subscription rather than a block of hours, and notes
  the difficulty is keeping it profitable and the client happy — not setting the number.

## Implications for Harbormill

1. **The published ladder is the *door*, not the price.** This method implies **no published
   rate card at all** — the number is derived per client, live, from their value. Harbormill
   publishes fixed prices. That tension is real and is **flagged, not resolved**, on
   [[The Harbormill Ladder]]. It does not adjudicate the entry-rung reprice under review.

2. **The [[ROI-Discovery Audit]] already computes the input this method needs.** The framework's
   hard step is obtaining a credible value number; his answer is a careful interview. Our audit
   produces `audit_opportunities.annual_value_cents` as a scored, sourced artifact. That is the
   same number the formula multiplies. **This is Harbormill's conclusion, not his** — recorded
   on [[ROI-Discovery Audit]] and [[Value-Based Pricing]].

3. **It corroborates retiring hourly, and adds nothing about what to charge instead.** The
   incentive-inversion argument is stronger than the coherence argument already in
   `docs/gtm/`. But this session is methodology from a pricing specialist addressing agency
   owners — **it is not evidence about SMB buyers**, and `docs/gtm/case-studies/` is still
   empty.

4. **It flags a live spec as underpriced.** The AIOS Outcome Edition spec prices a $10K project
   against a claimed $320K/yr of value — about **3%**, under a third of the 10% floor. By this
   method both halves are underpriced, not just the retainer corrected earlier on 2026-07-15.
   **Recorded as a flag; not repriced here.**

5. **Our own Field Guide is partially convergent already.** `docs/gtm/field-guide/03-run-the-call.md`
   §4 independently arrived at "make the problem cost more than the price before naming the
   price" and payback-in-weeks. What it lacks is the **percentage-of-value formula** and the
   **three-option proposal** — the two genuinely new, actionable pieces here.

## See Also

- [[Value-Based Pricing]]
- [[The Harbormill Ladder]]
- [[ROI-Discovery Audit]]
- [[Education-First Philosophy]]
- [[Four-Condition Loop Test]]
- [[Media Ingest]]
- [[Project Context]]

**Pending cross-reference:** a *Tool Wars Panel 2026* source page (Kearns / Ebbelaar / Medin —
same cohort, same week, and the session carrying the actual market rates) exists on the unmerged
PR #39 branch, not on `main`. If it lands, wikilink it from here — and apply this page's
no-quotes rule to it first.
