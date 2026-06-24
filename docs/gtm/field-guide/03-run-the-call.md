# Part 3 — Run the Call

> **Audience: you, Damon — live on a 1:1 prospect call, or in the five minutes before it.**
> This is the discovery + objection-handling layer. It **extends** the
> [intro-call script](../intro-call-script.md); it does not replace it. Run the script's
> 30-minute structure (their world → make the prize a number → teach the method → offer the
> Loop Audit → book it). When the script says *"probe"* and *"reflect the pain as a number,"*
> this file is the deeper toolkit for doing exactly that — for **any** pain, not just the three
> loops the script already listens for.

This is file 3 in the [Field Guide](00-index.md). Where this and `docs/gtm/` ever disagree on
pricing, **`docs/gtm/` wins.** Pricing used here: Loop Audit **$500–$2,500** (fee fully credited),
Focused Project **$5,000** fixed (audit credited, 50/50), Retainer **Operate $3,000 / Operate+Build
$5,000 / Embedded $8–10k** — all from [`../retainer-tiers.md`](../retainer-tiers.md) and
[`../project-proposal-template.md`](../project-proposal-template.md).

---

## 1. Generic discovery questionnaire

The [intro-call script](../intro-call-script.md) already listens for the three high-ROI loops —
**AR / invoicing, leads, reporting** (and the agency variants: lead-gen, client onboarding, client
reporting). This questionnaire is the **catch-all**: when a prospect names a repeating task that
*isn't* one of those — client onboarding paperwork, compliance reporting, inventory reconciliation,
scheduling, permit/renewal tracking, order entry — run it through here and you'll still land on a
dollar prize and a clean read on whether it's a Loop.

### How to run it (the move)

1. **Listen first; let them name the pain.** Don't pitch. The intro-call script's opener
   (*"What's eating your week right now?"*) does this — these questions go a level deeper on
   whatever they surface.
