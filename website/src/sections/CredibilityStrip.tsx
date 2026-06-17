import { site } from "@/config/site";
import { Reveal } from "@/components/Reveal";

export function CredibilityStrip() {
  return (
    <div className="border-y border-border bg-card/30">
      <div className="container py-8">
        <Reveal className="flex flex-col items-center gap-5 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {site.credibility.label}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {site.credibility.brands.map((brand) => (
              <span
                key={brand}
                className="text-lg font-semibold tracking-tight text-muted-foreground/70 sm:text-xl"
              >
                {brand}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
