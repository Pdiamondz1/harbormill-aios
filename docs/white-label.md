# White-labeling

Rebranding is two files plus two assets — **no component code changes**.

## 1. Words, names, logos → `src/config/brand.ts`

Everything client-facing lives here:

| Field | What it controls |
|-------|------------------|
| `productName` | App title, login, nav |
| `tagline` | Login + dashboard subtitle |
| `assistantName` | The assistant's name everywhere (replaces "Aria") |
| `assistantPersona` | One-liner shown in the assistant empty state + system prompt |
| `logoSrc` / `emblemSrc` | Paths to the logo + square mark in `/public` |
| `company.name` / `company.url` | The operator/agency footer |
| `tiers.admin` / `tiers.stakeholder` | Access-tier labels in your client's vocabulary |

The assistant's server-side name/persona/product are set independently as function
secrets (`ASSISTANT_NAME`, `ASSISTANT_PERSONA`, `PRODUCT_NAME`) so the edge function
doesn't depend on the frontend bundle — keep them in sync with `brand.ts`.

## 2. Colors → `src/index.css`

The palette is CSS variables in the `:root` (light) and `.dark` (dark, the default)
blocks. Change the HSL values; every component re-themes automatically. The key ones:

- `--primary` — the one confident accent (buttons, active nav, links).
- `--secondary` — highlights / "go" status.
- `--background`, `--card`, `--foreground`, `--muted`, `--border` — surfaces & text.
- `--success` / `--warning` / `--destructive` — metric & finding status colors.

Tailwind tokens (`bg-primary`, `text-muted-foreground`, …) resolve from these variables,
so you never touch `tailwind.config.ts`.

To ship **light-first** instead of dark, remove `class="dark"` from `<html>` in `index.html`.

## 3. Assets & metadata

- Replace `/public/logo.svg` (horizontal lockup) and `/public/emblem.svg` (square mark/favicon).
- Update `<title>`, `<meta name="description">`, and `theme-color` in `index.html`.

## 4. Verify

`npm run dev`, sign in, and confirm the product name, assistant name, colors, and logo
are all the client's — with zero edits outside the files above.
