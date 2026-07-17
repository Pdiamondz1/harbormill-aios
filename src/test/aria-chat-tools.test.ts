import { describe, it, expect } from "vitest";
// Import the Deno registry as raw text (Vite ?raw → typed string via vite/client).
// We can't import tools.ts as a module here — it uses Deno globals — and node:fs
// types aren't available under this tsconfig's `types: ["vitest/globals"]`.
import toolsSource from "../../supabase/functions/assistant-chat/tools.ts?raw";
import {
  READ_ONLY_TOOL_NAMES,
  CHAT_EXCLUDED_TOOL_NAMES,
} from "../../supabase/functions/_shared/aria-chat-tools";

// Extract every tool `name: "..."` from the registry source.
function registryToolNames(): string[] {
  const names = new Set<string>();
  for (const m of toolsSource.matchAll(/name:\s*"([a-z_]+)"/g)) names.add(m[1]);
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
