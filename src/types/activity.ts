export interface ActivityItem {
  id: string;
  type: string;
  actor: string | null;
  summary: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}
