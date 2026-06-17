import { site } from "@/config/site";
import { Section, SectionHeading } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { Icon } from "@/components/Icon";

export function Problem() {
  return (
    <Section className="py-16 sm:py-20">
      <SectionHeading eyebrow={site.problem.eyebrow} title={site.problem.title} />
      <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
        {site.problem.items.map((item, i) => (
          <Reveal key={item.title} delay={i * 0.05}>
            <div className="flex h-full gap-4 rounded-xl border border-border bg-card/50 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon name={item.icon} className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
