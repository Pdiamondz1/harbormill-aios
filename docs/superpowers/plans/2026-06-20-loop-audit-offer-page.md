# Loop Audit Offer Section (Phase 2b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a config-driven "Loop Audit" offer section to the Harbormill marketing site (`website/`), placed after the Ladder, leading with the four-condition method and a Calendly CTA.

**Architecture:** Follow the site's established pattern exactly — copy lives in `src/config/site.ts`, a presentational `LoopAudit` section consumes it via the shared `Section`/`SectionHeading`/`Reveal`/`Icon`/`CalendlyButton` primitives, and `App.tsx` renders it in the single-page flow. The card icons are registered in `Icon.tsx`'s fixed icon map. No new dependencies, no routing, no new UI primitives.

**Tech Stack:** React 18 + Vite + TypeScript (strict) · Tailwind · lucide-react · framer-motion (via the existing `Reveal`). All work is inside `website/`.

## Global Constraints

- **All commands run from `website/`** (the marketing app is a separate Vite project from the product app at the repo root).
- **No test runner exists** in `website/` (scripts: `dev`, `build`, `lint`, `typecheck`, `preview`). The gate is `npm run typecheck` + `npm run lint` (+ `npm run build` and a manual `npm run dev` check for the UI task). This plan therefore uses no `*.test.*` files — that is correct for this project, not an omission.
- **No hardcoded hex or brand strings in components** — colors via semantic tokens (`bg-card`, `text-muted-foreground`, `border-primary/30`, `text-primary`, …); all copy via `site.ts`.
- **Price shown is `$500–$2,500`**, matching the figure the `Ladder` section already displays publicly for Rung 2 — no new pricing claim.
- **Reuse shared primitives** (`Section`, `SectionHeading`, `Reveal`, `Icon`, `CalendlyButton`); do not introduce new structure or components beyond `LoopAudit.tsx`.
- **Commit message trailers:** every commit message in this plan ends with exactly these two lines:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01WeaJRix28TKCtCi29NsE8W
  ```
- Branch is already `feat/loop-audit-offer-page` (off `main`). Do not switch branches.

---

### Task 1: Register card icons + add the `loopAudit` config block

**Files:**
- Modify: `website/src/components/Icon.tsx` (add 4 imports + 4 map entries)
- Modify: `website/src/config/site.ts` (add `nav` entry, `site.loopAudit` block, exported type)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces, for Task 2:
  - `Icon` resolves names `"Repeat"`, `"CheckCircle2"`, `"ShieldCheck"`, `"Plug"` to real lucide icons (no longer the `Workflow` fallback).
  - `site.loopAudit` with this exact shape:
    ```ts
    {
      eyebrow: string;
      title: string;
      subtitle: string;
      conditions: ReadonlyArray<{ icon: string; title: string; body: string }>;
      receive: { title: string; points: readonly string[] };
      priceNote: string;
      closer: string;
      cta: string;
    }
    ```
  - `export type LoopAuditCondition = (typeof site.loopAudit.conditions)[number];`
  - `site.nav` contains `{ label: "Loop Audit", href: "#loop-audit" }` as the 3rd entry.

- [ ] **Step 1: Add the four icons to `Icon.tsx`**

In `website/src/components/Icon.tsx`, add the four names to **both** the import list and the `ICONS` map. The full file becomes:

```tsx
import {
  FileBarChart,
  Receipt,
  UserPlus,
  Inbox,
  GraduationCap,
  LayoutDashboard,
  Workflow,
  FileText,
  ListChecks,
  Bell,
  Sparkles,
  Puzzle,
  Repeat,
  CheckCircle2,
  ShieldCheck,
  Plug,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  FileBarChart,
  Receipt,
  UserPlus,
  Inbox,
  GraduationCap,
  LayoutDashboard,
  Workflow,
  FileText,
  ListChecks,
  Bell,
  Sparkles,
  Puzzle,
  Repeat,
  CheckCircle2,
  ShieldCheck,
  Plug,
};

/** Renders a lucide icon by name (used for config-driven service/problem cards). */
export function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = ICONS[name] ?? Workflow;
  return <Cmp className={className} />;
}
```

- [ ] **Step 2: Add the "Loop Audit" nav entry in `site.ts`**

In `website/src/config/site.ts`, the `nav` array currently reads:

```ts
  nav: [
    { label: "Services", href: "#services" },
    { label: "AIOS", href: "#aios" },
    { label: "Ladder", href: "#ladder" },
    { label: "About", href: "#about" },
    { label: "FAQ", href: "#faq" },
  ],
