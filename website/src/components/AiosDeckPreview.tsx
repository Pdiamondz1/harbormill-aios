import { DEMO_METRICS } from "@/config/demoData";
import { metricAccentBorder } from "@/lib/status";

/** Static, glowing mini-deck for the hero — a glimpse of the AIOS Overview. */
export function AiosDeckPreview() {
  const metrics = DEMO_METRICS.slice(0, 4);
  return (
    <div className="glass glow rounded-2xl border border-border p-4 shadow-card-lg sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/emblem.svg" alt="" className="h-5 w-5" />
          <span className="text-sm font-semibold">Harbormill AIOS</span>
        </div>
        <span className="rounded-full border border-success/40 bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">
          Live
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {metrics.map((m) => (
          <div
            key={m.key}
            className={`rounded-lg border border-l-2 border-border bg-card p-3 shadow-card-sm ${metricAccentBorder(
              m.status
            )}`}
          >
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {m.label}
            </p>
            <p className="tnum mt-0.5 text-xl font-bold">
              {m.value}
              {m.unit && (
                <span className="ml-0.5 text-xs font-medium text-muted-foreground">{m.unit}</span>
              )}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-2.5 rounded-lg border border-border bg-card p-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-primary">
          This week's briefing
        </p>
        <div className="mt-2 space-y-1.5">
          <div className="h-2 w-full rounded-full bg-muted" />
          <div className="h-2 w-4/5 rounded-full bg-muted" />
          <div className="h-2 w-3/5 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
