import { formatDollars } from "@/types/value";
export type { Reconciliation } from "@/types/value";
import type { Reconciliation } from "@/types/value";

export function formatReconciliation(r: Reconciliation) {
  return {
    promised: formatDollars(r.promised_annual_cents),
    delivered: formatDollars(r.delivered_cents),
    pct: r.pct_of_promise === null ? "—" : `${r.pct_of_promise}%`,
  };
}
