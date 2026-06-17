/**
 * Canned, illustrative data for the AIOS demo tour. Mirrors the product's
 * `supabase/seed.sql` so the staged deck looks exactly like the real thing.
 * Clearly labeled as sample data in the UI — no live business numbers.
 */

export type MetricStatus = "on_track" | "at_risk" | "off_track";

export interface DemoMetric {
  key: string;
  label: string;
  value: string;
  unit?: string;
  target?: string;
  status: MetricStatus;
}

export const DEMO_METRICS: DemoMetric[] = [
  { key: "mrr", label: "MRR", value: "$48,200", target: "$60,000", status: "at_risk" },
  { key: "active_clients", label: "Active clients", value: "37", target: "40", status: "on_track" },
  { key: "nps", label: "NPS", value: "62", target: "60", status: "on_track" },
  { key: "churn", label: "Churn (30d)", value: "3.1", unit: "%", target: "< 2.5%", status: "off_track" },
  { key: "pipeline", label: "Pipeline", value: "$112k", status: "on_track" },
  { key: "tickets_open", label: "Open tickets", value: "8", target: "< 10", status: "on_track" },
  { key: "uptime", label: "Uptime (30d)", value: "99.96", unit: "%", target: "99.9%", status: "on_track" },
  { key: "csat", label: "CSAT", value: "4.7", unit: "★", target: "4.5", status: "on_track" },
];

export interface DemoBriefingKpi {
  label: string;
  value: string;
  status: MetricStatus;
}

export const DEMO_BRIEFING = {
  title: "Weekly operating brief",
  week: "This week",
  kpis: [
    { label: "MRR", value: "$48,200", status: "at_risk" },
    { label: "Churn", value: "3.1%", status: "off_track" },
    { label: "NPS", value: "62", status: "on_track" },
  ] as DemoBriefingKpi[],
  body: `## Where we stand

Revenue is tracking just under target while retention holds. Two items need attention this week.

### Highlights
- **Active clients** crossed 37, on pace for the Q-target.
- **Uptime** held at 99.96% through the deploy window.

### Watch
- **Churn** ticked to 3.1% — two enterprise accounts flagged at-risk. Owner: success team.
- **MRR** is $11.8k under target; pipeline coverage is healthy, so this is a close-rate problem, not a top-of-funnel one.

### Recommended focus
1. Save play on the two at-risk accounts before Thursday.
2. Tighten the proposal-to-close step — that's where the gap is.`,
};

export interface DemoExchange {
  prompt: string;
  answer: string;
}

/** Scripted Q&A for the "Ask Aria" step. Answers are grounded in the seed brief + positioning. */
export const DEMO_EXCHANGES: DemoExchange[] = [
  {
    prompt: "How are we doing this week?",
    answer:
      "Solid but with two things to watch. **MRR is $48,200** — about **$11.8k under target** — but pipeline coverage is healthy, so this reads as a close-rate problem, not a lead problem. **Churn ticked up to 3.1%** with two enterprise accounts flagged at-risk. On the bright side, **active clients crossed 37** and **uptime held at 99.96%**. My suggestion: run a save play on the at-risk accounts before Thursday.",
  },
  {
    prompt: "What's driving the churn number?",
    answer:
      "Two enterprise accounts are flagged at-risk, which is what pushed **churn to 3.1%** (target is under 2.5%). It's concentrated, not broad — the rest of the base is steady. I'd prioritize a direct save conversation with both this week and loop in the success team as owner.",
  },
  {
    prompt: "What are my top priorities today?",
    answer:
      "Reading today's operations, three things rise to the top:\n\n1. **Save the two at-risk enterprise accounts** — churn is the biggest revenue risk right now.\n2. **Follow up on the two stalled proposals** in the $112k pipeline — they're past the close step.\n3. **Clear the 8 open support tickets** before any age past SLA.\n\nThe emails and meetings worth your time today all ladder up to #1. Want me to draft the outreach?",
  },
  {
    prompt: "Summarize my last meeting",
    answer:
      "**Weekly ops sync — summary**\n\n- Revenue is ~$11.8k under target; the team agreed it's a close-rate issue, not lead flow.\n- Two enterprise accounts flagged at-risk; success team owns the save plays.\n- Reporting export shipped on schedule.\n\n**Next action steps**\n1. Success — save calls with both at-risk accounts by Thursday.\n2. Sales — tighten the proposal-to-close step.\n3. Ops — watch support volume as the new cohort ramps.",
  },
  {
    prompt: "What's our positioning?",
    answer:
      "From your strategy docs: you sell **operational clarity** to mid-market operators who are flying blind between their tools. **Who:** 20–200 person services & SaaS businesses. **Wedge:** the weekly brief — the one artifact a busy operator actually reads. **Moat:** the assistant gets smarter on their data over time.",
  },
];
