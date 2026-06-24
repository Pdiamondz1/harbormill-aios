# validator-forge — design spec

- **Date:** 2026-06-23
- **Status:** approved design, pre-implementation
- **Surface:** A — dev-side methodology (the "skills → validators → loops" dogfood)
- **Origin:** the prompt *"Analyze my existing skills and tell me how some could potentially be tweaked to become validators to allow me to create loops"* — recognized as a sharper, actionable phrasing of Harbormill's existing thesis (the [[Four-Condition Loop Test]], condition #2: *"a rule decides done"* **is** a validator).

## 1. Context & problem

Harbormill's automation thesis already runs on the [[Four-Condition Loop Test]]
(`docs/wiki/concepts/four-condition-loop-test.md`). Of its four conditions, **#2 — "a
rule decides 'done'" — is a hard blocker** and the condition most candidate loops die
on: *"if 'done' needs human taste, it is not loop-ready."* That objective done-rule is
a **validator**.

The repo already contains working validators:

- the **`autoresearch` acceptance gate** (`kept/discarded/flagged`),
- **`wiki-ops lint`** (a health check over the wiki),
- the **build-and-verification gate** (`npm run typecheck/lint/build/test`,
  `docs/wiki/concepts/build-and-verification-gate.md`),
- **`loop-audit`'s** own four-condition gate.

What is missing is a *method* that, given existing capabilities, finds **which other
ones can become validators** and therefore unblock new loops. That method is this
skill.

A concrete gap motivates it: **`autoresearch` is a growth loop** (it *adds* verified
wiki pages) but **nothing maintains** the pages it has already written. `wiki-ops lint`
is the obvious validator for that missing **maintenance** loop. Running the validator
lens by hand over the three skills in `.claude/skills/` (`autoresearch`, `wiki-ops`,
`loop-audit`) produces an unambiguous #1 candidate (the "wiki-gardener" loop), which is
good evidence the method works. (Note the distinction used throughout this spec: the
**four existing validators** above are validator-shaped *logic* to credit; the
*skills* in `.claude/skills/` are the units the skill enumerates and classifies — see
§4.)

## 2. Goals / non-goals

**Goals**
- A new **advisory** skill, working name **`validator-forge`**, that analyzes existing
  skills/capabilities, classifies each by its validator potential, ranks the
  convertible ones by value-per-effort, and **emits a buildable loop-spec stub for the
  top pick**.
- Be the dev-side **Phase-1 dogfood** that produces the proof/artifacts later reused by
  surface B (website message) and surface C (in-app Aria feature) — those are separate
  specs.

