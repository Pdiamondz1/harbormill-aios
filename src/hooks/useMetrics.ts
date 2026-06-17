import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MetricStatus = "on_track" | "at_risk" | "off_track";

export interface Metric {
  id: string;
  key: string;
  label: string;
  value: string;
  unit: string | null;
  target: string | null;
  status: MetricStatus | null;
  captured_at: string;
}

/** Latest metric snapshot per key (from the metric_latest view). */
export function useMetrics() {
  return useQuery({
    queryKey: ["metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metric_latest")
        .select("id, key, label, value, unit, target, status, captured_at")
        .order("label", { ascending: true });
      if (error) {
        console.error("metric_latest list failed:", error);
        throw error;
      }
      return (data ?? []) as unknown as Metric[];
    },
  });
}
