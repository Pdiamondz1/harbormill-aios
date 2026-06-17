---
title: Calendly Booking Flow
type: concept
created: 2026-06-17
updated: 2026-06-17
sources: [website/src/lib/calendly.ts, website/src/sections/Booking.tsx, website/src/components/CalendlyButton.tsx, website/src/config/site.ts]
tags: [marketing, calendly, booking, gtm]
---

# Calendly Booking Flow

How the [[Marketing Site]] converts a visitor into a free 30-minute intro call —
the entry point to [[The Harbormill Ladder]].

## Mechanics

- **Loader:** `website/src/lib/calendly.ts` injects Calendly's `widget.js` +
  `widget.css` **once**, exposes `openCalendlyPopup(url)` and `themedCalendlyUrl()`
  (dark params `background_color=0e1726&text_color=f1f5f9&primary_color=2ea8f2` to
  match the deck). No npm wrapper.
- **Popup CTAs:** `CalendlyButton` (nav, hero, ladder, footer) calls
  `initPopupWidget`; a passed `onClick` still fires (e.g. close the mobile menu).
- **Inline embed:** `Booking.tsx` hydrates a `.calendly-inline-widget` with the
  themed URL.
- **Event:** `calendly.com/dwilliams-harbormill/30min` (via `VITE_CALENDLY_URL`),
  a free intro; conferencing is **Google Meet** (set on the Calendly event once a
  Google calendar is connected).

## Pairs with lead capture

Visitors not ready to book hit the free-guide email opt-in instead (Google Apps
Script → Sheet, see [[Marketing Site]]). Two conversion paths, one funnel.

## See Also

- [[Marketing Site]]
- [[The Harbormill Ladder]]
- [[Damon Williams]]
