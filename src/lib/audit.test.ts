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
