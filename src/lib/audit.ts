import type { Audit, AuditOpportunity, AuditSummary, OpportunityCategory, LoopOutcome, GateScore } from "@/types/audit";
import { VALUE_CATEGORY_LABELS, formatDollars } from "@/types/value";
import { AUDIT_STATUS_LABELS, LOOP_OUTCOME_LABELS } from "@/types/audit";

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

/** The single recommended first build: top candidate by value-per-effort, else null. */
export function recommendFirstBuild(opps: AuditOpportunity[]): AuditOpportunity | null {
  const candidates = opps.filter((o) => gateOutcome(o) === "candidate");
  return candidates.length ? prioritize(candidates)[0] : null;
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

const gateScoreCell = (v: GateScore | null) => v ?? "—";
const ynCell = (v: boolean | null) => (v === true ? "yes" : v === false ? "no" : "—");
const tableCell = (s: string) => s.replace(/\|/g, "\\|");

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
      `| ${i + 1} | ${tableCell(o.title)} | ${tableCell(VALUE_CATEGORY_LABELS[o.category])} | ${formatDollars(o.annual_value_cents)}/yr | ${o.confidence} | ${o.effort} |`
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
