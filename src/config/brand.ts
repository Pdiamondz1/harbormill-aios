/**
 * Harbormill AIOS — white-label control panel.
 *
 * DEMO SKIN: "Mise" — a restaurant-group operating deck. This branch
 * (demo/restaurant-ops) is a worked example of a per-vertical reskin: it changes
 * ONLY this file, the theme variables in src/index.css, and the seed data.
 *
 * (Colors live in src/index.css :root/.dark; this file is words + logos + names.)
 */
export interface BrandConfig {
  productName: string;
  tagline: string;
  assistantName: string;
  assistantPersona: string;
  logoSrc: string;
  emblemSrc: string;
  company: {
    name: string;
    url: string;
  };
  tiers: {
    admin: string;
    stakeholder: string;
  };
}

export const brand: BrandConfig = {
  productName: "Mise",
  tagline: "Your service deck — covers, food & labor cost, reviews, and a GM who never sleeps.",
  assistantName: "Sage",
  assistantPersona:
    "the GM's right hand — reads the line like a chef and the P&L like a controller, grounded in this group's live service numbers",
  logoSrc: "/logo.svg",
  emblemSrc: "/emblem.svg",
  company: {
    name: "Harbormill Automation",
    url: "https://harbormill.net",
  },
  tiers: {
    admin: "GM",
    stakeholder: "Owner",
  },
};
