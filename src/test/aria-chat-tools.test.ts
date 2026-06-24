import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  READ_ONLY_TOOL_NAMES,
  CHAT_EXCLUDED_TOOL_NAMES,
} from "../../supabase/functions/_shared/aria-chat-tools";

// Extract every tool `name: "..."` from the Deno registry source (can't import
// tools.ts here — it uses Deno globals).
function registryToolNames(): string[] {
  const filePath = resolve(
    process.cwd(),
    "supabase/functions/assistant-chat/tools.ts",
  );
  const src = readFileSync(filePath, "utf8");
  const names = new Set<string>();
  for (const m of src.matchAll(/name:\s*"([a-z_]+)"/g)) names.add(m[1]);
  return [...names];
}

describe("aria-chat read-only tool policy", () => {
  const registry = registryToolNames();

  it("registry parse found a sane number of tools", () => {
    expect(registry.length).toBeGreaterThanOrEqual(10);
  });

  it("every allowlisted name exists in the registry", () => {
    for (const n of READ_ONLY_TOOL_NAMES) expect(registry).toContain(n);
  });

  it("every excluded name exists in the registry", () => {
    for (const n of CHAT_EXCLUDED_TOOL_NAMES) expect(registry).toContain(n);
  });

  it("allowlist and excluded set partition the whole registry", () => {
    const classified = new Set([...READ_ONLY_TOOL_NAMES, ...CHAT_EXCLUDED_TOOL_NAMES]);
    const unclassified = registry.filter((n) => !classified.has(n));
    expect(unclassified).toEqual([]); // a new tool must be classified read or write
  });

  it("no excluded (write/action) tool leaks into the allowlist", () => {
    const allow = new Set(READ_ONLY_TOOL_NAMES);
    for (const n of CHAT_EXCLUDED_TOOL_NAMES) expect(allow.has(n)).toBe(false);
  });
});
