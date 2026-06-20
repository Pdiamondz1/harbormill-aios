import { TrendingUp } from "lucide-react";
import type { Audit, AuditOpportunity } from "@/types/audit";
import { formatDollars } from "@/types/value";
import { summarizeAudit } from "@/lib/audit";
import { roiClass } from "@/lib/status";
import { cn } from "@/lib/utils";

interface Props {
  audit: Audit;
  opportunities: AuditOpportunity[];
}

// Hero card showing projected annual value and ROI multiple vs. the proposed
// retainer. Mirrors ValueDeliveredCard's hero styling with token-based classes.
export function OpportunityReport({ audit, opportunities }: Props) {
  const summary = summarizeAudit(opportunities, audit.proposed_retainer_cents);

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
            Projected annual value
          </p>
          <p className="tnum mt-1 text-4xl font-bold text-foreground">
            {formatDollars(summary.total_annual_cents)}
            <span className="ml-1 text-xl font-semibold text-muted-foreground">/yr</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Annual fee {formatDollars(summary.annual_fee_cents)}
          </p>
        </div>

        {summary.roi_multiple !== null && (
          <div className="text-right">
            <span
              className={cn(
                "inline-flex items-baseline gap-1 rounded-full border px-3 py-1 text-sm font-bold",
                roiClass(summary.roi_multiple)
              )}
            >
              {summary.roi_multiple}× your fee
            </span>
            <p className="mt-1 text-xs text-muted-foreground">
              on {formatDollars(audit.proposed_retainer_cents)}/mo
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
