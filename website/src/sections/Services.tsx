import { site } from "@/config/site";
import { cn } from "@/lib/utils";
import { Section, SectionHeading } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { Icon } from "@/components/Icon";

export function Services() {
  return (
    <Section id="services">
      <SectionHeading eyebrow={site.services.eyebrow} title={site.services.title} />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {site.services.items.map((item, i) => {
          const flagged = "flag" in item && item.flag;
          return (
            <Reveal key={item.title} delay={(i % 3) * 0.05}>
              <div
                className={cn(
                  "flex h-full flex-col rounded-xl border bg-card p-6 shadow-card-sm transition-colors",
                  flagged
                    ? "border-primary/40 bg-primary/[0.04]"
                    : "border-border hover:border-primary/30"
                )}
              >
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-lg",
                    flagged ? "bg-primary/20 text-primary" : "bg-muted text-foreground"
                  )}
                >
                  <Icon name={item.icon} className="h-5 w-5" />
                </div>
                <h3 className="mt-4 flex items-center gap-2 font-semibold">
                  {item.title}
                  {flagged && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                      Start here
                    </span>
                  )}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
