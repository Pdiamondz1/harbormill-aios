# Trust Differentiator Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "trust" differentiator strip to harbormill.net — *"Automation you can leave running"* — between the Loop Audit section and About, stating Harbormill's automation is safe to run unattended (a rule decides "done"; a wrong run is cheap) and that Harbormill runs the same discipline on its own systems.

**Architecture:** Three tightly-coupled changes in the `website/` app, all following existing patterns: (1) add a `trust` copy object to `website/src/config/site.ts` (the content source of truth); (2) create `website/src/sections/TrustStrip.tsx`, a presentational sibling of `PhilosophyStrip.tsx`; (3) wire `<TrustStrip />` into `website/src/App.tsx` between `<LoopAudit />` and `<About />`. One cohesive task — the three changes only make sense together.

**Tech Stack:** Vite + React 18 + TypeScript + Tailwind, `lucide-react` icons, dark-only, brand tokens. The `website/` app is separate from the AIOS product and has its own `package.json` (`typecheck` / `lint` / `build` scripts).

**Spec:** `docs/superpowers/specs/2026-06-24-trust-differentiator-strip-design.md` (source of truth — read it first).

**Worktree:** Execute in `C:\GIT\harbormill-aios\.claude\worktrees\hma-prod4`. The website app is the `website/` subdirectory; run its npm scripts from there.

**Testing approach:** This is copy + a presentational component (no unit tests in this app for sections). Verification is the website's own gate run from `website/`: `npm run typecheck`, `npm run lint`, `npm run build` must all pass. (No app-product gate — this is the separate marketing site.)

**Commit convention:** End the commit message with the repo trailer:
```
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01PXhzcUxRqNEX5nbVkjKc5p
```

---

## File Structure

| File | Responsibility | Change |
|------|----------------|--------|
| `website/src/config/site.ts` | Copy source of truth | Add a `trust` object (eyebrow/title/body) after the `loopAudit` block. |
| `website/src/sections/TrustStrip.tsx` | The presentational strip | Create; mirror `PhilosophyStrip.tsx`, swap icon → `ShieldCheck`, read `site.trust`. |
| `website/src/App.tsx` | Page composition | Import `TrustStrip`; render `<TrustStrip />` between `<LoopAudit />` and `<About />`. |

---

## Task 1: Add the Trust differentiator strip

**Files:**
- Modify: `website/src/config/site.ts` (add `trust` object)
- Create: `website/src/sections/TrustStrip.tsx`
- Modify: `website/src/App.tsx` (import + compose)

- [ ] **Step 1: Read the pattern and the spec**

Read `website/src/sections/PhilosophyStrip.tsx` (the exact visual pattern to mirror) and the spec. The strip must look like a sibling of the philosophy strip, read its copy from `site`, and use only brand tokens (no hardcoded hex).

- [ ] **Step 2: Add the `trust` copy to `site.ts`**

In `website/src/config/site.ts`, add this object immediately **after** the `loopAudit: { … },` block (and before `about:`). Keep the body verbatim (plain string — no inline markup, matching every other section body):

```ts
  trust: {
    eyebrow: "Why it's safe to automate",
    title: "Automation you can leave running",
    body: "Black-box automation is unnerving — you can't tell when it's quietly gone wrong. So we only build automation where a clear rule decides when the job is done, and a wrong run is cheap to undo. That's what makes it safe to leave running without watching it. It's the same discipline we run on our own systems: loops that check their own work against a rule, fix what they safely can, and flag the rest for a human. We don't sell a black box we wouldn't run ourselves.",
  },
```

- [ ] **Step 3: Create `TrustStrip.tsx`**

Create `website/src/sections/TrustStrip.tsx` with exactly this content (mirrors `PhilosophyStrip`, icon `ShieldCheck`, glow uses `--primary` to subtly differentiate from the philosophy strip's `--secondary` glow — both are brand tokens):

```tsx
import { ShieldCheck } from "lucide-react";
import { site } from "@/config/site";
import { Section } from "@/components/Section";
import { Reveal } from "@/components/Reveal";

export function TrustStrip() {
  return (
    <Section className="py-16 sm:py-20">
      <Reveal className="mx-auto max-w-3xl">
        <div className="glass relative overflow-hidden rounded-2xl border border-border p-8 sm:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-50"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.16), transparent 65%)",
            }}
          />
          <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:gap-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                {site.trust.eyebrow}
              </p>
              <h2 className="text-2xl font-bold sm:text-3xl">{site.trust.title}</h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {site.trust.body}
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
```

- [ ] **Step 4: Wire it into `App.tsx`**

In `website/src/App.tsx`, add the import next to the other section imports (e.g. right after the `LoopAudit` import):

```tsx
import { TrustStrip } from "@/sections/TrustStrip";
```

Then insert `<TrustStrip />` in the composition **between** `<LoopAudit />` and `<About />`:

```tsx
        <LoopAudit />
        <TrustStrip />
        <About />
```

(The durable contract is the anchors `<LoopAudit />` / `<About />`; line numbers may have shifted.)

- [ ] **Step 5: Run the website gate**

From the `website/` directory:

```bash
cd website
npm run typecheck
npm run lint
npm run build
```

Expected: all three pass. `typecheck` (tsc) confirms `site.trust` and the new component/import resolve; `lint` (eslint) is clean; `build` (vite) compiles. If `node_modules` is missing, run `npm install` (or `npm ci`) in `website/` first. Note: a pre-existing `react-refresh` lint warning pattern may exist in the repo (as in the product app) — only NEW lint errors introduced by this change are a failure.

- [ ] **Step 6: Commit**

```bash
git add website/src/config/site.ts website/src/sections/TrustStrip.tsx website/src/App.tsx
git commit -m "feat(website): add 'Automation you can leave running' trust strip

A new differentiator strip after the Loop Audit section: the trust payoff to
the four conditions, with the self-proof at principle altitude. Copy in
site.ts, presentational TrustStrip mirroring PhilosophyStrip, wired between
LoopAudit and About in App.tsx."
```

---

## Done criteria (whole plan)

- [ ] `website/src/config/site.ts` has the `trust` object with the approved copy verbatim.
- [ ] `website/src/sections/TrustStrip.tsx` exists, mirrors the `PhilosophyStrip` pattern, reads `site.trust`, uses `ShieldCheck`, and hardcodes no colors.
- [ ] `<TrustStrip />` renders between `<LoopAudit />` and `<About />` in `App.tsx`; no nav entry added; no existing section copy changed.
- [ ] `npm run typecheck`, `npm run lint`, `npm run build` all pass in `website/`.
- [ ] No changes outside the `website/` app (the AIOS product is untouched).
