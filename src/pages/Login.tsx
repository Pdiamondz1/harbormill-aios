import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { brand } from "@/config/brand";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

/**
 * Login for the operating deck. Access is provisioned via `user_roles`, never
 * self-served — so there is deliberately no signup path.
 */
export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (loginError) {
        setError(loginError.message);
        setLoading(false);
        return;
      }
      navigate("/", { replace: true });
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <style>{`
        @keyframes deck-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes deck-pulse { 0%,100% { opacity: 1; box-shadow: 0 0 0 0 hsl(var(--primary) / 0.6); } 50% { opacity: 0.6; box-shadow: 0 0 0 6px hsl(var(--primary) / 0); } }
        .deck-rise { opacity: 0; animation: deck-rise 0.7s cubic-bezier(0.22,1,0.36,1) forwards; }
        .deck-dot { animation: deck-pulse 2.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .deck-rise { animation: none; opacity: 1; } .deck-dot { animation: none; } }
      `}</style>

      {/* Atmosphere */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute -bottom-48 -right-32 h-[30rem] w-[30rem] rounded-full bg-secondary/15 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-10 px-6 py-12 lg:flex-row lg:gap-24">
        {/* Identity panel */}
        <section className="max-w-md text-center lg:text-left">
          <div
            className="deck-rise flex items-center justify-center gap-3 lg:justify-start"
            style={{ animationDelay: "0ms" }}
          >
            <img src={brand.logoSrc} alt={brand.productName} className="h-11 w-auto" />
          </div>

          <h1
            className="deck-rise mt-6 text-4xl font-bold leading-tight tracking-tight text-foreground lg:text-5xl"
            style={{ animationDelay: "90ms" }}
          >
            {brand.productName}
          </h1>
          <p
            className="deck-rise mt-3 text-base text-muted-foreground"
            style={{ animationDelay: "180ms" }}
          >
            {brand.tagline}
          </p>

          <div
            className="deck-rise mt-8 inline-flex items-center gap-2.5 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5"
            style={{ animationDelay: "270ms" }}
          >
            <span className="deck-dot h-2 w-2 rounded-full bg-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              {brand.assistantName} standing by
            </span>
          </div>
        </section>

        {/* Login card */}
        <section className="deck-rise w-full max-w-sm" style={{ animationDelay: "360ms" }}>
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border bg-card/80 p-7 shadow-card-lg backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Secure access
              </h2>
            </div>

            <label
              htmlFor="login-email"
              className="mt-6 block text-xs font-semibold uppercase tracking-wider text-primary"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            />

            <label
              htmlFor="login-password"
              className="mt-4 block text-xs font-semibold uppercase tracking-wider text-primary"
            >
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="w-full rounded-lg border border-input bg-background px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-xs text-destructive-foreground"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading || !email || !password}
              size="lg"
              className="mt-6 w-full"
            >
              {loading ? "Authenticating…" : "Enter the deck"}
            </Button>

            <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground">
              Access is provisioned by your {brand.tiers.admin} — there is no signup.
            </p>
          </form>
        </section>
      </main>

      <footer className="relative z-10 pb-6 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {brand.company.name}
      </footer>
    </div>
  );
}
