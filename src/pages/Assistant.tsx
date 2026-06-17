import { Sparkles } from "lucide-react";
import { brand } from "@/config/brand";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export default function Assistant() {
  return (
    <div>
      <PageHeader
        eyebrow="AI"
        title={brand.assistantName}
        description={`${brand.assistantName} is ${brand.assistantPersona}.`}
      />
      <EmptyState
        icon={Sparkles}
        title={`${brand.assistantName} isn't wired up yet`}
        description="The chat assistant, its knowledge base, and tool registry come online in a later phase."
      />
    </div>
  );
}
