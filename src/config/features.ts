/**
 * Per-client feature flags — the plug-and-play lever.
 *
 * Toggle a module off and it disappears from the nav AND its routes stop
 * resolving (deep links fall back to Overview). No component code changes.
 * Flip these per client deployment; Overview is always on (the home surface).
 *
 * To also disable a specific Aria tool per deployment, set the edge-function
 * secret DISABLED_TOOLS (comma-separated tool names) — see assistant-chat.
 */
export interface FeatureFlags {
  projects: boolean;
  calendar: boolean;
  value: boolean;
  audits: boolean;
  connectors: boolean;
  loops: boolean;
  briefings: boolean;
  findings: boolean;
  strategy: boolean;
  workspace: boolean;
  assistant: boolean;
}

export const features: FeatureFlags = {
  projects: true,
  calendar: true,
  value: true,
  audits: true,
  connectors: true,
  loops: true,
  briefings: true,
  findings: true,
  strategy: true,
  workspace: true,
  assistant: true,
};

export type FeatureKey = keyof FeatureFlags;
