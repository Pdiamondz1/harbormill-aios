---
title: The Harbormill Ladder
type: concept
created: 2026-06-17
updated: 2026-07-15
sources: [docs/PROJECT_CONTEXT.md, website/src/config/site.ts, external:land-and-expand-benchmarks, external:what-actually-matters-in-ai-2026]
tags: [strategy, pricing, business-model, gtm]
---

# The Harbormill Ladder

Harbormill Automation's engagement model **and** pricing, in one ladder. Low-risk
entry, climb only as ROI proves out:

1. **Get started** — $100/hr one-on-one consulting (e.g. Claude setup).
2. **Paid audit** — $500–$2,500, fixed scope; map workflows, scope the first build.
   Now operationalized in-product by the [[ROI-Discovery Audit]] tool (Opportunity
   Report → ROI vs the retainer), which is also the engine for selling Rung 4.
3. **Focused project** — $2,500–$10,000; ship one workflow, prove ROI.
4. **Retainer** — $3,000–$10,000/mo; ongoing, after trust and results.

Every climb starts with a free 30-min intro. Surfaced on the marketing site
(`website/src/config/site.ts`) and in [[Project Context]].

## Key Decisions

- **"Rung" is internal vocabulary — never shown to or said to clients (2026-06-20).**
  The ladder/rung model is how Harbormill reasons about the engagement internally;
  client-facing surfaces refer to a tier by its **name** ("Paid audit") or a numeric
  badge, not "Rung N." The [[Marketing Site]] follows this (the Ladder section uses
  numbered badges + names; the Loop Audit price pill reads `$500–$2,500 · fixed
  scope`, not "Rung 2 · …"). This matters for the knowledge base: when [[Aria]]
  answers a client from this page's content, it should describe a tier by name/price,
  never echo the word "Rung." (Internal code identifiers and docs may still use it.)

## Why it's shaped this way (external validation)

The ladder is a textbook **land-and-expand / productized-consulting** structure,
and the external evidence supports the design:

- A **low-priced audit as the gateway to larger work** is a proven pattern — e.g.
  a $2,500 audit consistently leading to $25k+ implementations
  ([Consulting Success](https://www.consultingsuccess.com/consulting-retainer)).
- The hybrid **consulting → productized program → retainer** ladder, where each
  rung feeds the next, is the recommended scale path
  ([ManyRequests](https://www.manyrequests.com/blog/productized-consulting),
  [Assembly](https://assembly.com/blog/productized-services)).
- Productized consultants commonly serve **40–80 clients/yr** at $5k–$25k MRR as
  they scale ([Assembly](https://assembly.com/blog/productized-services)).

## Flag (observation, not yet acted on)

The productization literature stresses **clear fixed-scope deliverables** at each
tier. Rungs 2–4 are scoped engagements; **Rung 1 (Get started) is hourly**, which is
less "productized."
A future option is a fixed-price starter package (e.g. a named "AI setup session")
to make the entry rung a cleaner product. Recorded as a strategy flag.

## Flag: the method we're adopting implies no published ladder at all (2026-07-15)

A third flag, from [[Ditching Hourly (Jonathan Stark, 2026)]] — a pricing specialist, presenting
method rather than market data. **Observation only — no repricing recommended from this source.**

Two things it settles, and one it doesn't.

**Settled: hourly is the wrong _unit_, not merely a low number.** The argument is incentive
inversion — at one blended rate a slow worker out-earns a fast one for identical output, so you
are paid more for being worse. This is a stronger case than the coherence argument already in
`docs/gtm/`, and it lands hardest here because **Harbormill sells the elimination of billable
hours**. Corroborates the 2026-07-15 retirement of hourly; changes nothing else.

**Unsettled — the real tension: the method sets price _per client, live_, as a percentage of
that client's first-year value (~10% floor, three options at ~10/25/50%). It implies no
published rate card at all.** This ladder publishes fixed prices on a public site. The likely
resolution is that **the published ladder is the _door_, not the price** — a lead-gen artifact,
while the actual number is set in the sales interview. That is a hypothesis, recorded as such.

The consequence is worth stating plainly: **arguments about the published entry-rung number are
arguments about the door**, not about what any client should pay. This sits alongside — and is
independent of — the entry-rung reprice under review on the unmerged PR #39 / PR #40 branches.
**Do not merge these threads.** See [[Value-Based Pricing]] for the method in full.

One caution that cuts against the small end: value pricing caps small clients by design — a
small shop's whole upside may be modest, and by definition it will not pay more than the work is
worth to it. The stated scale path for a soloist is **bigger clients for the same expertise**.
That corroborates the $3–10M-revenue targeting and cautions against moving downmarket.

## Flag: discovery is commoditizing — the audit can't sell the list (2026-07-15)

A second, sharper flag on the same rung, from
[[What Actually Matters in AI Right Now (2026)]]. **Observation only — no repricing recommended
from this source.**

Matt Wolfe's closing advice, given free to an audience of AI agency owners, is to dictate a full
account of your business to a frontier model and ask what it can take off your plate — and he
reports it doing exactly that for him, triaging his work into stop / hand off / automate.
**That is the discovery half of the Paid Audit, self-serve, at zero marginal cost.**

The implication for Rung 2 is narrow but real: if an owner can obtain *the list of their
repeating work* for free, the audit's value cannot be the list. What does not commoditize, on
the same evidence:

- **Implementation** — Wolfe is a 17-year technologist with coding agents open all day; the SMB
  owner is not, and by his own estimate the overwhelming majority of people build nothing with
  these tools even when they can.
- **Accountability** — he keeps a *human* accountant precisely for the answerable-party role.
  The [[ROI-Discovery Audit]]'s scored, sourced Opportunity Report is an accountable artifact; a
  chat transcript is not.
- **Condition #2** — his setup has no objective done-rule; a human reads every draft. Harbormill
  sells the closed loop, not the suggestion. See [[Four-Condition Loop Test]].

**Deliberately not concluded here.** This says nothing about *price* — it is evidence about
what the audit should be *sold as*. It is also n=1 and drawn from an agency-owner audience, not
SMB buyers. It sits alongside, and is independent of, the entry-rung reprice under review on the
unmerged PR #39 branch (where a roast returned RESHAPE and storm-research found the supporting
evidence absent). **Do not merge these two threads without customer evidence**;
`docs/gtm/case-studies/` is still empty. Cross-reference the contradiction flag on
[[SMB AI-Automation Landscape]].

## See Also

- [[ROI-Discovery Audit]]
- [[Four-Condition Loop Test]]
- [[Marketing Site]]
- [[Project Context]]
- [[SMB AI-Automation Landscape]]
- [[Harbormill AIOS]]
- [[What Actually Matters in AI Right Now (2026)]]
