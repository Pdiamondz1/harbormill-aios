import { Lightbulb } from "lucide-react";

// A contextual tip shown at the top of the tray. Token-based styling only.
export function AriaNudgeCard({ tip }: { tip: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-border bg-accent/40 px-3 py-2.5 text-sm text-foreground">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p className="leading-snug">{tip}</p>
    </div>
  );
}
