import type { MetricStatus } from "@/hooks/useMetrics";

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
