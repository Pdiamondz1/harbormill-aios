import { useCallback, useState, type ReactNode } from "react";
import { useAssistant } from "@/hooks/useAssistant";
import { AriaContext, type AriaContextValue } from "@/contexts/aria-context";
import type { AriaStage } from "@/types/aria";

// Owns the Aria panel state machine and a single useAssistant instance so the
// floating panel and the full-page Assistant share one live conversation
// (messages, optimistic pending turn, thinking state).
export function AriaProvider({ children }: { children: ReactNode }) {
  const { messages, pending, sendMessage, isThinking, error, streamingText, statusLabel, actions } = useAssistant();
  const [stage, setStage] = useState<AriaStage>("closed");

  const open = useCallback(() => setStage("tray"), []);
  const openChat = useCallback(() => setStage("chat"), []);
  const collapse = useCallback(() => setStage("tray"), []);
  const close = useCallback(() => setStage("closed"), []);

  const sendAndOpen = useCallback(
    (prompt: string) => {
      setStage("chat");
      sendMessage(prompt);
    },
    [sendMessage]
  );

  const value: AriaContextValue = {
    stage,
    open,
    openChat,
    collapse,
    close,
    messages,
    pending,
    isThinking,
    error,
    streamingText,
    statusLabel,
    actions,
    sendMessage,
    sendAndOpen,
  };

  return <AriaContext.Provider value={value}>{children}</AriaContext.Provider>;
}