```

Insert the Loop Audit link between the `AIOS` and `Ladder` entries so it becomes the 3rd link:

```ts
  nav: [
    { label: "Services", href: "#services" },
    { label: "AIOS", href: "#aios" },
    { label: "Loop Audit", href: "#loop-audit" },
    { label: "Ladder", href: "#ladder" },
    { label: "About", href: "#about" },
    { label: "FAQ", href: "#faq" },
  ],
```

- [ ] **Step 3: Add the `loopAudit` copy block in `site.ts`**

Add this block to the `site` object **immediately after the `ladder: { … },` block and before `about: {`** (keeping related sales copy adjacent and in render order). Paste verbatim:

```ts
  loopAudit: {
    eyebrow: "The signature audit",
    title: "Find the one automation worth building first",
    subtitle:
      "Before we build anything, we map your repeating work and score each task on four conditions — then hand you a ranked plan with the single highest-ROI automation to build first.",
    conditions: [
      {
        icon: "Repeat",
        title: "It repeats",
        body: "It happens on a predictable cadence — the time it eats, week after week, is the prize.",
      },
      {
        icon: "CheckCircle2",
        title: "A rule decides \"done\"",
        body: "Success is checkable by a clear rule, not a matter of human taste.",
      },
      {
        icon: "ShieldCheck",
        title: "A wrong run is cheap",
        body: "A mistake is low-stakes and reversible — safe to let software try.",
      },
      {
        icon: "Plug",
        title: "AI has the data + tools",
        body: "The inputs are reachable and the actions already exist as tools we can wire in.",
      },
    ],
    receive: {
      title: "What you walk away with",
      points: [
        "Every repeating task scored by ROI — value per unit of effort.",
        "One clear \"build this first\" recommendation, with the reasoning.",
        "A plan you keep — whether you build it with us or not.",
      ],
    },
    priceNote: "Rung 2 · $500–$2,500 · fixed scope",
    closer: "You leave understanding the method — not dependent on us.",
    cta: "Book a Loop Audit",
  },
```

- [ ] **Step 4: Export the `LoopAuditCondition` type in `site.ts`**

At the bottom of the file, the exported types currently read:

```ts
export type ServiceItem = (typeof site.services.items)[number];
export type LadderRungItem = (typeof site.ladder.rungs)[number];
export type ProblemItem = (typeof site.problem.items)[number];
export type AiosFeature = (typeof site.aios.features)[number];
```

Add one line after them:

```ts
export type LoopAuditCondition = (typeof site.loopAudit.conditions)[number];
```

- [ ] **Step 5: Verify typecheck passes**

Run (from `website/`): `npm run typecheck`
Expected: exits 0, no errors. (Confirms the new config shape and exported type resolve and `Icon.tsx` still compiles.)

- [ ] **Step 6: Verify lint passes**

Run (from `website/`): `npm run lint`
Expected: exits 0, no new errors/warnings in `Icon.tsx` or `site.ts`.

- [ ] **Step 7: Commit**

```bash
git add website/src/components/Icon.tsx website/src/config/site.ts
git commit -F - <<'EOF'
feat(website): Loop Audit config + card icons

Add the site.loopAudit copy block (four-condition method, deliverable,
Rung 2 price, CTA), a "Loop Audit" nav entry, the LoopAuditCondition
type, and register Repeat/CheckCircle2/ShieldCheck/Plug in Icon.tsx.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01WeaJRix28TKCtCi29NsE8W
EOF
```

---

### Task 2: Build the `LoopAudit` section + wire it into the page

**Files:**
- Create: `website/src/sections/LoopAudit.tsx`
- Modify: `website/src/App.tsx` (import + render after `<Ladder />`)
- Modify: `docs/wiki/log.md` (one log entry)

**Interfaces:**
- Consumes (from Task 1): `site.loopAudit` (shape above) and the four registered icon names; the shared primitives `Section`/`SectionHeading` (`@/components/Section`), `Reveal` (`@/components/Reveal`), `Icon` (`@/components/Icon`), `CalendlyButton` (`@/components/CalendlyButton`). `CalendlyButton` accepts `size`, `className`, `onClick`, and `children` (children override its default label) — confirmed by `Ladder.tsx` and `SiteNav.tsx` usage.
- Produces: `<LoopAudit />` rendered between `<Ladder />` and `<About />`.

- [ ] **Step 1: Create `website/src/sections/LoopAudit.tsx`**

Paste verbatim:

```tsx
import { Check } from "lucide-react";
import { site } from "@/config/site";
import { Section, SectionHeading } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { Icon } from "@/components/Icon";
import { CalendlyButton } from "@/components/CalendlyButton";

export function LoopAudit() {
  const { loopAudit } = site;
  return (
    <Section id="loop-audit">
      <SectionHeading
        eyebrow={loopAudit.eyebrow}
        title={loopAudit.title}
        subtitle={loopAudit.subtitle}
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loopAudit.conditions.map((c, i) => (
          <Reveal key={c.title} delay={(i % 4) * 0.05}>
            <div className="flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-card-sm transition-colors hover:border-primary/30">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-foreground">
                <Icon name={c.icon} className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="mx-auto mt-10 max-w-3xl">
        <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-6 sm:p-8">
          <h3 className="text-lg font-semibold">{loopAudit.receive.title}</h3>
          <ul className="mt-4 space-y-3">
            {loopAudit.receive.points.map((point) => (
              <li
                key={point}
                className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal className="mx-auto mt-10 max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
          {loopAudit.priceNote}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{loopAudit.closer}</p>
        <div className="mt-6">
          <CalendlyButton size="lg">{loopAudit.cta}</CalendlyButton>
        </div>
      </Reveal>
    </Section>
  );
}
```

- [ ] **Step 2: Render `<LoopAudit />` in `App.tsx`**

In `website/src/App.tsx`, add the import alongside the other section imports (after the `Ladder` import):

```tsx
import { Ladder } from "@/sections/Ladder";
import { LoopAudit } from "@/sections/LoopAudit";
```

And render it between `<Ladder />` and `<About />`:

```tsx
        <Ladder />
        <LoopAudit />
        <About />
```

- [ ] **Step 3: Verify typecheck passes**

Run (from `website/`): `npm run typecheck`
Expected: exits 0, no errors.

- [ ] **Step 4: Verify lint passes**

Run (from `website/`): `npm run lint`
Expected: exits 0, no new errors/warnings.

- [ ] **Step 5: Verify the build succeeds**

Run (from `website/`): `npm run build`
Expected: `vite build` completes successfully, no errors.

- [ ] **Step 6: Manual visual check**

Run (from `website/`): `npm run dev`, open the served URL. Confirm:
- The "Loop Audit" section renders **after** the Ladder and before About.
- The four condition cards show their **distinct** icons (Repeat / CheckCircle2 / ShieldCheck / Plug — not four identical `Workflow` icons), laid out 4-up on desktop and 2×2 on mobile width.
- The "What you walk away with" card shows three checked bullets; the price pill reads `Rung 2 · $500–$2,500 · fixed scope`; the "Book a Loop Audit" button opens the Calendly scheduler.
- Clicking the "Loop Audit" nav link scrolls to the section with the fixed-nav offset (no overlap).

- [ ] **Step 7: Add a wiki log entry**

In `docs/wiki/log.md`, insert this new entry **directly below the `# Wiki Log` heading (line 1), above the existing `## [2026-06-20] ingest — Loop Audit deliverable (Phase 2)` entry** — newest-first, matching the file's format:

```markdown
## [2026-06-20] ship | Loop Audit offer section (Phase 2b)

Gave surface 2 of the [[Four-Condition Loop Test]] a marketing presence: a
**Loop Audit** offer section on the Harbormill site (`website/`), placed after
the Ladder. Leads with the four-condition method (Repeats / a rule decides
"done" / a wrong run is cheap / AI has the data + tools), states what the
prospect receives (a ranked plan with one "build this first" pick), and ties
it to Rung 2 ($500–$2,500) with a Calendly CTA. Config-driven via
`site.loopAudit`; no new deps or routing.
```

- [ ] **Step 8: Commit**

```bash
git add website/src/sections/LoopAudit.tsx website/src/App.tsx docs/wiki/log.md
git commit -F - <<'EOF'
feat(website): Loop Audit offer section

Add the LoopAudit section (four-condition method grid, "what you receive"
deliverable, Rung 2 price + Book-a-Loop-Audit CTA), render it after the
Ladder in App.tsx, and log the new marketing surface in the wiki.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01WeaJRix28TKCtCi29NsE8W
EOF
```

---

## Verification (whole plan)

From `website/`: `npm run typecheck`, `npm run lint`, `npm run build` all pass; the manual dev check in Task 2 Step 6 confirms the section renders correctly and is responsive. The product app (`src/`) and its `npm run test` suite are untouched. No new dependencies were added (`package.json` unchanged).
