export type ProjectStatus = "planned" | "active" | "blocked" | "done";

export const PROJECT_STATUSES: ProjectStatus[] = ["planned", "active", "blocked", "done"];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planned: "Planned",
  active: "Active",
  blocked: "Blocked",
  done: "Done",
};

export interface Project {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  owner: string | null;
  start_date: string | null;
  due_date: string | null;
  progress: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Fields an admin can set when creating/editing a project. */
export interface ProjectInput {
  title: string;
  description?: string | null;
  status?: ProjectStatus;
  owner?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  progress?: number;
}
