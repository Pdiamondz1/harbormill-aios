// Mirrors _shared/connectors/types.ts, extended for action-proposing loops.
export interface PulledMetric {
  key: string;
  label: string;
  value: string;
  unit?: string;
  target?: string;
  status?: "on_track" | "at_risk" | "off_track";
}

export interface ProposedAction {
  type: "email_reminder";
  target: Record<string, unknown>;      // { recipient, invoice_id, ... }
  payload: { subject: string; body_md: string };
  value_estimate_cents: number;
  value_category: "hours_saved" | "revenue_captured" | "cost_avoided" | "other";
  audit_opportunity_id?: string | null;
  metadata?: Record<string, unknown>;
}

export interface LoopPlan { actions: ProposedAction[]; metrics: PulledMetric[]; }

export interface LoopContext {
  supabase: any;   // service-role client (mirror ConnectorContext's client typing)
  config: Record<string, unknown>;
}

export interface Loop {
  type: string;
  plan(ctx: LoopContext): Promise<LoopPlan>;
}
