import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, ExternalLink, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAudit, useSaveAudit } from "@/hooks/useAudits";
import { useExportDoc } from "@/hooks/useGoogleWorkspace";
import { summarizeAudit, composeReportMarkdown } from "@/lib/audit";
import { AUDIT_STATUSES, AUDIT_STATUS_LABELS, type AuditStatus, type AuditOpportunity } from "@/types/audit";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { AuditStatusBadge } from "@/components/audit/AuditStatusBadge";
import { AuditOpportunityForm } from "@/components/audit/AuditOpportunityForm";
import { OpportunityList } from "@/components/audit/OpportunityList";
import { OpportunityReport } from "@/components/audit/OpportunityReport";

const selectClass =
  "rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export default function AuditDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useAudit(id);
  const saveAudit = useSaveAudit();
  const exportDoc = useExportDoc();
  const [addingOpp, setAddingOpp] = useState(false);
  const [editing, setEditing] = useState<AuditOpportunity | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="h-9 w-9" />
      </div>
    );
  }

  if (isError || !data?.audit) {
    return <EmptyState icon={ClipboardList} title="Audit not found" />;
  }

  const { audit, opportunities } = data;

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    saveAudit.mutate({ id: audit.id, input: { status: e.target.value as AuditStatus } });
  };

  const handleExport = () => {
    const summary = summarizeAudit(opportunities, audit.proposed_retainer_cents);
    const md = composeReportMarkdown(audit, opportunities, summary);
    exportDoc.mutate(
      {
        title: `Opportunity Report — ${audit.prospect_name}`,
        markdown: md,
        doc_id: audit.last_export_doc_id,
      },
      {
        onSuccess: ({ file }) => {
          saveAudit.mutate({ id: audit.id, input: { last_export_doc_id: file.id } });
          toast.success("Exported to Google Docs", {
            action: {
              label: "Open",
              onClick: () => window.open(file.webViewLink, "_blank"),
            },
          });
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : "Export failed";
          if (msg.toLowerCase().includes("connect") || msg.toLowerCase().includes("not_connected")) {
            toast.error("Google not connected — connect it on the Workspace page.");
          } else {
            toast.error(msg);
          }
        },
      }
    );
  };

  const handleOppDone = () => {
    setAddingOpp(false);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <Link to="/audits" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
        <ArrowLeft className="h-4 w-4" />
        Audits
      </Link>

      {/* Prospect header */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{audit.prospect_name}</h1>
              <AuditStatusBadge status={audit.status} />
            </div>
            {audit.company && (
              <p className="mt-1 text-sm text-muted-foreground">{audit.company}</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <label htmlFor="audit-status-select" className="sr-only">
              Status
            </label>
            <select
              id="audit-status-select"
              className={selectClass}
              value={audit.status}
              onChange={handleStatusChange}
            >
              {AUDIT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {AUDIT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ROI summary */}
      <OpportunityReport audit={audit} opportunities={opportunities} />

      {/* Add / edit opportunity */}
      {(addingOpp || editing !== null) && (
        <div>
          <h2 className="mb-3 text-sm font-bold text-foreground">
            {editing ? "Edit opportunity" : "Add opportunity"}
          </h2>
          <AuditOpportunityForm
            auditId={audit.id}
            initial={editing ?? undefined}
            onDone={handleOppDone}
          />
        </div>
      )}

      {/* Opportunity list */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-foreground">Opportunities</h2>
          {!addingOpp && editing === null && (
            <Button size="sm" variant="outline" onClick={() => setAddingOpp(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add opportunity
            </Button>
          )}
        </div>
        <OpportunityList
          auditId={audit.id}
          opportunities={opportunities}
          onEdit={(o) => {
            setEditing(o);
            setAddingOpp(false);
          }}
        />
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <Button
          onClick={handleExport}
          isLoading={exportDoc.isPending}
          disabled={opportunities.length === 0 || exportDoc.isPending}
          variant="outline"
        >
          <ExternalLink className="h-4 w-4" />
          Export to Google Doc
        </Button>
      </div>
    </div>
  );
}
