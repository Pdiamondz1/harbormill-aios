import { useState } from "react";
import { TrendingUp, Plus } from "lucide-react";
import { useValueEvents, useValueSummary } from "@/hooks/useValue";
import { useAccess } from "@/hooks/useAccess";
import { VALUE_CATEGORY_LABELS, formatDollars, type ValueCategory } from "@/types/value";
import { formatReconciliation } from "@/lib/reconciliation";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { ValueDeliveredCard } from "@/components/value/ValueDeliveredCard";
import { ValueEventList } from "@/components/value/ValueEventList";
import { ValueEventForm } from "@/components/value/ValueEventForm";

export default function Value() {
  const { data: summary } = useValueSummary();
  const { data: events, isLoading, isError } = useValueEvents();
  const { isAdmin } = useAccess();
  const [adding, setAdding] = useState(false);

  const byCategory = summary?.by_category ?? {};
  const categories = Object.keys(byCategory) as ValueCategory[];

  return (
    <div>
      <PageHeader
        eyebrow="Operating deck"
        title="Value delivered"
        description="The quantified return this engagement has produced — what justifies the retainer, kept honest and visible."
        actions={
          isAdmin && !adding ? (
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" />
              Log value
            </Button>
          ) : undefined
        }
      />

      <ValueDeliveredCard linkToDetail={false} />

      {summary?.reconciliation && summary.reconciliation.promised_annual_cents > 0 && (() => {
        const r = formatReconciliation(summary.reconciliation!);
        return (
          <p className="mt-3 text-sm text-muted-foreground">
            Promised at audit:{" "}
            <span className="font-semibold text-foreground">{r.promised}/yr</span>
            {" · "}Delivered to date:{" "}
            <span className="font-semibold text-foreground">{r.delivered}</span>
            {" · "}
            <span className="font-semibold text-foreground">{r.pct}</span>
            {" "}of promise.
          </p>
        );
      })()}

      {isAdmin && adding && (
        <div className="mt-4">
          <ValueEventForm onDone={() => setAdding(false)} />
        </div>
      )}

      {categories.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map((c) => (
            <div key={c} className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {VALUE_CATEGORY_LABELS[c]}
              </p>
              <p className="tnum mt-1 text-xl font-bold text-foreground">
                {formatDollars(byCategory[c] ?? 0)}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-bold text-foreground">Recent value</h2>
        {isLoading ? (
          <div className="flex min-h-[20vh] items-center justify-center">
            <Spinner className="h-8 w-8" />
          </div>
        ) : isError || !events ? (
          <EmptyState icon={TrendingUp} title="Couldn't load value events" />
        ) : (
          <ValueEventList events={events} />
        )}
      </div>
    </div>
  );
}
