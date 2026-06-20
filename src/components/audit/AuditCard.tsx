import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";
import type { Audit } from "@/types/audit";
import { formatDollars } from "@/types/value";
import { AuditStatusBadge } from "@/components/audit/AuditStatusBadge";

export function AuditCard({ audit }: { audit: Audit }) {
  return (
    <Link
      to={`/audits/${audit.id}`}
      className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-foreground">{audit.prospect_name}</h3>
          {audit.company && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              {audit.company}
            </p>
          )}
        </div>
        <AuditStatusBadge status={audit.status} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">Proposed retainer</span>
        <span className="tnum text-sm font-semibold text-foreground">
          {formatDollars(audit.proposed_retainer_cents)}/mo
        </span>
      </div>
    </Link>
  );
}
