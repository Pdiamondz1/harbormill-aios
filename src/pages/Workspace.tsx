import { useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  Sheet as SheetIcon,
  Presentation,
  FolderOpen,
  ExternalLink,
  Pencil,
  Trash2,
  Plug,
  TableProperties,
} from "lucide-react";
import {
  useGoogleConnection,
  useConnectGoogle,
  useDisconnectGoogle,
  useWorkspaceFiles,
  useCreateWorkspaceFile,
  useRenameWorkspaceFile,
  useTrashWorkspaceFile,
  useExportMetricsToSheet,
  type WorkspaceFile,
  type WorkspaceFileKind,
} from "@/hooks/useGoogleWorkspace";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

function fileIcon(mimeType: string) {
  if (mimeType.includes("spreadsheet")) return SheetIcon;
  if (mimeType.includes("presentation")) return Presentation;
  return FileText;
}

const KINDS: { kind: WorkspaceFileKind; label: string }[] = [
  { kind: "doc", label: "Doc" },
  { kind: "sheet", label: "Sheet" },
  { kind: "slides", label: "Slides" },
];

export default function Workspace() {
  const connection = useGoogleConnection();
  const connect = useConnectGoogle();
  const disconnect = useDisconnectGoogle();
  const files = useWorkspaceFiles();
  const createFile = useCreateWorkspaceFile();
  const renameFile = useRenameWorkspaceFile();
  const trashFile = useTrashWorkspaceFile();
  const exportMetrics = useExportMetricsToSheet();
  const [newName, setNewName] = useState("");

  const connected = connection.data?.connected;

  const onCreate = (kind: WorkspaceFileKind) => {
    const name = newName.trim() || `Untitled ${kind}`;
    createFile.mutate(
      { kind, name },
      {
        onSuccess: () => setNewName(""),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Create failed"),
      }
    );
  };

  const onRename = (file: WorkspaceFile) => {
    const name = window.prompt("Rename file", file.name)?.trim();
    if (!name || name === file.name) return;
    renameFile.mutate({ fileId: file.id, name }, { onError: (e) => toast.error(String(e)) });
  };

  const onTrash = (file: WorkspaceFile) => {
    if (!window.confirm(`Move "${file.name}" to Trash?`)) return;
    trashFile.mutate(file.id, { onError: (e) => toast.error(String(e)) });
  };

  const onExportMetrics = () => {
    exportMetrics.mutate(undefined, {
      onSuccess: (r) =>
        toast.success(`Exported ${r.rows} metrics to Sheet`, {
          action: r.link ? { label: "Open", onClick: () => window.open(r.link, "_blank", "noopener") } : undefined,
        }),
      onError: (e) => toast.error(e instanceof Error ? e.message : "Export failed"),
    });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Connections"
        title="Workspace"
        description="Connect Google to browse Drive and export metrics and briefs."
        actions={
          connected ? (
            <Button variant="outline" size="sm" onClick={() => disconnect.mutate()} disabled={disconnect.isPending}>
              <Plug className="h-4 w-4" />
              {disconnect.isPending ? "Disconnecting…" : "Disconnect"}
            </Button>
          ) : undefined
        }
      />

      {connection.isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="h-9 w-9" />
        </div>
      ) : !connected ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <FolderOpen className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-semibold text-foreground">
            {connection.data?.needs_reconnect ? "Reconnect Google" : "Connect Google"}
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Connect your Google account to browse the deck's Drive folder and export metrics and briefs. Only files this
            app creates are ever visible.
          </p>
          <Button className="mt-5" onClick={() => connect.mutate()} disabled={connect.isPending}>
            {connect.isPending ? "Redirecting…" : "Connect Google"}
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-success/15 text-success">
                <Plug className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Connected</p>
                <p className="text-xs text-muted-foreground">{connection.data?.google_email}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onExportMetrics} disabled={exportMetrics.isPending}>
              <TableProperties className="h-4 w-4" />
              {exportMetrics.isPending ? "Exporting…" : "Export metrics to Sheet"}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New file name"
              className="h-9 max-w-xs"
            />
            {KINDS.map(({ kind, label }) => (
              <Button key={kind} variant="secondary" size="sm" onClick={() => onCreate(kind)} disabled={createFile.isPending}>
                New {label}
              </Button>
            ))}
          </div>

          {files.isLoading ? (
            <div className="flex min-h-[20vh] items-center justify-center">
              <Spinner className="h-8 w-8" />
            </div>
          ) : !files.data || files.data.length === 0 ? (
            <EmptyState icon={FolderOpen} title="No files yet" description="Create a Doc, Sheet, or Slides to get started." />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {files.data.map((file) => {
                const Icon = fileIcon(file.mimeType);
                return (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0 hover:bg-muted/50"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">{file.name}</span>
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      {new Date(file.modifiedTime).toLocaleDateString()}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          aria-label="Open"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => onRename(file)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        aria-label="Rename"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onTrash(file)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive-foreground"
                        aria-label="Trash"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
