import { DEMO_METRICS } from "@/config/demoData";
import { metricAccentBorder } from "@/lib/status";

/** Mirrors the product's Overview grid + StatCard markup. */
export function OverviewStep() {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Overview</h3>
        <p className="text-sm text-muted-foreground">Live business metrics at a glance</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {DEMO_METRICS.map((metric) => (
          <div
            key={metric.key}
            className={`rounded-xl border border-l-2 border-border bg-card p-4 shadow-card-sm ${metricAccentBorder(
              metric.status
            )}`}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {metric.label}
            </p>
            <p className="tnum mt-1 text-2xl font-bold text-foreground sm:text-3xl">
              {metric.value}
              {metric.unit && (
                <span className="ml-1 text-base font-medium text-muted-foreground">
                  {metric.unit}
                </span>
              )}
            </p>
            {metric.target && (
              <p className="mt-1 text-xs text-muted-foreground">Target: {metric.target}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
