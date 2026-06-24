# Harbormill Automation — Go-To-Market & Business Model Design

- **Date:** 2026-06-24
- **Status:** Approved design (brainstorming) — pending implementation plan
- **Owner:** Damon "Dame" Williams
- **Source material:** AAA Accelerator "Tyler Webinar" recording (`aios.aaaaccelerator.com/tyler-recording`,
  Wistia media `0ywbiyjuor`), the 19:00–60:00 segment covering the AIOS product thesis,
  live client demos, and the sell-and-deliver business model. Full timestamped transcript of
  that window was captured and processed; key claims are cited inline below.

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

## 4. The Offer (mirrors Tyler's validated structure)

- **Paid "AI Exploration" milestone — ~$2,500**, credited toward month 1, refundable if undeliverable.
  De-risks the buyer, funds scoping, filters tire-kickers. Functions as a build down-payment.
- **Tiered monthly retainers:**
  | Tier | Price | Scope |
  |---|---|---|
  | Core | **~$2,500/mo** | One pain point solved end-to-end |
  | Growth | **~$4,500/mo** | Expanded automations / multiple workflows |
  | Full AIOS | **~$10,500/mo** | Complete operating system build-out |
  *~99% of clients start in Core or Growth; Full is the land-and-expand ceiling.* (Stated as Tyler's
  real prices with live clients on every tier.)
- **Land-and-expand** is the operating mindset: solve one pain cheaply, then let the AIOS sell its own
  next phase as the client's "what else can it do?" instinct kicks in. *"I just let them upsell
  themselves."* — webinar, ~56:00

---

## 5. Delivery Model

- Built on **Harbormill's existing white-label AIOS base** → Claude Code + Cursor + starter-kit folder
  structure; a per-client context layer assembled from discovery docs (call transcripts, business
  info, financials, team roster) dropped into an inbox folder and processed by one prompt.
- **One agency sub-type first** → each build yields a reusable template → speed-to-value compounds.
- **Honest capacity constraint:** early on, **Dame is the build bottleneck**. "Nearly infinitely
  scalable" is *conditional* on (a) templates first, then (b) Phase-2 builders/hires absorbing
  delivery. The model plans for this explicitly — it does not pretend scale is free. Concentration and
  templating are therefore **non-negotiable**, because they are the bridge off the bottleneck.

---

## 6. Go-To-Market Motion (Sweven-powered)

1. **Dogfood** — build real AIOS for the partner's restaurant and for Sweven's own operations
   (member billing, tour/lead follow-up, bookings, community comms, events). Output: 2 flagship
   case studies, a refined delivery process, and removal of the "we haven't run this ourselves" risk.
2. **Sweven membership audit** — survey/segment members; identify the dominant agency sub-type →
   sets the concentration vertical.
3. **In-person demo night / workshop at Sweven** — "AIOS for your business." Warm pipeline at ~zero CAC.
4. **Sales process** (from the webinar):
   - Discovery call → identify the pain point.
   - **Quantify** it (time / dollars / missed revenue) — this is what justifies the retainer.
   - "Magic wand" question → scopes the exact build.
   - **Paid exploration milestone** ($2,500) → verify APIs/data, map workflow, rough MVP/dashboard.
   - **ROI proposal**, tiered → close on Core or Growth.
   - Deliver → land-and-expand.

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
3. Pricing: adopt Tyler's ladder as-is, or adjust for the NYC/Hoboken market?
4. Who delivers builds beyond Dame in Phase 1 (partner? first hire? a Sweven member-builder)?
5. What is the trigger metric to *start* Phase 2 (client count, MRR, or a specific case-study bar)?

---

## See Also

- AAA Accelerator Tyler Webinar — captured transcript (19:00–60:00 segment), local capture
  `tyler_window_19_60.txt`.
- Harbormill white-label AIOS base — `docs/white-label.md`, `docs/per-client-workflow.md`,
  `docs/client-setup.md`.
