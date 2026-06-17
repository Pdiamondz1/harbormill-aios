import { Check } from "lucide-react";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";
import { Section, SectionHeading } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { CalendlyButton } from "@/components/CalendlyButton";

export function Ladder() {
  return (
    <Section id="ladder" className="bg-card/20">
      <SectionHeading
        eyebrow={site.ladder.eyebrow}
        title={site.ladder.title}
        subtitle={site.ladder.subtitle}
      />

      <div className="mx-auto mt-12 max-w-3xl space-y-4">
        {site.ladder.rungs.map((rung, i) => (
          <Reveal key={rung.name} delay={i * 0.06}>
            <div
              className="rounded-xl border border-border bg-card p-5 shadow-card-sm sm:p-6"
              style={{ marginLeft: `${i * 1.5}rem` }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                      i === 0 ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary"
                    )}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{rung.name}</h3>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="tnum text-lg font-bold">{rung.price}</p>
                  <p className="text-xs text-muted-foreground">{rung.unit}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:pl-[3.25rem]">
                {rung.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="mx-auto mt-10 max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-4 py-2 text-sm text-success">
          <Check className="h-4 w-4" />
          {site.ladder.footnote}
        </div>
        <div className="mt-6">
          <CalendlyButton size="lg" />
        </div>
      </Reveal>
    </Section>
  );
}
