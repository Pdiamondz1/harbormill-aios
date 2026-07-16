import { createContext } from "react";
import type { AriaStage } from "@/types/aria";
import type { ChatMessage } from "@/hooks/useAssistant";

export interface AriaContextValue {
  stage: AriaStage;
  /** Open the panel to the tray (page help + quick chips). */
  open: () => void;
  /** Open straight into the chat view. */
  openChat: () => void;
  /** Collapse the chat view back to the tray. */
  collapse: () => void;
  /** Close the panel entirely. */
  close: () => void;

  // Shared chat state (one conversation per user, mirrored from useAssistant).
  messages: ChatMessage[];
  pending: string | null;
  isThinking: boolean;
  error: string | null;
  /** Incremental text accumulated during the current streaming reply. */
  streamingText: string;
  /** Human-readable label for the tool currently running (null when idle). */
  statusLabel: string | null;
  /** Route-based action chips surfaced by the last assistant reply. */
  actions: { label: string; route: string }[];
  /** Send a message (does not change stage). */
  sendMessage: (text: string) => void;
  /** Open into chat and send a prompt in one step (used by quick chips). */
  sendAndOpen: (prompt: string) => void;
}

export const AriaContext = createContext<AriaContextValue | null>(null);
