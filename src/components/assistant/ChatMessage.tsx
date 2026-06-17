import { brand } from "@/config/brand";
import { MarkdownProse } from "@/components/MarkdownProse";
import { cn } from "@/lib/utils";

export function ChatMessage({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[85%]", isUser ? "order-2" : "order-1")}>
        {!isUser && (
          <p className="mb-1 text-xs font-semibold text-muted-foreground">{brand.assistantName}</p>
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
            isUser
              ? "rounded-br-sm bg-primary text-primary-foreground"
              : "rounded-bl-sm border border-border bg-card text-card-foreground"
          )}
        >
          {isUser ? <p className="whitespace-pre-wrap">{content}</p> : <MarkdownProse>{content}</MarkdownProse>}
        </div>
      </div>
    </div>
  );
}
