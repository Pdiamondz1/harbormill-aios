import { Link } from "react-router-dom";
import { TrendingUp, ArrowRight } from "lucide-react";
import { useValueSummary } from "@/hooks/useValue";
import { formatDollars } from "@/types/value";
import { roiClass } from "@/lib/status";
import { cn } from "@/lib/utils";

// The headline ROI card: value delivered this month + the multiple of the fee.
// The artifact that justifies the retainer and keeps it visible. Links to /value.
export function ValueDeliveredCard({ linkToDetail = true }: { linkToDetail?: boolean }) {
  const { data, isLoading } = useValueSummary();

  if (isLoading || !data) return null;
  if (data.cumulative_cents === 0 && data.this_month_cents === 0) return null;

  const multiple = data.roi_multiple;
  const prev = data.prev_month_cents;
  const delta = prev > 0 ? Math.round(((data.this_month_cents - prev) / prev) * 100) : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card-md">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            Value delivered this month
          </p>
          <p className="tnum mt-1 text-4xl font-bold text-foreground">
            {formatDollars(data.this_month_cents)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDollars(data.cumulative_cents)} delivered to date
            {delta !== null && (
              <span className={cn("ml-2", delta >= 0 ? "text-success" : "text-warning")}>
                {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}% vs last month
              </span>
            )}
          </p>
        </div>

        {multiple !== null && (
          <div className="text-right">
            <span
              className={cn(
                "inline-flex items-baseline gap-1 rounded-full border px-3 py-1 text-sm font-bold",
                roiClass(multiple)
              )}
            >
              {multiple}× your fee
            </span>
            <p className="mt-1 text-xs text-muted-foreground">
              on {formatDollars(data.retainer_cents)}/mo
            </p>
          </div>
        )}
      </div>

      {linkToDetail && (
        <Link
          to="/value"
          className="relative mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          See the breakdown
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
