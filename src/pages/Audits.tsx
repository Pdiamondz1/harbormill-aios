import { useState } from "react";
import { ClipboardList, Plus } from "lucide-react";
import { useAudits, useSaveAudit } from "@/hooks/useAudits";
import { useAccess } from "@/hooks/useAccess";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { AuditCard } from "@/components/audit/AuditCard";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const labelClass = "mb-1 block text-xs font-semibold text-muted-foreground";

export default function Audits() {
  const { data, isLoading, isError } = useAudits();
  const { isAdmin } = useAccess();
  const saveAudit = useSaveAudit();
  const [creating, setCreating] = useState(false);

  // Create form state
  const [prospectName, setProspectName] = useState("");
  const [company, setCompany] = useState("");
  const [retainerDollars, setRetainerDollars] = useState("5000");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prospectName.trim()) return;
    const proposed_retainer_cents = Math.round((Number(retainerDollars) || 0) * 100);
    saveAudit.mutate(
      {
        input: {
          prospect_name: prospectName.trim(),
          company: company.trim() || null,
          proposed_retainer_cents,
        },
      },
      {
        onSuccess: () => {
          setCreating(false);
          setProspectName("");
          setCompany("");
          setRetainerDollars("5000");
        },
      }
    );
  };

  const handleCancelCreate = () => {
    setCreating(false);
    setProspectName("");
    setCompany("");
    setRetainerDollars("5000");
  };

  return (
    <div>
      <PageHeader
        eyebrow="Prospecting"
        title="Audits"
        description="ROI-discovery audits — map a prospect's workflow, identify automation opportunities, and build the business case for an engagement."
        actions={
          isAdmin && !creating ? (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              New audit
            </Button>
          ) : undefined
        }
      />

      {isAdmin && creating && (
        <form
          onSubmit={handleCreate}
          className="mb-4 space-y-3 rounded-xl border border-border bg-card p-4"
        >
          <div>
            <label className={labelClass} htmlFor="audit-prospect">
              Prospect name <span className="text-destructive">*</span>
            </label>
            <input
              id="audit-prospect"
              className={inputClass}
              value={prospectName}
              onChange={(e) => setProspectName(e.target.value)}
              placeholder="e.g. Jane Smith"
              required
              autoFocus
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="audit-company">
              Company <span className="font-normal">(optional)</span>
            </label>
            <input
              id="audit-company"
              className={inputClass}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Roofing"
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="audit-retainer">
              Proposed retainer ($/mo)
            </label>
            <input
              id="audit-retainer"
              type="number"
              min={0}
              step="1"
              className={inputClass}
              value={retainerDollars}
              onChange={(e) => setRetainerDollars(e.target.value)}
              placeholder="5000"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleCancelCreate}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={saveAudit.isPending}
              disabled={!prospectName.trim()}
            >
              Create audit
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="h-9 w-9" />
        </div>
      ) : isError || !data ? (
        <EmptyState icon={ClipboardList} title="Couldn't load audits" />
      ) : data.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No audits yet"
          description={
            isAdmin ? "Create your first audit to start building the ROI case." : undefined
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((audit) => (
            <AuditCard key={audit.id} audit={audit} />
          ))}
        </div>
      )}
    </div>
  );
}
