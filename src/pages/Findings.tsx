import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  useFindings,
  useUpdateFindingStatus,
  type Finding,
  type FindingStatus,
} from "@/hooks/useFindings";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { MarkdownProse } from "@/components/MarkdownProse";
import { Spinner } from "@/components/ui/spinner";
import { severityClass } from "@/lib/status";
import { cn } from "@/lib/utils";

const STATUSES: FindingStatus[] = ["open", "acknowledged", "resolved", "wontfix"];
const STATUS_LABELS: Record<FindingStatus, string> = {
  open: "Open",
  acknowledged: "Acknowledged",
  resolved: "Resolved",
  wontfix: "Won't fix",
};

function FindingCard({ finding }: { finding: Finding }) {
  const updateStatus = useUpdateFindingStatus();
  const [expanded, setExpanded] = useState(false);
  const hasEvidence = Object.keys(finding.evidence ?? {}).length > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-bold uppercase",
                severityClass(finding.severity)
              )}
            >
              {finding.severity}
            </span>
            <h3 className="font-semibold text-foreground">{finding.title}</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {finding.source} · seen {finding.occurrences}×, last{" "}
            {new Date(finding.last_seen_at).toLocaleString()}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={updateStatus.isPending || finding.status === s}
              onClick={() => updateStatus.mutate({ id: finding.id, status: s })}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:cursor-default",
                finding.status === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              )}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <MarkdownProse>{finding.summary_md}</MarkdownProse>
      </div>

      {hasEvidence && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-semibold text-primary"
          >
            {expanded ? "Hide evidence" : "Show evidence"}
          </button>
          {expanded && (
            <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-background p-3 text-xs text-secondary">
              {JSON.stringify(finding.evidence, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default function Findings() {
  const { data, isLoading, isError } = useFindings();
  const [filter, setFilter] = useState<FindingStatus | "all">("open");

  const filtered = useMemo(() => {
    const list = data ?? [];
    return filter === "all" ? list : list.filter((f) => f.status === filter);
  }, [data, filter]);

  return (
    <div>
      <PageHeader
        eyebrow="Operating deck"
        title="Findings"
        description="Issues and regressions surfaced by your sweep agents. Triage here; fixes ship through your normal process."
      />

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="h-9 w-9" />
        </div>
      ) : isError || !data ? (
        <EmptyState icon={AlertTriangle} title="Couldn't load findings" />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {(["open", "acknowledged", "resolved", "wontfix", "all"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                  filter === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {s === "all" ? "All" : STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title={filter === "open" ? "No open findings" : "Nothing with this status"}
              description={
                filter === "open"
                  ? "Findings appear here as sweep agents report them. Resolved items reopen on recurrence."
                  : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((f) => (
                <FindingCard key={f.id} finding={f} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
