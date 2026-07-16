import { DEMO_VALUE } from "@/config/demoData";

/** Mirrors the product's Value-Delivered surface: ROI this month measured against the fee. */
export function ValueStep() {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Value delivered</h3>
        <p className="text-sm text-muted-foreground">
          What the automation is worth — measured against what you pay
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-l-2 border-border border-l-success bg-card p-4 shadow-card-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Value this month
          </p>
          <p className="tnum mt-1 text-2xl font-bold text-foreground sm:text-3xl">
            {DEMO_VALUE.thisMonth}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Last month: {DEMO_VALUE.lastMonth}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-card-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Monthly retainer
          </p>
          <p className="tnum mt-1 text-2xl font-bold text-foreground sm:text-3xl">
            {DEMO_VALUE.retainer}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">What you pay</p>
        </div>
        <div className="rounded-xl border border-l-2 border-border border-l-success bg-card p-4 shadow-card-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            ROI this month
          </p>
          <p className="tnum mt-1 text-2xl font-bold text-success sm:text-3xl">
            {DEMO_VALUE.roiMultiple}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Value ÷ fee</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-card-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Cumulative
          </p>
          <p className="tnum mt-1 text-2xl font-bold text-foreground sm:text-3xl">
            {DEMO_VALUE.cumulative}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Since launch</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card/60 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          This month's value events
        </p>
        <ul className="mt-3 space-y-2">
          {DEMO_VALUE.events.map((event) => (
            <li key={event.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">{event.category}:</span> {event.label}
              </span>
              <span className="tnum shrink-0 font-semibold text-success">{event.amount}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
