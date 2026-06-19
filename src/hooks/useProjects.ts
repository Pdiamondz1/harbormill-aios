import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Project, ProjectInput } from "@/types/project";

const COLUMNS =
  "id, title, description, status, owner, start_date, due_date, progress, created_by, created_at, updated_at";

/** Projects/initiatives. Readable by the access tier; admin-managed (RLS). */
export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(COLUMNS)
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Project[];
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select(COLUMNS).eq("id", id!).maybeSingle();
      if (error) throw error;
      return (data ?? null) as Project | null;
    },
    enabled: !!id,
  });
}

export function useSaveProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: ProjectInput }) => {
      if (id) {
        const { error } = await supabase.from("projects").update(input).eq("id", id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase.from("projects").insert(input).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (_id) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}
