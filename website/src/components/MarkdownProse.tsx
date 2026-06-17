import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/** Tailwind-typography wrapper for rendering canned markdown (briefings, Aria answers). */
export function MarkdownProse({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose prose-sm prose-invert max-w-none",
        "prose-headings:tracking-tight prose-headings:text-foreground",
        "prose-p:text-muted-foreground prose-li:text-muted-foreground",
        "prose-strong:text-foreground prose-a:text-primary",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
