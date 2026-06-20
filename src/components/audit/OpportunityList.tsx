import { Pencil, Trash2 } from "lucide-react";
import type { AuditOpportunity } from "@/types/audit";
import { VALUE_CATEGORY_LABELS, formatDollars } from "@/types/value";
import { useDeleteOpportunity } from "@/hooks/useAudits";
import { prioritize } from "@/lib/audit";
import { Button } from "@/components/ui/button";

interface Props {
  auditId: string;
  opportunities: AuditOpportunity[];
  onEdit: (o: AuditOpportunity) => void;
}

export function OpportunityList({ auditId, opportunities, onEdit }: Props) {
  const deleteOpp = useDeleteOpportunity(auditId);

  if (opportunities.length === 0) {
    return <p className="text-sm text-muted-foreground">No opportunities yet.</p>;
  }

  const sorted = prioritize(opportunities);

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {sorted.map((o) => (
        <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{o.title}</p>
            <p className="text-xs text-muted-foreground">
              {VALUE_CATEGORY_LABELS[o.category as keyof typeof VALUE_CATEGORY_LABELS]} ·{" "}
              confidence {o.confidence} · effort {o.effort}
            </p>
          </div>

          <span className="tnum shrink-0 text-sm font-semibold text-foreground">
            {formatDollars(o.annual_value_cents)}/yr
          </span>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(o)}
              aria-label="Edit opportunity"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => deleteOpp.mutate(o.id)}
              disabled={deleteOpp.isPending}
              aria-label="Delete opportunity"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
