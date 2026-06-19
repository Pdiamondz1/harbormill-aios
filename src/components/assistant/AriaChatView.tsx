import { useEffect, useRef } from "react";
import { useAria } from "@/hooks/useAria";
import { brand } from "@/config/brand";
import { AriaAvatar } from "@/components/assistant/AriaAvatar";
import { ChatMessage } from "@/components/assistant/ChatMessage";
import { ChatInput } from "@/components/assistant/ChatInput";
import { TypingIndicator } from "@/components/assistant/TypingIndicator";

// The chat surface inside the Aria panel. Reuses the existing message/input
// components and the shared conversation state from the provider.
export function AriaChatView() {
  const { messages, pending, isThinking, error, sendMessage } = useAria();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending, isThinking]);

  const empty = messages.length === 0 && !pending;

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <AriaAvatar size="lg" />
            <h2 className="mt-3 text-base font-bold text-foreground">Ask {brand.assistantName}</h2>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">{brand.assistantPersona}.</p>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <ChatMessage key={m.id} role={m.role} content={m.content} />
            ))}
            {pending && <ChatMessage role="user" content={pending} />}
            {isThinking && <TypingIndicator />}
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
