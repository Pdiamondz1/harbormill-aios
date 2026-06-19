import { FolderPlus, GitBranch, MessageSquare, Activity as ActivityIcon, type LucideIcon } from "lucide-react";
import type { ActivityItem } from "@/types/activity";

const ICONS: Record<string, LucideIcon> = {
  project_created: FolderPlus,
  project_status_changed: GitBranch,
  note_added: MessageSquare,
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const Icon = ICONS[item.type] ?? ActivityIcon;
        return (
          <li key={item.id} className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-foreground">{item.summary}</p>
              <p className="text-xs text-muted-foreground">{relativeTime(item.created_at)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
