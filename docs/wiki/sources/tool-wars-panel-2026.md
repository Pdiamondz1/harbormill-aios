---
title: Tool Wars Panel 2026
type: source
created: 2026-07-15
updated: 2026-07-15
sources: [external:tool-wars-panel-2026]
tags: [strategy, pricing, business-model, gtm, market, rag, external-validation]
---

# Tool Wars Panel 2026

A ~36-minute panel from the [[AIS Program]] Day 2 assets (Hyperagent programming, published
2026-07-13), on what AI-automation clients are actually buying. Moderated by Russ Henneberry
(theCLICK), with Devin Kearns (CustomAI Studio), Dave Ebbelaar (Datalumina), and Cole Medin
(oTTomator).

**Gated, paid cohort content in a public repo — this page is Harbormill's reading, not a
record of the session.** Conclusions and the minimum facts needed to reason about them, in
our words. No transcript, no quotes, no blow-by-blow. The raw transcript stays local-only in
`docs/wiki/raw/external/` (gitignored, and excluded from `sync-wiki`).

Method note: audio captured off playback and transcribed with `scripts/transcribe-media.mjs`.
Whisper does not diarize, so **speaker attribution is inferred from context** — high
confidence, not certainty. We read a transcript; we did not watch the session.

## Why it mattered to us

Three people running AI-automation businesses independently described the shape of
[[The Harbormill Ladder]] and the [[Education-First Philosophy]] — then priced the entry rung
far above ours, which triggered a full pricing review. **That review concluded the panel was
wrong as evidence and we were mostly right already.** The audit trail is in
`docs/vetting/2026-07-15-harbormill-entry-rung-reprice/`.

## Key claims (our summary)

- **Training demand has overtaken build demand for two of the three.** Medin reports roughly
  80% of his work is now training rather than building — a reversal he says is new. Kearns
  reports a sharp rise in training interest and now sells a leadership workshop as a standard
  offer. Both run build shops and would rather be building, which is what makes the signal
  worth something. Corroborates [[Education-First Philosophy]].
- **Training is deliberately a front door, not a destination.** The moderator names the
  mechanism outright: training opens the account and the retainer follows. Kearns's stated
  sequence — workshop, then blueprint, then project, then retainer — is [[The Harbormill Ladder]]
  under different labels. The binding requirement is fast, visible value.
- **Stated entry prices, far above ours:** Medin ~$20k for a half-day workshop; Kearns ~$5k;
  Ebbelaar opens with a $10–20k fixed-price prototype delivered in 2–4 weeks, then moves to
  sprints or a retainer. **See the verification note below before using any of these.**
- **De-risking decides deals at signature.** Kearns lost a deal by pitching whole-business AI
  transformation; at scale, buyers are asking how they would defend the decision to a board if
  it failed. He lost to a vendor offering plain enablement on tools the client had already
  bought. Direct support for a low-risk climbing ladder.
- **The easy use cases are already commoditized** into features of tools clients own, or into
  off-the-shelf products needing no custom build. What still pays is deep, business-specific
  workflow work — the kind you could not know existed without working inside the company. A
  caution for generic-by-design positioning; see [[Harbormill AIOS]].
- **Four recurring build categories** (Ebbelaar): chat assistants over a private knowledge
  base; document processing; content generation; and augmented workflows that move and enrich
  data between systems.
- **Standardization is enforced by refusing work.** Ebbelaar's shop declines engagements that
  cannot be built on its standard stack — standardization is the scaling mechanism, not a
  preference. Compare [[Per-Client Deployment]]'s "never fork the engine."
- **RAG is being deprioritized for single-client knowledge bases.** All three converge: below
  roughly 10,000 documents, agentic navigation over plain markdown beats semantic search.
  Kearns has largely dropped RAG on reliability grounds — client-facing systems must work every
  time. Ebbelaar frames retrieval as one tool inside context engineering, chosen by latency and
  corpus size. Bears on [[Knowledge & RAG]] and [[Wiki-to-Aria Sync]] — our wiki is ~47 pages.
- **The harness now matters more than the model.** Capability has plateaued; the differentiator
  is context management and tooling, not model choice. Cost-efficiency has become a live
  concern where it recently wasn't.

## The principle worth keeping

Ebbelaar's shop optimizes for delivering projects with **as little AI as possible** —
deterministic code does the checkable work, and the model only reviews on top. This is
condition #2 of the [[Four-Condition Loop Test]] ("a rule decides done"), argued from
production experience rather than theory. The moderator flagged it as the takeaway of the
session, and we agree.

## ⚠ Verification note — do not cite the prices above

The pricing comparison did not survive primary-source verification and **must not be used as
market evidence**. Full audit: `docs/vetting/2026-07-15-harbormill-entry-rung-reprice/`.

- **These are audience rents, not market rates.** Medin has ~204k YouTube subscribers;
  Ebbelaar ~257k. Their prices embed trust their audiences already granted — unavailable to an
  unknown operator by definition.
- **None of the three prices could be independently verified.** n=3, self-reported, from a
  stage, where stating a high price is itself marketing.
- **The primary data points the other way.** More than half of firms expect to spend
  ≤$200/employee/year on AI (Atlanta Fed 2026); Ramp's median across 70k+ businesses is
  $11.38/employee/month. A ~40-person firm's *entire* annual AI budget is roughly $1k–$8k, so
  a $10–20k build is multiples of the whole pocket rather than a line item in it. Census adds
  that AI use did not change significantly among firms under 20 employees while larger firms
  pulled ahead — adoption is diverging *away* from this segment.
- **What survives is the direction, not the level.** Training demand rising is credible; there
  is less incentive to misreport mix than price. The dollar figures are not.

**What we did about it:** retired hourly (because hours are the wrong *unit*, not because $100
was a low number), kept the Loop Audit at $500–$2,500 as a *screen*, kept the sub-$10k build
ceiling deliberately, and adopted the rule to sell against the labour line rather than a
client's AI budget. Recorded in [[The Harbormill Ladder]] § Key Decisions.

## See Also

- [[The Harbormill Ladder]]
- [[Education-First Philosophy]]
- [[Four-Condition Loop Test]]
- [[Knowledge & RAG]]
- [[SMB AI-Automation Landscape]]
- [[Harbormill AIOS]]
- [[Project Context]]
