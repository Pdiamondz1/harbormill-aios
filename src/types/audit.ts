import type { ValueCategory } from "@/types/value";

export type AuditStatus = "draft" | "presented" | "won" | "lost";
export type Confidence = "low" | "med" | "high";
export type Effort = "low" | "med" | "high";
export type OpportunityCategory = ValueCategory;

export const AUDIT_STATUSES: AuditStatus[] = ["draft", "presented", "won", "lost"];
export const AUDIT_STATUS_LABELS: Record<AuditStatus, string> = {
  draft: "Draft", presented: "Presented", won: "Won", lost: "Lost",
};

export interface Audit {
  id: string;
  prospect_name: string;
  company: string | null;
  status: AuditStatus;
  proposed_retainer_cents: number;
  summary_notes: string | null;
  last_export_doc_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditOpportunity {
  id: string;
  audit_id: string;
  title: string;
  description_md: string | null;
  category: OpportunityCategory;
  annual_value_cents: number;
  confidence: Confidence;
  effort: Effort;
  basis_md: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AuditSummary {
  total_annual_cents: number;
  annual_fee_cents: number;
  roi_multiple: number | null;
  by_category: Partial<Record<OpportunityCategory, number>>;
}
