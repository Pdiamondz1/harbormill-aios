import { useState } from "react";
import { BookOpen } from "lucide-react";
import { useDocuments } from "@/hooks/useDocuments";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { MarkdownProse } from "@/components/MarkdownProse";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export default function Strategy() {
  const { data: docs, isLoading, isError } = useDocuments();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="h-9 w-9" />
      </div>
    );
  }

  if (isError || !docs || docs.length === 0) {
    return (
      <div>
        <PageHeader
          eyebrow="Knowledge"
          title="Strategy"
          description="Living strategy docs and reference material for the business."
        />
        <EmptyState
          icon={BookOpen}
          title={isError ? "Couldn't load documents" : "No documents yet"}
          description={
            isError
              ? undefined
              : "Markdown documents you add become the strategy library — and feed the assistant's knowledge base."
          }
        />
      </div>
    );
  }

  const selected = docs.find((d) => d.id === selectedId) ?? docs[0];

  return (
    <div>
      <PageHeader
        eyebrow="Knowledge"
        title="Strategy"
        description="Living strategy docs and reference material for the business."
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-72 lg:shrink-0">
          <nav className="overflow-hidden rounded-xl border border-border bg-card">
            {docs.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className={cn(
                  "block w-full border-b border-border px-4 py-2.5 text-left text-sm transition-colors last:border-b-0",
                  selected.id === d.id
                    ? "bg-accent font-semibold text-accent-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                {d.title}
              </button>
            ))}
          </nav>
        </aside>

        <article className="min-w-0 flex-1">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-bold text-foreground">{selected.title}</h2>
            <MarkdownProse>{selected.content_md}</MarkdownProse>
          </div>
        </article>
      </div>
    </div>
  );
}
