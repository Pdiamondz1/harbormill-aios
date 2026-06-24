// Pure, import-free breach-derivation for the KPI-watch loop.
// Maps metric_latest rows -> report-ingest finding payloads. No I/O — unit-tested in isolation.

export interface MetricRow {
  key: string;
  label: string;
  value: string;
  unit: string | null;
  target: string | null;
  status: string | null; // 'on_track' | 'at_risk' | 'off_track' | null
  captured_at: string;
}

export interface FindingPayload {
  severity: "high" | "medium";
  title: string;
  summary_md: string;
  evidence: Record<string, unknown>;
  source: "kpi-watch";
  fingerprint: string;
}

const STATUS_WORD: Record<string, string> = { off_track: "off target", at_risk: "at risk" };
const SEVERITY: Record<string, "high" | "medium"> = { off_track: "high", at_risk: "medium" };

/** Pure: metric_latest rows -> finding payloads for every breaching KPI (status != on_track). */
export function deriveBreachFindings(metrics: MetricRow[]): FindingPayload[] {
  const findings: FindingPayload[] = [];
  for (const m of metrics ?? []) {
    const status = m.status ?? "";
    if (status !== "at_risk" && status !== "off_track") continue;

    const word = STATUS_WORD[status];
    const valueDisplay = m.unit ? `${m.value} ${m.unit}` : `${m.value}`;
    const targetClause = m.target ? ` vs target **${m.target}**` : " (no target set)";

    const evidence: Record<string, unknown> = {
      key: m.key,
      value: m.value,
      status,
      captured_at: m.captured_at,
    };
    if (m.unit) evidence.unit = m.unit;
    if (m.target) evidence.target = m.target;

    findings.push({
      severity: SEVERITY[status],
      title: `KPI ${word}: ${m.label}`,
      summary_md:
        `**${m.label}** is ${word}. Latest **${valueDisplay}**${targetClause} ` +
        `(as of ${m.captured_at}). Auto-maintained by the KPI-watch loop while the metric is off track.`,
      evidence,
      source: "kpi-watch",
      fingerprint: `kpi-breach:${m.key}`,
    });
  }
  return findings;
}
