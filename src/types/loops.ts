import type { ValueCategory } from "@/types/value";

export type LoopType = "ar_followup";
export type LoopRunStatus = "ok" | "error" | "never";
export type LoopActionType = "email_reminder";
export type LoopActionStatus = "proposed" | "approved" | "sent" | "skipped" | "failed";

export interface Loop {
  id: string;
  type: LoopType;
  enabled: boolean;
  config: Record<string, unknown>;
  schedule_cron: string | null;
  last_run_at: string | null;
  last_status: LoopRunStatus | null;
  last_error: string | null;
  next_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoopAction {
  id: string;
  loop_id: string;
  type: LoopActionType;
  status: LoopActionStatus;
  target: Record<string, unknown>;
  payload: { subject: string; body_md: string };
  value_estimate_cents: number;
  value_category: ValueCategory;
  audit_opportunity_id: string | null;
  metadata: Record<string, unknown>;
  approved_by: string | null;
  approved_at: string | null;
  sent_at: string | null;
  last_error: string | null;
  created_at: string;
}
