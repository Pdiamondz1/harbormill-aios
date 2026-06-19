import { Link } from "react-router-dom";
import { CalendarClock, User } from "lucide-react";
import type { Project } from "@/types/project";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { ProjectProgress } from "@/components/projects/ProjectProgress";

function formatDate(date: string | null): string | null {
  if (!date) return null;
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ProjectCard({ project }: { project: Project }) {
  const due = formatDate(project.due_date);
  return (
    <Link
      to={`/projects/${project.id}`}
      className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 truncate font-semibold text-foreground">{project.title}</h3>
        <ProjectStatusBadge status={project.status} />
      </div>

      {project.description && (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {project.owner && (
          <span className="inline-flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {project.owner}
          </span>
        )}
        {due && (
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" />
            Due {due}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <ProjectProgress value={project.progress} />
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{project.progress}%</span>
      </div>
    </Link>
  );
}
