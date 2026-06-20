import type { Audit, AuditOpportunity, AuditSummary, OpportunityCategory, LoopOutcome } from "@/types/audit";
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
