export type ValueCategory = "hours_saved" | "revenue_captured" | "cost_avoided" | "other";

export const VALUE_CATEGORIES: ValueCategory[] = [
  "hours_saved",
  "revenue_captured",
  "cost_avoided",
  "other",
];

export const VALUE_CATEGORY_LABELS: Record<ValueCategory, string> = {
  hours_saved: "Hours saved",
  revenue_captured: "Revenue captured",
  cost_avoided: "Cost avoided",
  other: "Other",
};

export interface ValueEvent {
  id: string;
  occurred_at: string;
  category: ValueCategory;
  label: string;
  amount_cents: number;
  source: string;
  project_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ValueSummary {
  this_month_cents: number;
  prev_month_cents: number;
  cumulative_cents: number;
  retainer_cents: number;
  roi_multiple: number | null;
  by_category: Partial<Record<ValueCategory, number>>;
  generated_at: string;
}

/** Whole-dollar formatting from cents (no cents shown — these are estimates). */
export function formatDollars(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);
}
