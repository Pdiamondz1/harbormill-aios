# ROI-Discovery Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin-only prospecting surface that captures a prospect's value opportunities, computes total opportunity + ROI vs the proposed retainer, and exports a branded Opportunity Report to a Google Doc — the artifact that closes the $5k retainer.

**Architecture:** Two admin-only Postgres tables (`audits`, `audit_opportunities`) behind RLS; client-side ROI math + deterministic markdown composition (pure, unit-tested); React pages/hooks/components mirroring the existing Value surface; export via the Workspace proxy's existing `export_markdown_to_doc` action. Behind a `audits` feature flag, `tier="admin"`.

**Tech Stack:** React 18 + Vite + TS + Tailwind + shadcn/ui · TanStack Query · Supabase (Postgres/RLS, Deno edge functions) · vitest.

**Spec:** `docs/superpowers/specs/2026-06-19-roi-discovery-audit-design.md`

**Testing approach:** This repo verifies via the gate (`npm run typecheck && npm run lint && npm run build && npm run test`) + live MCP validation on `harbormill-aios-demo`, not per-component unit tests (there is one existing vitest test). TDD applies to the **pure logic only** (`src/lib/audit.ts`: `summarizeAudit` + `composeReportMarkdown`). Everything else is verified by the gate + a brand-leak grep + live validation, exactly as the Value surface (PR #12) was.

---

## File structure

Create:
- `supabase/migrations/20260617000800_audits.sql` — both tables, admin RLS, `updated_at` triggers.
- `src/types/audit.ts` — types (reuse `ValueCategory` from `types/value.ts`).
- `src/lib/audit.ts` — pure `summarizeAudit(opps, retainerCents)` + `composeReportMarkdown(audit, opps, summary)`.
- `src/lib/audit.test.ts` — vitest for the two pure functions.
- `src/hooks/useAudits.ts` — list/get/save audit, save/delete opportunity.
- `src/components/audit/{AuditStatusBadge,AuditCard,AuditOpportunityForm,OpportunityList,OpportunityReport}.tsx`.
- `src/pages/Audits.tsx`, `src/pages/AuditDetail.tsx`.

Modify:
- `src/hooks/useGoogleWorkspace.ts` — export a `useExportDoc` hook wrapping the private `callProxy("export_markdown_to_doc", …)`.
- `src/lib/status.ts` — add `auditStatusClass`.
- `src/config/features.ts` — add `audits: true`.
- `src/App.tsx` — gated `/audits` + `/audits/:id` routes (`tier="admin"`).
- `src/components/layout/AppLayout.tsx` — nav item `{ to: "/audits", label: "Audits", adminOnly: true, feature: "audits" }`.

Patterns to mirror (read these first): `supabase/migrations/20260617000700_value_delivered.sql` (table+RLS), `src/hooks/useValue.ts` + `src/hooks/useProjects.ts` (hooks), `src/components/value/ValueEventForm.tsx` (form), `src/components/value/ValueDeliveredCard.tsx` (hero), `src/pages/Value.tsx` + `src/pages/ProjectDetail.tsx` (pages), `src/hooks/useGoogleWorkspace.ts` (proxy seam).

---

## Task 1: Migration — audits + audit_opportunities

**Files:** Create `supabase/migrations/20260617000800_audits.sql`

- [ ] **Step 1: Write the migration**

```sql
-- ROI-discovery audit: admin-only prospecting. Captures a prospect's value
-- opportunities and the proposed retainer; the UI computes ROI and exports a
-- branded Opportunity Report. PRIVATE sales data — admin-only, and deliberately
-- NOT logged to the access-tier-readable `activity` table (would leak prospect names).

create table public.audits (
  id                      uuid primary key default gen_random_uuid(),
  prospect_name           text not null,
  company                 text,
  status                  text not null default 'draft'
                          check (status in ('draft','presented','won','lost')),
  proposed_retainer_cents integer not null default 500000 check (proposed_retainer_cents >= 0),
  summary_notes           text,
  last_export_doc_id      text,
  created_by              uuid references auth.users (id) default auth.uid(),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index idx_audits_status on public.audits (status, created_at desc);

alter table public.audits enable row level security;
create policy "audits admin manage" on public.audits
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create trigger trg_audits_updated_at
  before update on public.audits
  for each row execute function public.handle_updated_at();

create table public.audit_opportunities (
  id                 uuid primary key default gen_random_uuid(),
  audit_id           uuid not null references public.audits (id) on delete cascade,
  title              text not null,
  description_md     text,
  category           text not null default 'other'
                     check (category in ('hours_saved','revenue_captured','cost_avoided','other')),
  annual_value_cents integer not null default 0 check (annual_value_cents >= 0),
  confidence         text not null default 'med' check (confidence in ('low','med','high')),
  effort             text not null default 'med' check (effort in ('low','med','high')),
  basis_md           text,
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index idx_audit_opportunities_audit on public.audit_opportunities (audit_id, sort_order);

alter table public.audit_opportunities enable row level security;
create policy "audit_opportunities admin manage" on public.audit_opportunities
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create trigger trg_audit_opportunities_updated_at
  before update on public.audit_opportunities
  for each row execute function public.handle_updated_at();
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260617000800_audits.sql
git commit -m "feat(db): audits + audit_opportunities tables (admin-only RLS)"
```

(Live application to the demo project happens in Task 7.)

---

## Task 2: Types + pure logic (TDD)

**Files:** Create `src/types/audit.ts`, `src/lib/audit.ts`, `src/lib/audit.test.ts`

- [ ] **Step 1: Write `src/types/audit.ts`**

```ts
import type { ValueCategory } from "@/types/value";

export type AuditStatus = "draft" | "presented" | "won" | "lost";
export type Confidence = "low" | "med" | "high";
export type Effort = "low" | "med" | "high";
export type OpportunityCategory = ValueCategory;

export const AUDIT_STATUSES: AuditStatus[] = ["draft", "presented", "won", "lost"];
export const AUDIT_STATUS_LABELS: Record<AuditStatus, string> = {
  draft: "Draft", presented: "Presented", won: "Won", lost: "Lost",
};

export interface Audit {
  id: string;
  prospect_name: string;
  company: string | null;
  status: AuditStatus;
  proposed_retainer_cents: number;
  summary_notes: string | null;
  last_export_doc_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditOpportunity {
  id: string;
  audit_id: string;
  title: string;
  description_md: string | null;
  category: OpportunityCategory;
  annual_value_cents: number;
  confidence: Confidence;
  effort: Effort;
  basis_md: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AuditSummary {
  total_annual_cents: number;
  annual_fee_cents: number;
  roi_multiple: number | null;
  by_category: Partial<Record<OpportunityCategory, number>>;
}
```

- [ ] **Step 2: Write the failing test `src/lib/audit.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { summarizeAudit, composeReportMarkdown } from "@/lib/audit";
import type { Audit, AuditOpportunity } from "@/types/audit";

const opp = (over: Partial<AuditOpportunity>): AuditOpportunity => ({
  id: "o", audit_id: "a", title: "X", description_md: null, category: "hours_saved",
  annual_value_cents: 0, confidence: "med", effort: "med", basis_md: null,
  sort_order: 0, created_at: "", updated_at: "", ...over,
});
const audit: Audit = {
  id: "a", prospect_name: "Acme", company: "Acme Co", status: "draft",
  proposed_retainer_cents: 500000, summary_notes: null, last_export_doc_id: null,
  created_by: null, created_at: "", updated_at: "",
};

describe("summarizeAudit", () => {
  it("sums annual value and computes ROI vs the annual fee", () => {
    const s = summarizeAudit(
      [opp({ annual_value_cents: 1_800_000, category: "revenue_captured" }),
       opp({ annual_value_cents: 1_200_000, category: "hours_saved" })],
      500000
    );
    expect(s.total_annual_cents).toBe(3_000_000);
    expect(s.annual_fee_cents).toBe(6_000_000); // 500000 * 12
    expect(s.roi_multiple).toBe(0.5);
    expect(s.by_category).toEqual({ revenue_captured: 1_800_000, hours_saved: 1_200_000 });
  });
  it("returns null ROI when the fee is zero and handles no opportunities", () => {
    expect(summarizeAudit([], 0)).toMatchObject({ total_annual_cents: 0, roi_multiple: null });
  });
});

describe("composeReportMarkdown", () => {
  it("includes prospect, total, multiple, and each opportunity title", () => {
    const opps = [opp({ title: "Lead follow-up", annual_value_cents: 6_000_000 })];
    const md = composeReportMarkdown(audit, opps, summarizeAudit(opps, 500000));
    expect(md).toContain("# Opportunity Report — Acme");
    expect(md).toContain("Lead follow-up");
    expect(md).toContain("$60,000"); // total annual
    expect(md).toMatch(/##? /); // has markdown headings
  });
});
```

- [ ] **Step 3: Run it; verify it fails**

Run: `npm run test -- audit`
Expected: FAIL (module `@/lib/audit` not found / exports missing).

- [ ] **Step 4: Implement `src/lib/audit.ts`**

```ts
import type { Audit, AuditOpportunity, AuditSummary, OpportunityCategory } from "@/types/audit";
import { VALUE_CATEGORY_LABELS, formatDollars } from "@/types/value";
import { AUDIT_STATUS_LABELS } from "@/types/audit";

export function summarizeAudit(opps: AuditOpportunity[], retainerCents: number): AuditSummary {
  const total = opps.reduce((n, o) => n + (o.annual_value_cents || 0), 0);
  const annualFee = retainerCents * 12;
  const by: Partial<Record<OpportunityCategory, number>> = {};
  for (const o of opps) by[o.category] = (by[o.category] ?? 0) + (o.annual_value_cents || 0);
  return {
    total_annual_cents: total,
    annual_fee_cents: annualFee,
    roi_multiple: annualFee > 0 ? Math.round((total / annualFee) * 10) / 10 : null,
    by_category: by,
  };
}

// Effort/confidence weighting: high value, low effort, high confidence first.
const EFFORT_RANK = { low: 0, med: 1, high: 2 } as const;
const CONF_RANK = { high: 0, med: 1, low: 2 } as const;
export function prioritize(opps: AuditOpportunity[]): AuditOpportunity[] {
  return [...opps].sort(
    (a, b) =>
      b.annual_value_cents - a.annual_value_cents ||
      EFFORT_RANK[a.effort] - EFFORT_RANK[b.effort] ||
      CONF_RANK[a.confidence] - CONF_RANK[b.confidence]
  );
}

export function composeReportMarkdown(
  audit: Audit,
  opps: AuditOpportunity[],
  summary: AuditSummary
): string {
  const who = audit.company ? `${audit.prospect_name} — ${audit.company}` : audit.prospect_name;
  const lines: string[] = [
    `# Opportunity Report — ${who}`,
    "",
    `**Projected annual value:** ${formatDollars(summary.total_annual_cents)}`,
    summary.roi_multiple !== null
      ? `**ROI:** ${summary.roi_multiple}× the ${formatDollars(audit.proposed_retainer_cents)}/mo retainer (${formatDollars(summary.annual_fee_cents)}/yr)`
      : "",
    audit.summary_notes ? `\n${audit.summary_notes}` : "",
    "",
    "## Opportunities",
    "",
  ];
  for (const o of prioritize(opps)) {
    lines.push(`### ${o.title} — ${formatDollars(o.annual_value_cents)}/yr`);
    lines.push(`*${VALUE_CATEGORY_LABELS[o.category]} · confidence ${o.confidence} · effort ${o.effort}*`);
    if (o.description_md) lines.push("", o.description_md);
    if (o.basis_md) lines.push("", `_Basis: ${o.basis_md}_`);
    lines.push("");
  }
  lines.push(`---`, `_Status: ${AUDIT_STATUS_LABELS[audit.status]}._`);
  return lines.join("\n");
}
```

- [ ] **Step 5: Run tests; verify pass**

Run: `npm run test -- audit`
Expected: PASS (both describe blocks).

- [ ] **Step 6: Commit**

```bash
git add src/types/audit.ts src/lib/audit.ts src/lib/audit.test.ts
git commit -m "feat(audit): types + pure ROI summary/report composer (tested)"
```

---

## Task 3: Hooks + status helper + export hook

**Files:** Create `src/hooks/useAudits.ts`; Modify `src/hooks/useGoogleWorkspace.ts`, `src/lib/status.ts`

- [ ] **Step 1: Add `auditStatusClass` to `src/lib/status.ts`** (after `projectStatusClass`)

```ts
import type { AuditStatus } from "@/types/audit";

