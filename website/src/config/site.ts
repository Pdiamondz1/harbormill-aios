/**
 * Single source of truth for all marketing copy, links, and pricing on the
 * Harbormill Automation site. Edit here — components stay presentational.
 */

export const CALENDLY_URL =
  import.meta.env.VITE_CALENDLY_URL ?? "https://calendly.com/dwilliams-harbormill/30min";

export const FORM_ENDPOINT = import.meta.env.VITE_FORM_ENDPOINT ?? "";

export const site = {
  company: {
    name: "Harbormill Automation",
    url: "https://harbormill.net",
    email: "dwilliams@harbormill.net",
  },
  founder: {
    name: "Damon Williams",
    title: "AI Solutions Engineer & Founder",
    linkedin: "https://www.linkedin.com/in/damon-w-67882768",
  },

  nav: [
    { label: "Services", href: "#services" },
    { label: "AIOS", href: "#aios" },
    { label: "Loop Audit", href: "#loop-audit" },
    { label: "Ladder", href: "#ladder" },
    { label: "Proof", href: "#case-studies" },
    { label: "About", href: "#about" },
    { label: "FAQ", href: "#faq" },
  ],

  hero: {
    eyebrow: "Custom AI automation for small business",
    titleLead: "Stop doing the work",
    titleEmph: "your software should do for you.",
    subtitle:
      "I'm Damon Williams — 15 years in enterprise IT, now building practical AI automation for small-business owners who are out of hours, not out of ambition. We start by teaching you AI, then automate what's slowing you down.",
    primaryCta: "Book a free 30-min intro",
    secondaryCta: "See AIOS in action",
  },

  credibility: {
    label: "Background includes 15 years securing networks for",
    brands: ["Nike", "Assurant", "IAA", "LEGACY Supply Chain"],
  },

  philosophy: {
    eyebrow: "The Harbormill difference",
    title: "Education first. Automation second.",
    body: "Most shops sell you a black box. I'd rather teach you to fish. We start by getting you fluent with AI — set up Claude, learn the prompts and workflows your business actually needs — then automate the busywork on top of that foundation. You come out understanding your tools, not dependent on me.",
  },

  problem: {
    eyebrow: "Sound familiar?",
    title: "The busywork that quietly caps your growth",
    items: [
      {
        icon: "FileBarChart",
        title: "Reports built by hand",
        body: "Hours each week copy-pasting numbers into a spreadsheet nobody fully trusts.",
      },
      {
        icon: "Receipt",
        title: "Chasing invoices",
        body: "Money sitting in unpaid invoices because follow-up is manual and easy to forget.",
      },
      {
        icon: "UserPlus",
        title: "Leads typed in by hand",
        body: "New leads re-keyed from email into a CRM — slow, error-prone, and easy to drop.",
      },
      {
        icon: "Inbox",
        title: "Inbox overload",
        body: "Support and email piling up faster than a small team can triage and reply.",
      },
    ],
  },

  aios: {
    eyebrow: "The flagship",
    title: "Harbormill AIOS — your operating deck",
    subtitle:
      "The signature build: one place to see your live metrics, read an AI-written weekly brief, and ask an assistant that actually knows your business. Take the tour.",
    note: "Illustrative sample data — not a live client account.",
    featuresTitle: "More than a dashboard",
    features: [
      {
        icon: "LayoutDashboard",
        title: "Live metrics & weekly briefings",
        body: "Your KPIs at a glance with status colors, plus an AI-written weekly brief that tells you what actually changed and what to do about it.",
      },
      {
        icon: "FileText",
        title: "Meeting transcripts → action steps",
        body: "Hand AIOS a meeting transcript and get back a clean summary and concrete next action steps for the business — nothing lost after the call.",
      },
      {
        icon: "ListChecks",
        title: "Your top priorities, daily",
        body: "AIOS reads your day-to-day operations and surfaces the top priorities to focus on — so you start every morning knowing what matters most.",
      },
      {
        icon: "Bell",
        title: "What to act on now",
        body: "It flags the emails, messages, DMs, and meetings worth your attention based on your business's environment — signal over noise.",
      },
      {
        icon: "Sparkles",
        title: "Ask Aria, anything",
        body: "A business-aware assistant grounded in your live metrics, briefs, and knowledge base — ask in plain language, get grounded answers.",
      },
      {
        icon: "Puzzle",
        title: "Integrations & plugins",
        body: "AIOS plugs into the business software you already use — CRM, accounting, support, messaging, and more. If it has an API, we can wire it in.",
      },
    ],
  },

  services: {
    eyebrow: "What I build",
    title: "Automation that gives you your week back",
    items: [
      {
        icon: "GraduationCap",
        title: "AI enablement & training",
        body: "Get your team fluent with AI first — Claude setup, prompt libraries, and the workflows your business actually uses. The foundation everything else builds on.",
        flag: true,
      },
      {
        icon: "LayoutDashboard",
        title: "Reporting & operating decks",
        body: "Automated weekly KPI reports, dashboards, and the Harbormill AIOS deck — live metrics plus an AI brief, so you stop flying blind.",
      },
      {
        icon: "UserPlus",
        title: "Lead intake → CRM",
        body: "Capture leads from forms, email, and calls; enrich and route them into your CRM automatically with follow-up reminders so nothing slips.",
      },
      {
        icon: "Receipt",
        title: "Invoice & AR follow-ups",
        body: "Automated invoicing and payment-reminder sequences that chase receivables for you — get paid faster without the awkward emails.",
      },
      {
        icon: "Inbox",
        title: "AI support & inbox triage",
        body: "AI that triages tickets and email, drafts replies, tags urgency, and escalates — cutting response time for small teams.",
      },
      {
        icon: "Workflow",
        title: "Custom workflow automation",
        body: "Anything manual that eats time, slows your staff, or caps your scalability. If it's repetitive, it's a candidate for automation.",
      },
    ],
  },

  ladder: {
    eyebrow: "How we work together",
    title: "The Harbormill Ladder",
    subtitle:
      "Start small and low-risk, and climb only as results prove out. It's a repeatable engine: a Loop Audit finds the highest-ROI automation, a Focused Project ships it, and a Retainer keeps it compounding — so you never commit to a big build before you've seen ROI.",
    rungs: [
      {
        name: "Get started",
        price: "$100",
        unit: "per hour",
        body: "One-on-one consulting sessions — get your Claude setup running, solve a real problem, learn the ropes. We build the relationship before anything bigger.",
      },
      {
        name: "Loop Audit",
        price: "$500–$2,500",
        unit: "fixed scope",
        body: "We map your workflows, find the highest-ROI automation, and scope the first real build. You leave with a concrete plan whether or not we continue.",
      },
      {
        name: "Focused project",
        price: "$2,500–$10,000",
        unit: "per project",
        body: "We ship one workflow end to end and prove the ROI on something that matters — reporting, lead intake, AR follow-up, support triage.",
      },
      {
        name: "Retainer",
        price: "$3,000–$10,000",
        unit: "per month",
        body: "Ongoing automation and support — but only after trust and results. We expand what's working and keep your systems sharp.",
      },
    ],
    footnote: "Every engagement starts with a free 30-minute intro. One-on-one consulting is $100/hour.",
  },

  loopAudit: {
    eyebrow: "The signature audit",
    title: "Find the one automation worth building first",
    subtitle:
      "Before we build anything, we map your repeating work and score each task on four conditions — then hand you a ranked plan with the single highest-ROI automation to build first.",
    conditions: [
      {
        icon: "Repeat",
        title: "It repeats",
        body: "It happens on a predictable cadence — the time it eats, week after week, is the prize.",
      },
      {
        icon: "CheckCircle2",
        title: "A rule decides \"done\"",
        body: "Success is checkable by a clear rule, not a matter of human taste.",
      },
      {
        icon: "ShieldCheck",
        title: "A wrong run is cheap",
        body: "A mistake is low-stakes and reversible — safe to let software try.",
      },
      {
        icon: "Plug",
        title: "AI has the data + tools",
        body: "The inputs are reachable and the actions already exist as tools we can wire in.",
      },
    ],
    receive: {
      title: "What you walk away with",
      points: [
        "Every repeating task scored by ROI — value per unit of effort.",
        "One clear \"build this first\" recommendation, with the reasoning.",
        "A plan you keep — whether you build it with us or not.",
      ],
    },
    priceNote: "$500–$2,500 · fixed scope",
    closer: "You leave understanding the method — not dependent on us.",
    cta: "Book a Loop Audit",
  },

  trust: {
    eyebrow: "Why it's safe to automate",
    title: "Automation you can leave running",
    body: "Black-box automation is unnerving — you can't tell when it's quietly gone wrong. So we only build automation where a clear rule decides when the job is done, and a wrong run is cheap to undo. That's what makes it safe to leave running without watching it. It's the same discipline we run on our own systems: loops that check their own work against a rule, fix what they safely can, and flag the rest for a human. We don't sell a black box we wouldn't run ourselves.",
  },

  caseStudies: {
    eyebrow: "Proof",
    title: "Results, not promises",
    subtitle:
      "The deck tracks the ROI of every automation we ship — value delivered against what you pay. Our first flagship case studies are publishing soon; here's the shape of what we measure.",
    items: [
      {
        industry: "Marketing agency",
        pain: "Invoices aging past 45 days because follow-up was manual and easy to forget.",
        loop: "An AR follow-up Loop that chases receivables on a schedule and flags exceptions for a human.",
        result: "Publishing soon",
        roi: "Publishing soon",
        comingSoon: true,
      },
      {
        industry: "Restaurant group",
        pain: "Guest follow-up and review requests handled by hand, so most never went out.",
        loop: "A guest follow-up Loop that sends the right message at the right time, automatically.",
        result: "Publishing soon",
        roi: "Publishing soon",
        comingSoon: true,
      },
    ],
  },

  about: {
    eyebrow: "About",
    name: "Damon Williams",
    title: "AI Solutions Engineer & Founder, Harbormill Automation",
    paragraphs: [
      "For 15 years I built and secured the networks that companies like Nike and Assurant run on — SD-WAN, Azure cloud, and infrastructure security. I've been an independent IT consultant since 2015, and I've seen up close how much time good systems give people back.",
      "Now I bring that same engineering rigor to something small businesses can actually use: practical AI automation. I've spent the past year deep in production AI and prompt engineering — building the systems, prompt libraries, and workflows I now set up for clients.",
      "My approach is education-first: I'd rather teach you to use AI than sell you a black box. We get you fluent with Claude, then automate the busywork that's holding you back.",
    ],
    skills: ["Python", "AI & prompt engineering", "Automation", "APIs & webhooks", "Cloud & networking", "Security"],
    credentials: "SUNY Delhi — Computer & Information Systems Security / Information Assurance",
    ctaLabel: "Connect on LinkedIn",
  },

  faqs: [
    {
      q: "How much does this cost?",
      a: "It starts low and stays proportional to results. One-on-one consulting is $100/hour, and you only move to larger fixed-scope projects once we've proven value together. The intro call is always free.",
    },
    {
      q: "Will AI replace my staff?",
      a: "No — the goal is to remove busywork so your people do the work that actually needs a human. Automation handles the repetitive copy-paste tasks; your team gets their hours back for customers, judgment, and growth.",
    },
    {
      q: "How long does it take to see results?",
      a: "A one-on-one session can solve a real problem the same day. A focused project typically ships one working automation in a few weeks — deliberately scoped small so you see ROI fast.",
    },
    {
      q: "Is my business data safe?",
      a: "Yes. Builds run on your own accounts and keys, your data stays in your control, and I architect for least-access by default — a habit from 15 years in infrastructure security.",
    },
    {
      q: "What's the free AI prompt guide?",
      a: "A 60-page guide of the prompts, frameworks, and systems I actually use in production — not theory. Grab it below; it's the fastest way to start using AI in your business today.",
    },
    {
      q: "I'm not technical. Is that a problem?",
      a: "Not at all — that's exactly who this is for. The education-first approach means we get you comfortable step by step. You'll understand your tools, not just inherit them.",
    },
  ],

  leadMagnet: {
    eyebrow: "Free guide",
    title: "The 60-page AI prompt guide I actually use",
    body: "Every prompt, framework, and system I use in production — copy-paste ready. Get it free and start putting AI to work in your business today.",
    cta: "Send me the guide",
    success: "Check your inbox — and grab it right here:",
    pdfPath: "/ai-prompt-guide.pdf",
    pdfLabel: "Download the guide (PDF)",
  },

  booking: {
    eyebrow: "Book a call",
    title: "Let's find an hour to give back to your week",
    subtitle:
      "A free 30-minute intro — no pressure, no pitch deck. Tell me what's eating your time and I'll tell you honestly whether automation can help.",
  },
} as const;

export type ServiceItem = (typeof site.services.items)[number];
export type LadderRungItem = (typeof site.ladder.rungs)[number];
export type ProblemItem = (typeof site.problem.items)[number];
export type AiosFeature = (typeof site.aios.features)[number];
export type LoopAuditCondition = (typeof site.loopAudit.conditions)[number];
export type CaseStudyItem = (typeof site.caseStudies.items)[number];
