import { Gauge } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export default function Overview() {
  return (
    <div>
      <PageHeader
        eyebrow="Operating deck"
        title="Overview"
        description="Live metrics for the business, pushed in by your scheduled agents."
      />
      <EmptyState
        icon={Gauge}
        title="No metrics yet"
        description="Once a scheduled agent pushes snapshots through the report-ingest endpoint, your KPIs appear here."
      />
    </div>
  );
}