/** Chip classes for an audit status. */
export function auditStatusClass(status: AuditStatus): string {
  switch (status) {
    case "won": return "border-success/50 bg-success/15 text-success";
    case "lost": return "border-destructive/50 bg-destructive/15 text-destructive-foreground";
    case "presented": return "border-primary/50 bg-primary/15 text-primary";
    default: return "border-border bg-muted text-muted-foreground"; // draft
  }
}
```

- [ ] **Step 2: Create `src/hooks/useAudits.ts`** (mirror `useProjects.ts` / `useValue.ts`)

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Audit, AuditOpportunity } from "@/types/audit";

const AUDIT_COLS =
  "id, prospect_name, company, status, proposed_retainer_cents, summary_notes, last_export_doc_id, created_by, created_at, updated_at";
const OPP_COLS =
  "id, audit_id, title, description_md, category, annual_value_cents, confidence, effort, basis_md, sort_order, created_at, updated_at";

export function useAudits() {
  return useQuery({
    queryKey: ["audits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("audits").select(AUDIT_COLS)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Audit[];
    },
  });
}

export function useAudit(id: string | undefined) {
  return useQuery({
    queryKey: ["audits", id],
    queryFn: async () => {
      const [{ data: audit, error: e1 }, { data: opps, error: e2 }] = await Promise.all([
        supabase.from("audits").select(AUDIT_COLS).eq("id", id!).maybeSingle(),
        supabase.from("audit_opportunities").select(OPP_COLS).eq("audit_id", id!)
          .order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return { audit: (audit ?? null) as Audit | null, opportunities: (opps ?? []) as unknown as AuditOpportunity[] };
    },
    enabled: !!id,
  });
}

export function useSaveAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: Partial<Audit> }) => {
      if (id) {
        const { error } = await supabase.from("audits").update(input).eq("id", id);
        if (error) throw error; return id;
      }
      const { data, error } = await supabase.from("audits").insert(input).select("id").single();
      if (error) throw error; return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["audits"] }),
  });
}

export function useSaveOpportunity(auditId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: Partial<AuditOpportunity> }) => {
      if (id) {
        const { error } = await supabase.from("audit_opportunities").update(input).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("audit_opportunities").insert({ ...input, audit_id: auditId });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["audits", auditId] }),
  });
}

export function useDeleteOpportunity(auditId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("audit_opportunities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["audits", auditId] }),
  });
}
```

