---
title: The Client Didn't Ask for AI (2026)
type: source
created: 2026-07-15
updated: 2026-07-15
sources: [external:client-didnt-ask-for-ai]
tags: [strategy, gtm, positioning, pricing, loops, external-validation, competitive, revenue]
---

# The Client Didn't Ask for AI (2026)

A 34-minute solo session presented by Hyperagent (AIS LIVE, GA Access, Day 2), published
2026-07-13: **Amy Simpson** — partner and creative director at a marketing studio she has run
with her husband for 21 years (strategy, branding, design, websites, content), who added AI
consulting to that practice rather than leaving it. Sibling session to
[[What Actually Matters in AI Right Now (2026)]] — same cohort, same day.

The stated audience is **service-business and agency owners** deciding whether to start an AI
business — Harbormill's peer group, **not its buyers**. Read it as practitioner signal, not
customer signal.

> **Restricted source — summarized, not reproduced.** Distributed by AIS behind gated,
> download-disabled, expiring shares. This page records **Harbormill's conclusions** and the
> facts needed to reason about them, **in Harbormill's own words, with no verbatim quotes and no
> blow-by-blow account**. The raw transcript is local-only in `docs/wiki/raw/external/` —
> gitignored, excluded from Aria's RAG, never to be committed: this repo is public. Do not
> re-add quotes here or repackage the session as Harbormill content. See [[Media Ingest]].

> **Coverage gap.** The transcript covers **1:49 → 34:48 only**; the first 1 minute 49 seconds
> were not captured (playback was already underway when recording started). The missing span
> appears to be the host's introduction — her thesis and origin story are both intact — but
> nothing on this page rests on the opening. **Speaker attribution is inferred from context**;
> Whisper does not diarize, and this is a solo talk with a brief Q&A.

## What it establishes (in our words)

- **Her organizing lens is four kinds of upgrade to an existing service: speed, margin,
  capability, scale.** Speed is delivering the same thing faster; margin is delivering it at
  lower cost *without lowering the price*; capability is offering what you previously refused or
  subcontracted; scale is serving more people without proportional labour. The lens is aimed at
  the *seller's own service book* and is deliberately tool-agnostic — the question is which
  upgrade you want, not which model to use.

- **Her highest-value engagement is one Harbormill's own gate would never surface.** She built a
  visual quote configurator for a yacht maker selling ~$600k boats with no showroom, where
  buyers had to choose finishes without seeing them. She frames the commission as the client
  asking for a better buying experience, not for AI. Priced at $3,000, grown to roughly $10,000
  through addendums, and now treated as a reusable framework for other custom-build verticals.
  **This is the load-bearing fact on this page** — see the scope flag on
  [[Four-Condition Loop Test]].

- **She rejected becoming an AI company on purpose.** Already running a business with competing
  demands on her attention, she judged a net-new AI venture too expensive in focus, and instead
  applied AI to services she already understood and already sold. Her closing advice is to pick
  one existing service and ask the four upgrade questions of it.

- **Capability came from refusing to outsource, not from hiring.** A long-tenured staff
  developer quit; contract replacements were slow. A self-described designer with no coding
  background, she used frontier models to close the gap herself — first iteration of the
  configurator inside an hour, shipped the next day, with the backend automation assembled by
  handing the work to a coding agent. Her elapsed time from starting with AI to shipping paid
  client builds was roughly one quarter.

- **She kept the rights to a client-funded build.** A training tool built for one client was
  licensed such that she retained the right to adapt it into other verticals — which she names
  as the significant business-model change, framing it as moving from delivering projects to
  owning assets.

- **Her pricing position is that efficiency is not a discount.** Because the work now takes a
  fraction of the hours, she argues the hourly frame actively misprices it, and that the outcome
  is what's sold. **Corroboration only — no repricing follows from this page.** See below.

## Implications for Harbormill

1. **The real finding is a scope boundary in the gate, not a missing category.**
   [[Four-Condition Loop Test]] Stage 2 *already* scores `revenue_captured` alongside
   `hours_saved` and `cost_avoided` — so it is wrong to say Harbormill has no revenue axis. The
   boundary is upstream, in Stage 1: the gate admits only work that **already repeats** and has
   an **objective done-rule**. Revenue from automating existing repeating work passes cleanly
   (AR follow-up repeats; "invoice paid" is a done-rule). Revenue from **new capability** — work
   the business does not do at all yet — cannot reach the ranking, because there is no
   recurrence to detect and no done-rule to write. Her configurator would be classed
   `not-a-loop` on #1 and `blocked` on #2, and the Loop Audit could not have proposed it.
   **This is the test behaving as specified** — it is a test for which repeating work to loop.
   The flag is that it is Harbormill's *only* discovery instrument, so the front door is
   structurally blind to the category that paid her best. Recorded as a flag, **not** a
   recommendation to widen the gate: loosening #1 or #2 would break the thing that makes a loop
   a loop.

2. **Her pricing advice is not the missing evidence, and must not be spent as if it were.** It
   points the same way as the 2026-07-15 reprice (retire the hourly anchor, price to value) —
   but it is the **same class of evidence already judged insufficient**: one practitioner,
   speaking to practitioners, about her own book. PR #39's roast returned RESHAPE and
   storm-research found the supporting evidence absent precisely because *customer* evidence was
   missing, and `docs/gtm/case-studies/` is still empty. That reprice resolved the way it did on
   exactly this basis — PR #39 retired hourly but raised no price, and PR #40 (which *did* raise
   prices) was closed. This page adds a second agency owner agreeing on direction; it does not
   add a buyer, so it changes nothing. Consistent with the standing decisions on
   [[The Harbormill Ladder]] — deliberately not edited here.

3. **Her headline thesis does not transfer — applying it literally would be a category error.**
   Her argument, in our words: *don't become an AI company; apply AI to the non-AI services you
   already sell.* That is advice to someone with 21 years of branding work to upgrade.
   **Harbormill has no non-AI book — Harbormill is the AI practice.** The transferable part is
   the *diagnostic* (which upgrade, for whom), not the conclusion.

4. **Her de-jargon lesson is already shipped, and this is worth knowing.** Her framing — that the
   client wanted a better buying experience and was indifferent to the technology behind it — is
   Harbormill's existing `docs/gtm/field-guide/say-this-not-that.md` discipline (*sell the hole,
   not the drill*, our phrase) plus the de-jargon pass already live on the [[Marketing Site]].
   Harbormill wrote this down before this session was watched. No action.

5. **Retained rights on client builds is a live lever Harbormill only pulls at the template
   layer.** [[White-Label Architecture]] is exactly her assets-over-projects move — build once,
   redeploy per client. But that is Harbormill's *own product*; the Focused Project rung ships
   bespoke client work with no recorded rights position. Whether a client-funded build can be
   generalized into a vertical asset is an open contract question, not a product one. Recorded
   as an observation; no change proposed.

6. **This is not customer evidence.** Same discount as [[What Actually Matters in AI Right Now
   (2026)]]: the room was owners selling services, not SMB owners buying them. It says nothing
   about what a Harbormill buyer will pay for.

## See Also

- [[Four-Condition Loop Test]]
- [[The Harbormill Ladder]]
- [[ROI-Discovery Audit]]
- [[What Actually Matters in AI Right Now (2026)]]
- [[White-Label Architecture]]
- [[Marketing Site]]
- [[Media Ingest]]
- [[Project Context]]
