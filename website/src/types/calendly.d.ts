// Ambient type for the Calendly widget script (loaded at runtime from
// assets.calendly.com). Only the calls we use are declared.
export {};

declare global {
  interface CalendlyPopupOptions {
    url: string;
  }

  interface CalendlyApi {
    initPopupWidget(options: CalendlyPopupOptions): void;
    initInlineWidget(options: { url: string; parentElement: HTMLElement }): void;
  }

  interface Window {
    Calendly?: CalendlyApi;
  }
}
