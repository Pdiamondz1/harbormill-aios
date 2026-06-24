---
title: Marketing Site
type: entity
created: 2026-06-17
updated: 2026-06-24
sources: [website/, website/src/config/site.ts, website/src/sections/LoopAudit.tsx, website/src/sections/TrustStrip.tsx, website/vercel.json, website/scripts/lead-capture.gs]
tags: [marketing, website, vercel, gtm]
---

# Marketing Site

harbormill.net — the company site that sells [[Harbormill AIOS]] and Harbormill
Automation's services. Lives in **`website/`** as a **separate, self-contained
Vite + React + TS + Tailwind + shadcn app**, dark-only, that **copies** the
product's brand tokens (so it never entangles with the per-client clone flow —
[[Per-Client Deployment]]).

## What's on it

Single long-scroll page (`website/src/config/site.ts` is the content source of
truth): product-forward hero with a live-looking AIOS deck preview, a
Nike/Assurant/IAA credibility strip, the [[Education-First Philosophy]] strip, a
problem section, an **interactive AIOS demo tour** (Overview → Briefing → Ask
Aria, backend-free, seed data), six service cards, [[The Harbormill Ladder]], a
**Loop Audit offer section** (`#loop-audit`, after the Ladder — the public pitch
for the paid [[Four-Condition Loop Test]] deliverable: the four-condition method
as a 4-card grid, a "what you receive" deliverable card, and a "Book a Loop Audit"
Calendly CTA), About (founder), FAQ, a free-guide email opt-in, an inline
**Calendly** booking (free 30-min intro, Google Meet), and the footer.

The nav order is Services · AIOS · Loop Audit · Ladder · About · FAQ. Note the
public pricing copy never uses the internal word "Rung" (see [[The Harbormill
Ladder]]) — tiers are shown by name ("Paid audit") or a numeric badge, and the
Loop Audit price pill reads simply `$500–$2,500 · fixed scope`.

## Trust strip — "Automation you can leave running"

A single trust differentiator card (`website/src/sections/TrustStrip.tsx`,
content in `site.trust`, mounted between `<LoopAudit />` and `<About />` — no nav
entry of its own). It states the loop-trust thesis at **principle altitude**:
plain language, **no internal jargon** ("Loop Test", "condition #2",
"validator"). Eyebrow *"Why it's safe to automate"*, title *"Automation you can
leave running"*, body: black-box automation is unnerving because you can't tell
when it's quietly gone wrong, so Harbormill only builds automation where a clear
rule decides when the job is done and a wrong run is cheap to undo — *"the same
discipline we run on our own systems … We don't sell a black box we wouldn't run
ourselves."* That self-proof is honest because the loops exist: [[KPI-Watch
Loop]] and `wiki-gardener` (see [[Self-Improving App]]). It is the public,
principle-altitude face of the [[Four-Condition Loop Test]].

## Plumbing

- **Deploy:** Vercel, Root Directory `website`, `vercel.json` (SPA rewrite +
  hashed-asset caching). Live on `harbormill.net` + `www` (apex DNS-only at
  Cloudflare → Vercel).
- **Lead capture:** the free-guide form posts to a Google Apps Script web app
  (`website/scripts/lead-capture.gs`) that logs emails to a Sheet + emails the
  founder; `mailto` fallback when `VITE_FORM_ENDPOINT` is unset.

## See Also

- [[Calendly Booking Flow]]
- [[Damon Williams]]
- [[Harbormill AIOS]]
- [[The Harbormill Ladder]]
- [[Four-Condition Loop Test]]
- [[KPI-Watch Loop]]
- [[Education-First Philosophy]]
- [[Project Context]]
