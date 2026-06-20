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
