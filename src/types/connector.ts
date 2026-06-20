export type ConnectorType = "stripe";
export type ConnectorRunStatus = "ok" | "error" | "never";

export const CONNECTOR_TYPE_LABELS: Record<ConnectorType, string> = { stripe: "Stripe" };
export const CONNECTOR_SECRET_ENV: Record<ConnectorType, string> = {
  stripe: "CONNECTOR_STRIPE_SECRET_KEY",
};

export interface Connector {
  id: string;
  type: ConnectorType;
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
  schedule_cron: string;
  next_run_at: string | null;
  last_run_at: string | null;
  last_status: ConnectorRunStatus;
  last_error: string | null;
  last_result: { inserted?: number; keys?: string[] } | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
