import { describe, it, expect } from "vitest";
import { formatReconciliation } from "../lib/reconciliation";

describe("formatReconciliation", () => {
  it("formats promised, delivered, and pct", () => {
    const out = formatReconciliation({ promised_annual_cents: 32000000, delivered_cents: 8000000, pct_of_promise: 25 });
    expect(out.promised).toBe("$320,000");
    expect(out.delivered).toBe("$80,000");
    expect(out.pct).toBe("25%");
  });
  it("handles null promise", () => {
    const out = formatReconciliation({ promised_annual_cents: 0, delivered_cents: 0, pct_of_promise: null });
    expect(out.pct).toBe("—");
  });
});
