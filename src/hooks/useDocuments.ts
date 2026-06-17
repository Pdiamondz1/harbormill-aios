import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DocumentSummary {
  id: string;
  path: string;
  title: string;
  tags: string[];
  updated_at: string;
}

export interface DocumentFull extends DocumentSummary {
  content_md: string;
}

/** Strategy/reference library, readable by the access tier. */
export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, path, title, content_md, tags, updated_at")
        .order("title", { ascending: true });
      if (error) {
        console.error("documents list failed:", error);
        throw error;
      }
      return (data ?? []) as unknown as DocumentFull[];
    },
  });
}
