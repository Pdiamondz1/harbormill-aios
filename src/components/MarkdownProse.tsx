import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Shared prose renderer for markdown (briefings, findings, documents). */
export function MarkdownProse({ children }: { children: string }) {
  return (
    <div className="prose prose-sm prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-code:text-secondary">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
