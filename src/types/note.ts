export interface Note {
  id: string;
  project_id: string | null;
  author: string;
  body: string;
  created_at: string;
}
