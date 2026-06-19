import { useLocation } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { useAria } from "@/hooks/useAria";
import { brand } from "@/config/brand";
import { getSuggestionsForPage } from "@/lib/aria/suggestions";
import { AriaAvatar } from "@/components/assistant/AriaAvatar";
import { AriaQuickChips } from "@/components/assistant/AriaQuickChips";
import { AriaNudgeCard } from "@/components/assistant/AriaNudgeCard";
import { Button } from "@/components/ui/button";

// The first thing you see when Aria opens: page-aware help, a tip, quick chips,
// and a way into the full chat.
export function AriaTray() {
  const { pathname } = useLocation();
  const { sendAndOpen, openChat, messages } = useAria();
  const suggestion = getSuggestionsForPage(pathname);

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-center gap-3">
        <AriaAvatar />
        <div>
          <p className="text-sm font-bold text-foreground">{brand.assistantName}</p>
          <p className="text-xs text-muted-foreground">{suggestion.title}</p>
        </div>
      </div>

      {suggestion.tip && <AriaNudgeCard tip={suggestion.tip} />}

      <AriaQuickChips chips={suggestion.chips} onPick={sendAndOpen} />

      <Button variant="outline" className="mt-auto w-full justify-center" onClick={openChat}>
        <MessageSquare className="h-4 w-4" />
        {messages.length > 0 ? "Continue conversation" : "Start a conversation"}
      </Button>
    </div>
  );
}
