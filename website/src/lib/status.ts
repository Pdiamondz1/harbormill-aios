import type { MetricStatus } from "@/config/demoData";

/** Left-border accent for a metric card by status (mirrors the AIOS product). */
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

/** Chip classes for a KPI/metric status. */
export function metricStatusClass(status?: MetricStatus | null): string {
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
