import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export default function Strategy() {
  return (
    <div>
      <PageHeader
        eyebrow="Knowledge"
        title="Strategy"
        description="Living strategy docs and reference material for the business."
      />
      <EmptyState
        icon={BookOpen}
        title="No documents yet"
        description="Markdown documents you add become the strategy library — and feed the assistant's knowledge base."
      />
    </div>
  );
}
