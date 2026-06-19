import { VALUE_CATEGORY_LABELS, formatDollars, type ValueEvent } from "@/types/value";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ValueEventList({ events }: { events: ValueEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No value logged yet.</p>;
  }
  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {events.map((e) => (
        <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{e.label}</p>
            <p className="text-xs text-muted-foreground">
              {VALUE_CATEGORY_LABELS[e.category]} · {formatDate(e.occurred_at)}
              {e.source !== "manual" && ` · ${e.source}`}
            </p>
          </div>
          <span className="tnum shrink-0 text-sm font-semibold text-foreground">
            {formatDollars(e.amount_cents)}
          </span>
        </li>
      ))}
    </ul>
  );
}
