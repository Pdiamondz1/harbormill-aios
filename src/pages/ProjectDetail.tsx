import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, FolderKanban, Pencil, User } from "lucide-react";
import { useProject, useSaveProject } from "@/hooks/useProjects";
import { useAccess } from "@/hooks/useAccess";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { ProjectProgress } from "@/components/projects/ProjectProgress";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { NotesThread } from "@/components/notes/NotesThread";

function formatDate(date: string | null): string {
  return date ? new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading, isError } = useProject(id);
  const { isAdmin } = useAccess();
  const saveProject = useSaveProject();
  const [editing, setEditing] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="h-9 w-9" />
      </div>
    );
  }
  if (isError || !project) {
    return <EmptyState icon={FolderKanban} title="Project not found" />;
  }

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
        <ArrowLeft className="h-4 w-4" />
        Projects
      </Link>

      {editing ? (
        <ProjectForm
          initial={project}
          saving={saveProject.isPending}
          onCancel={() => setEditing(false)}
          onSubmit={(input) =>
            saveProject.mutate({ id: project.id, input }, { onSuccess: () => setEditing(false) })
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">{project.title}</h1>
                <ProjectStatusBadge status={project.status} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {project.owner || "Unassigned"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="h-4 w-4" />
                  {formatDate(project.start_date)} → {formatDate(project.due_date)}
                </span>
              </div>
            </div>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
          </div>

          {project.description && (
            <p className="mt-4 whitespace-pre-wrap text-sm text-foreground">{project.description}</p>
          )}

          <div className="mt-4 flex items-center gap-2">
            <ProjectProgress value={project.progress} />
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{project.progress}%</span>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-bold text-foreground">Notes</h2>
        <NotesThread projectId={project.id} />
      </div>
    </div>
  );
}
