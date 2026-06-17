---
title: Marketing Site
type: entity
created: 2026-06-17
updated: 2026-06-17
sources: [website/, website/src/config/site.ts, website/vercel.json, website/scripts/lead-capture.gs]
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
Aria, backend-free, seed data), six service cards, [[The Harbormill Ladder]],
About (founder), FAQ, a free-guide email opt-in, an inline **Calendly** booking
(free 30-min intro, Google Meet), and the footer.

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
- [[Education-First Philosophy]]
- [[Project Context]]
