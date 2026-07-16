export interface MeetingReport {
  id: string;
  title: string;
  meeting_date: string;
  summary_md: string;
  transcript_chars: number;
  action_item_count: number;
  source: string;
  created_by: string | null;
  created_at: string;
}

export interface SummarizeTranscriptInput {
  title: string;
  meeting_date: string;
  transcript: string;
}
