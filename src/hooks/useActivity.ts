import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ActivityItem } from "@/types/activity";

/** The append-only activity timeline. Readable by the access tier (RLS). */
export function useActivity(limit = 50) {
  return useQuery({
    queryKey: ["activity", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity")
        .select("id, type, actor, summary, entity_type, entity_id, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as ActivityItem[];
    },
  });
}
