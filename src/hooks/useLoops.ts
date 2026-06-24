import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Loop } from "@/types/loops";

const COLS =
  "id, type, enabled, config, schedule_cron, last_run_at, last_status, last_error, next_run_at, created_at, updated_at";

/** All automation loops ordered by creation time. */
export function useLoops() {
  return useQuery({
    queryKey: ["loops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loops")
        .select(COLS)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("loops list failed:", error);
        throw error;
      }
      return (data ?? []) as unknown as Loop[];
    },
  });
}

/** Toggle a loop's enabled flag (and optionally update its config). */
export function useToggleLoop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      enabled,
      config,
    }: {
      id: string;
      enabled: boolean;
      config?: Record<string, unknown>;
    }) => {
      const patch: Partial<Loop> = { enabled };
      if (config !== undefined) patch.config = config;
      const { error } = await supabase.from("loops").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loops"] });
    },
  });
}
