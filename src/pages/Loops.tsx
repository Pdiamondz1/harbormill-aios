import { Repeat, Inbox } from "lucide-react";
import { toast } from "sonner";
import { useLoops, useToggleLoop } from "@/hooks/useLoops";
import {
  usePendingLoopActions,
  useApproveLoopAction,
  useSkipLoopAction,
} from "@/hooks/useLoopActions";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { MarkdownProse } from "@/components/MarkdownProse";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { connectorStatusClass } from "@/lib/status";
import { cn } from "@/lib/utils";
import { formatDollars } from "@/types/value";
import type { Loop, LoopAction, LoopType, LoopRunStatus } from "@/types/loops";

const LOOP_TYPE_LABELS: Record<LoopType, string> = {
  ar_followup: "AR follow-up",
};

const RUN_STATUS_LABELS: Record<LoopRunStatus, string> = {
  ok: "OK",
  error: "Error",
  never: "Never run",
};

function formatRelative(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function LoopCard({ loop }: { loop: Loop }) {
  const toggle = useToggleLoop();
  const status = loop.last_status ?? "never";

  const handleToggle = () => {
    toggle.mutate(
      { id: loop.id, enabled: !loop.enabled },
      {
        onSuccess: () =>
          toast.success(loop.enabled ? "Loop disabled" : "Loop enabled"),
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Failed to update loop"),
      }
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-foreground">
            {LOOP_TYPE_LABELS[loop.type] ?? loop.type}
          </h3>
          {loop.schedule_cron && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Schedule:{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
                {loop.schedule_cron}
              </code>
            </p>
          )}
        </div>

        {/* Enabled toggle */}
        <label className="flex items-center gap-2 cursor-pointer shrink-0" aria-label="Enabled">
          <span className="text-xs text-muted-foreground">
            {loop.enabled ? "Enabled" : "Disabled"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={loop.enabled}
            onClick={handleToggle}
            disabled={toggle.isPending}
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              loop.enabled ? "bg-primary" : "bg-input"
            )}
          >
            <span
              className={cn(
                "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
                loop.enabled ? "translate-x-4" : "translate-x-0"
              )}
            />
          </button>
        </label>
      </div>

      {/* Status chip + run info */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
            connectorStatusClass(status)
          )}
        >
          {RUN_STATUS_LABELS[status] ?? status}
        </span>

        {loop.last_run_at && (
          <span className="text-xs text-muted-foreground">
            last run {formatRelative(loop.last_run_at)}
          </span>
        )}

        {loop.next_run_at && (
          <span className="text-xs text-muted-foreground">
            · next {formatRelative(loop.next_run_at)}
          </span>
        )}
      </div>

      {/* Last error */}
      {loop.last_error && (
        <p className="text-xs text-destructive-foreground bg-destructive/10 rounded-lg px-3 py-2 border border-destructive/30">
          {loop.last_error}
        </p>
      )}
    </div>
  );
}

function ActionCard({ action }: { action: LoopAction }) {
  const approve = useApproveLoopAction();
  const skip = useSkipLoopAction();
  const busy = approve.isPending || skip.isPending;
  const recipient =
    typeof action.target.recipient === "string" ? action.target.recipient : "—";

  const handleApprove = () => {
    approve.mutate(action.id, {
      onSuccess: () => toast.success("Reminder approved and sent"),
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Failed to approve"),
    });
  };

  const handleSkip = () => {
    skip.mutate(action.id, {
      onSuccess: () => toast.success("Reminder skipped"),
      onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to skip"),
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">To {recipient}</p>
          <h3 className="font-semibold text-foreground">{action.payload.subject}</h3>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full border border-primary/50 bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {formatDollars(action.value_estimate_cents)}
        </span>
      </div>

      <div className="rounded-lg border border-border bg-background p-3">
        <MarkdownProse>{action.payload.body_md}</MarkdownProse>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSkip}
          isLoading={skip.isPending}
          disabled={busy}
        >
          Skip
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleApprove}
          isLoading={approve.isPending}
          disabled={busy}
        >
          Approve
        </Button>
      </div>
    </div>
  );
}

export default function Loops() {
  const loops = useLoops();
  const actions = usePendingLoopActions();

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Automation"
        title="Loops"
        description="Configure your automation loops and approve the queue of proposed reminders. Nothing reaches a customer without your one-click approval."
      />

      {/* Section 1 — Loops */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Loops
        </h2>
        {loops.isLoading ? (
          <div className="flex min-h-[20vh] items-center justify-center">
            <Spinner className="h-9 w-9" />
          </div>
        ) : loops.isError || !loops.data ? (
          <EmptyState icon={Repeat} title="Couldn't load loops" />
        ) : loops.data.length === 0 ? (
          <EmptyState
            icon={Repeat}
            title="No loops configured"
            description="Loops appear here once they're provisioned for this deployment."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {loops.data.map((loop) => (
              <LoopCard key={loop.id} loop={loop} />
            ))}
          </div>
        )}
      </section>

      {/* Section 2 — Approval queue */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Approval queue
        </h2>
        {actions.isLoading ? (
          <div className="flex min-h-[20vh] items-center justify-center">
            <Spinner className="h-9 w-9" />
          </div>
        ) : actions.isError || !actions.data ? (
          <EmptyState icon={Inbox} title="Couldn't load approval queue" />
        ) : actions.data.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No reminders waiting for approval"
            description="Proposed reminders appear here for review before anything is sent."
          />
        ) : (
          <div className="space-y-3">
            {actions.data.map((action) => (
              <ActionCard key={action.id} action={action} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
