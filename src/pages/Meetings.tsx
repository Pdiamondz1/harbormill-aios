import { useState } from "react";
import { FileText, Upload } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMeetingReports, useSummarizeTranscript } from "@/hooks/useMeetingReports";
import type { Finding } from "@/hooks/useFindings";
import type { MeetingReport } from "@/types/meeting";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { MarkdownProse } from "@/components/MarkdownProse";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { severityClass } from "@/lib/status";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const labelClass = "mb-1 block text-xs font-semibold text-muted-foreground";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Action items filed against a given report (findings from the transcript agent). */
function useReportActionItems(reportId: string) {
  return useQuery({
    queryKey: ["findings", "meeting_report", reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("findings")
        .select(
          "id, severity, title, summary_md, evidence, source, status, occurrences, last_seen_at, created_at"
        )
        .eq("source", "transcript-agent")
        .eq("evidence->>meeting_report_id", reportId)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("meeting action items failed:", error);
        throw error;
      }
      return (data ?? []) as unknown as Finding[];
    },
  });
}

function ReportCard({ report }: { report: MeetingReport }) {
  const [expanded, setExpanded] = useState(false);
  const items = useReportActionItems(report.id);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground">{report.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(report.meeting_date).toLocaleDateString()} ·{" "}
            {report.action_item_count} action item
            {report.action_item_count === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 text-xs font-semibold text-primary"
        >
          {expanded ? "Hide" : "View"}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-4">
          <MarkdownProse>{report.summary_md}</MarkdownProse>

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Action items
            </h4>
            {items.isLoading ? (
              <div className="flex min-h-[6rem] items-center justify-center">
                <Spinner className="h-6 w-6" />
              </div>
            ) : items.isError || !items.data || items.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No action items filed for this report.
              </p>
            ) : (
              <ul className="space-y-2">
                {items.data.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2 rounded-lg border border-border bg-background p-3"
                  >
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase",
                        severityClass(item.severity)
                      )}
                    >
                      {item.severity}
                    </span>
                    <span className="text-sm text-foreground">{item.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Meetings() {
  const reports = useMeetingReports();
  const summarize = useSummarizeTranscript();

  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState(today());
  const [transcript, setTranscript] = useState("");

  const canSubmit = title.trim().length > 0 && transcript.trim().length > 0;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setTranscript(text);
      if (!title.trim()) setTitle(file.name.replace(/\.(txt|md|markdown)$/i, ""));
    } catch {
      toast.error("Couldn't read that file");
    } finally {
      e.target.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    summarize.mutate(
      { title: title.trim(), meeting_date: meetingDate, transcript: transcript.trim() },
      {
        onSuccess: () => {
          toast.success("Summary created — action items filed");
          setTitle("");
          setMeetingDate(today());
          setTranscript("");
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Failed to summarize transcript"),
      }
    );
  };

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Operating deck"
        title="Meetings"
        description="Paste or upload a meeting transcript to get a saved summary and action items filed as findings."
      />

      {/* Submit form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-xl border border-border bg-card p-4"
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label className={labelClass} htmlFor="meeting-title">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              id="meeting-title"
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Acme weekly sync"
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="meeting-date">
              Meeting date
            </label>
            <input
              id="meeting-date"
              type="date"
              className={inputClass}
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className={labelClass} htmlFor="meeting-transcript">
              Transcript <span className="text-destructive">*</span>
            </label>
            <label className="mb-1 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-primary">
              <Upload className="h-3.5 w-3.5" />
              Upload file
              <input
                type="file"
                accept=".txt,.md,.markdown,text/plain"
                className="sr-only"
                onChange={handleFile}
              />
            </label>
          </div>
          <textarea
            id="meeting-transcript"
            className={cn(inputClass, "min-h-[12rem] resize-y font-mono text-xs")}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste the meeting transcript here, or upload a .txt / .md file…"
            required
          />
        </div>

        <div className="flex items-center justify-end">
          <Button
            type="submit"
            size="sm"
            isLoading={summarize.isPending}
            disabled={!canSubmit || summarize.isPending}
          >
            Summarize transcript
          </Button>
        </div>
      </form>

      {/* Reports list */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Reports
        </h2>
        {reports.isLoading ? (
          <div className="flex min-h-[20vh] items-center justify-center">
            <Spinner className="h-9 w-9" />
          </div>
        ) : reports.isError || !reports.data ? (
          <EmptyState icon={FileText} title="Couldn't load meeting reports" />
        ) : reports.data.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No meeting reports yet"
            description="Paste a transcript above to create one."
          />
        ) : (
          <div className="space-y-3">
            {reports.data.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
