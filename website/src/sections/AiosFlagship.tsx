import { Info } from "lucide-react";
import { site } from "@/config/site";
import { Section, SectionHeading } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { Icon } from "@/components/Icon";
import { DemoTour } from "@/components/demo/DemoTour";
import { CalendlyButton } from "@/components/CalendlyButton";

export function AiosFlagship() {
  return (
    <Section id="aios" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />
      <SectionHeading
        eyebrow={site.aios.eyebrow}
        title={site.aios.title}
        subtitle={site.aios.subtitle}
      />

      <Reveal className="mx-auto mt-12 max-w-4xl">
        <DemoTour />
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          {site.aios.note}
        </div>
      </Reveal>

      <Reveal className="mx-auto mt-16 max-w-5xl">
        <h3 className="text-center text-xl font-bold sm:text-2xl">{site.aios.featuresTitle}</h3>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {site.aios.features.map((feature) => (
            <div
              key={feature.title}
              className="flex h-full flex-col rounded-xl border border-border bg-card/60 p-5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Icon name={feature.icon} className="h-5 w-5" />
              </div>
              <h4 className="mt-4 font-semibold">{feature.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal className="mt-12 text-center">
        <CalendlyButton size="lg">Book a live walkthrough</CalendlyButton>
      </Reveal>
    </Section>
  );
}
