import { useNavigate } from "react-router-dom";

export interface ActionChip {
  label: string;
  route: string;
}

// Route-based action chips surfaced by an assistant reply. Each chip navigates
// to the given route via React Router. Token-based styling only.
export function AriaActionChips({ chips }: { chips: ActionChip[] }) {
  const navigate = useNavigate();
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 px-1 pt-1">
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => navigate(chip.route)}
          className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
