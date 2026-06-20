import { describe, it, expect } from "vitest";
import { mapStripe } from "../../supabase/functions/_shared/connectors/stripe-map";

const summary = { mrr_cents: 1234500, active_subscriptions: 42, new_customers_30d: 9, churned_30d: 3 };

describe("mapStripe", () => {
  it("emits all four KPIs by default with formatted values", () => {
    const out = mapStripe(summary, {});
    const byKey = Object.fromEntries(out.map((m) => [m.key, m]));
    expect(out).toHaveLength(4);
    expect(byKey.stripe_mrr).toMatchObject({ label: "MRR", value: "12,345", unit: "$" });
    expect(byKey.stripe_active_subscriptions).toMatchObject({ value: 42 });
    expect(byKey.stripe_new_customers_30d).toMatchObject({ value: 9 });
    expect(byKey.stripe_churned_30d).toMatchObject({ value: 3 });
  });

  it("emits only the KPIs named in config.kpis", () => {
    const out = mapStripe(summary, { kpis: ["stripe_mrr"] });
    expect(out.map((m) => m.key)).toEqual(["stripe_mrr"]);
  });

  it("applies a target override from config.targets", () => {
    const out = mapStripe(summary, { targets: { stripe_mrr: "15,000" } });
    const mrr = out.find((m) => m.key === "stripe_mrr");
    expect(mrr?.target).toBe("15,000");
  });
});
