import type { Connector, ConnectorContext, PulledMetric } from "./types.ts";
import { mapStripe, type StripeSummary } from "./stripe-map.ts";

const SECRET_ENV = "CONNECTOR_STRIPE_SECRET_KEY";
const API = "https://api.stripe.com/v1";

async function stripeGet(path: string, key: string): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Stripe ${path} ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function fetchSummary(key: string): Promise<StripeSummary> {
  const now = Math.floor(Date.now() / 1000);
  const since = now - 30 * 24 * 3600;

  // Active subscriptions (and MRR from their plan amounts).
  const subs = await stripeGet(`/subscriptions?status=active&limit=100`, key);
  let mrr_cents = 0;
  for (const sub of subs.data ?? []) {
    for (const item of sub.items?.data ?? []) {
      const price = item.price;
      const qty = item.quantity ?? 1;
      const amount = price?.unit_amount ?? 0;
      const interval = price?.recurring?.interval ?? "month";
      const monthly = interval === "year" ? amount / 12 : amount;
      mrr_cents += monthly * qty;
    }
  }

  const newCustomers = await stripeGet(`/customers?created[gte]=${since}&limit=100`, key);

  return {
    mrr_cents: Math.round(mrr_cents),
    active_subscriptions: (subs.data ?? []).length,
    new_customers_30d: (newCustomers.data ?? []).length,
    churned_30d: 0, // TODO: Stripe churn needs a canceled-subscription scan; deferred for v1
  };
}

export const stripeConnector: Connector = {
  type: "stripe",
  secretEnvVar: SECRET_ENV,
  async pull(ctx: ConnectorContext): Promise<PulledMetric[]> {
    const key = ctx.env[SECRET_ENV];
    if (!key) throw new Error(`missing ${SECRET_ENV}`);
    const summary = await fetchSummary(key);
    return mapStripe(summary, ctx.config as any);
  },
};
