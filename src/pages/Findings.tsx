import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export default function Findings() {
  return (
    <div>
      <PageHeader
        eyebrow="Operating deck"
        title="Findings"
        description="Issues and regressions surfaced by your sweep agents."
      />
      <EmptyState
        icon={AlertTriangle}
        title="No open findings"
        description="Findings appear here as sweep agents report them. Resolved items reopen on recurrence."
      />
    </div>
  );
}