**Non-goals (YAGNI)**
- It does **not** build any loop, edit app code/schema/RLS/auth, or modify other skills.
- **No `loop N` autonomous mode.** The skill set is small and static; one pass is the
  product. (Mirrors `loop-audit`'s own YAGNI stance on its loop mode.)
- It does not design surfaces B or C.

## 3. The validator lens (core method)

For each capability, answer:

1. What does it **generate** (its output)?
2. Is there a **latent acceptance check** already inside it (a gate, lint, test,
   threshold)?
3. What rule would decide **"done" objectively**, and how strong is it?
   - **machine-checkable** (strong) / **heuristic-but-objective** (partial) /
     **needs-human-taste** (fails).
4. What **loop** would that validator close: *generator → validator →
   iterate-until-done*?

**Verdict** per capability (parallel to `autoresearch`'s `kept/discarded/flagged` and
`loop-audit`'s `candidate/blocked/not-a-loop`):

- **`validator`** — already has an objective done-rule (e.g. the autoresearch gate).
  Credit it and point at it; never re-propose.
- **`forgeable`** — a **specific, named tweak** converts it into a validator (e.g.
  promote `wiki-ops lint` into a closed loop's gate).
- **`taste-bound`** — "done" needs human judgment; not forgeable. Record the closest
  objective proxy, if any, that could stand in.

## 4. Flow — `/validator-forge` (one pass)

1. **Enumerate** capabilities. The **unit of classification is each skill in
   `.claude/skills/`** — every such skill gets exactly one ledger row with a
   `validator | forgeable | taste-bound` verdict (§5). Separately, **note repo-level
   validator logic that is not a skill** (notably the build-and-verification gate,
   which is `npm` scripts, not a skill) so the analysis *credits* it and avoids
   re-proposing it — but it does **not** get a per-skill ledger row.
2. **Apply the lens** to each → verdict + proposed done-rule + one-line rationale.
3. **Rank** the `forgeable` set by **value-per-effort**, reusing the **ROI-Discovery /
   `loop-audit` scoring vocabulary** (`category` = `hours_saved | revenue_captured |
   cost_avoided | other`; `value` = annualized prize weighted by `confidence`
   (`low|med|high`); ÷ `effort` (`low|med|high`)) so scoring is identical across all
   three surfaces.
4. **Emit the top pick as a concrete loop-spec stub** — generator, validator (done-rule
   + which defect/output classes gate it), iterate/stop condition, guardrails, and the
   human-gated boundary. For the current #1 pick this is the **wiki-gardener** (§6).
5. **Persist** the report and the emitted proposal (§5).

## 5. Outputs / artifacts

- **Report:** `docs/validator-forge/YYYY-MM-DD-validator-forge.md` — enumerated
  capabilities, per-capability verdict + done-rule, ranked `forgeable` table, and the
  named top pick. (Create the `docs/validator-forge/` folder if absent — mirrors
  `loop-audit`'s `docs/loop-audits/`.)
- **Top build stub:** `docs/validator-forge/YYYY-MM-DD-<pick>-loop.proposal.md` — a
  **proposal**, deliberately **not** written into `docs/superpowers/specs/` (that path
  is reserved for human-approved specs). A human then runs `brainstorming` /
  `writing-plans` on the proposal to actually build the loop. This is what keeps
  "advisory skills never build" intact.

### Report format

```
# Validator Forge — YYYY-MM-DD

Capabilities analyzed: <n>   Validators (existing): <n>   Forgeable: <n>   Taste-bound: <n>

## Recommended first build
<pick> — <one paragraph: the loop it closes, why it wins value-per-effort, the done-rule>

## Ranked forgeable validators
| Rank | Capability | Loop it closes | Done-rule (strength) | Category | Value | Confidence | Effort |
|------|-----------|----------------|----------------------|----------|-------|------------|--------|
| 1 | … | … | … (machine-checkable) | hours_saved | … | high | low |

## Ledger (every capability)
### <capability name>
Verdict: validator | forgeable | taste-bound
Generates: <output>   Latent check: <yes/no — what>
Done-rule: <the objective rule, or why none exists>   Strength: machine-checkable | heuristic | none
Loop: <generator → validator → iterate>  (omit if taste-bound)
Note: <one line — the specific tweak if forgeable; the proxy if taste-bound; the pointer if already a validator>
```

## 6. The emitted wiki-gardener proposal (the concrete first output)

- **Generator:** `wiki-ops` fix/ingest actions.
- **Validator:** `wiki-ops lint` — **"done" = zero defects of the *gating* classes**.
- **Loop:** `lint → fix highest-severity auto-fixable defect → re-lint → repeat until
  clean or budget N exhausted` (bounded, mirroring `autoresearch`'s loop).
- **Critical guardrail — class split.** Lint findings divide into:
  - **auto-fixable** (loop may act): orphan `[[wikilinks]]`, missing `index.md`
    entries, missing cross-references between related pages.
  - **human-gated** (loop surfaces, never resolves): **contradictions** (stay flagged
    per the wiki's "never silently overwrite" rule); **thin/single-source coverage**
    (handed to `autoresearch` to research, never invented).
  The loop only auto-acts on the auto-fixable set; everything else is reported.
- **Why it matters:** wiki-gardener is the **maintenance** counterpart to
  `autoresearch`'s **growth** loop. Together they form the complete self-improving-wiki
  cycle ([[Self-Improving App]]).

*(This section is the shape of what `validator-forge` emits as a proposal; the actual
wiki-gardener build is a separate, human-gated spec.)*

## 7. Relationship to `loop-audit` (non-redundancy contract)

- **`loop-audit`** gates *tasks/work* against **all four** conditions and ranks them.
- **`validator-forge`** analyzes *capabilities/skills* for **condition #2 specifically**
  and forges the missing done-rule.
- **Handoff both ways:**
  - a `loop-audit` candidate marked **`blocked` on #2** (no rule decides done) is a
    referral *into* `validator-forge` — "can an existing skill be forged into the
    validator that unblocks this?"
  - a validator `validator-forge` forges feeds *back* as a high-confidence `loop-audit`
    `candidate`.
- They share the **ROI-Discovery scoring vocabulary** and the same **advisory,
  ledgered, no-metered-spend** posture.

## 8. Guardrails (mirror `loop-audit` / `autoresearch`)

- **Advisory only.** Writes **only** its report + proposal under `docs/validator-forge/`.
  Never edits app code, schema, RLS, auth, or other skills. Never builds the loop.
- **No metered/client spend.** Runs in the local Claude Code session, not through any
  client edge function or AI key.
- **Read-only** against skills and repo.
- **Don't duplicate existing validators.** If a capability already has an objective gate
  (autoresearch, build-and-verification gate, `wiki-ops lint`), mark it `validator` and
  point at it — never re-propose.
- **One pass is the product** — no `loop N` mode.

## 9. Naming

Working name **`validator-forge`**. Alternatives considered: `validator-audit` (parallel
to `loop-audit` but slightly misleading — it forges, it doesn't audit validators),
`loop-closer`. Decision: keep `validator-forge` unless a better name surfaces at
skill-authoring time.

## 10. Success criteria

- `/validator-forge` runs one pass and produces a dated report that classifies every
  `.claude/skills/` skill as `validator | forgeable | taste-bound`, with an objective
  done-rule named for each `forgeable`.
- It ranks the `forgeable` set by value-per-effort using the shared ROI vocabulary.
- It emits a wiki-gardener loop **proposal** (not a spec) under `docs/validator-forge/`.
- It credits the four existing validators without re-proposing them.
- It writes nothing outside `docs/validator-forge/`.

## 11. Out of scope (enabled, not built here)

- **Surface B** — the harbormill.net "loops you can trust because a rule decides done"
  message (its own spec; consumes this skill's report as proof).
- **Surface C** — an in-app Aria "forge a validator" capability (its own spec; this is
  the template).
- The **actual wiki-gardener build** — a separate human-gated spec, kicked off from the
  proposal this skill emits.

## See Also

- [[Four-Condition Loop Test]] — `docs/wiki/concepts/four-condition-loop-test.md`
- [[Self-Improving App]] — `docs/wiki/concepts/self-improving-app.md`
- `.claude/skills/loop-audit/SKILL.md` — the sibling skill
- `.claude/skills/autoresearch/SKILL.md` — the proven loop + acceptance gate
- `.claude/skills/wiki-ops/SKILL.md` — `lint` is the validator for wiki-gardener
