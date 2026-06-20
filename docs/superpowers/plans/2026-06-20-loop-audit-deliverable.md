# Loop Audit Deliverable (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package the Four-Condition Loop Test as a paid "Loop Audit" deliverable — a sibling mode of the shipped ROI-Discovery Audit that captures the four-condition gate per opportunity, ranks the loop candidates, recommends one first build, and exports a branded Google Doc.

**Architecture:** Add a per-audit `is_loop_audit` flag plus four nullable gate columns on `audit_opportunities` (additive migration). Add pure lib functions for the gate outcome, the first-build recommendation, and a loop-flavored report markdown. Extend the existing audit UI components (no new page) to show the gate controls/badges and pick the loop report on export. Ship a methodology playbook doc.

**Tech Stack:** React 18 + Vite + TypeScript (strict), Tailwind + shadcn/ui, TanStack Query, Supabase (Postgres + RLS), Vitest. Reuses `src/lib/audit.ts`, `src/hooks/useAudits.ts`, `src/components/audit/*`, and the existing `export_markdown_to_doc` Google Workspace action.

## Global Constraints

- TypeScript strict — no `any`, no non-null assertions on possibly-null DB fields.
- Never hardcode brand or color — use semantic tokens only (`success` / `warning` / `muted` / `primary`, `bg-card`, `text-muted-foreground`, …). Match the existing `src/lib/status.ts` chip-class pattern (`border-success/50 bg-success/15 text-success`).
- Admin-only surface; new DB columns inherit existing RLS — do NOT add or alter policies.
- Do NOT write audits to the `activity` table (leaks prospect names) — no activity triggers.
- Leave the non-loop Opportunity Report path (`composeReportMarkdown`) unchanged.
- The gate before "done": `npm run typecheck` · `npm run lint` · `npm run build` · `npm run test`. The 2 known react-refresh lint warnings (button.tsx / AuthContext.tsx) are acceptable.
- Migration timestamp must sort after the latest existing migration (`20260617001000_connector_schedule.sql`). Use `20260617001100_loop_audit.sql`.

---

### Task 1: Additive migration — `is_loop_audit` flag + four gate columns

**Files:**
- Create: `supabase/migrations/20260617001100_loop_audit.sql`

**Interfaces:**
- Produces: columns `audits.is_loop_audit boolean`, `audit_opportunities.loop_repeats text`, `audit_opportunities.loop_done_rule boolean`, `audit_opportunities.loop_afford_waste text`, `audit_opportunities.loop_has_tools boolean`.

- [ ] **Step 1: Write the migration**

```sql
-- Loop Audit (Phase 2): the Four-Condition Loop Test as a sibling mode of the
-- ROI-discovery audit. Additive + defaulted/nullable, so existing audits are
-- unaffected. New columns inherit the tables' admin-only RLS (no policy change).

alter table public.audits
  add column is_loop_audit boolean not null default false;

alter table public.audit_opportunities
  add column loop_repeats      text check (loop_repeats in ('strong','partial','weak')),
  add column loop_done_rule    boolean,
  add column loop_afford_waste text check (loop_afford_waste in ('strong','partial','weak')),
  add column loop_has_tools    boolean;
```

- [ ] **Step 2: Verify it parses / sorts last**

Run: `git status --porcelain supabase/migrations/` and confirm the new file is the lexically-last migration (prefix `20260617001100`). The migration applies on deploy (`supabase db push`) — Postgres/Deno are not covered by the npm gate; validate on the demo project at deploy time.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260617001100_loop_audit.sql
git commit -m "feat(loop-audit): migration — is_loop_audit flag + four gate columns"
```

---

### Task 2: Types + hook column lists

**Files:**
- Modify: `src/types/audit.ts`
- Modify: `src/hooks/useAudits.ts:5-8` (the `AUDIT_COLS` / `OPP_COLS` constants)

**Interfaces:**
- Consumes: nothing.
- Produces: `GateScore`, `LoopOutcome`, `LOOP_OUTCOME_LABELS`; `Audit.is_loop_audit: boolean`; `AuditOpportunity.{loop_repeats, loop_done_rule, loop_afford_waste, loop_has_tools}` (all nullable).

- [ ] **Step 1: Add the new types to `src/types/audit.ts`**

After the existing `Effort` type line (`export type Effort = "low" | "med" | "high";`), add:

```ts
export type GateScore = "strong" | "partial" | "weak";
export type LoopOutcome = "candidate" | "blocked" | "not-a-loop";

export const LOOP_OUTCOME_LABELS: Record<LoopOutcome, string> = {
  candidate: "Candidate",
  blocked: "Blocked",
  "not-a-loop": "Not a loop",
};
```

In the `Audit` interface, add after `summary_notes`:

```ts
  is_loop_audit: boolean;
```

In the `AuditOpportunity` interface, add after `effort`:

```ts
  loop_repeats: GateScore | null;
  loop_done_rule: boolean | null;
  loop_afford_waste: GateScore | null;
  loop_has_tools: boolean | null;
