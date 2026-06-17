import { Linkedin } from "lucide-react";
import { site } from "@/config/site";
import { Section } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";

export function About() {
  return (
    <Section id="about">
      <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <Reveal>
          <div className="relative mx-auto max-w-sm">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-4 rounded-3xl opacity-50"
              style={{
                background: "radial-gradient(circle at 30% 0%, hsl(var(--primary) / 0.18), transparent 60%)",
              }}
            />
            <img
              src="/founder.png"
              alt={`${site.founder.name}, ${site.founder.title}`}
              loading="lazy"
              decoding="async"
              className="relative aspect-[3/4] w-full rounded-2xl border border-border object-cover shadow-card-lg"
            />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            {site.about.eyebrow}
          </p>
          <h2 className="text-3xl font-bold sm:text-4xl">{site.about.name}</h2>
          <p className="mt-1 text-base text-muted-foreground">{site.about.title}</p>

          <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {site.about.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {site.about.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {skill}
              </span>
            ))}
          </div>

          <p className="mt-5 text-sm text-muted-foreground">{site.about.credentials}</p>

          <div className="mt-7">
            <Button asChild variant="outline" size="lg">
              <a href={site.founder.linkedin} target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-4 w-4" />
                {site.about.ctaLabel}
              </a>
            </Button>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
