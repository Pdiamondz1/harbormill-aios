import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { deriveBreachFindings, type MetricRow } from "./derive.ts";

const row = (over: Partial<MetricRow>): MetricRow => ({
  key: "rev",
  label: "Revenue",
  value: "$12,400",
  unit: null,
  target: "$15,000",
  status: "on_track",
  captured_at: "2026-06-24T00:00:00Z",
  ...over,
});

Deno.test("on_track rows produce no findings", () => {
  assertEquals(deriveBreachFindings([row({ status: "on_track" })]), []);
});

Deno.test("off_track -> high severity, correct fingerprint/title/source", () => {
  const out = deriveBreachFindings([row({ key: "rev", label: "Revenue", status: "off_track" })]);
  assertEquals(out.length, 1);
  assertEquals(out[0].severity, "high");
  assertEquals(out[0].fingerprint, "kpi-breach:rev");
  assertEquals(out[0].title, "KPI off target: Revenue");
  assertEquals(out[0].source, "kpi-watch");
});

Deno.test("at_risk -> medium severity", () => {
  const out = deriveBreachFindings([row({ status: "at_risk" })]);
  assertEquals(out.length, 1);
  assertEquals(out[0].severity, "medium");
  assertEquals(out[0].title, "KPI at risk: Revenue");
});

Deno.test("null unit and null target -> clean summary + evidence omits null fields", () => {
  const out = deriveBreachFindings([
    row({ key: "nps", label: "NPS", value: "12", unit: null, target: null, status: "off_track" }),
  ]);
  assertEquals(out.length, 1);
  const f = out[0];
  assertEquals(f.summary_md.includes("undefined"), false);
  assertEquals(f.summary_md.includes("null"), false);
  assertEquals(f.summary_md.includes("no target set"), true);
  assertEquals("unit" in f.evidence, false);
  assertEquals("target" in f.evidence, false);
  assertEquals(f.evidence.key, "nps");
});

Deno.test("unit is appended to the value when present", () => {
  const out = deriveBreachFindings([row({ value: "4.2", unit: "★", status: "at_risk" })]);
  assertEquals(out[0].summary_md.includes("**4.2 ★**"), true);
});

Deno.test("mixed batch: only breaching rows yield findings, in order", () => {
  const out = deriveBreachFindings([
    row({ key: "a", status: "on_track" }),
    row({ key: "b", status: "at_risk" }),
    row({ key: "c", status: "off_track" }),
    row({ key: "d", status: null }),
  ]);
  assertEquals(out.map((f) => f.fingerprint), ["kpi-breach:b", "kpi-breach:c"]);
});

Deno.test("empty input -> empty output", () => {
  assertEquals(deriveBreachFindings([]), []);
});
