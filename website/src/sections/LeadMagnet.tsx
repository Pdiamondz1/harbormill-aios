import { FileText } from "lucide-react";
import { site } from "@/config/site";
import { Section } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { LeadMagnetForm } from "@/components/LeadMagnetForm";

export function LeadMagnet() {
  return (
    <Section id="guide" className="py-16 sm:py-20">
      <Reveal className="mx-auto max-w-3xl">
        <div className="glass relative overflow-hidden rounded-2xl border border-border p-8 sm:p-10">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
              <FileText className="h-6 w-6" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
                {site.leadMagnet.eyebrow}
              </p>
              <h2 className="text-2xl font-bold">{site.leadMagnet.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {site.leadMagnet.body}
              </p>
              <div className="mt-5">
                <LeadMagnetForm />
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
