import { FolderOpen } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export default function Workspace() {
  return (
    <div>
      <PageHeader
        eyebrow="Connections"
        title="Workspace"
        description="Connect Google to browse Drive and export metrics and briefs."
      />
      <EmptyState
        icon={FolderOpen}
        title="Google not connected"
        description="Once connected, your Drive files appear here and the deck can export snapshots to Sheets and Docs."
      />
    </div>
  );
}
