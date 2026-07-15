---
title: Roast Verdict — Kill the $100/hr entry rung, reprice the Harbormill Ladder
source_id: docs/vetting/2026-07-15-harbormill-entry-rung-reprice/roast-verdict.md
path: docs/vetting/2026-07-15-harbormill-entry-rung-reprice/roast-verdict.md
tags: [vetting, roast, verdict]
updated: 2026-07-15
---

# Roast Verdict — Kill the $100/hr entry rung, reprice the Harbormill Ladder

**The brief:** Harbormill Automation is a solo AI-automation consultancy run by Damon Williams —
15 years enterprise IT infrastructure/networking/security (Nike, Assurant, IAA, LEGACY Supply
Chain), independent since 2015, with no public audience and no published case studies. The
proposal: kill the $100/hour entry rung entirely and replace it with a productized fixed-price
workshop at $2,500 (climbing to $5,000 once two case studies exist); raise the paid audit from
$500–$2,500 to $5,000+; raise the focused-project floor from $2,500 to $10,000; leave the
retainer at $3,000–$10,000/mo. Current ladder: $100/hr → $500–$2,500 audit → $2,500–$10,000
project → $3,000–$10,000/mo retainer, each engagement opening with a free 30-min intro. Stated
goal: 2 projects converting to retainers in ~30 days. Evidence: the [[Tool Wars Panel 2026]] —
Medin ~$20K/4-hr workshop, Kearns ~$5K workshop, Ebbelaar $10–20K fixed 2–4 week prototype; two
of three report training demand overtaking build demand. Core argument: hourly is the wrong
*unit*, not merely a low number; a $100/hr front door anchors a $10K project as "100 hours of
Damon"; and the $100/hr was an unconsidered default, not a deliberate loss-leader.

## THE VERDICT: RESHAPE
Confidence: high

**The call in one line:** Kill hourly this afternoon — but the reprice is a 30-minute config
change, not a strategy, and every hour spent tuning the price card instead of filling the
Warm-50 is the actual failure mode.

**Why:** The council split 3-9 on the price and converged 5-for-5 on the cause: there is no
pipeline, and price is a coefficient on a variable that is currently zero. The Contrarian is
right that the evidence is three YouTubers talking their book (the Researcher could not
independently verify the panel or a single quoted price, and found Medin at ~204K subscribers,
Ebbelaar at ~257K — their prices are audience rent). The Researcher is right that independent
data says raise anyway. Both resolve identically: do it because it is nearly free and because
it forces a defined deliverable, not because it converts anyone.

**Biggest risk:** Displacement activity. `warm-50-tracker.md` contains "Jane Doe" and "Alex R."
18 GTM docs, 0 case studies, 0 real contacts. A price with zero transactions is unfalsifiable —
$2,500 vs $5,000 can be argued forever without ever being wrong. Calling 50 people is
falsifiable. That asymmetry explains which artifact exists.

**Biggest upside:** The deck already mints case studies. `src/pages/Value.tsx`,
`deck_value_summary()`, and the promised-vs-delivered reconciliation
(`20260623000300_value_events_audit_link.sql`) mean every deployed deck continuously computes
the number a case study needs. Medin *buys* proof with audience; Harbormill *manufactures* it as
a byproduct of delivery — a structural asymmetry no panelist has. The proof gap is a 60-day
problem, not a 12-month one.

**Money read:** Workshop **$2,500–3,500** — stay under the signature-authority threshold (the
largest number an owner approves alone, without a board or a spouse conversation); $5,000 is
market rate but risks converting a solo yes into a committee no. Audit **free-to-$2,500**, not
$5,000+ — in this category the free audit is the highest-converting lead magnet and competitors
give it away. Project floor **$10,000** — corroborated; most SMB implementations land $10–15K.
Retainer **$3–10K/mo** — already market, leave it. Time-to-first-dollar: SMB deals under $15K
close in 14–30 days (n=939), but that clock starts when a qualified lead appears and no engine
produces them. Repricing is an afternoon in `website/src/config/site.ts`. Shipping is not the
constraint.

**The cheapest 48-hour test:** Delete Jane Doe. Put 50 real names in the tracker and book 5
intros. Quote the new price to all five and count who flinches. Tests price and pipeline
simultaneously, costs nothing, requires no build, and falsifies the one number that decides
everything — entry conversion, currently unmeasured. If it is 5% rather than 20%, ~89 intros
are needed and no price card saves the plan.

**If RESHAPE:** Four corrections.
1. **The workshop cannot teach — it must INSTALL.** Buyer: *"something has to still exist in my
   company after you drive away… I won't write you $2,500 to be taught."* Ship a running,
   branded deck wired to their data. The Expansionist and the Buyer reached this independently
   from opposite directions — the strongest signal in the council.
2. **Carry the risk instead of borrowing proof.** "If it isn't doing X by day 30, don't pay me."
   Buyer: *"The instant you carry some of the risk, the case-study problem evaporates — I'm no
   longer betting on your past, I'm betting on a deliverable with a date."* This is the exit
   from the circular dependency (price follows proof → proof requires a sale → a sale requires
   proof) that the Contrarian said had only three doors. It is a fourth.
3. **Dogfood it.** Buyer's hardest blow: *"you're pitching me a dashboard for my business —
   where's yours? Show me the weekly brief it wrote about Harbormill last Monday."* Run AIOS on
   Harbormill; the brief becomes case study #0, free, this week.
4. **Fix the scoreboard.** 2 projects *signed* by day 30, retainers by day 60–75. Retainers are
   conditioned on project results, so the current goal is arithmetically impossible — and when
   day 30 arrives short, the available conclusion is "the prices were too high," reversing a
   correct decision on a broken measurement.

**Council scores:** Contrarian 3/10 · Expansionist 9/10 · Logician 7/10 · Researcher 7/10 · Buyer 4/10

## Corrections to the original proposal (what the council overturned)

- **The audit raise was wrong** — unanimously. Free/cheap audits are the category's standard
  lead magnet; charging ceiling rate with no proof inverts the instrument. The Logician
  separately caught that a $5K workshop and $5K audit collide (two adjacent rungs, one price)
  and that the workshop already produces the discovery — consider deleting the audit rung.
- **The anchoring argument is folk psychology as stated.** The real mechanisms: *divisor
  leakage* (publishing a rate hands the buyer a price→hours conversion function, turning a
  value-priced offer into an auditable cost-plus one); *Bayesian selection* (P(buys $10K | paid
  $2,500) ≫ P(buys $10K | paid $800)); and *commitment* — a fixed price cannot be sold without
  defining a deliverable, while $100/hr can. Falsifiable: change the number without changing the
  deliverable and nothing happens.
- **$2,500 is derivable, but not from the panel** — it is the signature-authority threshold.
- **Budget ceiling missed:** median SMB AI spend is ~$18K/yr. A $5K audit + $10K project =
  ~83% of it. The proposed ladder silently re-targets upmarket to $5–50M-revenue firms — an
  unmade positioning decision.
- **Repo inconsistencies surfaced:** `sweven-channel.md` prints Projects at $5,000 (contradicts
  both the ladder and the proposed $10K floor); its demo night allots 10 of 25–30 minutes to
  "two flagship case studies" that do not exist; `beachhead-decision.md` is referenced twice and
  is missing; the $2,500 workshop has no curriculum, agenda, or deliverable spec anywhere.

## See Also

- [[The Harbormill Ladder]]
- [[Tool Wars Panel 2026]]
- [[Education-First Philosophy]]
