import { Info } from "lucide-react";
import { site } from "@/config/site";
import { Section, SectionHeading } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
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

      <Reveal className="mt-10 text-center">
        <CalendlyButton size="lg">Book a live walkthrough</CalendlyButton>
      </Reveal>
    </Section>
  );
}
