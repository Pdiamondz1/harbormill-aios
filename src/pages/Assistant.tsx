import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { brand } from "@/config/brand";
import { useAria } from "@/hooks/useAria";
import { ChatMessage } from "@/components/assistant/ChatMessage";
import { ChatInput } from "@/components/assistant/ChatInput";
import { TypingIndicator } from "@/components/assistant/TypingIndicator";

const QUICK_PROMPTS = [
  "How are we doing this week?",
  "What are our current metrics?",
  "Summarize the latest brief",
  "What's our positioning?",
];

export default function Assistant() {
  const { messages, pending, sendMessage, isThinking, error } = useAria();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending, isThinking]);

  const empty = messages.length === 0 && !pending;

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pb-4">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <Sparkles className="h-7 w-7" />
            </span>
            <h2 className="text-xl font-bold text-foreground">Ask {brand.assistantName}</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {brand.assistantName} is {brand.assistantPersona}.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {p}
                </button>
              ))}
            </div>
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

      {error && <p className="pb-2 text-xs text-destructive-foreground">{error}</p>}

      <ChatInput onSend={sendMessage} disabled={isThinking} />
    </div>
  );
}
