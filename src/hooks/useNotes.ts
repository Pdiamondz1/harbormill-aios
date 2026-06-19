import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Note } from "@/types/note";

/** Notes for a project (or general notes when projectId is null). */
export function useNotes(projectId: string | null) {
  return useQuery({
    queryKey: ["notes", projectId],
    queryFn: async () => {
      let query = supabase
        .from("notes")
        .select("id, project_id, author, body, created_at")
        .order("created_at", { ascending: true });
      query = projectId ? query.eq("project_id", projectId) : query.is("project_id", null);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as Note[];
    },
  });
}

export function useAddNote(projectId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (body: string) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("notes")
        .insert({ project_id: projectId, author: user.id, body: body.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", projectId] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}
