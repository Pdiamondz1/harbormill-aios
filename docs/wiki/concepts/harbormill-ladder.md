---
title: The Harbormill Ladder
type: concept
created: 2026-06-17
updated: 2026-07-15
sources: [docs/PROJECT_CONTEXT.md, website/src/config/site.ts, external:land-and-expand-benchmarks, external:jonathan-stark-ditching-hourly]
tags: [strategy, pricing, business-model, gtm]
---

# The Harbormill Ladder

Harbormill Automation's engagement model **and** pricing, in one ladder. Low-risk
entry, climb only as ROI proves out. **Every rung is a fixed price — Harbormill
publishes no hourly rate** (see Key Decisions):

1. **AI Setup Session** — $250 fixed, one 90-minute working session (e.g. Claude setup).
2. **Paid audit** — $500–$2,500, fixed scope; map workflows, scope the first build.
   Fee fully credited toward the build. Now operationalized in-product by the
   [[ROI-Discovery Audit]] tool (Opportunity Report → ROI vs the retainer), which is
   also the engine for selling Rung 4.
3. **Focused project** — $5,000 fixed; ship one workflow, prove ROI. Audit fee
   credited; 50% deposit / 50% on delivery.
4. **Retainer** — $3,000–$10,000/mo; ongoing, after trust and results.

Every climb starts with a free 30-min intro. Surfaced on the marketing site
(`website/src/config/site.ts`) and in [[Project Context]].

## Key Decisions

- **No published hourly rate — the entry rung is a fixed-price product (2026-07-15).**
  The `$100/hr` "Get started" rung was replaced by the **AI Setup Session ($250 fixed,
  90 minutes)**. Rationale: Harbormill sells AI automation — *the elimination of
  billable hours*. Publishing an hourly rate prices us against our own product and pays
  us more for working slower, exactly the incoherence Jonathan Stark's "Ditching Hourly"
  names (AIS program, Day 2). The [[GTM Field Guide]] had **already** adopted value
  pricing in the sales room (make the problem cost more than the price *before* naming
  the price; price ÷ prize = payback in weeks) while the [[Marketing Site]] still
  anchored every prospect on $100/hr — the rate our own playbook used to *qualify people
  out*. This closes that gap. **$100/hr survives unpublished**, as an internal fallback
  for one-off asks and prospects too small for the project math to clear.
  Pricing note: $250/90min ≈ $167/hr effective — a raise, at a *lower* commitment
  number. $250 (not $500) keeps the ladder cleanly ascending and avoids colliding with
  the audit floor.
- **Focused project is $5,000 fixed, not a $2,500–$10,000 range (2026-07-15).**
  The range and the fixed price had both been live simultaneously — the range on the
  public site + [[Project Context]], the fixed price across all of `docs/gtm/`, each
  claiming source-of-truth. Resolved in favor of `docs/gtm/`: a range invites *"how many
  hours is that?"*, which is hourly thinking in disguise. Jurisdiction split to prevent
  recurrence: **[[Project Context]] §8 is canon for the ladder + prices; `docs/gtm/` is
  canon for call mechanics** (payment terms, scripts, objections, tiers).
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

## Resolved flag (2026-07-15)

This page previously carried a standing flag: the productization literature stresses
**clear fixed-scope deliverables** at each tier, yet Rungs 2–4 were scoped engagements
while **Rung 1 was hourly** — less "productized." It proposed *"a fixed-price starter
package (e.g. a named 'AI setup session')"* as a future option.

**Acted on 2026-07-15** — that is now the AI Setup Session ($250 fixed). The flag was
right on its own merits nearly a month before Stark's "Ditching Hourly" session supplied
the sharper argument for it (see Key Decisions). Worth noting for future flags: the
observation was recorded and then sat, and the fix only shipped when an external trigger
made it urgent.

## See Also

- [[ROI-Discovery Audit]]
- [[Four-Condition Loop Test]]
- [[Marketing Site]]
- [[Project Context]]
- [[SMB AI-Automation Landscape]]
- [[Harbormill AIOS]]
