import { brand } from "@/config/brand";

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div>
        <p className="mb-1 text-xs font-semibold text-muted-foreground">{brand.assistantName}</p>
        <div className="inline-flex items-center gap-1 rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
