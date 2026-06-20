import { LOOP_OUTCOME_LABELS, type LoopOutcome } from "@/types/audit";
import { loopGateClass } from "@/lib/status";
import { cn } from "@/lib/utils";

export function LoopGateBadge({ outcome, className }: { outcome: LoopOutcome; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
        loopGateClass(outcome),
        className
      )}
    >
      {LOOP_OUTCOME_LABELS[outcome]}
    </span>
  );
}
