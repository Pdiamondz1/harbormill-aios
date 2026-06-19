import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/ui/spinner";
import { CalendarGrid, type CalendarEvent } from "@/components/calendar/CalendarGrid";

export default function Calendar() {
  const { data, isLoading, isError } = useProjects();

  const events = useMemo<CalendarEvent[]>(
    () =>
      (data ?? [])
        .filter((p) => p.due_date)
        .map((p) => ({ id: p.id, date: p.due_date!, label: p.title, href: `/projects/${p.id}` })),
    [data]
  );

  return (
    <div>
      <PageHeader
        eyebrow="Operating deck"
        title="Calendar"
        description="Project due dates across the month. Click an item to open the project."
      />

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="h-9 w-9" />
        </div>
      ) : isError || !data ? (
        <EmptyState icon={CalendarDays} title="Couldn't load the calendar" />
      ) : (
        <CalendarGrid events={events} />
      )}
    </div>
  );
}
