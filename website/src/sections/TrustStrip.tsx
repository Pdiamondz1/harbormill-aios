import { ShieldCheck } from "lucide-react";
import { site } from "@/config/site";
import { Section } from "@/components/Section";
import { Reveal } from "@/components/Reveal";

export function TrustStrip() {
  return (
    <Section className="py-16 sm:py-20">
      <Reveal className="mx-auto max-w-3xl">
        <div className="glass relative overflow-hidden rounded-2xl border border-border p-8 sm:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-50"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.16), transparent 65%)",
            }}
          />
          <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:gap-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                {site.trust.eyebrow}
              </p>
              <h2 className="text-2xl font-bold sm:text-3xl">{site.trust.title}</h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {site.trust.body}
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
