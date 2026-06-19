import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

// Brand-driven avatar (uses the emblem asset, never a hardcoded mark).
// `thinking` adds the breathe animation defined in tailwind.config.ts.
export function AriaAvatar({
  size = "md",
  thinking = false,
  className,
}: {
  size?: "sm" | "md" | "lg";
  thinking?: boolean;
  className?: string;
}) {
  const dimensions = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-12 w-12" : "h-9 w-9";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent",
        dimensions,
        thinking && "animate-breathe",
        className
      )}
    >
      <img src={brand.emblemSrc} alt={brand.assistantName} className="h-2/3 w-2/3 object-contain" />
    </span>
  );
}
