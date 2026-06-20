import { describe, it, expect } from "vitest";
import { summarizeAudit, composeReportMarkdown, isUngated, gateOutcome, recommendFirstBuild, composeLoopReportMarkdown } from "@/lib/audit";
import type { Audit, AuditOpportunity } from "@/types/audit";

const opp = (over: Partial<AuditOpportunity>): AuditOpportunity => ({
  id: "o", audit_id: "a", title: "X", description_md: null, category: "hours_saved",
  annual_value_cents: 0, confidence: "med", effort: "med", loop_repeats: null, loop_done_rule: null, loop_afford_waste: null, loop_has_tools: null, basis_md: null,
  sort_order: 0, created_at: "", updated_at: "", ...over,
});
const audit: Audit = {
  id: "a", prospect_name: "Acme", company: "Acme Co", status: "draft",
  proposed_retainer_cents: 500000, summary_notes: null, is_loop_audit: false, last_export_doc_id: null,
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
    expect(s.annual_fee_cents).toBe(6_000_000);
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
    expect(md).toContain("$60,000");
    expect(md).toMatch(/##? /);
  });
});

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

  it("escapes pipe characters in table cells so the markdown table is not corrupted", () => {
    const cand = opp({ ...pass, title: "Invoice | dunning", annual_value_cents: 3_000_000 });
    const md = composeLoopReportMarkdown({ ...audit, is_loop_audit: true }, [cand]);
    expect(md).toContain("Invoice \\| dunning");
  });
});
