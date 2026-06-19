import { useAria } from "@/hooks/useAria";
import { brand } from "@/config/brand";
import { AriaAvatar } from "@/components/assistant/AriaAvatar";

// Floating button that opens the Aria tray. Hidden while the panel is open.
export function AriaLauncher() {
  const { stage, open } = useAria();
  if (stage !== "closed") return null;

  return (
    <button
      type="button"
      onClick={open}
      aria-label={`Open ${brand.assistantName}`}
      className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full border border-border bg-card py-2 pl-2 pr-4 shadow-card-lg transition-transform hover:scale-[1.03] active:scale-[0.98]"
    >
      <AriaAvatar size="sm" />
      <span className="text-sm font-semibold text-foreground">{brand.assistantName}</span>
    </button>
  );
}
