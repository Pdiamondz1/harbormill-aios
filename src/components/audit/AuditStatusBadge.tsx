import { AUDIT_STATUS_LABELS, type AuditStatus } from "@/types/audit";
import { auditStatusClass } from "@/lib/status";
import { cn } from "@/lib/utils";

export function AuditStatusBadge({ status }: { status: AuditStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        auditStatusClass(status)
      )}
    >
      {AUDIT_STATUS_LABELS[status]}
    </span>
  );
}
