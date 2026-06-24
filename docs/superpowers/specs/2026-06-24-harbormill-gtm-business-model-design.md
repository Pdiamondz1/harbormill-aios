# Harbormill Automation — Go-To-Market & Business Model Design

- **Date:** 2026-06-24
- **Status:** Approved design (brainstorming) — pending implementation plan
- **Owner:** Damon "Dame" Williams
- **Source material:** AAA Accelerator "Tyler Webinar" recording (`aios.aaaaccelerator.com/tyler-recording`,
  Wistia media `0ywbiyjuor`), the 19:00–60:00 segment covering the AIOS product thesis,
  live client demos, and the sell-and-deliver business model. Full timestamped transcript of
  that window was captured and processed; key claims are cited inline below.
- **Relationship to existing GTM assets (read first):** This design **extends**, and does not
  replace, Harbormill's existing 30-Day Playbook / `[[Harbormill Ladder]]` in `docs/gtm/`. The
  **Loop Audit → Focused Project → Retainer** ladder and its pricing (the **$3–10k** retainer band)
  remain the **single source of truth**. This spec adds only what was genuinely new from the
  brainstorm: the **Sweven channel**, the **agency-niche concentration**, **dogfood case studies**,
  and the **Phase-2 accelerator arc**. Where this document and `docs/gtm/` ever disagree on pricing
  or the sales ladder, `docs/gtm/` wins.

---

## North Star: Scale

**The goal is scale.** Direct-to-SMB delivery (Phase 1) is *not* the destination — it is the
**proof and the template factory** that earns the right to scale. Revenue in Phase 1 is still
coupled to founder build-time; the whole point of the model is to **decouple revenue from build-time**
by Phase 2, when Harbormill stops being only the agency and becomes the *accelerator* that sells the
templated playbook to other builders.

Every decision in Phase 1 is judged by one question: **does this make Phase 2 scaling more
inevitable?** Concentrate on one vertical → reusable templates. Serve agencies → warm builder
pipeline. Dogfood Sweven → credible case studies. Each is a deposit into the scaling engine.

```
Phase 1 (prove + templatize)          Phase 2 (scale)
Harbormill = the agency        →      Harbormill = the accelerator
revenue ∝ founder build-time          revenue ∝ # of builders × kit/training
```

---

## 1. Core Thesis (adopted from the webinar)

Sell a **retainer for a service business in which AI agents deliver the service.** Charge
traditional-agency prices, but agents do the work — high margin, low founder-time, and scalable
*as templates compound.*

> *"What Tyler is essentially doing is charging a retainer for a service based business. The
> difference now is the service is handled by AI agents… highly profitable for us, does not take
> our time, and is nearly infinitely scalable given the right architecture and infrastructure."*
> — webinar, ~19:30

**The moat is the AIOS's persistent, compounding context layer — not a chatbot or a workflow.**
ChatGPT wrappers start over every session; an AIOS retains context, feeds action results back in,
and optimizes over time (human-in-the-loop). That compounding is what justifies a *recurring*
fee rather than a one-off build.

### The 5-layer AIOS (the product being delivered)
1. **Context** — business strategy, model, offers, team roles, goals, financials. Foundational;
   *hosted locally on the client's desktop* (the privacy/trust answer).
2. **Data** — P&L, APIs (CRM, Stripe, ad accounts, sales dashboards).
3. **Intelligence** — meeting transcripts fed in daily so the system tracks how the business evolves.
4. **Automation** — automate the identified repeatable tasks.
5. **Custom software** — build dashboards/apps (e.g., a branded client "command center").

Stated objective: kill the **operator trap** — free the founder from manual daily/weekly/monthly
tasks to focus on direction.

### Delivery stack (proven on stage)
Claude Code running inside **Cursor**, on a structured **starter-kit folder layout**. One-sentence
prompts build the context layer in ~39 seconds; dashboards in ~2 minutes. Harbormill already owns a
white-label AIOS base — this is the starter kit we adapt per client.

---

## 2. Strategic Engine — why this shape wins for Harbormill

The webinar's hardest, slowest step is **building local trust from a cold start** (networking,
coffees, handshakes before any sale). **Sweven eliminates that** and **fuses the two phases**:

