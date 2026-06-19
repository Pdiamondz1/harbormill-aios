import { useState } from "react";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, type Project, type ProjectInput, type ProjectStatus } from "@/types/project";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const labelClass = "mb-1 block text-xs font-semibold text-muted-foreground";

// Create/edit form for a project. Admin-only surface (gated by the caller).
export function ProjectForm({
  initial,
  onSubmit,
  onCancel,
  saving,
}: {
  initial?: Project;
  onSubmit: (input: ProjectInput) => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(initial?.status ?? "planned");
  const [owner, setOwner] = useState(initial?.owner ?? "");
  const [startDate, setStartDate] = useState(initial?.start_date ?? "");
  const [dueDate, setDueDate] = useState(initial?.due_date ?? "");
  const [progress, setProgress] = useState(initial?.progress ?? 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      status,
      owner: owner.trim() || null,
      start_date: startDate || null,
      due_date: dueDate || null,
      progress,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div>
        <label className={labelClass} htmlFor="proj-title">Title</label>
        <input id="proj-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title" autoFocus />
      </div>
      <div>
        <label className={labelClass} htmlFor="proj-desc">Description</label>
        <textarea id="proj-desc" className={inputClass} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this initiative?" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="proj-status">Status</label>
          <select id="proj-status" className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="proj-owner">Owner</label>
          <input id="proj-owner" className={inputClass} value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Who owns it?" />
        </div>
        <div>
          <label className={labelClass} htmlFor="proj-start">Start date</label>
          <input id="proj-start" type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="proj-due">Due date</label>
          <input id="proj-due" type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="proj-progress">Progress: {progress}%</label>
        <input id="proj-progress" type="range" min={0} max={100} step={5} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full accent-primary" />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" isLoading={saving} disabled={!title.trim()}>
          {initial ? "Save changes" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
