import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LoopAction } from "@/types/loops";

const COLS =
  "id, loop_id, type, status, target, payload, value_estimate_cents, value_category, audit_opportunity_id, metadata, approved_by, approved_at, sent_at, last_error, created_at";

/** Proposed loop actions awaiting admin review, newest first. */
export function usePendingLoopActions() {
  return useQuery({
    queryKey: ["loop_actions", "pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loop_actions")
        .select(COLS)
        .eq("status", "proposed")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("loop_actions pending list failed:", error);
        throw error;
      }
      return (data ?? []) as unknown as LoopAction[];
    },
  });
}

/** Approve a proposed loop action — delegates execution to the loop-run edge function. */
export function useApproveLoopAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (action_id: string) => {
      const { error } = await supabase.functions.invoke("loop-run", {
        body: { mode: "approve", action_id },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loop_actions", "pending"] });
      qc.invalidateQueries({ queryKey: ["value"] });
    },
  });
}

/** Skip a proposed loop action without sending it. */
export function useSkipLoopAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (action_id: string) => {
      const { error } = await supabase.functions.invoke("loop-run", {
        body: { mode: "skip", action_id },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loop_actions", "pending"] });
      qc.invalidateQueries({ queryKey: ["value"] });
    },
  });
}
