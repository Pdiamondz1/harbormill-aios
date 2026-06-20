import { useState } from "react";
import { Plug, Plus } from "lucide-react";
import { useConnectors } from "@/hooks/useConnectors";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { ConnectorCard } from "@/components/connectors/ConnectorCard";
import { ConnectorForm } from "@/components/connectors/ConnectorForm";
import type { Connector } from "@/types/connector";

export default function Connectors() {
  const { data, isLoading, isError } = useConnectors();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Connector | undefined>(undefined);

  const openCreate = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  const openEdit = (connector: Connector) => {
    setEditing(connector);
    setFormOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditing(undefined);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Integrations"
        title="Connectors"
        description="Data connectors pull live metrics into the dashboard on a schedule. Each connector runs as a Supabase edge function triggered by pg_cron."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add connector
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="h-9 w-9" />
        </div>
      ) : isError || !data ? (
        <EmptyState icon={Plug} title="Couldn't load connectors" />
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Plug className="h-6 w-6" />
          </span>
          <p className="text-sm font-semibold text-foreground">No connectors yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Add a connector to start pulling live metrics into the dashboard automatically.
          </p>
          <Button size="sm" className="mt-4" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add connector
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((connector) => (
            <ConnectorCard
              key={connector.id}
              connector={connector}
              onEdit={openEdit}
            />
          ))}
        </div>
      )}

      <ConnectorForm
        connector={editing}
        open={formOpen}
        onOpenChange={handleOpenChange}
      />
    </div>
  );
}
