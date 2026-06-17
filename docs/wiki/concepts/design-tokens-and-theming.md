---
title: Design Tokens & Theming
type: concept
created: 2026-06-17
updated: 2026-06-17
sources: [src/index.css, tailwind.config.ts]
tags: [frontend, design-system, theming, white-label]
---

# Design Tokens & Theming

The concrete design system behind [[White-Label Architecture]]. All color lives in
CSS variables in `src/index.css` (`:root` light + `.dark`); Tailwind maps them in
`tailwind.config.ts`. Re-theming a client = editing these variables, never
components. **Dark-first** (`<html class="dark">`).

## Palette (dark, HSL)

- `--background: 222 28% 9%` (the navy `#0e1726`) · `--foreground: 210 20% 96%` · `--card: 222 24% 13%`
- `--primary: 205 90% 56%` (**azure**) · `--secondary: 38 92% 58%` (**amber**)
- `--success: 152 52% 50%` · `--warning: 38 92% 58%` · `--destructive: 0 62% 48%`
- `--border`/`--input: 222 16% 22%` · `--ring: 205 90% 56%` · `--radius: 0.75rem`

## Type & utilities

Font: **Inter** (`Inter var`, `Inter` in `tailwind.config.ts`) with OpenType
features `cv02 cv03 cv04 cv11 ss01`. Custom utilities: `.text-gradient`
(azure→amber 120°), `.glow` (azure box-shadow), `.glass` (`bg-card/70` +
backdrop-blur), `.tnum` (tabular figures for KPIs). Shadow tokens `--shadow-sm/md/lg`
+ `boxShadow.glow`.

## Reuse

The [[Marketing Site]] **copies** these exact tokens (rather than importing) so
harbormill.net and the deck share one visual language without coupling.

## See Also

- [[White-Label Architecture]]
- [[AIOS App Shell]]
- [[Marketing Site]]
- [[Harbormill AIOS]]
