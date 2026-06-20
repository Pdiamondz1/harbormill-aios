import { describe, it, expect } from "vitest";
import { summarizeAudit, composeReportMarkdown, isUngated, gateOutcome } from "@/lib/audit";
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
