import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MeetingReport, SummarizeTranscriptInput } from "@/types/meeting";

const COLS =
  "id, title, meeting_date, summary_md, transcript_chars, action_item_count, source, created_by, created_at";

/** All meeting reports ordered by meeting date, newest first. */
export function useMeetingReports() {
  return useQuery({
    queryKey: ["meeting_reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meeting_reports")
        .select(COLS)
        .order("meeting_date", { ascending: false });
      if (error) {
        console.error("meeting_reports list failed:", error);
        throw error;
      }
      return (data ?? []) as unknown as MeetingReport[];
    },
  });
}

/** Summarize a transcript via the edge function, then refresh reports + findings. */
export function useSummarizeTranscript() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, meeting_date, transcript }: SummarizeTranscriptInput) => {
      const { error } = await supabase.functions.invoke("transcript-summarize", {
        body: { title, meeting_date, transcript },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meeting_reports"] });
      qc.invalidateQueries({ queryKey: ["findings"] });
    },
  });
}
