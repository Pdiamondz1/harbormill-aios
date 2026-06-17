import type { Metric } from "@/hooks/useMetrics";
import { metricAccentBorder } from "@/lib/status";

export function StatCard({ metric }: { metric: Metric }) {
  return (
    <div
      className={`rounded-xl border border-l-2 border-border bg-card p-4 shadow-card-sm ${metricAccentBorder(
        metric.status
      )}`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {metric.label}
      </p>
      <p className="tnum mt-1 text-3xl font-bold text-foreground">
        {metric.value}
        {metric.unit && (
          <span className="ml-1 text-base font-medium text-muted-foreground">{metric.unit}</span>
        )}
      </p>
      {metric.target && (
        <p className="mt-1 text-xs text-muted-foreground">Target: {metric.target}</p>
      )}
    </div>
  );
}
