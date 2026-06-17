import type { ReactNode } from "react";
import { LayoutDashboard, FileText, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type StepKey = "overview" | "briefing" | "aria";

const NAV: { key: StepKey | "findings"; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "briefing", label: "Briefings", icon: FileText },
  { key: "findings", label: "Findings", icon: AlertTriangle },
  { key: "aria", label: "Assistant", icon: Sparkles },
];

/** Faux Harbormill AIOS app chrome (top bar + nav rail) wrapping a demo step. */
export function DemoFrame({ active, children }: { active: StepKey; children: ReactNode }) {
  return (
    <div className="glass glow overflow-hidden rounded-2xl border border-border shadow-card-lg">
      {/* top bar */}
      <div className="flex items-center gap-3 border-b border-border bg-card/80 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-destructive/70" />
          <span className="h-3 w-3 rounded-full bg-warning/70" />
          <span className="h-3 w-3 rounded-full bg-success/70" />
        </div>
        <div className="flex items-center gap-2">
          <img src="/emblem.svg" alt="" className="h-5 w-5" />
          <span className="text-sm font-semibold">Harbormill AIOS</span>
        </div>
      </div>

      <div className="flex">
        {/* nav rail */}
        <aside className="hidden w-44 shrink-0 border-r border-border bg-card/40 p-3 sm:block">
          <nav className="space-y-1">
            {NAV.map((item) => {
              const isActive = item.key === active;
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm",
                    isActive
                      ? "bg-primary/15 font-medium text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* content */}
        <div className="min-h-[420px] flex-1 bg-background/40 p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
