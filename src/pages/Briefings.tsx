import { FileText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export default function Briefings() {
  return (
    <div>
      <PageHeader
        eyebrow="Operating deck"
        title="Briefings"
        description="AI-written weekly operating briefs."
      />
      <EmptyState
        icon={FileText}
        title="No briefings yet"
        description="Weekly briefs land here once your brief agent publishes through report-ingest."
      />
    </div>
  );
}