2. **Reflect the pain back as a number.** Every answer is feeding the
   [§2 worksheet](#2-make-the-prize-a-number-worksheet). You are quietly collecting
   *frequency × time × rate* (or *overdue $ × recovery fraction*) as they talk.
3. **Map their answers to the [Four-Condition Loop Test](01-know-the-product.md#4-the-loop-concept--the-four-condition-loop-test).**
   The five question-groups below line up with the test: **the work** and **the cadence** size the
   prize (condition 1), **the decision/authority** group tests condition 2 (a rule decides "done"),
   **the cost** quantifies condition 3 (can you afford a wrong run), and **the data/tools** group
   tests condition 4. You don't read the test aloud — you *use* it to know which questions matter.
4. **Remember the two hard blockers.** Conditions **2 (a rule decides "done")** and **4 (data +
   tools reachable)** are pass/fail. If either fails, it's *not a Loop yet* — note the one thing
   that would unblock it (an objective done-rule, or access to a system / an API). That note is
   itself a deliverable of the paid audit.

### The questions

**The work** *(what is it, and what does "done" look like)*
1. *"Walk me through that task start to finish — what kicks it off, and what's the last step before
   you'd call it done?"*
2. *"When you finish one, how do you **know** it's right? Is there a checklist or a rule, or is it
   more 'I just eyeball it'?"* → this is condition 2. A checklist = green; "I eyeball it" = the
   audit's job is to find the objective rule hiding underneath.

**The cadence** *(how often, and how big each time)*
3. *"How often does this come up — every day, every week, per new client, per order?"*
4. *"Roughly how long does one run take you, start to finish? And is it you, or someone you pay?"*
   → frequency × minutes × who = the size of the prize.

**The cost** *(what a mistake costs — and what a wrong run costs)*
5. *"When it goes wrong or gets dropped, what actually happens — lost money, an angry client, a
   compliance miss, or just rework?"*
6. *"If a draft of this went out slightly wrong, is that a quick fix — or is it the kind of thing
   that can't be unwound?"* → this is condition 3. "Quick fix / it's just a draft I'd catch" =
   safe to automate; "irreversible / regulatory" = human-gated or not yet.

**The data / tools** *(can the AI actually reach it)*
7. *"Where does the information for this live today — a spreadsheet, your CRM, your accounting
   system, your inbox, someone's head?"*
8. *"Do those systems let other software talk to them — an API, an export, a login I could be
   given?"* → this is condition 4. Reachable data + a real action to take = green; locked in a
   legacy box with no export = the blocker to record.

**The decision / authority** *(who owns the call, and who owns the budget)*
9. *"Who decides this is finished and sends it on its way — you, or someone on your team?"*
10. *"And if we found this was worth automating, are you the one who'd green-light a fixed-scope
    build, or is there a partner / co-founder in that decision?"* → qualifies authority (mirrors
    the script's BANT-lite checklist) and surfaces the "I need to ask my partner" objection
    *before* it ambushes you at the close (see [§3](#3-objection-handling-playbook)).
11. *(If unclear)* *"On a scale of 'mild annoyance' to 'this is genuinely capping our growth' —
    where does this sit for you?"* → urgency, and it often makes them say the prize number out loud
    themselves.

> **Test it on a non-AR/leads/reporting pain — "client onboarding paperwork":**
> Q1–2: kicks off when a contract is signed; "done" = a folder with 6 forms filled, signed, and
> filed — *that's an objective rule (condition 2 ✓)*. Q3–4: every new client, ~10/month, ~90 min
> each, done by an ops person at ~$35/hr loaded. Q5–6: a missed form delays kickoff and annoys the
> client, but a wrong draft is caught at signature — *cheap, reversible (condition 3 ✓)*. Q7–8:
> data is in their CRM + a Google Form, both with exports/APIs — *reachable (condition 4 ✓)*. Q9–10:
> the owner green-lights builds, no partner. → **Passes all four.** Prize:
> `10 × 90 min × $35/hr` ≈ **$5,250/yr** of ops time, before the faster-kickoff upside. You just
> took a pain the script never mentions and turned it into a number and a Loop verdict.

---

## 2. "Make the prize a number" worksheet

This is the live math behind the intro-call script's *"Make the prize a number"* step. Two formulas
cover almost everything. Do the arithmetic **out loud, rounded** — the point is a number they feel,
not a spreadsheet.

**Formula A — time saved (most pains):**
```
annual prize  =  frequency-per-year  ×  minutes-per-run  ×  loaded $/min
              =  frequency-per-year  ×  hours-per-run    ×  loaded $/hour
```
*Loaded $/min* = the fully-burdened cost of whoever does it. Rule of thumb: $35/hr ≈ $0.58/min,
$60/hr ≈ $1.00/min, $100/hr (your time / billable time) ≈ $1.67/min.

**Formula B — recoverable cash (AR / receivables):**
```
annual prize  =  overdue $ outstanding  ×  fraction recovered by faster follow-up
```
Faster, consistent follow-up typically pulls forward **a third or so** of what's stuck — and unlike
time-saved, *it never stops once the Loop is running.*

### Worked example 1 — agency lead-gen / intake (Formula A)

> **What they said:** *"Leads come in through our site form and a few inboxes. Someone on the team
> re-keys each one into the CRM, enriches it, and sends a first-touch email. We get maybe 8 a day."*

- Frequency: 8 leads/day × ~250 working days ≈ **2,000/year**
- Time per run: ~12 minutes of re-keying + enrich + personalize ≈ **0.2 hr**
- Who: a coordinator at ~$40/hr loaded

**Math, out loud:** *"2,000 leads a year, twelve minutes each — that's 400 hours, about ten full
work-weeks. At $40 an hour that's roughly **$16,000 a year** of someone's time spent re-typing
leads a machine could route in seconds."* And the kicker for the close: *"that's before we count the
leads that get dropped or followed up cold because it's manual."*

→ **Annual prize ≈ $16,000/yr** (time), plus recovered-conversion upside.

### Worked example 2 — AR / invoicing (Formula B)

> **What they said:** *"We've got something like $45k sitting in invoices that are 30-plus days
> overdue. Follow-up is whoever remembers, so it's inconsistent."*

- Overdue outstanding: **$45,000**
- Fraction faster, consistent follow-up pulls forward: **~1/3**

**Math, out loud:** *"So about $45k is stuck, paying ~30 days slow. A Loop that chases every overdue
invoice on schedule, the same way every time, typically pulls forward a third of that — that's
roughly **$15,000 back in your account** — and it keeps doing it every cycle, forever, without you
thinking about it."*

→ **Annual prize ≈ $15,000** recovered (and recurring) — plus the time saved *not* chasing it by
hand (run that through Formula A too if they ask).

> **Why this works:** the number is what makes them *want* the audit. You're not selling a build on
> the call — you're making the pain concrete enough that paying $500–$2,500 to map it cold is
> obviously worth it. Hand the number to the [close](#4-the-close).

---

## 3. Objection-handling playbook

Every objection gets the same shape: **the reframe** (how to think about it) and **the one-liner**
(what you actually say). The reframes for *vs-alternatives* all anchor to the differentiator from
[Part 1 §1 / §4](01-know-the-product.md#1-the-thesis-in-one-breath): **persistent, compounding
business context + self-checking Loops** — not a one-off script, not a generic chatbot. The
data-safety reframe anchors to **"Automation you can leave running"** and **you own your data**.

| Objection | The reframe | The one-liner you say |
|---|---|---|
| **"$5k is a lot — why not just hire a VA?"** | A VA is a recurring cost that forgets everything when they leave and caps out at human speed; the build is a one-time fee for an asset *you own* that runs 24/7 and compounds. Anchor to the prize you just calculated. | *"A VA is $2–3k every month, forever, and walks out the door with everything they learned. This is a one-time $5k for something you own that recovers ~$[prize] a year and never quits — it pays for itself in [X] months, then keeps paying."* |
| **"Why not just use Zapier / Make?"** | Zapier fires a fixed if-this-then-that chain — it has no memory and no judgment, and it can't tell you when it quietly broke. A Loop carries persistent context *and checks its own work against a rule* before it acts. | *"Zapier's great for plumbing — move A to B. But it doesn't *know* anything about your business and it can't tell when it's gone wrong. What I build remembers your context, checks its own work against a rule, and flags anything it's unsure of for you. It's a teammate, not a tripwire."* |
| **"Why not hire a junior dev to script this?"** | A bespoke script is a one-off that rots — no one maintains it, it has no context layer, and you own a liability you can't read. I deploy a mature, battle-tested template (the AIOS deck) that gets *their* logo, plus the method to keep it healthy. | *"A junior dev gives you a script that works until it doesn't, and then you're stuck. I deploy a product that's already running for other businesses — yours gets your logo and your data — and I keep it healthy. You're buying a maintained asset, not a one-off you'll have to babysit."* |
| **"Isn't this just ChatGPT with extra steps?"** | A generic chatbot starts every conversation from zero and can't *do* anything. The value is the compounding context layer (your metrics history, briefs, findings, knowledge base) plus real tools and Loops that run on a schedule. | *"ChatGPT forgets you the second you close the tab, and it can't actually do the work. This is grounded in *your* live numbers and your playbooks, it gets smarter about your business the longer it runs, and the Loops actually do the task on a schedule — not just talk about it."* |
| **"I need to run this by my partner / co-founder."** | Great — that's a buying signal, not a brush-off. Don't leave it open; book the decision-maker into the next step. (You should have surfaced this in [discovery Q10](#the-questions).) | *"Totally — let's get them on the Loop Audit kickoff so they see the ranked plan and the numbers first-hand. What's a 30-minute window this week that works for both of you?"* |
| **"How long until I see results?"** | The audit delivers a ranked plan in **48 hours**; a focused project ships one working automation in **2–3 weeks**, deliberately scoped small so ROI shows fast. Mirrors the site's promise. | *"Fast on purpose. You get the audit's ranked plan within 48 hours, and the first automation is live in two to three weeks — I scope it small specifically so you see the dollars move quickly, not in six months."* |
| **"Is my business data safe?"** | Anchor to **data ownership** + **least-access** + **leave-it-running discipline**. The build runs on *their* own Supabase, their own Google Cloud, their own AI keys — never co-mingled with anyone else's. Data enters through one narrow, audited door; the assistant is bounded to a fixed set of safe tools and can only *propose* changes, never rewrite their systems. | *"It runs on your *own* accounts and keys — your data lives in your account, never mine, never mixed with another client's. I architect for least-access by default; that's a habit from 15 years in infrastructure security. And I only automate work where a clear rule decides 'done' and a wrong run is cheap to undo — that's what makes it safe to leave running. I don't sell a black box I wouldn't run myself."* |
| **"I'm not technical — is that a problem?"** | That's exactly who this is for. The whole model is education-first: get you fluent, then automate on top. You come out understanding your tools, not dependent on me. | *"That's the point — I'd rather teach you to fish than sell you a black box. We get you comfortable with the AI step by step, and the deck is built so you read it at a glance. You'll understand your tools, not just inherit them."* |

> **Stacking note:** the *vs-alternatives* objections (VA, Zapier, junior dev, ChatGPT) all close
> the same way — **persistent context + self-checking Loops + an asset you own.** If you only
> remember one sentence, it's that. Pair it with the prize number from
> [§2](#2-make-the-prize-a-number-worksheet) and the objection dissolves into a math problem in
> your favor.

---

## 4. The close

The close is the [intro-call script's close](../intro-call-script.md#5-book-it-before-you-hang-up)
— **book the paid Loop Audit before you hang up.** Run that section; don't re-write it here. The
one job of this file at the close is to make sure you state the offer crisply:

- **Name it and price it:** the **Loop Audit — $500–$2,500, fixed scope, and I credit the whole fee
  toward the build if you go ahead.** (No risk: even if they never build, they keep a ranked plan.)
- **Set the deliverable:** the Opportunity Report **within 48 hours** of the audit discovery.
- **Put it on the calendar live** — book the audit-discovery slot while you're still on the call.
  (For a warm, eager prospect, use the script's *compression option* and run the audit discovery
  right there.)

The one-liner, straight from the script:
> *"The next step is a Loop Audit — I map all your repeating work, score each task on those four
> conditions, and hand you a ranked plan with the single highest-ROI thing to build first. It's
> $500–$2,500, fixed scope, and I credit the whole fee toward the build if you go ahead. Grab a
> time this week?"*

### After the call

- [ ] Update the [Warm-50 tracker](../warm-50-tracker.md): set **Status** (e.g.
      `Intro booked → Audit sold`) and write **the prize number** you calculated in §2 next to them
      in the **Next action / notes** column — that number is what you anchor every follow-up on.
- [ ] If the audit sold: send confirmation + the credited-fee terms in writing (per the script).
- [ ] If no fit: make the graceful exit and **harvest the referral ask** (per the script) — a no
      still feeds the funnel.

---

## See also

- [intro-call-script.md](../intro-call-script.md) — the 30-minute call structure this file extends.
- [Part 1 §4 — the Four-Condition Loop Test](01-know-the-product.md#4-the-loop-concept--the-four-condition-loop-test) — the method behind discovery.
- [retainer-tiers.md](../retainer-tiers.md) · [project-proposal-template.md](../project-proposal-template.md) — pricing, the moment the audit converts.
- [warm-50-tracker.md](../warm-50-tracker.md) — where the prize number and status land after the call.
