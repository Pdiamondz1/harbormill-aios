import { useEffect, useRef } from "react";
import { useAria } from "@/hooks/useAria";
import { brand } from "@/config/brand";
import { AriaAvatar } from "@/components/assistant/AriaAvatar";
import { ChatMessage } from "@/components/assistant/ChatMessage";
import { ChatInput } from "@/components/assistant/ChatInput";
import { TypingIndicator } from "@/components/assistant/TypingIndicator";
import { AriaQuickChips } from "@/components/assistant/AriaQuickChips";
import { AriaActionChips } from "@/components/assistant/AriaActionChips";
import { getSuggestionsForPage } from "@/lib/aria/suggestions";
import { useLocation } from "react-router-dom";
import { MarkdownProse } from "@/components/MarkdownProse";

// The chat surface inside the Aria panel. Reuses the existing message/input
// components and the shared conversation state from the provider.
export function AriaChatView() {
  const { messages, pending, isThinking, error, sendMessage, streamingText, statusLabel, actions, sendAndOpen } =
    useAria();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending, isThinking, streamingText]);

  const empty = messages.length === 0 && !pending;
  const suggestion = getSuggestionsForPage(pathname);

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <AriaAvatar size="lg" />
            <h2 className="mt-3 text-base font-bold text-foreground">Ask {brand.assistantName}</h2>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">{brand.assistantPersona}.</p>
            <div className="mt-4 w-full">
              <AriaQuickChips chips={suggestion.chips} onPick={(prompt) => sendAndOpen(prompt)} />
            </div>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <ChatMessage key={m.id} role={m.role} content={m.content} />
            ))}

            {/* Route-based action chips from the last assistant reply */}
            {!isThinking && actions.length > 0 && <AriaActionChips chips={actions} />}

            {/* Optimistic user turn */}
            {pending && <ChatMessage role="user" content={pending} />}

            {/* Streaming assistant bubble */}
            {isThinking && (
              <>
                {statusLabel && (
                  <p className="text-xs text-muted-foreground">{statusLabel}</p>
                )}
                {streamingText ? (
                  <div className="flex justify-start">
                    <div className="max-w-[85%]">
                      <p className="mb-1 text-xs font-semibold text-muted-foreground">
                        {brand.assistantName}
                      </p>
                      <div className="rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-2.5 text-sm text-card-foreground">
                        <MarkdownProse>{streamingText}</MarkdownProse>
                      </div>
                    </div>
                  </div>
                ) : (
                  <TypingIndicator />
                )}
              </>
            )}
          </>
        )}
      </div>

      <div className="border-t border-border p-3">
        {error && <p className="pb-2 text-xs text-destructive-foreground">{error}</p>}
        <ChatInput onSend={sendMessage} disabled={isThinking} />
      </div>
    </div>
  );
}
