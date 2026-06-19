import { useState } from "react";
import { VALUE_CATEGORIES, VALUE_CATEGORY_LABELS, type ValueCategory } from "@/types/value";
import { useLogValueEvent, type ValueEventInput } from "@/hooks/useValue";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const labelClass = "mb-1 block text-xs font-semibold text-muted-foreground";

// Admin entry for a value event. For hours_saved, captures hours × rate and
// records the basis in metadata so the figure stays defensible.
export function ValueEventForm({ onDone }: { onDone?: () => void }) {
  const logEvent = useLogValueEvent();
  const [category, setCategory] = useState<ValueCategory>("hours_saved");
  const [label, setLabel] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dollars, setDollars] = useState("");
  const [hours, setHours] = useState("");
  const [rate, setRate] = useState("");

  const isHours = category === "hours_saved";
  const amountCents = isHours
    ? Math.round((Number(hours) || 0) * (Number(rate) || 0) * 100)
    : Math.round((Number(dollars) || 0) * 100);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || amountCents <= 0) return;
    const input: ValueEventInput = {
      category,
      label: label.trim(),
      amount_cents: amountCents,
      occurred_at: new Date(date).toISOString(),
      metadata: isHours ? { hours: Number(hours), rate: Number(rate) } : {},
    };
    logEvent.mutate(input, {
      onSuccess: () => {
        setLabel("");
        setDollars("");
        setHours("");
        setRate("");
        onDone?.();
      },
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="val-cat">Category</label>
          <select id="val-cat" className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as ValueCategory)}>
            {VALUE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{VALUE_CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="val-date">Date</label>
          <input id="val-date" type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="val-label">What was delivered</label>
        <input id="val-label" className={inputClass} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Automated lead follow-up" />
      </div>

      {isHours ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="val-hours">Hours saved</label>
            <input id="val-hours" type="number" min={0} step="0.5" className={inputClass} value={hours} onChange={(e) => setHours(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className={labelClass} htmlFor="val-rate">Hourly rate ($)</label>
            <input id="val-rate" type="number" min={0} step="1" className={inputClass} value={rate} onChange={(e) => setRate(e.target.value)} placeholder="0" />
          </div>
        </div>
      ) : (
        <div>
          <label className={labelClass} htmlFor="val-amount">Value ($)</label>
          <input id="val-amount" type="number" min={0} step="1" className={inputClass} value={dollars} onChange={(e) => setDollars(e.target.value)} placeholder="0" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Logs <span className="font-semibold text-foreground">${(amountCents / 100).toLocaleString()}</span>
        </span>
        <Button type="submit" isLoading={logEvent.isPending} disabled={!label.trim() || amountCents <= 0}>
          Log value
        </Button>
      </div>
    </form>
  );
}
