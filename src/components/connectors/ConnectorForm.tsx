import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Connector } from "@/types/connector";
import { useSaveConnector } from "@/hooks/useConnectors";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const labelClass = "mb-1 block text-xs font-semibold text-muted-foreground";

const STRIPE_KPI_KEYS = [
  "stripe_mrr",
  "stripe_active_subscriptions",
  "stripe_new_customers_30d",
  "stripe_churned_30d",
] as const;

const STRIPE_KPI_LABELS: Record<(typeof STRIPE_KPI_KEYS)[number], string> = {
  stripe_mrr: "MRR",
  stripe_active_subscriptions: "Active Subscriptions",
  stripe_new_customers_30d: "New Customers (30d)",
  stripe_churned_30d: "Churned (30d)",
};

interface Props {
  connector?: Connector;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectorForm({ connector, open, onOpenChange }: Props) {
  const save = useSaveConnector();

  const [name, setName] = useState(connector?.name ?? "");
  const [scheduleCron, setScheduleCron] = useState(connector?.schedule_cron ?? "0 * * * *");
  const [enabled, setEnabled] = useState(connector?.enabled ?? true);

  // KPI selection — defaults from config, or all
  const configKpis = (connector?.config?.kpis as string[] | undefined) ?? [];
  const [selectedKpis, setSelectedKpis] = useState<Set<string>>(
    configKpis.length > 0 ? new Set(configKpis) : new Set<string>()
  );

  // Sync state when the connector prop changes (e.g. switching from create to edit)
  useEffect(() => {
    if (!open) return;
    setName(connector?.name ?? "");
    setScheduleCron(connector?.schedule_cron ?? "0 * * * *");
    setEnabled(connector?.enabled ?? true);
    const kpis = (connector?.config?.kpis as string[] | undefined) ?? [];
    setSelectedKpis(kpis.length > 0 ? new Set(kpis) : new Set<string>());
  }, [open, connector]);

  if (!open) return null;

  const toggleKpi = (key: string) => {
    setSelectedKpis((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const kpisArr = [...selectedKpis];
    const config: Record<string, unknown> = {};
    if (kpisArr.length > 0) config.kpis = kpisArr;

    save.mutate(
      {
        id: connector?.id,
        input: {
          type: "stripe",
          name: name.trim(),
          schedule_cron: scheduleCron.trim() || "0 * * * *",
          enabled,
          config,
        },
      },
      {
        onSuccess: () => {
          toast.success(connector ? "Connector updated" : "Connector created");
          onOpenChange(false);
        },
        onError: (e) => {
          toast.error(e instanceof Error ? e.message : "Save failed");
        },
      }
    );
  };

  const handleClose = () => {
    if (!save.isPending) onOpenChange(false);
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-lg">
        {/* Dialog header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">
            {connector ? "Edit connector" : "Add connector"}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          {/* Type (fixed: stripe only) */}
          <div>
            <label className={labelClass} htmlFor="conn-type">
              Type
            </label>
            <select id="conn-type" className={inputClass} value="stripe" disabled>
              <option value="stripe">Stripe</option>
            </select>
          </div>

          {/* Name */}
          <div>
            <label className={labelClass} htmlFor="conn-name">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              id="conn-name"
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Stripe Production"
              required
              autoFocus
            />
          </div>

          {/* Schedule */}
          <div>
            <label className={labelClass} htmlFor="conn-cron">
              Schedule (cron)
            </label>
            <input
              id="conn-cron"
              className={inputClass}
              value={scheduleCron}
              onChange={(e) => setScheduleCron(e.target.value)}
              placeholder="0 * * * *"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Default <code className="font-mono">0 * * * *</code> runs hourly.
            </p>
          </div>

          {/* Enabled */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="conn-enabled"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled((v) => !v)}
              className={[
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                enabled ? "bg-primary" : "bg-input",
              ].join(" ")}
            >
              <span
                className={[
                  "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
                  enabled ? "translate-x-4" : "translate-x-0",
                ].join(" ")}
              />
            </button>
            <label htmlFor="conn-enabled" className="text-sm text-foreground cursor-pointer">
              Enabled
            </label>
          </div>

          {/* KPI selection */}
          <div>
            <p className={labelClass}>
              KPIs to sync{" "}
              <span className="font-normal">(leave all unchecked to sync all)</span>
            </p>
            <div className="mt-1.5 space-y-2">
              {STRIPE_KPI_KEYS.map((key) => (
                <label
                  key={key}
                  className="flex items-center gap-2.5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedKpis.has(key)}
                    onChange={() => toggleKpi(key)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm text-foreground">{STRIPE_KPI_LABELS[key]}</span>
                  <code className="ml-auto text-[10px] font-mono text-muted-foreground">
                    {key}
                  </code>
                </label>
              ))}
            </div>
          </div>

          {/* Secret hint */}
          <div className="rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
            Set the API key as the Supabase secret{" "}
            <code className="font-mono text-foreground">CONNECTOR_STRIPE_SECRET_KEY</code> — it is
            never entered here.
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={save.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={save.isPending}
              disabled={!name.trim() || save.isPending}
            >
              {connector ? "Save changes" : "Add connector"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
