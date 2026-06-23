import { describe, it, expect } from "vitest";
import { daysOverdue, recoveryLikelihood, estimateRecoverableCents, dueForReminder }
  from "../../supabase/functions/_shared/loops/ar-followup-map";

describe("ar-followup-map", () => {
  it("daysOverdue counts whole days past due", () => {
    expect(daysOverdue("2026-06-01", new Date("2026-06-16T00:00:00Z"))).toBe(15);
    expect(daysOverdue("2026-07-01", new Date("2026-06-16T00:00:00Z"))).toBe(0);
  });
  it("recoveryLikelihood decays with age", () => {
    expect(recoveryLikelihood(7) > recoveryLikelihood(90)).toBe(true);
    expect(recoveryLikelihood(7) <= 1 && recoveryLikelihood(90) >= 0).toBe(true);
  });
  it("estimateRecoverableCents = amount * likelihood, rounded", () => {
    expect(estimateRecoverableCents(100000, 7)).toBe(Math.round(100000 * recoveryLikelihood(7)));
  });
  it("dueForReminder respects cadence and last_reminded_at", () => {
    const now = new Date("2026-06-16T00:00:00Z");
    expect(dueForReminder(15, null, [7, 14, 30], now)).toBe(true);
    expect(dueForReminder(15, "2026-06-16T00:00:00Z", [7, 14, 30], now)).toBe(false);
    expect(dueForReminder(3, null, [7, 14, 30], now)).toBe(false);
  });
});
