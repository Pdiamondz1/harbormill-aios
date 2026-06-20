// Pure Stripe summary -> PulledMetric[] mapping. NO imports (Vitest-testable).
export interface StripeSummary {
  mrr_cents: number;
  active_subscriptions: number;
  new_customers_30d: number;
  churned_30d: number;
}
export interface StripeMapConfig {
  kpis?: string[];                          // if set, only these keys are emitted
  targets?: Record<string, string>;         // optional target per key
}
interface Metric { key: string; label: string; value: string | number; unit?: string; target?: string; }

function dollars(cents: number): string {
  return Math.round(cents / 100).toLocaleString("en-US");
}

export function mapStripe(s: StripeSummary, config: StripeMapConfig) {
  const all: Metric[] = [
    { key: "stripe_mrr", label: "MRR", value: dollars(s.mrr_cents), unit: "$" },
    { key: "stripe_active_subscriptions", label: "Active subscriptions", value: s.active_subscriptions },
    { key: "stripe_new_customers_30d", label: "New customers (30d)", value: s.new_customers_30d },
    { key: "stripe_churned_30d", label: "Churned (30d)", value: s.churned_30d },
  ];
  const enabled = config.kpis && config.kpis.length ? all.filter((m) => config.kpis!.includes(m.key)) : all;
  const targets = config.targets ?? {};
  return enabled.map((m) => (targets[m.key] ? { ...m, target: targets[m.key] } : m));
}
