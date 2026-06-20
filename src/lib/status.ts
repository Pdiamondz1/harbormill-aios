import type { MetricStatus } from "@/hooks/useMetrics";
import type { ProjectStatus } from "@/types/project";
import type { AuditStatus } from "@/types/audit";

/** Chip classes for a KPI/metric status. */
export function metricStatusClass(status?: string | null): string {
  switch (status) {
    case "on_track":
      return "border-success/50 bg-success/15 text-success";
    case "at_risk":
      return "border-warning/50 bg-warning/15 text-warning";
    case "off_track":
      return "border-destructive/50 bg-destructive/15 text-destructive-foreground";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

/** Left-border accent for a metric card by status. */
export function metricAccentBorder(status?: MetricStatus | null): string {
  switch (status) {
    case "on_track":
      return "border-l-success";
    case "at_risk":
      return "border-l-warning";
    case "off_track":
      return "border-l-destructive";
    default:
      return "border-l-primary";
  }
}

/** Chip classes for an ROI multiple (≥10x = strong, ≥3x = solid, else muted). */
export function roiClass(multiple: number | null): string {
  if (multiple === null) return "border-border bg-muted text-muted-foreground";
  if (multiple >= 10) return "border-success/50 bg-success/15 text-success";
  if (multiple >= 3) return "border-primary/50 bg-primary/15 text-primary";
  return "border-warning/50 bg-warning/15 text-warning";
}

/** Chip classes for a project status. */
export function projectStatusClass(status: ProjectStatus): string {
  switch (status) {
    case "active":
      return "border-success/50 bg-success/15 text-success";
    case "blocked":
      return "border-destructive/50 bg-destructive/15 text-destructive-foreground";
    case "done":
      return "border-primary/50 bg-primary/15 text-primary";
    default: // planned
      return "border-border bg-muted text-muted-foreground";
  }
}

/** Chip classes for an audit status. */
export function auditStatusClass(status: AuditStatus): string {
  switch (status) {
    case "won": return "border-success/50 bg-success/15 text-success";
    case "lost": return "border-destructive/50 bg-destructive/15 text-destructive-foreground";
    case "presented": return "border-primary/50 bg-primary/15 text-primary";
    default: return "border-border bg-muted text-muted-foreground";
  }
}

/** Badge classes for a finding severity. */
export function severityClass(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-destructive text-destructive-foreground";
    case "high":
      return "bg-warning text-background";
    case "medium":
      return "bg-secondary text-secondary-foreground";
    default:
      return "bg-accent text-accent-foreground";
  }
}
