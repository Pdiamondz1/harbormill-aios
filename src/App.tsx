import { brand } from "@/config/brand";

/**
 * Phase 0 placeholder splash — proves the theme + white-label config render.
 * Replaced by the router + app shell in Phase 1.
 */
export default function App() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-xl text-center animate-fade-in-up">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {brand.company.name}
        </p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-bold text-gradient">
          {brand.productName}
        </h1>
        <p className="mt-4 text-base text-muted-foreground leading-relaxed">
          {brand.tagline}
        </p>

        <div className="mt-10 flex items-center justify-center gap-3">
          <span className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground glow">
            Scaffold online
          </span>
          <span className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-sm text-card-foreground">
            {brand.assistantName} standing by
          </span>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
          {["Metrics", "Briefs", "Findings", brand.assistantName].map((label) => (
            <div
              key={label}
              className="rounded-lg border border-border bg-card p-4 shadow-card-sm"
            >
              <div className="tnum text-2xl font-bold text-foreground">—</div>
              <div className="mt-1 text-xs font-medium text-muted-foreground">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
