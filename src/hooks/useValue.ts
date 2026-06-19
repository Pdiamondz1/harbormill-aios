import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ValueCategory, ValueEvent, ValueSummary } from "@/types/value";

/** ROI summary (this month / cumulative / multiple vs the retainer) via RPC. */
export function useValueSummary() {
  return useQuery({
    queryKey: ["value", "summary"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("deck_value_summary");
      if (error) throw error;
      return data as unknown as ValueSummary;
    },
  });
}

/** The value-event log (readable by the access tier). */
export function useValueEvents() {
  return useQuery({
    queryKey: ["value", "events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("value_events")
        .select("id, occurred_at, category, label, amount_cents, source, project_id, metadata, created_at")
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ValueEvent[];
    },
  });
}

export interface ValueEventInput {
  category: ValueCategory;
  label: string;
  amount_cents: number;
  occurred_at?: string;
  project_id?: string | null;
  metadata?: Record<string, unknown>;
}

/** Admin-only insert (RLS enforces the tier). */
export function useLogValueEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ValueEventInput) => {
      const { error } = await supabase
        .from("value_events")
        .insert({ ...input, source: "manual" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["value"] });
    },
  });
}
