---
title: The Harbormill Ladder
type: concept
created: 2026-06-17
updated: 2026-07-15
sources: [docs/PROJECT_CONTEXT.md, website/src/config/site.ts, external:land-and-expand-benchmarks, external:tool-wars-panel-2026]
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

**Corroborated with prices (2026-07-15).** The [[Tool Wars Panel 2026]] turned this flag
from a literature-derived hunch into an evidenced gap. Three practitioners each sell the
entry rung as a **fixed-price product**, none hourly, and all price it far above Rung 1:

| Tier | Panel | Ladder |
|---|---|---|
| Entry / workshop | $5,000 (Kearns) – $20,000 (Medin, 4 hrs) | **$100/hr** |
| Audit / blueprint | folded into the workshop step | $500–$2,500 |
| First build | $10,000–$20,000 fixed, 2–4 wks (Ebbelaar) | $2,500–$10,000 |
| Retainer | the shared destination | $3,000–$10,000/mo — **in line** |

Two structural problems the prices expose, beyond the numbers themselves:

1. **Rung 2 is cheaper than the panel's entry rung.** The audit produces the blueprint that
   sells the project, yet it's priced below Kearns's cheapest workshop. The ordering is
   inverted.
2. **Hourly anchors everything above it.** A $100/hr front door invites the buyer to read a
   $10,000 project as "100 hours of Damon" and audit the timesheet. A fixed-price workshop
   reframes the same project as a multiple of a known-good outcome. This bears directly on
   the Outcome Edition's $10k + $2.5k/mo target.

**Counterweight — price follows proof.** Medin's $20k is backed by a large public audience
generating inbound; Kearns co-founded a studio with 50+ deployments. Harbormill's
`docs/gtm/case-studies/` still holds only a template. The panel sets the *ceiling* these
prices can reach, not the price Harbormill can charge on Monday. Kearns's ~$5k is the nearer
comparable, and Harbormill's own de-risking credential — 15 yrs enterprise IT/security at
Nike, Assurant, IAA, LEGACY ([[Damon Williams]]) — speaks directly to the board-defensibility
that Kearns says decides deals at signature.

Founder confirmed 2026-07-15 that **$100/hr was a default, not a deliberate loss-leader.**
Still recorded as a flag rather than a decision — the number is the founder's to set.

## See Also

- [[ROI-Discovery Audit]]
- [[Four-Condition Loop Test]]
- [[Marketing Site]]
- [[Project Context]]
- [[SMB AI-Automation Landscape]]
- [[Harbormill AIOS]]
- [[Tool Wars Panel 2026]]
- [[Education-First Philosophy]]
