// Loads the Calendly widget assets once and exposes popup/inline helpers.
// No npm wrapper — the official script is lighter and sufficient.

let loadPromise: Promise<void> | null = null;

const CSS_URL = "https://assets.calendly.com/assets/external/widget.css";
const JS_URL = "https://assets.calendly.com/assets/external/widget.js";

export function loadCalendly(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    if (!document.querySelector("link[data-calendly]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CSS_URL;
      link.setAttribute("data-calendly", "true");
      document.head.appendChild(link);
    }

    if (window.Calendly) {
      resolve();
      return;
    }

    const existing = document.querySelector(
      "script[data-calendly]"
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }

    const script = document.createElement("script");
    script.src = JS_URL;
    script.async = true;
    script.setAttribute("data-calendly", "true");
    script.addEventListener("load", () => resolve());
    document.head.appendChild(script);
  });

  return loadPromise;
}

/** Apply dark-theme params so the embedded widget matches the AIOS deck. */
export function themedCalendlyUrl(url: string): string {
  const params = "background_color=0e1726&text_color=f1f5f9&primary_color=2ea8f2";
  return url.includes("?") ? `${url}&${params}` : `${url}?${params}`;
}

export function openCalendlyPopup(url: string): void {
  loadCalendly().then(() => {
    window.Calendly?.initPopupWidget({ url: themedCalendlyUrl(url) });
  });
}
