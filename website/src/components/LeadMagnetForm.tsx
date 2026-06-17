import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { site, FORM_ENDPOINT } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});
type FormValues = z.infer<typeof schema>;

export function LeadMagnetForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit({ email }: FormValues) {
    try {
      if (FORM_ENDPOINT) {
        // Google Apps Script web app: send a "simple" request (text/plain + no-cors)
        // so the browser skips the CORS preflight the script can't answer. The
        // response is opaque, so a resolved fetch means the request was delivered;
        // only a network failure rejects and lands in catch.
        await fetch(FORM_ENDPOINT, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ email, source: "harbormill.net guide" }),
        });
      } else {
        // No provider wired yet — fall back to a mailto capture so the site still ships.
        const subject = encodeURIComponent("Send me the AI prompt guide");
        const body = encodeURIComponent(`Please send the 60-page AI prompt guide to: ${email}`);
        window.location.href = `mailto:${site.company.email}?subject=${subject}&body=${body}`;
      }
      setSubmitted(true);
      toast.success("You're in — grab the guide below.");
    } catch {
      toast.error("Something went wrong. Please try again or email me directly.");
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/10 p-5 text-center">
        <p className="text-sm text-foreground">{site.leadMagnet.success}</p>
        <Button asChild variant="secondary" className="mt-4">
          <a href={site.leadMagnet.pdfPath} target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4" />
            {site.leadMagnet.pdfLabel}
          </a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 sm:flex-row">
      <div className="flex-1">
        <Input
          type="email"
          placeholder="you@yourbusiness.com"
          aria-label="Email address"
          {...register("email")}
        />
        {errors.email && (
          <p className="mt-1.5 text-left text-xs text-destructive-foreground">
            {errors.email.message}
          </p>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting} className="sm:shrink-0">
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {site.leadMagnet.cta}
      </Button>
    </form>
  );
}
