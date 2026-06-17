import { useState } from "react";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { useBriefings, usePublishBriefing, type BriefingKpi } from "@/hooks/useBriefings";
import { useAccess } from "@/hooks/useAccess";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { MarkdownProse } from "@/components/MarkdownProse";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { metricStatusClass } from "@/lib/status";
import { cn } from "@/lib/utils";

const KpiChip = ({ kpi }: { kpi: BriefingKpi }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
      metricStatusClass(kpi.status)
    )}
  >
    {kpi.label}: {kpi.value}
    {kpi.target && <span className="font-normal opacity-70">/ {kpi.target}</span>}
  </span>
);

function weekLabel(weekStart: string) {
  return new Date(`${weekStart}T00:00:00`).toLocaleDateString();
}

export default function Briefings() {
  const { data: list, isLoading, isError } = useBriefings();
  const { isAdmin } = useAccess();
  const publish = usePublishBriefing();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="h-9 w-9" />
      </div>
    );
  }

  if (isError || !list) {
    return (
      <div>
        <PageHeader eyebrow="Operating deck" title="Briefings" />
        <EmptyState icon={FileText} title="Couldn't load briefings" />
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div>
        <PageHeader eyebrow="Operating deck" title="Briefings" description="AI-written weekly operating briefs." />
        <EmptyState
          icon={FileText}
          title="No briefings yet"
          description="Weekly briefs land here once your brief agent publishes through report-ingest."
        />
      </div>
    );
  }

  const selected = list.find((b) => b.id === selectedId) ?? list[0];

  const onTogglePublish = () => {
    publish.mutate(
      { id: selected.id, publish: !selected.published_at },
      {
        onSuccess: () =>
          toast.success(selected.published_at ? "Brief unpublished" : "Brief published to stakeholders"),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Publish failed"),
      }
    );
  };

  return (
    <div>
      <PageHeader
        eyebrow="Operating deck"
        title="Briefings"
        description="Weekly operating briefs — KPIs vs targets and what changed."
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-72 lg:shrink-0">
          <nav className="overflow-hidden rounded-xl border border-border bg-card">
            {list.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedId(b.id)}
                className={cn(
                  "block w-full border-b border-border px-4 py-2.5 text-left text-sm transition-colors last:border-b-0",
                  selected.id === b.id
                    ? "bg-accent font-semibold text-accent-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <span className="block">{b.title}</span>
                <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  Week of {weekLabel(b.week_start)}
                  {!b.published_at && (
                    <span className="rounded-full bg-warning/20 px-2 py-0.5 font-semibold text-warning">
                      Draft
                    </span>
                  )}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        <article className="min-w-0 flex-1">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">{selected.title}</h2>
                <p className="text-xs text-muted-foreground">
                  Week of {weekLabel(selected.week_start)} · {selected.generated_by}
                  {selected.published_at
                    ? ` · published ${new Date(selected.published_at).toLocaleDateString()}`
                    : " · draft"}
                </p>
              </div>
              {isAdmin && (
                <Button
                  size="sm"
                  variant={selected.published_at ? "outline" : "default"}
                  disabled={publish.isPending}
                  onClick={onTogglePublish}
                >
                  {selected.published_at ? "Unpublish" : "Publish to stakeholders"}
                </Button>
              )}
            </div>

            {selected.kpis.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2">
                {selected.kpis.map((kpi) => (
                  <KpiChip key={kpi.key} kpi={kpi} />
                ))}
              </div>
            )}

            <MarkdownProse>{selected.body_md}</MarkdownProse>
          </div>
        </article>
      </div>
    </div>
  );
}
