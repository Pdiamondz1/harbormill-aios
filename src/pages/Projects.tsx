import { useMemo, useState } from "react";
import { FolderKanban, Plus } from "lucide-react";
import { useProjects, useSaveProject } from "@/hooks/useProjects";
import { useAccess } from "@/hooks/useAccess";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/types/project";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { cn } from "@/lib/utils";

const FILTERS: (ProjectStatus | "all")[] = ["all", "planned", "active", "blocked", "done"];

export default function Projects() {
  const { data, isLoading, isError } = useProjects();
  const { isAdmin } = useAccess();
  const saveProject = useSaveProject();
  const [filter, setFilter] = useState<ProjectStatus | "all">("all");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const list = data ?? [];
    return filter === "all" ? list : list.filter((p) => p.status === filter);
  }, [data, filter]);

  return (
    <div>
      <PageHeader
        eyebrow="Operating deck"
        title="Projects"
        description="Initiatives and the work in flight — status, owners, due dates, and progress."
        actions={
          isAdmin && !creating ? (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              New project
            </Button>
          ) : undefined
        }
      />

      {isAdmin && creating && (
        <div className="mb-4">
          <ProjectForm
            saving={saveProject.isPending}
            onCancel={() => setCreating(false)}
            onSubmit={(input) =>
              saveProject.mutate({ input }, { onSuccess: () => setCreating(false) })
            }
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="h-9 w-9" />
        </div>
      ) : isError || !data ? (
        <EmptyState icon={FolderKanban} title="Couldn't load projects" />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                  filter === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {s === "all" ? "All" : PROJECT_STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title={filter === "all" ? "No projects yet" : "Nothing with this status"}
              description={
                isAdmin && filter === "all"
                  ? "Create your first project to start tracking work."
                  : undefined
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
