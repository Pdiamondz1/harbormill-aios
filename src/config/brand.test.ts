import { describe, it, expect } from "vitest";
import { brand } from "./brand";

// Guards the white-label contract: every client-facing field must be present
// and non-empty so a rebrand can't accidentally ship blanks.
describe("brand config", () => {
  it("has all required non-empty fields", () => {
    expect(brand.productName).toBeTruthy();
    expect(brand.tagline).toBeTruthy();
    expect(brand.assistantName).toBeTruthy();
    expect(brand.assistantPersona).toBeTruthy();
    expect(brand.logoSrc).toMatch(/^\//);
    expect(brand.emblemSrc).toMatch(/^\//);
    expect(brand.company.name).toBeTruthy();
    expect(brand.company.url).toMatch(/^https?:\/\//);
    expect(brand.tiers.admin).toBeTruthy();
    expect(brand.tiers.stakeholder).toBeTruthy();
  });
});
