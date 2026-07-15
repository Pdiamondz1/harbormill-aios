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

1. **Loop Audit** — $500–$2,500, fixed scope, **fee credited toward the build**; map
   workflows, scope the first build. **This is the front door.** Operationalized
   in-product by the [[ROI-Discovery Audit]] tool (Opportunity Report → ROI vs the
   retainer), which is also the engine for selling Rung 3.
2. **Focused project** — $2,500–$10,000; ship one workflow, prove ROI. The sub-$10k
   ceiling is deliberate — it keeps the decision inside one owner's signature.
3. **Retainer** — $3,000–$10,000/mo; ongoing, after trust and results.

*(Hourly consulting was Rung 1 until 2026-07-15 — retired, see Key Decisions.)*

Every climb starts with a free 30-min intro. Surfaced on the marketing site
(`website/src/config/site.ts`) and in [[Project Context]].

## Key Decisions

- **Hourly retired; the audit is the front door (2026-07-15).** Rung 1 ($100/hr) is
  gone. The founder confirmed it was an unconsidered default, not a loss-leader. It
  capped delivery at the calendar, crowded out the outbound hours that fill the
  pipeline, and — the real defect — let an engagement be sold with *no defined
  deliverable*, which a fixed price makes impossible. **Not replaced with a workshop
  tier:** the $500 audit already is the low-friction entry, and it sits under any
  plausible single-signature line. The website's own ladder subtitle already told a
  three-rung story (audit → project → retainer), so Rung 1 was vestigial.
- **The audit fee screens; it does not earn (2026-07-15).** Ashraf, Berry & Shapiro
  (2010, *AER*), a field RCT built to separate the mechanisms, finds paying produces
  "economically important screening effects… no consistent evidence of sunk-cost
  effects." So the fee needs only be non-zero enough to filter tyre-kickers — raising
  it toward $5k buys nothing the screen already provides and costs volume. Being paid
  also preserves the right to say "AI is the wrong answer here," which a free audit
  financially forbids. This overturns *both* earlier proposals: raising the audit and
  making it free.
- **No outcome guarantees (2026-07-15).** "If it isn't doing X by day 30, don't pay
  me" was proposed as a substitute for missing case studies, and is rejected on three
  independent grounds: a solo's refund forfeits 100% of sunk labour, so it fails as a
  separating signal (Moorthy & Srinivasan 1995); consulting is a *credence* good, so
  the model doesn't transfer; and it inverts adverse selection — the clients who
  self-select in have the worst-instrumented processes and are likeliest to dispute.
  In practice the argument is never "did it work," it is **"did you use it."**
- **Sell against the labour line, never the "AI budget" (2026-07-15).** More than half
  of firms expect ≤$200/employee/year on AI (Atlanta Fed 2026); Ramp's median across
  70k+ businesses is $11.38/employee/month. A ~40-person firm's *entire* annual AI
  budget is ~$1k–$8k, so any real build is multiples of the whole pocket. Priced
  against a $4,500/mo hire not made, the same number is cheap. See
  [[Tool Wars Panel 2026]] and `docs/vetting/2026-07-15-harbormill-entry-rung-reprice/`.
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

## Flag → RESOLVED 2026-07-15 (hourly retired)

The flag recorded 2026-06-24 — *"Rungs 2–4 are scoped engagements; Rung 1 is hourly, which
is less productized"* — is closed. Rung 1 is gone. But **the reasoning that closed it is not
the reasoning that opened it**, and the difference is worth keeping, because the obvious
argument was wrong.

**What triggered the review:** the [[Tool Wars Panel 2026]] appeared to show Harbormill
pricing its entry rung 25–200x below market (Medin ~$20k/4-hr workshop; Kearns ~$5k;
Ebbelaar $10–20k fixed prototype). The apparent conclusion — *raise everything* — did not
survive an adversarial roast or primary-source verification.

**What the evidence actually said** (full audit trail:
`docs/vetting/2026-07-15-harbormill-entry-rung-reprice/`):

- **The panel is audience rent, not market rate.** Medin has ~204k YouTube subscribers,
  Ebbelaar ~257k. Verification could not independently confirm the panel or a single one of
  its three prices. Three self-reported figures, from a stage, where stating a high price is
  itself marketing.
- **The "productize and raise your fees" evidence base is conflicted folklore.** Every
  headline stat traces to a vendor selling fee coaching *to consultants*, on the same pages,
  with no disclosed methodology and a convenience sample selected on the outcome variable.
  **Independent corroboration: none found.**
- **Price does not signal quality here.** Völckner & Hofmann (2007), 71 effects:
  r = .286 (~9% of variance), *significantly weaker for services*. The "hourly anchors the
  project price" argument is an extrapolation — anchors are demonstrated within one issue.
- **Raising the audit was wrong, and so was making it free.** The audit works by
  **screening** (Ashraf/Berry/Shapiro 2010, *AER*), so its fee should filter, not earn. It is
  already the right instrument at the right price.
- **The sub-$10k build ceiling is load-bearing**, not timid — single signature, 30–60 day cycle.
- **The AI budget is the wrong pocket entirely.** >half of firms expect ≤$200/employee/year
  (Atlanta Fed 2026); Ramp's median is $11.38/employee/month. A ~40-person firm's *whole*
  annual AI budget is ~$1k–$8k. Sell against the labour line instead.

**So hourly was retired for one reason that survived everything:** a fixed price forces a
defined deliverable and hourly permits none. Not because $100 was too low a number — because
hours were the wrong unit, and the low number was never the defect.

**The constraint was never price.** Ten independent attacks (5 roast personas + 5 research
lenses), including both bulls, converged on distribution. `docs/gtm/warm-50-tracker.md` still
held only seed rows ("Jane Doe") when this was written.

## See Also

- [[ROI-Discovery Audit]]
- [[Four-Condition Loop Test]]
- [[Marketing Site]]
- [[Project Context]]
- [[SMB AI-Automation Landscape]]
- [[Harbormill AIOS]]
- [[Tool Wars Panel 2026]]
- [[Education-First Philosophy]]
