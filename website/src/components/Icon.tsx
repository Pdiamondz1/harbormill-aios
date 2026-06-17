import {
  FileBarChart,
  Receipt,
  UserPlus,
  Inbox,
  GraduationCap,
  LayoutDashboard,
  Workflow,
  FileText,
  ListChecks,
  Bell,
  Sparkles,
  Puzzle,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  FileBarChart,
  Receipt,
  UserPlus,
  Inbox,
  GraduationCap,
  LayoutDashboard,
  Workflow,
  FileText,
  ListChecks,
  Bell,
  Sparkles,
  Puzzle,
};

/** Renders a lucide icon by name (used for config-driven service/problem cards). */
export function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = ICONS[name] ?? Workflow;
  return <Cmp className={className} />;
}
