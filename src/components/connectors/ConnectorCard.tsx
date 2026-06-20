import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { Connector } from "@/types/connector";
import { CONNECTOR_TYPE_LABELS, CONNECTOR_SECRET_ENV } from "@/types/connector";
import { useSaveConnector, useSyncConnector } from "@/hooks/useConnectors";
import { connectorStatusClass } from "@/lib/status";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<string, string> = {
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

interface Props {
  connector: Connector;
  onEdit: (connector: Connector) => void;
}

export function ConnectorCard({ connector, onEdit }: Props) {
  const save = useSaveConnector();
  const sync = useSyncConnector();

  const handleToggle = () => {
    save.mutate({ id: connector.id, input: { enabled: !connector.enabled } });
  };

  const handleSync = () => {
    sync.mutate(connector.id, {
      onSuccess: (r) => {
        if (r?.status === "error") {
          toast.error(r.error ?? "Sync failed");
        } else {
          toast.success(`Synced: ${r?.inserted ?? 0} metrics inserted`);
        }
      },
      onError: (e) => {
        toast.error(e instanceof Error ? e.message : "Sync failed");
      },
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-foreground">{connector.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {CONNECTOR_TYPE_LABELS[connector.type]}
          </p>
        </div>

        {/* Enabled toggle */}
        <label className="flex items-center gap-2 cursor-pointer shrink-0" aria-label="Enabled">
          <span className="text-xs text-muted-foreground">
            {connector.enabled ? "Enabled" : "Disabled"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={connector.enabled}
            onClick={handleToggle}
            disabled={save.isPending}
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              connector.enabled ? "bg-primary" : "bg-input"
            )}
          >
            <span
              className={cn(
                "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
                connector.enabled ? "translate-x-4" : "translate-x-0"
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
            connectorStatusClass(connector.last_status)
          )}
        >
          {STATUS_LABELS[connector.last_status] ?? connector.last_status}
        </span>

        {connector.last_run_at && (
          <span className="text-xs text-muted-foreground">
            {formatRelative(connector.last_run_at)}
          </span>
        )}

        {connector.last_result?.inserted !== undefined && (
          <span className="text-xs text-muted-foreground">
            · {connector.last_result.inserted} inserted
          </span>
        )}
      </div>

      {/* Last error */}
      {connector.last_error && (
        <p className="text-xs text-destructive-foreground bg-destructive/10 rounded-lg px-3 py-2 border border-destructive/30">
          {connector.last_error}
        </p>
      )}

      {/* Secret hint */}
      <p className="text-xs text-muted-foreground">
        API key env:{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
          {CONNECTOR_SECRET_ENV[connector.type]}
        </code>
      </p>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSync}
          isLoading={sync.isPending}
          disabled={sync.isPending}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Sync now
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onEdit(connector)}
        >
          Edit
        </Button>
      </div>
    </div>
  );
}
