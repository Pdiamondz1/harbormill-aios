import { Gauge } from "lucide-react";
import { useMetrics } from "@/hooks/useMetrics";
import { useActivity } from "@/hooks/useActivity";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { Spinner } from "@/components/ui/spinner";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import { ValueDeliveredCard } from "@/components/value/ValueDeliveredCard";
import { features } from "@/config/features";

export default function Overview() {
  const { data: metrics, isLoading, isError } = useMetrics();
  const { data: activity = [] } = useActivity(8);

  return (
    <div>
      <PageHeader
        eyebrow="Operating deck"
        title="Overview"
        description="Live metrics for the business, pushed in by your scheduled agents."
      />

      {features.value && (
        <div className="mb-6">
          <ValueDeliveredCard />
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="h-9 w-9" />
        </div>
      ) : isError ? (
        <EmptyState icon={Gauge} title="Couldn't load metrics" description="Check your connection and try again." />
      ) : !metrics || metrics.length === 0 ? (
        <EmptyState
          icon={Gauge}
          title="No metrics yet"
          description="Once a scheduled agent pushes snapshots through the report-ingest endpoint, your KPIs appear here."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {metrics.map((m) => (
            <StatCard key={m.key} metric={m} />
          ))}
        </div>
      )}

      {activity.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-bold text-foreground">Recent activity</h2>
          <div className="rounded-xl border border-border bg-card p-4">
            <ActivityTimeline items={activity} />
          </div>
        </section>
      )}
    </div>
  );
}
