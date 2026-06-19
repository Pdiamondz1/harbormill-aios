import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/types/project";
import { projectStatusClass } from "@/lib/status";
import { cn } from "@/lib/utils";

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        projectStatusClass(status)
      )}
    >
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}
