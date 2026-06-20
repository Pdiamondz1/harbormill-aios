// Connector framework: the pluggable seam, mirroring assistant-chat/tools.ts.
// A connector pulls from an external SaaS and returns metrics that connector-sync
// writes through report-ingest.

export interface PulledMetric {
  key: string;
  label: string;
  value: string | number;
  unit?: string;
  target?: string;
  status?: "on_track" | "at_risk" | "off_track";
}

export interface ConnectorContext {
  config: Record<string, unknown>;          // the connector row's config jsonb
  env: Record<string, string | undefined>;  // Deno.env.toObject()
}

export interface Connector {
  type: string;
  secretEnvVar: string;                      // e.g. "CONNECTOR_STRIPE_SECRET_KEY"
  pull(ctx: ConnectorContext): Promise<PulledMetric[]>;
}
