import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Audit, AuditOpportunity } from "@/types/audit";

const AUDIT_COLS =
  "id, prospect_name, company, status, proposed_retainer_cents, summary_notes, last_export_doc_id, created_by, created_at, updated_at";
const OPP_COLS =
  "id, audit_id, title, description_md, category, annual_value_cents, confidence, effort, basis_md, sort_order, created_at, updated_at";

export function useAudits() {
  return useQuery({
    queryKey: ["audits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("audits").select(AUDIT_COLS)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Audit[];
    },
  });
}

export function useAudit(id: string | undefined) {
  return useQuery({
    queryKey: ["audits", id],
    queryFn: async () => {
      const [{ data: audit, error: e1 }, { data: opps, error: e2 }] = await Promise.all([
        supabase.from("audits").select(AUDIT_COLS).eq("id", id!).maybeSingle(),
        supabase.from("audit_opportunities").select(OPP_COLS).eq("audit_id", id!)
          .order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return { audit: (audit ?? null) as Audit | null, opportunities: (opps ?? []) as unknown as AuditOpportunity[] };
    },
    enabled: !!id,
  });
}

export function useSaveAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: Partial<Audit> }) => {
      if (id) {
        const { error } = await supabase.from("audits").update(input).eq("id", id);
        if (error) throw error; return id;
      }
      const { data, error } = await supabase.from("audits").insert(input).select("id").single();
      if (error) throw error; return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["audits"] }),
  });
}

export function useSaveOpportunity(auditId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: Partial<AuditOpportunity> }) => {
      if (id) {
        const { error } = await supabase.from("audit_opportunities").update(input).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("audit_opportunities").insert({ ...input, audit_id: auditId });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["audits", auditId] }),
  });
}

export function useDeleteOpportunity(auditId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("audit_opportunities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["audits", auditId] }),
  });
}
