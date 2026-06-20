import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, SUPABASE_URL } from "@/integrations/supabase/client";
import type { Connector } from "@/types/connector";

const COLS =
  "id, type, name, enabled, config, schedule_cron, next_run_at, last_run_at, last_status, last_error, last_result, created_by, created_at, updated_at";

export function useConnectors() {
  return useQuery({
    queryKey: ["connectors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("connectors").select(COLS)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Connector[];
    },
  });
}

export function useSaveConnector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: Partial<Connector> }) => {
      if (id) {
        const { error } = await supabase.from("connectors").update(input).eq("id", id);
        if (error) throw error; return id;
      }
      const { data, error } = await supabase.from("connectors").insert(input).select("id").single();
      if (error) throw error; return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["connectors"] }),
  });
}

export function useSyncConnector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (connectorId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");
      const res = await fetch(`${SUPABASE_URL}/functions/v1/connector-sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ connector_id: connectorId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Sync failed");
      return body.results?.[0] as { status: string; inserted?: number; error?: string } | undefined;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["connectors"] }),
  });
}
