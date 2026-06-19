import type { QuickChip } from "@/types/aria";

// One-tap suggested prompts. Token-based styling only.
export function AriaQuickChips({
  chips,
  onPick,
}: {
  chips: QuickChip[];
  onPick: (prompt: string) => void;
}) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => onPick(chip.prompt)}
          className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
