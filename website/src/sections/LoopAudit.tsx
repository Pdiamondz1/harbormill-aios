import { Check } from "lucide-react";
import { site } from "@/config/site";
import { Section, SectionHeading } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { Icon } from "@/components/Icon";
import { CalendlyButton } from "@/components/CalendlyButton";

export function LoopAudit() {
  const { loopAudit } = site;
  return (
    <Section id="audit">
      <SectionHeading
        eyebrow={loopAudit.eyebrow}
        title={loopAudit.title}
        subtitle={loopAudit.subtitle}
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loopAudit.conditions.map((c, i) => (
          <Reveal key={c.title} delay={(i % 4) * 0.05}>
            <div className="flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-card-sm transition-colors hover:border-primary/30">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-foreground">
                <Icon name={c.icon} className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="mx-auto mt-10 max-w-3xl">
        <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-6 sm:p-8">
          <h3 className="text-lg font-semibold">{loopAudit.receive.title}</h3>
          <ul className="mt-4 space-y-3">
            {loopAudit.receive.points.map((point) => (
              <li
                key={point}
                className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal className="mx-auto mt-10 max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
          {loopAudit.priceNote}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{loopAudit.closer}</p>
        <div className="mt-6">
          <CalendlyButton size="lg">{loopAudit.cta}</CalendlyButton>
        </div>
      </Reveal>
    </Section>
  );
}