```

- [ ] **Step 2: Extend the hook column lists in `src/hooks/useAudits.ts`**

Replace the two `const` lines (lines 5-8):

```ts
const AUDIT_COLS =
  "id, prospect_name, company, status, proposed_retainer_cents, summary_notes, is_loop_audit, last_export_doc_id, created_by, created_at, updated_at";
const OPP_COLS =
  "id, audit_id, title, description_md, category, annual_value_cents, confidence, effort, loop_repeats, loop_done_rule, loop_afford_waste, loop_has_tools, basis_md, sort_order, created_at, updated_at";
```

- [ ] **Step 3: Verify typecheck passes**

Run: `npm run typecheck`
Expected: PASS (no errors). The `Audit` / `AuditOpportunity` consumers compile because the new fields are additive.

- [ ] **Step 4: Commit**

```bash
git add src/types/audit.ts src/hooks/useAudits.ts
git commit -m "feat(loop-audit): types + hook columns for the gate fields"
```

---

### Task 3: Lib — `isUngated` + `gateOutcome` (TDD)

**Files:**
- Modify: `src/lib/audit.ts`
- Test: `src/lib/audit.test.ts`

**Interfaces:**
- Consumes: `AuditOpportunity`, `LoopOutcome` from `@/types/audit`.
- Produces: `isUngated(o: AuditOpportunity): boolean`; `gateOutcome(o: AuditOpportunity): LoopOutcome`.

- [ ] **Step 1: Extend the test fixture and write failing tests**

In `src/lib/audit.test.ts`, update the imports on line 2 and the `opp()` fixture (lines 5-9) so the new nullable fields exist, then add the new `describe` block.

Replace line 2:

```ts
import { summarizeAudit, composeReportMarkdown, isUngated, gateOutcome } from "@/lib/audit";
```

Replace the `opp` helper (lines 5-9) — add the four loop fields defaulting to `null`:

```ts
const opp = (over: Partial<AuditOpportunity>): AuditOpportunity => ({
  id: "o", audit_id: "a", title: "X", description_md: null, category: "hours_saved",
  annual_value_cents: 0, confidence: "med", effort: "med", basis_md: null,
  loop_repeats: null, loop_done_rule: null, loop_afford_waste: null, loop_has_tools: null,
  sort_order: 0, created_at: "", updated_at: "", ...over,
});
```

Also add `is_loop_audit: false,` to the `audit` fixture (after `summary_notes: null,` on line 12).

Append this `describe` block to the end of the file:

```ts
describe("isUngated / gateOutcome", () => {
  it("isUngated is true only when all four gate fields are null", () => {
    expect(isUngated(opp({}))).toBe(true);
    expect(isUngated(opp({ loop_repeats: "strong" }))).toBe(false);
  });

  const passing = {
    loop_repeats: "strong" as const, loop_done_rule: true,
    loop_afford_waste: "strong" as const, loop_has_tools: true,
  };

  it("candidate when all four are present and passing", () => {
    expect(gateOutcome(opp(passing))).toBe("candidate");
  });

  it("blocked when a hard blocker (#2 or #4) is false", () => {
    expect(gateOutcome(opp({ ...passing, loop_done_rule: false }))).toBe("blocked");
    expect(gateOutcome(opp({ ...passing, loop_has_tools: false }))).toBe("blocked");
  });

  it("not-a-loop when a scored condition (#1 or #3) is weak", () => {
    expect(gateOutcome(opp({ ...passing, loop_repeats: "weak" }))).toBe("not-a-loop");
    expect(gateOutcome(opp({ ...passing, loop_afford_waste: "weak" }))).toBe("not-a-loop");
  });

  it("not-a-loop (never a silent candidate) when partially gated", () => {
    expect(gateOutcome(opp({ loop_done_rule: true, loop_has_tools: true }))).toBe("not-a-loop");
    expect(gateOutcome(opp({}))).toBe("not-a-loop");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- src/lib/audit.test.ts`
Expected: FAIL — `isUngated`/`gateOutcome` are not exported from `@/lib/audit`.

- [ ] **Step 3: Implement `isUngated` and `gateOutcome` in `src/lib/audit.ts`**

Update the import on line 1 to add the loop types:

```ts
import type { Audit, AuditOpportunity, AuditSummary, OpportunityCategory, LoopOutcome } from "@/types/audit";
```

Add after the `prioritize` function (after line 27):

```ts
/** True when an opportunity has no gate data yet (all four conditions null). */
export function isUngated(o: AuditOpportunity): boolean {
  return o.loop_repeats == null && o.loop_done_rule == null &&
    o.loop_afford_waste == null && o.loop_has_tools == null;
}

/**
 * The Four-Condition Loop Test outcome. Hard blockers (#2 a-rule-decides-done,
 * #4 AI-has-data+tools) come first; a "candidate" requires all four present and
 * passing — a partially-gated row is never a silent candidate.
 */
export function gateOutcome(o: AuditOpportunity): LoopOutcome {
  if (o.loop_done_rule === false || o.loop_has_tools === false) return "blocked";
  const passesAll =
    o.loop_done_rule === true && o.loop_has_tools === true &&
    o.loop_repeats != null && o.loop_repeats !== "weak" &&
    o.loop_afford_waste != null && o.loop_afford_waste !== "weak";
  return passesAll ? "candidate" : "not-a-loop";
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- src/lib/audit.test.ts`
Expected: PASS (all `isUngated / gateOutcome` cases green; existing `summarizeAudit` / `composeReportMarkdown` still green).

- [ ] **Step 5: Commit**

```bash
git add src/lib/audit.ts src/lib/audit.test.ts
git commit -m "feat(loop-audit): gateOutcome + isUngated with tests"
```

---

### Task 4: Lib — `recommendFirstBuild` (TDD)

**Files:**
- Modify: `src/lib/audit.ts`
- Test: `src/lib/audit.test.ts`

**Interfaces:**
- Consumes: `gateOutcome`, `prioritize`, `AuditOpportunity`.
- Produces: `recommendFirstBuild(opps: AuditOpportunity[]): AuditOpportunity | null`.

- [ ] **Step 1: Write failing tests**

Add `recommendFirstBuild` to the import on line 2 of `src/lib/audit.test.ts`:

```ts
import { summarizeAudit, composeReportMarkdown, isUngated, gateOutcome, recommendFirstBuild } from "@/lib/audit";
```

Append:

```ts
describe("recommendFirstBuild", () => {
  const pass = {
    loop_repeats: "strong" as const, loop_done_rule: true,
    loop_afford_waste: "strong" as const, loop_has_tools: true,
  };

  it("returns null when there are no candidates", () => {
    expect(recommendFirstBuild([opp({}), opp({ ...pass, loop_done_rule: false })])).toBeNull();
  });

  it("picks the highest value-per-effort candidate, ignoring non-candidates", () => {
    const big = opp({ ...pass, id: "big", title: "Big", annual_value_cents: 9_000_000, effort: "high" });
    const lean = opp({ ...pass, id: "lean", title: "Lean", annual_value_cents: 9_000_000, effort: "low" });
    const blocked = opp({ ...pass, id: "blk", loop_has_tools: false, annual_value_cents: 99_000_000 });
    const first = recommendFirstBuild([big, blocked, lean]);
    expect(first?.id).toBe("lean"); // same value, lower effort wins via prioritize()
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- src/lib/audit.test.ts`
Expected: FAIL — `recommendFirstBuild` not exported.

- [ ] **Step 3: Implement `recommendFirstBuild` in `src/lib/audit.ts`**

Add after `gateOutcome`:

```ts
/** The single recommended first build: top candidate by value-per-effort, else null. */
export function recommendFirstBuild(opps: AuditOpportunity[]): AuditOpportunity | null {
  const candidates = opps.filter((o) => gateOutcome(o) === "candidate");
  return candidates.length ? prioritize(candidates)[0] : null;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- src/lib/audit.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/audit.ts src/lib/audit.test.ts
git commit -m "feat(loop-audit): recommendFirstBuild with tests"
```

---

### Task 5: Lib — `composeLoopReportMarkdown` (TDD)

**Files:**
- Modify: `src/lib/audit.ts`
- Test: `src/lib/audit.test.ts`

**Interfaces:**
- Consumes: `Audit`, `AuditOpportunity`, `gateOutcome`, `prioritize`, `LOOP_OUTCOME_LABELS`, `VALUE_CATEGORY_LABELS`, `formatDollars`, `AUDIT_STATUS_LABELS`.
- Produces: `composeLoopReportMarkdown(audit: Audit, opps: AuditOpportunity[]): string`.

- [ ] **Step 1: Write failing tests**

Add `composeLoopReportMarkdown` to the import on line 2:

```ts
import { summarizeAudit, composeReportMarkdown, isUngated, gateOutcome, recommendFirstBuild, composeLoopReportMarkdown } from "@/lib/audit";
```

Append:

```ts
describe("composeLoopReportMarkdown", () => {
  const pass = {
    loop_repeats: "strong" as const, loop_done_rule: true,
    loop_afford_waste: "strong" as const, loop_has_tools: true,
  };

  it("leads with the build-first headline, ranks candidates, and ledgers every task", () => {
    const cand = opp({ ...pass, title: "Invoice follow-up", annual_value_cents: 6_000_000 });
    const blocked = opp({ ...pass, title: "Inbox triage", loop_has_tools: false });
    const md = composeLoopReportMarkdown({ ...audit, is_loop_audit: true }, [cand, blocked]);
    expect(md).toContain("# Loop Audit — Acme");
    expect(md).toContain("## Recommended first build");
    expect(md).toContain("Invoice follow-up");
    expect(md).toContain("## Ranked candidates");
    expect(md).toContain("## Ledger");
    expect(md).toContain("Blocked");          // the blocked task appears in the ledger
    expect(md).not.toMatch(/\| 1 \| Inbox triage/); // blocked task is NOT ranked
  });

  it("states no candidates when none pass the gate", () => {
    const md = composeLoopReportMarkdown({ ...audit, is_loop_audit: true }, [opp({})]);
    expect(md).toContain("No loop candidates yet");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- src/lib/audit.test.ts`
Expected: FAIL — `composeLoopReportMarkdown` not exported.

- [ ] **Step 3: Implement `composeLoopReportMarkdown` in `src/lib/audit.ts`**

Update imports — line 1 (add `GateScore`) and line 3 (add `LOOP_OUTCOME_LABELS`):

```ts
import type { Audit, AuditOpportunity, AuditSummary, OpportunityCategory, LoopOutcome, GateScore } from "@/types/audit";
import { VALUE_CATEGORY_LABELS, formatDollars } from "@/types/value";
import { AUDIT_STATUS_LABELS, LOOP_OUTCOME_LABELS } from "@/types/audit";
```

Add at the end of the file:

```ts
const gateScoreCell = (v: GateScore | null) => v ?? "—";
const ynCell = (v: boolean | null) => (v === true ? "yes" : v === false ? "no" : "—");

/**
 * The Loop Audit deliverable. Leads with the recommended first build, then a
 * ranked table of loop candidates, then a ledger of every task (including
 * blocked / not-a-loop). The non-loop report stays in composeReportMarkdown.
 */
export function composeLoopReportMarkdown(audit: Audit, opps: AuditOpportunity[]): string {
  const who = audit.company ? `${audit.prospect_name} — ${audit.company}` : audit.prospect_name;
  const candidates = prioritize(opps.filter((o) => gateOutcome(o) === "candidate"));
  const candidateValue = candidates.reduce((n, o) => n + (o.annual_value_cents || 0), 0);
  const first = candidates[0] ?? null;

  const lines: string[] = [
    `# Loop Audit — ${who}`,
    "",
    `**Projected annual value (candidates):** ${formatDollars(candidateValue)}`,
    "",
    "## Recommended first build",
    first
      ? `**${first.title}** — ${formatDollars(first.annual_value_cents)}/yr · ${VALUE_CATEGORY_LABELS[first.category]} · confidence ${first.confidence} · effort ${first.effort}. Highest value-per-effort among the loop candidates.`
      : "_No loop candidates yet — every task is blocked or stays manual (see the ledger)._",
    "",
    "## Ranked candidates",
    "",
    "| Rank | Task | Category | Annual value | Confidence | Effort |",
    "|------|------|----------|--------------|------------|--------|",
  ];
  candidates.forEach((o, i) => {
    lines.push(
      `| ${i + 1} | ${o.title} | ${VALUE_CATEGORY_LABELS[o.category]} | ${formatDollars(o.annual_value_cents)}/yr | ${o.confidence} | ${o.effort} |`
    );
  });

  lines.push("", "## Ledger", "");
  for (const o of opps) {
    lines.push(`### ${o.title} — ${LOOP_OUTCOME_LABELS[gateOutcome(o)]}`);
    lines.push(
      `Gate: repeats=${gateScoreCell(o.loop_repeats)} · rule-decides-done=${ynCell(o.loop_done_rule)} · afford-wasted=${gateScoreCell(o.loop_afford_waste)} · has-data+tools=${ynCell(o.loop_has_tools)}`
    );
    if (o.basis_md) lines.push(`_Basis: ${o.basis_md}_`);
    lines.push("");
  }
  lines.push(`---`, `_Status: ${AUDIT_STATUS_LABELS[audit.status]}._`);
  return lines.join("\n");
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -- src/lib/audit.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/audit.ts src/lib/audit.test.ts
git commit -m "feat(loop-audit): composeLoopReportMarkdown with tests"
```

---

### Task 6: `LoopGateBadge` component + `loopGateClass` helper

**Files:**
- Modify: `src/lib/status.ts`
- Create: `src/components/audit/LoopGateBadge.tsx`

**Interfaces:**
- Consumes: `LoopOutcome`, `LOOP_OUTCOME_LABELS`.
- Produces: `loopGateClass(outcome: LoopOutcome): string`; `<LoopGateBadge outcome={...} />`.

- [ ] **Step 1: Add `loopGateClass` to `src/lib/status.ts`**

Update the type import at the top (line 3) to include `LoopOutcome`:

```ts
import type { AuditStatus, LoopOutcome } from "@/types/audit";
```

Add after `auditStatusClass` (after line 64):

```ts
/** Chip classes for a loop-gate outcome (candidate=success, blocked=warning, else muted). */
export function loopGateClass(outcome: LoopOutcome): string {
  switch (outcome) {
    case "candidate": return "border-success/50 bg-success/15 text-success";
    case "blocked": return "border-warning/50 bg-warning/15 text-warning";
    default: return "border-border bg-muted text-muted-foreground"; // not-a-loop
  }
}
```

- [ ] **Step 2: Create `src/components/audit/LoopGateBadge.tsx`**

```tsx
import { LOOP_OUTCOME_LABELS, type LoopOutcome } from "@/types/audit";
import { loopGateClass } from "@/lib/status";
import { cn } from "@/lib/utils";

export function LoopGateBadge({ outcome, className }: { outcome: LoopOutcome; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
        loopGateClass(outcome),
        className
      )}
    >
      {LOOP_OUTCOME_LABELS[outcome]}
    </span>
  );
}
```

- [ ] **Step 3: Verify typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS (only the 2 known react-refresh warnings).

- [ ] **Step 4: Commit**

```bash
git add src/lib/status.ts src/components/audit/LoopGateBadge.tsx
git commit -m "feat(loop-audit): LoopGateBadge + loopGateClass"
```

---

### Task 7: Gate controls in `AuditOpportunityForm`

**Files:**
- Modify: `src/components/audit/AuditOpportunityForm.tsx`

**Interfaces:**
- Consumes: `GateScore`, `gateOutcome`, `LoopGateBadge`, `useSaveOpportunity`.
- Produces: `<AuditOpportunityForm isLoopAudit={boolean} ... />` — persists the four gate fields when `isLoopAudit`.

- [ ] **Step 1: Add the `isLoopAudit` prop and gate state**

In `src/components/audit/AuditOpportunityForm.tsx`:

Update the `Props` interface (lines 11-15) to add the flag:

```ts
interface Props {
  auditId: string;
  isLoopAudit?: boolean;
  initial?: AuditOpportunity;
  onDone?: () => void;
}
```

Update the destructure on line 20:

```ts
export function AuditOpportunityForm({ auditId, isLoopAudit, initial, onDone }: Props) {
```

Update the type import on line 3 to add `GateScore`:

```ts
import { type Confidence, type Effort, type GateScore, type AuditOpportunity } from "@/types/audit";
```

Add to the imports (after line 5):

```ts
import { gateOutcome } from "@/lib/audit";
import { LoopGateBadge } from "@/components/audit/LoopGateBadge";
```

After the `dollars` state (after line 51), add the four gate states:

```ts
  // loop-audit gate state
  const [loopRepeats, setLoopRepeats] = useState<GateScore | "">(initial?.loop_repeats ?? "");
  const [loopAfford, setLoopAfford] = useState<GateScore | "">(initial?.loop_afford_waste ?? "");
  const [loopDoneRule, setLoopDoneRule] = useState<boolean | null>(initial?.loop_done_rule ?? null);
  const [loopHasTools, setLoopHasTools] = useState<boolean | null>(initial?.loop_has_tools ?? null);
```

- [ ] **Step 2: Persist the gate fields in `submit`**

In the `saveOpp.mutate` `input` object (lines 74-82), add the four fields (only meaningful when `isLoopAudit`, but harmless otherwise — they default to null/empty):

```ts
        input: {
          title: title.trim(),
          description_md: description.trim() || null,
          category,
          annual_value_cents: annualValueCents,
          confidence,
          effort,
          loop_repeats: isLoopAudit ? (loopRepeats || null) : null,
          loop_afford_waste: isLoopAudit ? (loopAfford || null) : null,
          loop_done_rule: isLoopAudit ? loopDoneRule : null,
          loop_has_tools: isLoopAudit ? loopHasTools : null,
          basis_md: basisMd,
        },
```

In the reset block (the `if (!initial)` branch, after line 94), reset the gate state too:

```ts
            setLoopRepeats("");
            setLoopAfford("");
            setLoopDoneRule(null);
            setLoopHasTools(null);
```

- [ ] **Step 3: Render the gate controls + live outcome chip**

Insert this block just before the final `<div className="flex items-center justify-between">` (before line 234), so the gate appears only in loop mode. It builds a synthetic opportunity to compute the live outcome:

```tsx
      {isLoopAudit && (
        <div className="space-y-3 rounded-lg border border-border bg-background/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Four-Condition Loop Test
            </span>
            <LoopGateBadge
              outcome={gateOutcome({
                ...(initial ?? ({} as AuditOpportunity)),
                loop_repeats: loopRepeats || null,
                loop_afford_waste: loopAfford || null,
                loop_done_rule: loopDoneRule,
                loop_has_tools: loopHasTools,
              })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="opp-repeats">
                1 · Repeats
              </label>
              <select
                id="opp-repeats"
                className={inputClass}
                value={loopRepeats}
                onChange={(e) => setLoopRepeats(e.target.value as GateScore | "")}
              >
                <option value="">—</option>
                <option value="strong">Strong</option>
                <option value="partial">Partial</option>
                <option value="weak">Weak</option>
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="opp-afford">
                3 · Afford wasted runs
              </label>
              <select
                id="opp-afford"
                className={inputClass}
                value={loopAfford}
                onChange={(e) => setLoopAfford(e.target.value as GateScore | "")}
              >
                <option value="">—</option>
                <option value="strong">Strong</option>
                <option value="partial">Partial</option>
                <option value="weak">Weak</option>
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="opp-donerule">
                2 · A rule decides "done"
              </label>
              <select
                id="opp-donerule"
                className={inputClass}
                value={loopDoneRule === null ? "" : loopDoneRule ? "yes" : "no"}
                onChange={(e) =>
                  setLoopDoneRule(e.target.value === "" ? null : e.target.value === "yes")
                }
              >
                <option value="">—</option>
                <option value="yes">Yes</option>
                <option value="no">No (blocker)</option>
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="opp-hastools">
                4 · AI has data + tools
              </label>
              <select
                id="opp-hastools"
                className={inputClass}
                value={loopHasTools === null ? "" : loopHasTools ? "yes" : "no"}
                onChange={(e) =>
                  setLoopHasTools(e.target.value === "" ? null : e.target.value === "yes")
                }
              >
                <option value="">—</option>
                <option value="yes">Yes</option>
                <option value="no">No (blocker)</option>
              </select>
            </div>
          </div>
        </div>
      )}
```

- [ ] **Step 4: Verify typecheck + lint + build**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: PASS (2 known warnings only).

- [ ] **Step 5: Commit**

```bash
git add src/components/audit/AuditOpportunityForm.tsx
git commit -m "feat(loop-audit): gate controls + live outcome in the opportunity form"
```

---

### Task 8: Per-row gate badge in `OpportunityList`

**Files:**
- Modify: `src/components/audit/OpportunityList.tsx`

**Interfaces:**
- Consumes: `gateOutcome`, `isUngated`, `LoopGateBadge`.
- Produces: `<OpportunityList isLoopAudit={boolean} ... />`.

- [ ] **Step 1: Add the prop and render the badge**

Add to imports (after line 5):

```ts
import { gateOutcome, isUngated } from "@/lib/audit";
import { LoopGateBadge } from "@/components/audit/LoopGateBadge";
```

Update `Props` (lines 8-12):

```ts
interface Props {
  auditId: string;
  isLoopAudit?: boolean;
  opportunities: AuditOpportunity[];
  onEdit: (o: AuditOpportunity) => void;
}
```

Update the destructure (line 14):

```ts
export function OpportunityList({ auditId, isLoopAudit, opportunities, onEdit }: Props) {
```

Inside the `<li>` meta paragraph, after the category/confidence/effort `<p>` (after line 32), add a loop badge row that distinguishes "needs assessment" from a scored outcome:

```tsx
            {isLoopAudit && (
              <div className="mt-1">
                {isUngated(o) ? (
                  <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                    Needs assessment
                  </span>
                ) : (
                  <LoopGateBadge outcome={gateOutcome(o)} />
                )}
              </div>
            )}
```

- [ ] **Step 2: Verify typecheck + lint + build**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/audit/OpportunityList.tsx
git commit -m "feat(loop-audit): per-row gate badge in the opportunity list"
```

---

### Task 9: Loop summary strip in `OpportunityReport`

**Files:**
- Modify: `src/components/audit/OpportunityReport.tsx`

**Interfaces:**
- Consumes: `gateOutcome`, `recommendFirstBuild`.
- Produces: `<OpportunityReport audit opportunities />` shows a loop strip when `audit.is_loop_audit`.

- [ ] **Step 1: Add the loop strip**

Add to imports (after line 4):

```ts
import { gateOutcome, recommendFirstBuild } from "@/lib/audit";
```

Inside the component, after `const summary = summarizeAudit(...)` (after line 16), compute loop counts:

```ts
  const candidateCount = opportunities.filter((o) => gateOutcome(o) === "candidate").length;
  const blockedCount = opportunities.filter((o) => gateOutcome(o) === "blocked").length;
  const first = recommendFirstBuild(opportunities);
```

Just before the closing `</div>` of the hero card (before line 56), add:

```tsx
      {audit.is_loop_audit && (
        <div className="relative mt-4 border-t border-border pt-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Loop Audit
          </p>
          <p className="mt-1 text-foreground">
            {first ? (
              <>
                Build first: <span className="font-semibold">{first.title}</span>
              </>
            ) : (
              <span className="text-muted-foreground">No loop candidates yet</span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {candidateCount} candidate{candidateCount === 1 ? "" : "s"} · {blockedCount} blocked
          </p>
        </div>
      )}
```

- [ ] **Step 2: Verify typecheck + lint + build**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/audit/OpportunityReport.tsx
git commit -m "feat(loop-audit): build-first summary strip in the report hero"
```

---

### Task 10: Wire `AuditDetail` — thread the flag + loop export

**Files:**
- Modify: `src/pages/AuditDetail.tsx`

**Interfaces:**
- Consumes: `composeLoopReportMarkdown`, `composeReportMarkdown`, `summarizeAudit`; passes `isLoopAudit={audit.is_loop_audit}` to `AuditOpportunityForm` and `OpportunityList`.

- [ ] **Step 1: Import the loop report composer**

Update line 7:

```ts
import { summarizeAudit, composeReportMarkdown, composeLoopReportMarkdown } from "@/lib/audit";
```

- [ ] **Step 2: Pick the loop report on export**

Replace the first two lines of `handleExport` (lines 47-48) so a loop audit composes the loop report and titles the Doc accordingly:

```ts
  const handleExport = () => {
    const summary = summarizeAudit(opportunities, audit.proposed_retainer_cents);
    const md = audit.is_loop_audit
      ? composeLoopReportMarkdown(audit, opportunities)
      : composeReportMarkdown(audit, opportunities, summary);
```

Update the `exportDoc.mutate` title (line 51) to reflect the mode:

```ts
        title: `${audit.is_loop_audit ? "Loop Audit" : "Opportunity Report"} — ${audit.prospect_name}`,
```

- [ ] **Step 3: Thread `isLoopAudit` into the form and list**

Pass the flag to `AuditOpportunityForm` (line 131-135):

```tsx
          <AuditOpportunityForm
            auditId={audit.id}
            isLoopAudit={audit.is_loop_audit}
            initial={editing ?? undefined}
            onDone={handleOppDone}
          />
```

Pass it to `OpportunityList` (line 150-157):

```tsx
        <OpportunityList
          auditId={audit.id}
          isLoopAudit={audit.is_loop_audit}
          opportunities={opportunities}
          onEdit={(o) => {
            setEditing(o);
            setAddingOpp(false);
          }}
        />
```

Optionally label the "Opportunities" heading (line 142) for loop audits:

```tsx
          <h2 className="text-sm font-bold text-foreground">
            {audit.is_loop_audit ? "Loop candidates" : "Opportunities"}
          </h2>
```

- [ ] **Step 4: Verify typecheck + lint + build + test**

Run: `npm run typecheck && npm run lint && npm run build && npm run test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/AuditDetail.tsx
git commit -m "feat(loop-audit): wire AuditDetail — loop export + thread the flag"
```

---

### Task 11: Create toggle in `Audits` + `AuditCard` badge

**Files:**
- Modify: `src/pages/Audits.tsx`
- Modify: `src/components/audit/AuditCard.tsx`

**Interfaces:**
- Consumes: `useSaveAudit` (now passing `is_loop_audit`).
- Produces: a "Loop Audit" creation toggle; a "Loop Audit" badge on the card.

- [ ] **Step 1: Add the create-form toggle in `src/pages/Audits.tsx`**

Add a state after `retainerDollars` (after line 24):

```ts
  const [isLoopAudit, setIsLoopAudit] = useState(false);
```

Add `is_loop_audit` to the `input` in `handleCreate` (inside the object on lines 32-36):

```ts
        input: {
          prospect_name: prospectName.trim(),
          company: company.trim() || null,
          proposed_retainer_cents,
          is_loop_audit: isLoopAudit,
        },
```

Reset it in both `onSuccess` (after line 43) and `handleCancelCreate` (after line 53):

```ts
          setIsLoopAudit(false);
```

Add the toggle control in the create form, just before the buttons row (before line 121):

```tsx
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring"
              checked={isLoopAudit}
              onChange={(e) => setIsLoopAudit(e.target.checked)}
            />
            Run as a <span className="font-semibold">Loop Audit</span> (score each
            opportunity with the Four-Condition Loop Test)
          </label>
```

- [ ] **Step 2: Add the badge in `src/components/audit/AuditCard.tsx`**

Add to imports (after line 2):

```ts
import { Repeat } from "lucide-react";
```

Below the `company` paragraph block (after line 21, inside the `min-w-0` div), add:

```tsx
          {audit.is_loop_audit && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              <Repeat className="h-3 w-3" />
              Loop Audit
            </span>
          )}
```

(Adjust the existing `Building2` import line to keep both icons: `import { Building2, Repeat } from "lucide-react";` — merge rather than duplicate the import.)

- [ ] **Step 3: Verify typecheck + lint + build**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Audits.tsx src/components/audit/AuditCard.tsx
git commit -m "feat(loop-audit): create-as-Loop-Audit toggle + card badge"
```

---

### Task 12: Methodology playbook + wiki updates

**Files:**
- Create: `docs/loop-audit-playbook.md`
- Modify: `docs/wiki/concepts/four-condition-loop-test.md`
- Modify: `docs/wiki/concepts/roi-discovery-audit.md`
- Modify: `docs/wiki/log.md`

**Interfaces:** none (docs only).

- [ ] **Step 1: Write `docs/loop-audit-playbook.md`**

```markdown
# Loop Audit — engagement playbook

How to run Harbormill's signature **paid Loop Audit**: map a prospect's repeating
work, score each task with the Four-Condition Loop Test, and hand them a branded
"build this loop first" recommendation. This is **Rung 2 (Paid audit, $500–$2,500)**
of the Harbormill Ladder, and the motion that sells **Rung 3 (Focused project)**.

The canonical framework lives in `docs/wiki/concepts/four-condition-loop-test.md`.
This doc is the *engagement* wrapper around it.

## The deliverable

A branded Google Doc — the "Loop Audit" report — produced from the in-deck Audits
tool with **Loop Audit** mode on. It leads with the recommended first build, then a
ranked candidate table, then a ledger of every task (including what's blocked and
the single thing that would unblock it).

## Run of show

1. **Discovery (30–45 min).** Walk the prospect's week. For every task done on a
   cadence, capture: what it is, how often, and rough minutes per run.
2. **Score the gate, per task** — the four conditions:
   - **1 · Repeats** (strong / partial / weak): predictable cadence; frequency ×
     time-per-run is the prize.
   - **2 · A rule decides "done"** (yes / no — hard blocker): an objective check
     exists. If "done" needs human taste, it is not loop-ready *yet*.
   - **3 · Afford wasted runs** (strong / partial / weak): failure is cheap and
     reversible; advisory, not high-blast-radius.
   - **4 · AI has data + tools** (yes / no — hard blocker): inputs are reachable and
     the actions exist as tools/integrations.
3. **Rank the candidates** by value-per-effort (annual value × confidence ÷ effort).
4. **Recommend one first build** — the highest value-per-effort candidate — and name
   what would unblock the top *blocked* item next.
5. **Export + present** the Google Doc; use it as the proposal for the Focused
   Project.

## Education-first framing

The rubric is the product as much as the recommendation: teach the operator to spot
their own loop candidates. They leave able to triage new work themselves — "teach
you to fish," not a black box.

## See also

- `docs/wiki/concepts/four-condition-loop-test.md`
- `docs/wiki/concepts/roi-discovery-audit.md`
```

- [ ] **Step 2: Mark surface 2 shipped in `docs/wiki/concepts/four-condition-loop-test.md`**

In the "Three surfaces (one framework)" section, replace the surface-2 bullet (the "**Sales deliverable**" item) with:

```markdown
2. **Sales deliverable (shipped)** — the 4-Condition Test packaged as a paid "Loop
   Audit": run an in-deck audit in **Loop Audit** mode (`is_loop_audit`), score each
   opportunity against the four conditions, and export a branded build-first
   recommendation via the [[Google Workspace Bridge]]. Operationalizes the
   [[ROI-Discovery Audit]]. Engagement playbook: `docs/loop-audit-playbook.md`.
```

Bump the frontmatter `updated:` to `2026-06-20` if not already.

- [ ] **Step 3: Cross-link from `docs/wiki/concepts/roi-discovery-audit.md`**

In its "Notes" section, add a bullet:

```markdown
- **Loop Audit mode** (`is_loop_audit`) extends this surface with the
  [[Four-Condition Loop Test]] gate — same tables, scoring, and Doc export, with a
  per-opportunity gate and a "build-first" recommendation. See
  `docs/loop-audit-playbook.md`.
```

- [ ] **Step 4: Append a `log.md` entry**

At the top of `docs/wiki/log.md` (directly under the `# Wiki Log` header), add:

```markdown
## [2026-06-20] ingest — Loop Audit deliverable (Phase 2)

Shipped surface 2 of the [[Four-Condition Loop Test]]: a paid **Loop Audit** as a
sibling mode of the [[ROI-Discovery Audit]] (`is_loop_audit` + four gate columns,
gate/rank lib, loop report export). Added `docs/loop-audit-playbook.md`; updated the
Four-Condition Loop Test and ROI-Discovery Audit pages.
```

- [ ] **Step 5: Lint the wiki + commit**

Run a quick check that the new `[[wikilinks]]` resolve (`docs/loop-audit-playbook.md` references existing pages only) and that no index entry is needed (the playbook is a `docs/` doc, not a wiki page, so `index.md` is unchanged).

```bash
git add docs/loop-audit-playbook.md docs/wiki/concepts/four-condition-loop-test.md docs/wiki/concepts/roi-discovery-audit.md docs/wiki/log.md
git commit -m "docs(loop-audit): playbook + wiki updates (surface 2 shipped)"
```

---

## Self-Review

**1. Spec coverage**
- Schema (`is_loop_audit` + 4 gate columns) → Task 1. ✓
- Types (`GateScore`, `LoopOutcome`, `LOOP_OUTCOME_LABELS`, field additions) + hook columns → Task 2. ✓
- Lib `isUngated` / `gateOutcome` → Task 3; `recommendFirstBuild` → Task 4; `composeLoopReportMarkdown` → Task 5. ✓
- `LoopGateBadge` (+ `loopGateClass`) → Task 6; form gate controls → Task 7; list badge (+ "needs assessment" for ungated) → Task 8; report strip → Task 9; AuditDetail wiring/export → Task 10; create toggle + card badge → Task 11. ✓
- Playbook + wiki + log → Task 12. ✓
- Non-goals honored: no new feature flag, no RLS/policy change, no `activity` logging, `composeReportMarkdown` untouched, website page deferred. ✓
- Verification gate (typecheck/lint/build/test) embedded in code-touching tasks; unit tests cover all three lib branches. ✓

**2. Placeholder scan:** No TBD/TODO; every code step shows full code. ✓

**3. Type consistency:** `gateOutcome` / `isUngated` / `recommendFirstBuild` / `composeLoopReportMarkdown` signatures are identical across the tasks that define and consume them. `composeLoopReportMarkdown(audit, opps)` is 2-arg everywhere (Task 5 defines it; Task 10 calls it 2-arg). `loopGateClass` / `LoopGateBadge` names match across Tasks 6/7/8. Note: this refines the spec's illustrative 3-arg `composeLoopReportMarkdown(audit, opps, summary)` to 2-arg — the loop report needs candidate-only value, not the full ROI summary, and an unused `summary` param would trip eslint. ✓
