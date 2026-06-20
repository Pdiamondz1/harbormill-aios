import { useState } from "react";
import { VALUE_CATEGORIES, VALUE_CATEGORY_LABELS, type ValueCategory } from "@/types/value";
import { type Confidence, type Effort, type AuditOpportunity } from "@/types/audit";
import { useSaveOpportunity } from "@/hooks/useAudits";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const labelClass = "mb-1 block text-xs font-semibold text-muted-foreground";

interface Props {
  auditId: string;
  initial?: AuditOpportunity;
  onDone?: () => void;
}

// Form for adding or editing an audit opportunity. For hours_saved, computes
// annual_value_cents from hrs/wk × rate × 52 and records the basis so the
// figure stays defensible (mirrors ValueEventForm's hours×rate helper pattern).
export function AuditOpportunityForm({ auditId, initial, onDone }: Props) {
  const saveOpp = useSaveOpportunity(auditId);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description_md ?? "");
  const [category, setCategory] = useState<ValueCategory>(
    (initial?.category as ValueCategory) ?? "hours_saved"
  );
  const [confidence, setConfidence] = useState<Confidence>(initial?.confidence ?? "med");
  const [effort, setEffort] = useState<Effort>(initial?.effort ?? "med");

  // hours_saved path
  const [hours, setHours] = useState(
    initial?.category === "hours_saved" && initial.basis_md
      ? String(parseFloat(initial.basis_md) || "")
      : ""
  );
  const [rate, setRate] = useState(
    initial?.category === "hours_saved" && initial.basis_md
      ? (() => {
          const m = initial.basis_md.match(/\$(\d+(?:\.\d+)?)/);
          return m ? m[1] : "";
        })()
      : ""
  );

  // dollar path
  const [dollars, setDollars] = useState(
    initial && initial.category !== "hours_saved"
      ? String(Math.round(initial.annual_value_cents / 100))
      : ""
  );

  const isHours = category === "hours_saved";

  const annualValueCents = isHours
    ? Math.round((Number(hours) || 0) * (Number(rate) || 0) * 52 * 100)
    : Math.round((Number(dollars) || 0) * 100);

  const basisMd = isHours
    ? (() => {
        const h = Number(hours) || 0;
        const r = Number(rate) || 0;
        const annual = Math.round(h * r * 52);
        return `${h} hrs/wk × $${r} × 52 = $${annual.toLocaleString()}`;
      })()
    : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || annualValueCents <= 0) return;
    saveOpp.mutate(
      {
        id: initial?.id,
        input: {
          title: title.trim(),
          description_md: description.trim() || null,
          category,
          annual_value_cents: annualValueCents,
          confidence,
          effort,
          basis_md: basisMd,
        },
      },
      {
        onSuccess: () => {
          if (!initial) {
            setTitle("");
            setDescription("");
            setCategory("hours_saved");
            setConfidence("med");
            setEffort("med");
            setHours("");
            setRate("");
            setDollars("");
          }
          onDone?.();
        },
      }
    );
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div>
        <label className={labelClass} htmlFor="opp-title">
          Title
        </label>
        <input
          id="opp-title"
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Automate invoice follow-up"
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="opp-desc">
          Description <span className="font-normal">(optional)</span>
        </label>
        <textarea
          id="opp-desc"
          rows={2}
          className={inputClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Context, current pain, expected outcome…"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass} htmlFor="opp-cat">
            Category
          </label>
          <select
            id="opp-cat"
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value as ValueCategory)}
          >
            {VALUE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {VALUE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="opp-conf">
            Confidence
          </label>
          <select
            id="opp-conf"
            className={inputClass}
            value={confidence}
            onChange={(e) => setConfidence(e.target.value as Confidence)}
          >
            <option value="low">Low</option>
            <option value="med">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="opp-effort">
            Effort
          </label>
          <select
            id="opp-effort"
            className={inputClass}
            value={effort}
            onChange={(e) => setEffort(e.target.value as Effort)}
          >
            <option value="low">Low</option>
            <option value="med">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {isHours ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="opp-hours">
              Hours / week
            </label>
            <input
              id="opp-hours"
              type="number"
              min={0}
              step="0.5"
              className={inputClass}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="opp-rate">
              Hourly rate ($)
            </label>
            <input
              id="opp-rate"
              type="number"
              min={0}
              step="1"
              className={inputClass}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
      ) : (
        <div>
          <label className={labelClass} htmlFor="opp-dollars">
            Annual value ($)
          </label>
          <input
            id="opp-dollars"
            type="number"
            min={0}
            step="1"
            className={inputClass}
            value={dollars}
            onChange={(e) => setDollars(e.target.value)}
            placeholder="0"
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Annual value{" "}
          <span className="font-semibold text-foreground">
            ${(annualValueCents / 100).toLocaleString()}
          </span>
          {isHours && basisMd && (
            <span className="ml-2 text-xs text-muted-foreground">({basisMd})</span>
          )}
        </span>
        <Button
          type="submit"
          isLoading={saveOpp.isPending}
          disabled={!title.trim() || annualValueCents <= 0}
        >
          {initial ? "Save" : "Add opportunity"}
        </Button>
      </div>
    </form>
  );
}
