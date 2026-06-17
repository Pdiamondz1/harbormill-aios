import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { DEMO_EXCHANGES, type DemoExchange } from "@/config/demoData";
import { MarkdownProse } from "@/components/MarkdownProse";
import { cn } from "@/lib/utils";

const ASSISTANT = "Aria";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function Bubble({ role, content }: Message) {
  const isUser = role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[85%]", isUser ? "order-2" : "order-1")}>
        {!isUser && (
          <p className="mb-1 text-xs font-semibold text-muted-foreground">{ASSISTANT}</p>
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
            isUser
              ? "rounded-br-sm bg-primary text-primary-foreground"
              : "rounded-bl-sm border border-border bg-card text-card-foreground"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <MarkdownProse>{content}</MarkdownProse>
          )}
        </div>
      </div>
    </div>
  );
}

/** Scripted "Ask Aria" chat — clicking a prompt plays a canned answer. No network. */
export function AriaStep() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [asked, setAsked] = useState<Set<string>>(new Set());
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  useEffect(() => () => clearTimeout(timer.current), []);

  function ask(ex: DemoExchange) {
    if (typing || asked.has(ex.prompt)) return;
    setAsked((prev) => new Set(prev).add(ex.prompt));
    setMessages((prev) => [...prev, { role: "user", content: ex.prompt }]);
    setTyping(true);
    timer.current = setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", content: ex.answer }]);
      setTyping(false);
    }, 1100);
  }

  const remaining = DEMO_EXCHANGES.filter((ex) => !asked.has(ex.prompt));

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-lg font-semibold">Ask {ASSISTANT}</h3>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-5 text-sm text-muted-foreground">
            Hi — I'm {ASSISTANT}, your operating co-pilot. I'm grounded in this business's live
            metrics and knowledge base. Try a question below.
          </div>
        )}
        {messages.map((m, i) => (
          <Bubble key={i} {...m} />
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm border border-border bg-card px-2">
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {remaining.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          {remaining.map((ex) => (
            <button
              key={ex.prompt}
              onClick={() => ask(ex)}
              disabled={typing}
              className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground disabled:opacity-50"
            >
              {ex.prompt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
