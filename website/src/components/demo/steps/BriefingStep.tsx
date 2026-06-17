import { DEMO_BRIEFING } from "@/config/demoData";
import { metricStatusClass } from "@/lib/status";
import { MarkdownProse } from "@/components/MarkdownProse";

/** A canned weekly operating brief, rendered like the product's Briefings page. */
export function BriefingStep() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-border bg-card p-5 shadow-card-sm sm:p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">
          {DEMO_BRIEFING.week}
        </p>
        <h3 className="mt-1 text-xl font-bold">{DEMO_BRIEFING.title}</h3>

        <div className="mt-4 flex flex-wrap gap-2">
          {DEMO_BRIEFING.kpis.map((kpi) => (
            <span
              key={kpi.label}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${metricStatusClass(
                kpi.status
              )}`}
            >
              {kpi.label}
              <span className="tnum font-semibold">{kpi.value}</span>
            </span>
          ))}
        </div>

        <div className="mt-5 border-t border-border pt-5">
          <MarkdownProse>{DEMO_BRIEFING.body}</MarkdownProse>
        </div>
      </div>
    </div>
  );
}
