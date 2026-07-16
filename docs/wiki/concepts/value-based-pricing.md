---
title: Value-Based Pricing
type: concept
created: 2026-07-15
updated: 2026-07-15
sources: [external:ditching-hourly-jonathan-stark, docs/gtm/field-guide/03-run-the-call.md, docs/gtm/retainer-tiers.md]
tags: [strategy, pricing, business-model, gtm, method]
---

# Value-Based Pricing

Price the **outcome**, not the effort. The method Harbormill is converging on, drawn from
[[Ditching Hourly (Jonathan Stark, 2026)]] and from `docs/gtm/`'s own independently-derived
price-justification work. **Summarized in Harbormill's own words** — the source is gated
material; see [[Media Ingest]].

Canon for the ladder and its actual prices is [[Project Context]] §8. This page is *method*, not
a price list.

## The three anchors

| Term | Definition | Whose number |
|---|---|---|
| **Cost** | The floor — the least the seller would accept before walking away | Seller's |
| **Value** | The ceiling — the most the buyer would pay | Buyer's |
| **Price** | Any point between the two | Negotiated |

A price below cost is refused by the seller; above value, refused by the buyer. **Cost-based
pricing anchors on the wrong end** — it derives price from the seller's effort, a number the
buyer does not care about.

## Why hourly is the wrong *unit*, not just a low number

Hourly billing inverts the incentive: at one blended rate, a slow worker bills more than a fast
one for identical output, so the *worse* worker is the more profitable one. You are paid more for
being slower and penalised for improving.

**This bites hardest in Harbormill's category, because we sell the elimination of billable
hours.** Quoting our own time by the hour prices us against our own product. See
[[The Harbormill Ladder]] — hourly was retired 2026-07-15.

Hourly also leaks seller risk onto the buyer: overruns, surprises, and scope drift can push an
invoice past what the work was ever worth, which is how relationships end.

## The method

1. **Uncover value, not scope.** Scope is *your* cost. A discovery call spent cataloguing
   requested features produces an estimate, not a price. The buyer usually isn't the expert and
   may have asked for the wrong solution.
2. **Run the "why" conversation** — *why this / why now / why me*. Why-now surfaces urgency
   (urgency raises value); why-me surfaces every objection before a proposal exists. It is the
   uncomfortable question and the one that matters.
3. **Get a first-year value number**, conservatively estimated, in the client's own terms.
4. **Price as a percentage of that value.** ~**10% is the floor** — the no-brainer. Build
   **exactly three incremental options at roughly 10% / 25% / 50%**, which steers buyers to the
   middle. Narrowing jumps steer to the top instead. A rule of thumb, not a law.
5. **Choose scope last** — work you'd be glad to do at that number, and still fine with at twice
   the effort. Costs are yours to control; that's the point.
6. **Options are good/better/best increments, not either/or.** The client chooses *how* to work
   with you, not *whether* — and has nothing clean to shop against.

## Where Harbormill already agrees

`docs/gtm/field-guide/03-run-the-call.md` §4 arrived independently at the same core move: make
the problem cost more than the price, out loud, **before** naming the price; then sell the
payback period (price ÷ prize, stated in weeks). The credited-audit-fee risk reversal and the
monthly value-vs-fee scoreboard (target ≥3× — `docs/gtm/retainer-tiers.md`) are the same
instinct.

**What we did not have:** the percentage-of-value formula and the three-option proposal.

## The Harbormill unlock (our conclusion, not the source's)

The method's hard step is step 3 — *getting a credible value number*. The source's answer is a
skilled interview, which is exactly the skill most operators lack.

**The [[ROI-Discovery Audit]] already computes it.** `audit_opportunities.annual_value_cents` is
a scored, sourced, per-opportunity annual value — the same input the formula multiplies. So the
project price can be derived from **the audit's own number** rather than any fixed figure, and
the promised-vs-delivered reconciliation then checks the estimate against reality.

That is a structural advantage: most consultants must talk their way to a value number, and can
never prove it afterwards. Harbormill computes it up front and reconciles it later.

## Flag: this method implies no published rate card

**Unresolved tension, recorded not settled.** The method sets price **per client, live**, from
their value. Harbormill **publishes a ladder** with fixed prices on a public marketing site.

These are not reconcilable as stated. The most likely resolution — **the published ladder is the
door, not the price**: a lead-generation artifact that sets expectations and lowers friction,
while the real number is set in the sales interview. But that is a hypothesis.

**Consequence worth noting:** debates about the published entry-rung number are debates about
the *door*. They do not settle what any given client should pay. The entry-rung question was
resolved separately on PR #39 (hourly retired, the audit is the front door) — this *door-vs-price*
tension is a different question and remains open.

## Known limits

- **It is methodology, not market evidence.** It says nothing about what SMBs actually pay.
  `docs/gtm/case-studies/` is still empty; that gap is unchanged.
- **It caps small clients by design.** Value pricing cuts both ways — a small business's whole
  upside may be modest, and it will not pay more than the work is worth. The stated scale path
  for a soloist is **bigger clients, same expertise**. This corroborates the $3–10M-revenue
  targeting and cautions against downmarket.
- **It requires differentiation.** An undifferentiated seller is chosen on price no matter the
  model. See [[Education-First Philosophy]] and [[Four-Condition Loop Test]].
- **It requires a live prospect.** None of this can be executed in a config file — which is the
  same conclusion the PR #39 roast reached from the opposite direction.

## See Also

- [[Ditching Hourly (Jonathan Stark, 2026)]]
- [[The Harbormill Ladder]]
- [[ROI-Discovery Audit]]
- [[Four-Condition Loop Test]]
- [[Education-First Philosophy]]
- [[Media Ingest]]
- [[Project Context]]
