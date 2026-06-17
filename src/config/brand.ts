/**
 * Harbormill AIOS — white-label control panel.
 *
 * This file holds every piece of client-facing *text and imagery*. To rebrand
 * for a client, edit the values here, swap the logo asset, and adjust the color
 * variables in `src/index.css`. No component code should need to change.
 *
 * (Colors live in src/index.css :root/.dark; this file is words + logos + names.)
 */
export interface BrandConfig {
  /** Product name shown in the nav, title bar, and docs. */
  productName: string;
  /** Short tagline under the product name on the dashboard/login. */
  tagline: string;
  /** The AI assistant's display name (replaces "Donny"). */
  assistantName: string;
  /** One-line persona used in the assistant's empty state / system prompt mirror. */
  assistantPersona: string;
  /** Public path to the logo (place the file in /public). */
  logoSrc: string;
  /** Public path to a square mark/emblem (favicon, assistant avatar). */
  emblemSrc: string;
  /** The operator/agency selling this deployment. */
  company: {
    name: string;
    url: string;
  };
  /** Labels for the two access tiers (rename per client vocabulary). */
  tiers: {
    admin: string;
    stakeholder: string;
  };
}

export const brand: BrandConfig = {
  productName: "Harbormill AIOS",
  tagline: "Your operating deck — live metrics, weekly briefs, findings, and an AI that knows your business.",
  assistantName: "Aria",
  assistantPersona:
    "the operator's AI co-pilot — concise, candid, and grounded in this business's live metrics and knowledge base",
  logoSrc: "/logo.svg",
  emblemSrc: "/emblem.svg",
  company: {
    name: "Harbormill Automation",
    url: "https://harbormill.net",
  },
  tiers: {
    admin: "Admin",
    stakeholder: "Stakeholder",
  },
};