- [ ] **Step 3: Add `useExportDoc` to `src/hooks/useGoogleWorkspace.ts`**

Read the file first to match its `callProxy` signature. Add an exported mutation hook that calls `callProxy("export_markdown_to_doc", { title, markdown, doc_id })` and returns the resulting `{ file }` (with `webViewLink` + `id`). Do NOT duplicate the fetch/auth; reuse the existing private `callProxy`. If `callProxy` is not exportable as-is, export a thin wrapper hook from the same module.

- [ ] **Step 4: Gate**

Run: `npm run typecheck && npm run lint`
Expected: 0 errors (the 3 known warnings are fine).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAudits.ts src/hooks/useGoogleWorkspace.ts src/lib/status.ts
git commit -m "feat(audit): hooks (audits/opportunities) + export hook + status chip"
```

---

## Task 4: Components

**Files:** Create `src/components/audit/{AuditStatusBadge,AuditCard,AuditOpportunityForm,OpportunityList,OpportunityReport}.tsx`

- [ ] **Step 1: `AuditStatusBadge.tsx`** — token-based span using `auditStatusClass` + `AUDIT_STATUS_LABELS` (mirror `ProjectStatusBadge`).

- [ ] **Step 2: `AuditCard.tsx`** — a `Link` to `/audits/:id`; shows `prospect_name`/`company`, `AuditStatusBadge`, and computed `summarizeAudit`-from-list is not available here (list view has no opportunities) so show status only + `proposed_retainer_cents` via `formatDollars`. Mirror `ProjectCard`.

- [ ] **Step 3: `AuditOpportunityForm.tsx`** — modeled on `ValueEventForm`. Fields: category (`VALUE_CATEGORIES`/`VALUE_CATEGORY_LABELS`), title, description, confidence, effort selects, and value entry: for `hours_saved` show hours/week × rate → annual (`hrs*rate*52*100` cents) and write the basis string to `basis_md`; else a dollar amount → `annual_value_cents`. Submits via `useSaveOpportunity`.

- [ ] **Step 4: `OpportunityList.tsx`** — presentational list of opportunities (uses `prioritize`), each row: title, `formatDollars(annual_value_cents)`/yr, category label, confidence/effort, edit + delete buttons (delete via `useDeleteOpportunity`). Mirror `ValueEventList`.

- [ ] **Step 5: `OpportunityReport.tsx`** — the summary hero: `summarizeAudit(opps, audit.proposed_retainer_cents)` → "Projected $X/yr — N× your fee" using `formatDollars` + `roiClass`; zero-opportunity → $0, no multiple. Mirror `ValueDeliveredCard`.

- [ ] **Step 6: Gate + brand-leak grep**

Run: `npm run typecheck && npm run lint`
Run grep (no matches expected): search `src/components/audit/` for `dc-|bg-white|text-gray-|teal-|pink-|emerald-|fuchsia-|rose-`.

- [ ] **Step 7: Commit**

```bash
git add src/components/audit
git commit -m "feat(audit): card, status badge, opportunity form/list, report hero"
```

---

## Task 5: Pages + wiring

**Files:** Create `src/pages/Audits.tsx`, `src/pages/AuditDetail.tsx`; Modify `src/config/features.ts`, `src/App.tsx`, `src/components/layout/AppLayout.tsx`

- [ ] **Step 1: `features.ts`** — add `audits: boolean` to `FeatureFlags` and `audits: true` to `features`.

- [ ] **Step 2: `Audits.tsx`** — `PageHeader` (eyebrow "Prospecting", title "Audits") + admin "New audit" → inline create form (prospect name, company, proposed retainer defaulting to 500000); list `AuditCard`s via `useAudits`; `EmptyState` when none. Mirror `Projects.tsx`.

- [ ] **Step 3: `AuditDetail.tsx`** — `useAudit(id)`; back link; prospect header + `AuditStatusBadge` + a status `<select>` (updates via `useSaveAudit`); `OpportunityReport`; "Add opportunity" → `AuditOpportunityForm`; `OpportunityList`; **Export** button → compose `composeReportMarkdown(audit, opps, summary)` then `useExportDoc({ title, markdown, doc_id: audit.last_export_doc_id })`; on success persist `last_export_doc_id` via `useSaveAudit` and toast the returned link; disable export when 0 opportunities; `isLoading` while exporting. Mirror `ProjectDetail.tsx` + `Value.tsx`.

- [ ] **Step 4: `App.tsx`** — import the pages; add gated routes after the `value` route:

```tsx
{features.audits && (
  <Route path="audits" element={<ProtectedRoute tier="admin"><Audits /></ProtectedRoute>} />
)}
{features.audits && (
  <Route path="audits/:id" element={<ProtectedRoute tier="admin"><AuditDetail /></ProtectedRoute>} />
)}
```

- [ ] **Step 5: `AppLayout.tsx`** — add nav item `{ to: "/audits", label: "Audits", adminOnly: true, feature: "audits" }`.

- [ ] **Step 6: Full gate**

Run: `npm run typecheck && npm run lint && npm run build && npm run test`
Expected: 0 errors; build ok; tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Audits.tsx src/pages/AuditDetail.tsx src/config/features.ts src/App.tsx src/components/layout/AppLayout.tsx
git commit -m "feat(audit): /audits + /audits/:id pages, routes, nav, feature flag"
```