- **Sweven** (a coworking/membership space for entrepreneurs, owned by Dame's DragonCandy partner)
  is a room *already full of business owners* — Tyler's "go where the owners are" motion, except
  Harbormill **owns the room.** Near-zero-CAC, warm pipeline.
- The partner's **restaurant** and **Sweven itself** are willing **flagship clients on day one**.
- **Every agency served in Phase 1 is a warm Phase-2 builder lead.** AAA's own business is selling
  AIOS to "people building an agency" — so Harbormill's paying clients *are* its future builder
  customers. The phases feed each other instead of running strictly in sequence.

---

## 3. Segmentation — Sweven's three member types → three roles

| Segment | Role in the model | Why |
|---|---|---|
| **Local service businesses** (partner's restaurant + the few member service businesses) | **Flagship case studies** | High, quantifiable ROI; friendly; dogfooded. The "proof," not the paid beachhead — local/indie margins make them weak *retainer* buyers but excellent *evidence*. |
| **Agencies** | **Paying retainer beachhead AND Phase-2 builder pipeline** | Have revenue + recurring-fee literacy; back-office (lead gen, outreach, onboarding, reporting) is repeatable and templatable; double as future builders. |
| **Solo founders** | **Phase-2 builder / community audience** | Mostly can't pay retainers now; ideal "learn-to-build" buyers later, or upsell-when-they-grow. |

**Concentration rule:** "agency" is broad. Start with **one agency sub-type** (the one most common
in Sweven and most pained by its *own* lead gen — where the "AI CSO" template lands hardest). The
sub-type is chosen by the Sweven membership audit (Phase 1, Step 1), not guessed up front.

> Template reuse — the source of "ship in days, not months" — only kicks in once clients #2–3 are
> the *same* sub-type. Spreading across types early destroys the compounding. *"Another pest control
> company with a similar issue… we take the core components… and build a new system in a matter of
> days."* — webinar, ~46:00

---

## 4. The Offer — use Harbormill's existing ladder (source of truth: `docs/gtm/`)

This design introduces **no new pricing**. Harbormill already has a validated three-step ladder, and
agencies — being higher-budget — simply land in its upper tiers. (An earlier draft of this spec
proposed an "AI Exploration sprint" and a $3.5k/$6.5k/$15k ladder; **both are dropped** in favor of
the existing assets below, which are already faster and cheaper to enter.)

- **Wedge — the Loop Audit** (`docs/gtm/intro-call-script.md`): a paid **$500–$2,500** fixed-scope
  audit, fee **credited toward the build**, delivering a ranked Opportunity Report in **48h** via the
  Four-Condition Loop Test. *This already embodies the "fast, paid scoping" idea — the 48h turnaround
  is faster than the 3–6 day sprint the earlier draft proposed, so no separate exploration step is
  needed.*
- **Focused Project** (`docs/gtm/project-proposal-template.md`): **$5,000** fixed, 50/50
  deposit/delivery, 2–3 week timeline, audit fee credited.
- **Retainer** (`docs/gtm/retainer-tiers.md`): Operate **$3,000/mo** · Operate+Build **$5,000/mo** ·
  Embedded **$8–10k/mo** (published band **$3–10k**), pitched at delivery on the deck's
  **"Value Delivered"** surface.
- **Founding-client lever (optional, additive):** to seed the case studies the current outreach
  lacks, the first ~2–3 agency clients may get a reduced first-few-months retainer (or an extra
  credited audit) in exchange for testimonial + case-study + referral rights — kept **within the
  published $3–10k band**.
- **Land-and-expand** is already the retainer's spine: the Operate+Build tier ships one new loop/month
  from the client's ranked audit, so the system compounds. *"I just let them upsell themselves."*
  — webinar, ~56:00

---

## 5. Delivery Model

- Delivery is Harbormill's **deployable AIOS deck** (the GitHub-template base → a per-client repo on
  the client's own Supabase, white-labeled via `brand.ts` + CSS, with the **Aria** assistant,
  **connectors** (Stripe/GA4 → live KPIs), a knowledge/RAG layer, and the **"Value Delivered" ROI
  surface**) **plus a bespoke "loop"** (the automation from the Loop Audit). See
  `docs/per-client-workflow.md` and `docs/client-setup.md`. *"Configure, don't fork"* keeps it a
  product, not N forks.
- **One agency sub-type first** → each loop yields a reusable template that flows back to the base →
  speed-to-value compounds (client #3 is cheaper to serve than client #1).
- **Honest capacity constraint:** early on, **Dame is the build bottleneck**. "Nearly infinitely
  scalable" is *conditional* on (a) templates first, then (b) Phase-2 builders/hires absorbing
  delivery. The model plans for this explicitly — it does not pretend scale is free. Concentration and
  templating are therefore **non-negotiable**, because they are the bridge off the bottleneck.

---

## 6. Go-To-Market Motion — Sweven as the engine for the *existing* funnel

The existing playbook's funnel is *Warm-50 → intros → Loop Audits → Projects → Retainers*
(`docs/gtm/README.md`). Sweven supercharges its top: it is a **ready-made Warm-50+** and a **live
intro-generation channel**, replacing cold list-building — not a new sales process.

1. **Dogfood** — build the AIOS deck + first loop for the partner's restaurant and for Sweven's own
   ops (member billing, tour/lead follow-up, events). Output: **2 flagship case studies** (the proof
   current outreach lacks) + a rehearsed delivery, removing the "we haven't run this ourselves" risk.
2. **Sweven membership audit** → name the dominant **agency sub-type** (the niche to concentrate on)
   + a warm pilot shortlist; seed these straight into the Warm-50 tracker.
3. **Demo night at Sweven** ("kill the busywork") → books **intro calls** at ~zero CAC — a
   Sweven-native substitute for cold outreach (`docs/gtm/outreach-templates.md`).
4. **Run the existing ladder unchanged:** intro call (`intro-call-script.md`) → **Loop Audit** →
   **Focused Project** → **Retainer** (`retainer-tiers.md`). The agency niche only sharpens *which
   loops to lead with* — their own lead-gen, client onboarding, and reporting — versus the generic
   AR-follow-up default.

---

## 7. Phase 2 (stub) — Harbormill as the Accelerator (the scaling engine)

Trigger: ~3–5 paying agency clients + flagship case studies in hand.

Productize the playbook into a **builder offer**: the AIOS kit (starter-kit templates + the concentrated
vertical's reusable build) **+ training**, sold to:
- Sweven **solo founders** (learn-to-build audience), and
- Harbormill's own **agency clients** who want to resell AIOS to *their* clients.

Phase-1 clients become the testimonials that sell Phase 2. **This is where revenue decouples from
Dame's build-time** — the model's actual scaling mechanism. Phase 2 will get its own dedicated
spec; this section only fixes its dependencies on Phase 1 (case studies, a battle-tested template,
a proven sales script).

---

## 8. Risks & Honest Constraints (named, not hidden)

| Risk | Mitigation / reframe |
|---|---|
| Agencies think "we'll just build it ourselves" | That objection **is** the Phase-2 upsell — sell them the kit + training. |
| Founder is the delivery bottleneck | Why concentration + templates are non-negotiable in Phase 1; Phase 2 builders absorb delivery. |
| Local-service / restaurants can't sustain retainers | They are **flagship proof**, not the paid beachhead. |
| Data/trust objections from owners | Local-hosted context layer (the webinar's stated answer). |
| "Nearly infinitely scalable" is conditional | Stated plainly; scale is engineered (templates → builders), not assumed. |
| Sweven agency sub-type still unknown | Resolved by the membership audit as Phase-1 Step 1 — a discovery action, not a blocker. |

---

## 9. Open Questions for the Implementation Plan

1. Which agency sub-type does the Sweven audit surface (marketing/SMMA, creative, dev, recruiting…)?
2. Is the partner formally bought in as flagship client #1 and to opening Sweven as a channel?
3. ~~Pricing: adopt Tyler's ladder, or adjust for NYC?~~ **Resolved:** use the **existing Harbormill
   ladder** (Loop Audit $500–$2,500 → Project $5,000 → Retainer $3–10k band) as the single source of
   truth; the earlier NYC/exploration numbers are dropped (see §4). Optional founding-client lever
   stays within the band.
4. Who delivers builds beyond Dame in Phase 1 (partner? first hire? a Sweven member-builder)?
5. ~~What is the trigger metric to *start* Phase 2 (client count, MRR, or a specific case-study bar)?~~
   **Resolved (default — adopt unless Dame overrides):** Phase 2 starts when **all three** hold:
   **3 paying agency clients (Operate tier or above) + 2 published case studies + ≥ $12,000 MRR.**
   The three are complementary, not redundant — paying clients prove the loop *repeats*, case studies
   prove it *sells*, and the MRR floor proves the base can *fund* the Phase-2 builder push without
   starving founder build-time. Re-scored against live numbers in plan Task 5.3
   (`docs/gtm/phase2-readiness.md`).

---

## See Also

- AAA Accelerator Tyler Webinar — captured transcript (19:00–60:00 segment), local capture
  `tyler_window_19_60.txt`.
- Harbormill white-label AIOS base — `docs/white-label.md`, `docs/per-client-workflow.md`,
  `docs/client-setup.md`.
