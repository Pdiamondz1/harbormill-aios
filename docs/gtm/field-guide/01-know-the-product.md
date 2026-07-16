# Part 1 — Know the Product

> **Audience: you, Damon.** This is your internal mastery doc, not marketing copy and not a
> client handout. The goal is simple: you can speak to Harbormill AIOS cold — every surface,
> *why* it exists, and the architecture underneath — without notes. Pricing is deliberately
> absent here; it lives in [`../retainer-tiers.md`](../retainer-tiers.md) and Part 2.

This is the first file in the [Field Guide](00-index.md). Read it once end-to-end, then keep
the [surface-by-surface table](#2-surface-by-surface-tour) and [Aria's toolbelt](#6-arias-toolbelt)
handy as glance cards before a call.

---

## 1. The thesis in one breath

Harbormill AIOS is a **white-label AI operating-deck** — one dashboard that gives a
small-business owner live metrics, an AI-written weekly brief, a tracker for risks, and an AI
assistant grounded in their own business. But the deck is the visible tip. The thesis is:

- **Education-first.** We teach the owner to use AI for their business *first*, then automate
  the busywork on top of that foundation. "Teach you to fish," not sell a black box.
- **One ingest seam, and you own your data.** Every client gets their own everything (their own
  Supabase database, their own Google Cloud, their own AI keys). All their business data enters
  through **one** generic doorway and lives in *their* account — never ours, never co-mingled.
- **Loops, not chatbots.** The unit of value is an automation **Loop**: a repeating piece of
  work an AI handles end-to-end, chosen by an objective test (see §4), not a magic-button demo.
- **Honest ROI.** The deck has a surface whose only job is to show value delivered versus the
  fee — kept visible and reconciled against what we promised. We don't hide the scoreboard.
- **The moat is the context layer.** What compounds isn't the chat box — it's a **persistent,
  growing layer of business context**: the metrics history, the weekly briefs, the findings,
  the strategy library Aria searches. The longer a client runs it, the more the system *knows*
  about their business, and the harder it is to rip out. A chatbot or a one-off workflow has no
  memory; this does.

When someone asks "what is it," the one breath is:
*"It's an AI operating deck that you own — it watches your numbers, writes your weekly brief,
and runs the repeating work, while teaching you to drive the AI yourself."*

---

## 2. Surface-by-surface tour

One row per page. **The "one line you say"** column is the prospect-facing sentence; the rest is
for you. Access is enforced by the database (Row-Level Security) and mirrored in the nav. Pages
marked **admin-only** are hidden from stakeholder logins entirely.

| Page | What the operator sees / does | Why it exists | The one line you say to a prospect |
|------|-------------------------------|---------------|-------------------------------------|
| **Overview** | The post-login home: live KPI cards plus a "value delivered" hero card. Empty until data is pushed in. | The at-a-glance pulse of the business and the ROI scoreboard, in one screen. | "This is your business in one glance — your live numbers and what we've delivered against the fee." |
| **Briefings** | Weekly AI-written operating briefs. Admins draft and publish; stakeholders read the published ones. | Turns a week of raw numbers into a short narrative someone will actually read. | "Every week you get a plain-English brief on what moved and what to watch — written for you, not a wall of charts." |
| **Findings** *(admin-only)* | A tracker for risks/issues: severity, evidence, status. A recurring issue reopens with a rising occurrence count. | The system's memory of what's gone wrong and whether it's been handled. | "Anything worth flagging lands here with evidence — and if it comes back, it reopens itself so nothing gets quietly forgotten." |
| **Strategy** | A library of your reference docs and playbooks (Markdown), which the assistant searches to answer questions. | The knowledge base that grounds Aria in *your* business, not the open internet. | "We load your playbooks here so the assistant answers from how *your* business actually works." |
| **Assistant (Aria)** | A chat co-pilot grounded in your live metrics and your knowledge base, with a set of real tools. | The conversational front door to everything in the deck — ask instead of click. | "Ask Aria anything about your numbers or your business and it answers from your real data, not guesses." |
| **Workspace** | A one-time Google sign-in that connects a Drive folder, so Aria can read and write files there. | The bridge that lets the assistant put a finished doc into your Drive. | "Connect Google once, and Aria can drop a finished report straight into your Drive." |
| **Calendar** | A month grid of project due dates; click an item to open the project. | A simple time-view of what's due, drawn from the project tracker. | "A quick calendar of what's due, so nothing sneaks up on you." |
| **Projects** | A simple project/initiative tracker: status, owners, due dates, progress. Admins create/edit. | Lightweight place to track the work in flight without a separate tool. | "Track the work in flight here — no extra project tool to log into." |
| **Meetings** *(admin-only)* | Paste a meeting transcript; it becomes a summary report with next-action items filed automatically. | Turns the hour you spent in a meeting into a summary and a to-do list, automatically. | "Drop in a meeting transcript and get back a clean summary plus the action items — no note-taking." |
| **Audits** *(admin-only)* | A prospecting tool: capture a prospect's value opportunities, then export a branded "Opportunity Report" to Google Docs. | *My* sales instrument — it runs the paid audit and produces the leave-behind. | *(Internal tool — not shown to clients; this is how I run a paid audit.)* |
| **Loops** *(admin-only)* | The automation surface: see configured Loops, enable/disable them, and an approval queue for human-gated actions. | Where automations are switched on and where anything risky waits for a human "go." | "This is where your automations live — and anything I want a human to approve first waits right here." |
| **Value** | The ROI page: a log of value delivered (hours saved / cash recovered / cost avoided), rolled up versus the fee and reconciled against what the audit promised. | Keeps the ROI honest and visible — the number that justifies the engagement. | "Here's exactly what this engagement has produced in dollars, against what we promised and what you pay." |
| **Connectors** *(admin-only)* | Configure live data pipelines (e.g. Stripe → metrics, on a schedule). Each runs as a scheduled function. | How real data starts flowing in automatically instead of being entered by hand. | "We wire your existing tools straight in, so your numbers update themselves." |
| **Login** | Email/password sign-in. **No public signup** — an admin grants access via the user-roles table. | Access is provisioned, not self-serve — this is a private operating deck, not a SaaS. | "It's invite-only — I provision who gets in and at what level; there's no open sign-up." |

> **Two access tiers:** `admin` (you / the operator) and `stakeholder` (read-mostly client
> users). Findings, Audits, Loops, Connectors, and Meetings are admin-only. Per-client, any
> module can also be toggled off entirely in `src/config/features.ts` — it then disappears from
> the nav and its routes stop resolving.

---

## 3. The architecture story in plain English

Three design decisions make this product what it is. Each one is also a *selling point* — here's
the plain version and why a buyer should care.

**1. One ingest seam — the deck never touches client business tables.**
There is exactly one doorway through which data enters the deck: a service-only function called
`report-ingest`. Connectors, scheduled jobs, and even Aria all write *through* this one audited
choke point — and it can only write a handful of generic record types. The deck itself reads only
three generic tables: **metric snapshots** (the KPI history), **briefings** (the weekly briefs),
and **findings** (the risk tracker). *(Two more generic types ride the same seam — value events
and overdue invoices — but the three above are the spine.)* The deck never runs a query against a
client's own business tables; it doesn't even know their shape.
**Why a buyer cares:** *any* business software with an API can feed it — so it works no matter
what tools you already run — and because everything comes through one narrow, audited door, it's
**safe**: there's no way for the dashboard (or the AI) to reach into and rewrite your real
operational systems.

**2. White-label by config, not by fork.**
A whole client deployment is a configuration-and-data change, never a code fork. One brand file
plus a set of color variables rebrands the entire deck; feature flags toggle which modules a
client sees. The shared "engine" stays identical across every client.
**Why a buyer cares:** it's a mature, battle-tested product getting *their* logo — not a bespoke
app I'm inventing for them from scratch and will struggle to maintain.

**3. Aria is grounded, not a free-roaming database client.**
The assistant doesn't get to write arbitrary queries against the database. It can only act
through a fixed, named set of tools (see §6) — it **reads** metrics, the latest briefing, the
value summary, and **searches** the knowledge base; the few things it can *change* it can only
*propose* for an admin to approve. It answers from your live numbers and your loaded knowledge,
not from the open internet or from guessing.
**Why a buyer cares:** the AI is **grounded and bounded** — its answers come from your real data,
and it physically can't go rogue on your systems, because the only levers it has are the safe ones
we handed it.

**The through-line:** you own your data (it's in your own account), it works with any business
(one generic seam any API can feed), and it's safe (a narrow audited door + a bounded assistant).

---

## 4. The Loop concept + the Four-Condition Loop Test

A **Loop** is a piece of repeating work an AI (or a deterministic script) handles end-to-end on a
cadence — not a one-off chat answer. The hard question is *which* repeating work is worth turning
into a Loop. That's where the **[[Four-Condition Loop Test]]** comes in — **my signature method,
and the spine of the paid "Loop Audit"** I sell as a discovery step.

A task is a Loop candidate **only if it passes all four conditions:**

1. **It repeats.** It recurs on a predictable cadence — daily, weekly, or per-event. Frequency
   times the time-per-run is the size of the prize.
2. **A rule decides "done."** An *objective* check tells you when a run is correct — not human
   taste or judgment. If finishing requires someone to eyeball it and feel good, it's not Loop-ready yet.
3. **You can afford a wrong run.** A bad run is cheap and reversible — the Loop is advisory or
   easily undone, not something that can blow up the business if it misfires.
4. **The AI has the data and the tools.** The inputs are reachable and the actions exist as real
   tools or integrations. Locked-away data or a missing API blocks it.

Conditions **2 and 4 are hard blockers** — no objective done-rule or no reachable data/tools means
it's *not a Loop yet* (you record the one thing that would unblock it). Conditions 1 and 3 are
scored strong/partial/weak. Among everything that passes, you **rank by value-per-effort** and
build the highest one first.

**Worked example — KPI-watch (Harbormill eating its own dog food):**
We run a Loop on our own systems called *KPI-watch*. Once a day, a scheduled job reads the latest
KPIs and files a finding for any KPI that has breached its target. Run it through the four conditions:
1. **Repeats?** Yes — it runs every day on a schedule.
2. **A rule decides "done"?** Yes, and this is the clean part: a KPI is "breaching" if its status
   is `at_risk` or `off_track`. That status check *is* the objective rule — no human decides when a
   run is finished.
3. **Afford a wrong run?** Yes — the worst it can do is file (or not file) an advisory finding.
   It changes nothing operational and it's idempotent, so a re-run can't pile up duplicates.
4. **Data + tools?** Yes — it reads the KPI table and writes a finding through the one ingest seam.
   (In fact it needs *no AI at all* — it's a deterministic script, which is the cheapest, safest
   kind of Loop.)

It passes all four, so it's a real Loop — and it's our live proof point: *"the same discipline we
run on our own systems."* That's the move on a sales call — you don't argue that automation works,
you point at the one running on us.

---

## 5. "How a client's data becomes value" — end-to-end

One concrete walk-through, following a single thread from raw data to a dollar figure on screen.

> **The setup:** a client runs Stripe and cares about monthly recurring revenue (MRR).

1. **Ingest.** We stand up a **Connector** for Stripe. On a schedule, it pulls the latest revenue
   numbers and pushes them through the one ingest seam (`report-ingest`) as a metric.
2. **Metric snapshots.** Each push appends a row to the **metric snapshots** history — an
   append-only log. The **Overview** page reads the *latest* snapshot per KPI, so the MRR card is
   always current, and the history is there for trends.
3. **Weekly briefing.** At the end of the week, the briefing job composes a short brief from the
   week's numbers and pushes it in as a **briefing**. It lands on the **Briefings** page: *"MRR
   slipped 4% this week; churn is the driver."*
4. **A Loop files a finding.** The MRR metric's status flips to `off_track`. The next day,
   **KPI-watch** (the Loop from §4) reads it, sees the breach, and files a **finding** —
   *"KPI off target: MRR"* — with the evidence attached. Because findings de-duplicate by
   fingerprint, if it keeps slipping the same finding reopens with a rising occurrence count
   instead of spamming new ones.
5. **A Loop acts.** Say the deeper cause is overdue invoices dragging cash. An **AR-follow-up
   Loop** drafts the follow-up emails. Anything that touches a customer is **human-gated**: the
   drafts wait in the approval queue on the **Loops** page until the admin clicks approve. Once
   approved and the cash comes in, the recovered amount is pushed in as a **value event**.
6. **The scoreboard updates.** The **Value** page rolls up those value events — hours saved, cash
   recovered, cost avoided — totals them against the fee, and shows the **ROI multiple** (e.g.
   *"delivered 6× the retainer this month"*), reconciled against what the audit originally promised.

That's the whole arc: **Stripe → metric snapshots → weekly briefing → KPI-watch files a finding on
the breach → an AR Loop acts (with a human approving) → the Value surface shows the ROI multiple.**
One thread, ingest to dollars, with a human in the loop where it matters.

---

## 6. Aria's toolbelt

Aria can only act through this fixed set of tools (defined in
`supabase/functions/assistant-chat/tools.ts`). She has no arbitrary database access — these are the
only levers. Tools marked **(admin)** are hidden from stakeholder users.

| Tool | What it lets her do |
|------|---------------------|
| `search_knowledge` | Search the strategy/knowledge base for context on how the business works. |
| `read_metrics` | Read the latest value of every operating KPI. |
| `get_latest_briefing` | Pull the most recent weekly brief — title, week, KPIs, full body. |
| `get_document` | List the strategy/reference docs, or read one document's full content by path. |
| `create_finding` | Log an issue/risk to the findings tracker for an admin to triage. |
| `get_value_summary` | Report the ROI summary: value delivered, the fee, and the multiple of it. |
| `get_weight_trend` | Show the platform's growth over time (database size, storage, users, row counts). |
| `compose_email_link` | Build a pre-filled Gmail compose link for a drafted email — it never sends; you review and send. |
| `export_to_drive` | Export a finished Markdown document as a Google Doc in the connected Drive folder. |
| `list_drive_files` | List the files in the connected Google Drive folder. |
| `get_cost_stats` **(admin)** | Summarize AI spend — token usage and per-model breakdown over a recent window. |
| `propose_correction` **(admin)** | Queue a fix to a dashboard value or a document — proposed only; an admin must approve before it applies. |
| `list_pending_loop_actions` **(admin)** | List automation-Loop actions waiting for admin approval (recipient, subject, estimated value). |

Note the pattern: everything Aria can *change* she can only *propose* — corrections and Loop
actions land in a queue for a human, never auto-applied. That's the "grounded and bounded" design
from §3, made concrete.

---

## 7. References

- **`docs/PROJECT_CONTEXT.md`** — the single source of truth for Harbormill's identity, strategy,
  architecture keystones, and **the engagement ladder and its prices** (§8). Read this first if you
  only read one thing. *Jurisdiction:* §8 owns the ladder and every published price; `docs/gtm/`
  owns **call mechanics** — scripts, objection handling, payment terms, retainer-tier structure.
  Neither overrides the other; they cover different things. Where a `docs/gtm/` file quotes a
  price, it must match §8. (Before 2026-07-16 both claimed blanket source-of-truth, which is how
  the field guide and §8 came to quote different Focused-Project prices — see the flag in
  `03-run-the-call.md`.)
- **`docs/wiki/`** — the knowledge wiki. Most relevant here:
  `concepts/four-condition-loop-test.md`, `concepts/kpi-watch.md`, `concepts/report-ingest-seam.md`,
  `concepts/aios-pages.md`, and `entities/aria.md`. Query or extend it with the `wiki-ops` skill.
- **`docs/extending.md`** — how to add a new Aria tool, a new metric, or a new page without forking
  the engine.
- **GTM siblings:** [`../README.md`](../README.md) (the 30-day playbook) and
  [`../retainer-tiers.md`](../retainer-tiers.md) (**pricing lives here, not in Part 1**).