---

## Task 6: Live validation + PR

- [ ] **Step 1: Apply the migration to the demo** via Supabase MCP `apply_migration` (project `khtlrhtgnwhrhrstivkw`, name `audits`) using the Task 1 SQL.

- [ ] **Step 2: Verify** via `execute_sql`: both tables exist, RLS enabled; insert a sample audit + 2 opportunities; confirm a hand-computed ROI matches `summarizeAudit`'s formula (total annual ÷ retainer×12).

- [ ] **Step 3: Security advisor** (`get_advisors` type security): confirm no new issue class (`audits`/`audit_opportunities` must show RLS policies; no `rls_enabled_no_policy`).

- [ ] **Step 4: Manual smoke** (`npm run dev`, 127.0.0.1:8080): as admin create an audit, add an hours-based + a revenue opportunity, see the projected $/yr + multiple, export to a Google Doc (if Google connected). Confirm a stakeholder cannot reach `/audits`; toggling `features.audits=false` hides nav + routes.

- [ ] **Step 5: Push + PR** (base `main`): summarize the feature, note the migration + that no edge-function redeploy is needed (export reuses the existing proxy action). End the PR body with the Claude Code generation line.

---

## Notes for the implementer

- **No `activity` triggers** on these tables (private sales data — see spec Non-goals).
- Reuse, don't reinvent: `formatDollars`/`VALUE_CATEGORIES` (`types/value.ts`), `roiClass` (`lib/status.ts`), `PageHeader`/`EmptyState` (`src/components/`), `Spinner` (`src/components/ui/spinner.tsx`), `Button` w/ `isLoading` (`src/components/ui/button.tsx`).
- Confidence/effort literals are `'med'` (not `'medium'`) to match the DB constraints.
- The export path requires a connected Google account; show the standard "connect Google on the Workspace page" message on the `not_connected`/`needs_reconnect` codes.
