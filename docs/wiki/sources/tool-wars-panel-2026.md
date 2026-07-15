---
title: Tool Wars Panel 2026
type: source
created: 2026-07-15
updated: 2026-07-15
sources: [external:tool-wars-panel-2026]
tags: [strategy, pricing, business-model, gtm, market, rag, external-validation]
---

# Tool Wars Panel 2026

*"The Tool War Panel: What Actually Makes Money in 2026"* — a 36-minute panel presented by
Hyperagent (GA Access, Day 2), published 2026-07-13. Moderated by **Russ Henneberry**
(theCLICK), with **Devin Kearns** (CustomAI Studio), **Dave Ebbelaar** (Datalumina), and
**Cole Medin** (oTTomator).

Three practitioners running AI-automation businesses describe what clients are actually
buying and what they charge. Directly relevant to [[The Harbormill Ladder]] and
[[Education-First Philosophy]]: they independently describe Harbormill's engagement model
and price the entry rung 25–200x higher.

Transcribed via `scripts/transcribe-media.mjs`; raw transcript in `docs/wiki/raw/external/`
(local-only). **Caveats:** Whisper does not diarize — attribution below is inferred from
context and is high-confidence but not certain. Proper nouns were mangled in places
(Vercel, Anthropic, shadcn, Qdrant, PydanticAI).

## Key Claims

- **Training demand has overtaken build demand.** Medin: fewer people ask him to build;
  *"it's probably like 80% training that I'm doing"* — a shift he says he never saw before.
  Kearns reports interest in trainings *"just skyrocket"* over recent months. Both run build
  shops; neither positioned themselves as trainers. Corroborates [[Education-First Philosophy]].
- **Training is deliberately a front door, not a product line.** Henneberry names it directly
  — training gets you in the door and ends on retainer. Kearns: *"they need quick time to
  value."* His sequence is **workshop → blueprint → project → retainer**, which is
  [[The Harbormill Ladder]] under different names.
- **Pricing benchmarks** (the panel's headline value for Harbormill):
  - Medin: **~$20,000** for a base four-hour workshop; priced on customization, not headcount
    (teams of 7 to 160).
  - Kearns: **~$5,000** for a workshop — *"a lot lower than Cole's"* — then blueprint → project
    → retainer.
  - Ebbelaar: **$10,000–$20,000** fixed-price prototype delivered in 2–4 weeks as the standard
    opener, then sprint- or retainer-based.
- **De-risking beats vision at the point of signature.** Kearns lost a deal pitching full AI
  transformation: at scale, buyers ask *"how do I make the right decision that I can argue to
  my board if it goes wrong?"* He lost to a vendor offering to train staff on Claude and write
  skills. Strong external support for the ladder's low-risk climb.
- **The easy use cases are commoditized.** Ebbelaar: simple AI use cases are now covered by
  features in tools clients already own, or by off-the-shelf products needing no custom build.
  What still pays is deep, niche workflow work you *"would never know"* existed without working
  inside the business. A caution for generic-by-design product positioning — see
  [[Harbormill AIOS]].
- **Four recurring build categories** (Ebbelaar): chat assistants over a private knowledge base;
  document processing; content generation; and *augmented workflows* (system-to-system, enrich,
  hand off).
- **Standardization is enforced by refusing work.** Ebbelaar: a Python/FastAPI/Celery backend is
  non-negotiable, and they decline work that can't be automated that way — standardization is
  the scaling mechanism. Compare [[Per-Client Deployment]]'s "never fork the engine."
- **RAG is being deprioritized for single-client knowledge bases.** All three converge: Medin
  puts the crossover at roughly **10,000 documents** before classic semantic search earns its
  keep; below that, agentic navigation over markdown wins. Kearns has largely dropped RAG on
  reliability grounds (*"it just has to work 100% of the time"*), preferring document-tree
  search. Ebbelaar frames RAG as one tool within context engineering — choose by latency and
  corpus size. Bears on [[Knowledge & RAG]] and [[Wiki-to-Aria Sync]].
- **Model choice matters less than the harness.** Medin notes LLM capability has plateaued;
  *"the harness is what matters a lot more than the model."* Kearns now favours Sonnet 5 over
  Opus on cost-efficiency grounds, reporting the industry has turned the corner from
  "cost doesn't matter" to token efficiency. Both criticize Fable 5 as expensive and slow for
  marginal gain, strong only at design.

## Notable Principles

- **"How can we deliver our projects with as little AI as possible?"** — Ebbelaar, on why
  deterministic code (regex, XML parsing) does the checkable work and the LLM only reviews on
  top. Henneberry called it *"a writer-downer."* This is condition #2 of the
  [[Four-Condition Loop Test]] — an objective rule decides "done" — argued from production
  experience.
- **Quick, tangible value beats a transformation blueprint.** Kearns on why Ebbelaar's 2–4 week
  POC works: clients must see it running in their own business, and it triggers demand — ship
  one agent and they come back with thirteen more.

## ⚠ Verification note (2026-07-15) — read before citing any price below

The pricing comparison in this section **did not survive primary-source verification** and
must not be used as market evidence. See
`docs/vetting/2026-07-15-harbormill-entry-rung-reprice/` for the full audit.

- **These are audience rents, not market rates.** Medin has ~204k YouTube subscribers;
  Ebbelaar ~257k. Their prices include trust their audiences already granted them —
  unavailable to an unknown operator by definition.
- **None of the three prices could be independently verified.** n=3, self-reported, from a
  stage, where stating a high price is itself marketing.
- **The primary data points the opposite way.** More than half of firms expect to spend
  ≤$200/employee/year on AI (Atlanta Fed 2026); Ramp's median across 70k+ businesses is
  $11.38/employee/month. A ~40-person firm's *entire* annual AI budget is ~$1k–$8k, so a
  $10–20k build is multiples of the whole pocket, not a line item in it.
- **What survives is the direction, not the level:** training demand rising is corroborated
  (there is less incentive to misreport mix than price). The dollar figures are not.

The resolution — hourly retired, audit kept at $500–$2,500 as a *screen*, sub-$10k build
ceiling kept deliberately — is recorded in [[The Harbormill Ladder]] § Key Decisions.

## Contradiction with current Harbormill pricing (as it appeared before verification)

Retained for the audit trail. **Superseded by the note above** — do not cite these as
benchmarks. The panel appears to price the entry rung far above [[The Harbormill Ladder]]:

| Tier | Panel | Harbormill |
|---|---|---|
| Entry / workshop | $5,000 (Kearns) – $20,000 (Medin) | **$100/hour** |
| Audit / blueprint | bundled into the workshop step | $500–$2,500 |
| First build | $10,000–$20,000 fixed (Ebbelaar) | $2,500–$10,000 |
| Retainer | the shared destination | $3,000–$10,000/mo — **in line** |

Harbormill's audit tier sits *below* Kearns's cheapest workshop, and the entry rung is sold as
hours rather than as a product. This is direct evidence for the pre-existing strategy flag on
[[The Harbormill Ladder]] (recorded 2026-06-24), which already proposed a fixed-price starter
package. **Caveat:** these prices are backed by large public audiences and published case
studies; price follows proof, and Harbormill's case-study scaffold is still empty.

## See Also

- [[The Harbormill Ladder]]
- [[Education-First Philosophy]]
- [[Four-Condition Loop Test]]
- [[Knowledge & RAG]]
- [[SMB AI-Automation Landscape]]
- [[Harbormill AIOS]]
- [[Project Context]]
