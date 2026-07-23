# Claude Code Enablement Kit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended)
> or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax
> for tracking.
>
> **This is a documentation + light-build plan, not a TDD code plan.** Most tasks produce **prose**
> (markdown docs) or **seed data**, not unit-tested functions. The task format is adapted (per the
> `2026-06-24-harbormill-field-guide.md` precedent): each content task carries **Done-criteria** (an
> objective, usually grep-able check) instead of a failing test. Only Phase 4 (the deck builder) touches
> real code and uses proper `pytest` TDD. Commit after every task.

**Goal:** Build a reusable, plain-language training kit that teaches a non-technical Microsoft-stack IT
team to set up and run Claude Code the "Harbormill way" (context spine, memory 2nd-brain, skills,
superpowers workflow, worktrees, MCP) — delivered as live sessions + a leave-behind kit, and doubling
as Harbormill's first client-enablement case study.

**Architecture:** A documentation kit under `docs/gtm/enablement/` (README, glossary, setup guide,
workflow runbook, Microsoft-stack translation guide, continuity/governance doc, facilitator guide,
first-week cheat sheet), a fake worked example under `examples/contoso-server-health/`, and a slide
deck built from a markdown source (`deck/deck.md`) via a small `python-pptx` script (`deck/build_deck.py`)
into an editable, Harbormill-branded `Directing-Claude.pptx`. Every artifact is client-agnostic.

**Tech Stack:** Markdown (docs) · Python 3.13 + `python-pptx` (deck builder, tested with `pytest`) ·
the existing Harbormill methodology surfaces (`CLAUDE.md`, `docs/PROJECT_CONTEXT.md`, the memory model,
`.claude/skills/`) as the reference source for what the kit teaches.

**Source of truth & guardrails (read before any task):**
- `docs/superpowers/specs/2026-07-23-claude-code-enablement-kit-design.md` — this plan's spec. Where
  this plan and the spec disagree, **the spec wins.**
- Reference canon for *what the methodology is*: `CLAUDE.md`, `docs/PROJECT_CONTEXT.md`, the memory
  model at `~/.claude/projects/<proj>/memory/` (`MEMORY.md` + typed files), `.claude/skills/`, and the
  superpowers skills (`brainstorming`, `writing-plans`, `executing-plans`, `subagent-driven-development`).
- Match existing `docs/` house style: markdown, ~100-char wrap, plain section headers, token-style tone.

**Branch:** `worktree-hma-improvements` (current). The spec + logo are already committed (`920eb2c`).
Commit after each task; **push + open a PR at the end of Phase 5** (Damon OKs the merge-to-main prompt).

---

## Global Constraints

Every task's requirements implicitly include this section. Values copied verbatim from the spec.

1. **Plain language, zero assumed knowledge.** No term used without a one-line definition and a
   Windows-admin analogy. Every hands-on step is "click *here*, type *this*, press Enter," with a
   screenshot placeholder (`![screenshot: <what it shows>](screenshots/<name>.png)`) and a
   **"✅ you should now see…"** checkpoint. Include plain-terms **troubleshooting** boxes ("if you see
   a red message, do X").
2. **The spine:** *"You are the director. Claude is the developer. You don't write code — you tell
   Claude what you want, check what it did, and keep the notes."* State it early; echo it in each doc.
3. **Confidentiality (load-bearing):** the real client project appears **nowhere**. The only worked
   example is the fake **"Contoso Server Health Report."** No real company, person, or project-specific
   vendor-stack names anywhere in `docs/gtm/enablement/`.
4. **Microsoft translation = exactly three swaps:** GitHub/`gh` → **Azure Repos** (`az repos`),
   GitHub Issues → **Azure Boards**, GitHub Actions → **Azure Pipelines**. Everything else in the
   methodology is identical. **Do NOT teach Azure PaaS deployment** (App Service, etc.); Azure Key
   Vault / Azure Monitor get a one-line "optional future" mention only.
5. **Reusable / client-agnostic.** Instantiating for a new client = swap the fake example + a few
   client-specific values, with **no rewrite of the method content**.
6. **Deck:** markdown source (`deck/deck.md`) → `python-pptx` (`deck/build_deck.py`) → editable
   `Directing-Claude.pptx`. Harbormill-branded via `deck/assets/harbormill-logo.png`. ~30 slides; each
   hands-on module ≈ 2–3 slides.
7. **Python tooling is auxiliary** — like the Deno edge functions, it is **not** covered by the
   `npm run` gate. Validate it by running `pytest` inside `docs/gtm/enablement/deck/`.

**Confidentiality scan (reused as Done-criteria in every content task).** Keep an *uncommitted* local
`scratch/deny.txt` containing the real client + people names (never commit it). Then:

```bash
# Generic domain leak-check (these networking product names would only appear if the real
# project's domain leaked in). Expect PASS.
grep -riE 'meraki|cradlepoint|fortigate|fortianalyzer|netscaler|noc dashboard' docs/gtm/enablement/ \
  && echo "FAIL: domain term leaked" || echo "PASS: no domain leak"
# Real-name check against the uncommitted denylist. Expect PASS.
grep -rif scratch/deny.txt docs/gtm/enablement/ && echo "FAIL: real name leaked" || echo "PASS"
# Positive check: the example company is Contoso. Expect a non-zero count.
grep -ric 'contoso' docs/gtm/enablement/ | grep -v ':0$' | head -1
```

---

## File Structure (decomposition)

```
docs/gtm/enablement/
  README.md                       Kit overview + how to instantiate for a new client (Task 1)
  00-glossary.md                  ~10 core terms, one plain line + Windows-admin analogy each (Task 1)
  setup-guide.md                  Modules 0–3: orientation, install, rulebook, memory (Task 3)
  workflow-runbook.md             Modules 4–7 daily loop + optional Module 8 appendix (Task 4)
  microsoft-stack-translation.md  The three swaps + command cheat-sheet + MCP mapping + secrets (Task 5)
  continuity-governance.md        Module 9 concern→artifact map + stakeholder briefing (Task 6)
  facilitator-guide.md            Session agendas, timing, hands-on checkpoints (Task 7)
  first-week-cheat-sheet.md       One-page "your first week" (Task 7)
  screenshots/                    Placeholder screenshots referenced by the docs (Task 3+, generic only)
  deck/
    deck.md                       Slide source + speaker notes (Task 9)
    build_deck.py                 python-pptx build script (Task 8)
    test_build_deck.py            pytest tests for the builder (Task 8)
    requirements.txt              python-pptx pin (Task 8)
    Directing-Claude.pptx         Generated, branded, editable output (Task 9)
    assets/harbormill-logo.png    Brand logo — ALREADY COMMITTED (920eb2c)
  examples/contoso-server-health/
    CLAUDE.md                     Starter rulebook for the fake example (Task 2)
    PROJECT_CONTEXT.md            Starter project context for the fake example (Task 2)
    memory-seed/MEMORY.md         Sample memory index (Task 2)
    memory-seed/*.md              A couple of typed sample memories (Task 2)
    sample-spec.md                Finished reference spec for the disk-check script (Task 2)
    sample-plan.md                Finished reference plan for the disk-check script (Task 2)
    sample-skill/SKILL.md         One example skill: "add a server to the health check" (Task 2)
```

**Phase map:** Phase 0 = Task 1 · Phase 1 = Task 2 · Phase 2 = Tasks 3–6 · Phase 3 = Task 7 ·
Phase 4 = Tasks 8–9 · Phase 5 = Task 10. Tasks 3–6 are independent of one another (any order) once
Tasks 1–2 land.

---

## Phase 0 — Scaffold & foundations

### Task 1: Kit README + glossary

**Files:**
- Create: `docs/gtm/enablement/README.md`
- Create: `docs/gtm/enablement/00-glossary.md`

**Interfaces:**
- Produces: the kit's entry point and shared vocabulary. Every later doc links back to `00-glossary.md`
  for term definitions and to `README.md` for the "how to use this kit" framing.

- [ ] **Step 1: Write `README.md`.** Required sections:
  - **What this is** — one paragraph: a plain-language kit to set up + run Claude Code the Harbormill
    way, for a non-technical Microsoft-stack team; hybrid delivery (live sessions + leave-behind).
  - **The one idea** — the director/developer spine (Constraint 2), quoted verbatim.
  - **How to use this kit** — the reading order: `00-glossary` → `setup-guide` (Session 1) →
    `workflow-runbook` (Session 2) → `continuity-governance` (stakeholder briefing); facilitators also
    read `facilitator-guide`; everyone keeps `first-week-cheat-sheet`.
  - **The 5 pieces** — rulebook, memory, skills, safe sandbox, tool connections (one plain line each).
  - **How to instantiate this kit for a new client** — a numbered list: (1) copy `docs/gtm/enablement/`
    to the client engagement, (2) swap the fake example values only, (3) keep all method content as-is,
    (4) never add real client specifics to the reusable copy; client screenshots live in the private
    copy only (cite the spec's screenshot guardrail).
  - **What's a fake example?** — one line pointing at `examples/contoso-server-health/`.
- [ ] **Step 2: Write `00-glossary.md`.** A table of **~10 core terms**, each with a one-line plain
  definition **and** a Windows-admin analogy. Required terms (define at least these): **Claude Code**,
  **terminal**, **repository (repo)**, **commit**, **pull request (PR)**, **branch / worktree**,
  **`CLAUDE.md` (the rulebook)**, **memory (2nd brain)**, **skill**, **MCP (tool connection)**. Example
  row — Repo: "A folder whose full history is tracked. *Like a shared network folder that remembers
  every version of every file.*"
- [ ] **Step 3: Done-criteria.** Run:

```bash
test -f docs/gtm/enablement/README.md && test -f docs/gtm/enablement/00-glossary.md && echo "files OK"
grep -qi "you are the director" docs/gtm/enablement/README.md && echo "spine present"
grep -c '|' docs/gtm/enablement/00-glossary.md   # table rows present (expect >= 12)
# Confidentiality scan (see Global Constraints) — expect PASS lines.
```
Expected: `files OK`, `spine present`, a row count ≥ 12, and PASS on the confidentiality scan.

- [ ] **Step 4: Commit.**

```bash
git add docs/gtm/enablement/README.md docs/gtm/enablement/00-glossary.md
git commit -m "docs(enablement): kit README + plain-language glossary"
```

---

## Phase 1 — The fake worked example

### Task 2: Contoso Server Health Report seed

Build the fake example the docs and deck reference. Keep it tiny but complete: a Python script that
reads a list of Windows servers, checks free disk space, and writes a simple daily HTML report.

**Files:**
- Create: `docs/gtm/enablement/examples/contoso-server-health/CLAUDE.md`
- Create: `docs/gtm/enablement/examples/contoso-server-health/PROJECT_CONTEXT.md`
- Create: `docs/gtm/enablement/examples/contoso-server-health/memory-seed/MEMORY.md`
- Create: `docs/gtm/enablement/examples/contoso-server-health/memory-seed/user-it-lead.md`
- Create: `docs/gtm/enablement/examples/contoso-server-health/memory-seed/project-disk-report.md`
- Create: `docs/gtm/enablement/examples/contoso-server-health/sample-spec.md`
- Create: `docs/gtm/enablement/examples/contoso-server-health/sample-plan.md`
- Create: `docs/gtm/enablement/examples/contoso-server-health/sample-skill/SKILL.md`

**Interfaces:**
- Produces: the canonical example objects referenced by Tasks 3–9. The **skill** is named
  **"add-server-to-health-check"** and the **script** the example builds is
  **`Get-DiskHealthReport.ps1`** / **`disk_report.py`** — use these exact names everywhere downstream.

- [ ] **Step 1: `CLAUDE.md`** — a starter rulebook, mirroring this repo's `CLAUDE.md` shape but for the
  fake project: project = "Contoso Server Health Report," stack = Python 3.12 on Windows + a scheduled
  task + a static HTML report, source in **Azure DevOps**, a rule that **secrets never go in Git**, and
  the git-trailer conventions. ~40 lines.
- [ ] **Step 2: `PROJECT_CONTEXT.md`** — the fake project's single source of truth: purpose (spot low
  disk before it pages someone), who uses it (Contoso IT), the continuity requirement (a backup owner
  can run it), and the phased shape (v1: one server list + HTML report; v2: email it). ~30 lines.
- [ ] **Step 3: `memory-seed/`** — `MEMORY.md` index (2–3 one-line pointers) plus two typed memory
  files following the repo's memory format (frontmatter `name`/`description`/`metadata.type` + body):
  `user-it-lead.md` (type `user`) and `project-disk-report.md` (type `project`, records the v1/v2 decision).
- [ ] **Step 4: `sample-spec.md` + `sample-plan.md`** — a finished, miniature spec and plan for the v1
  disk-check script, so Module 4's checkpoint ("a written plan for the disk-check script") has a
  reference answer. The plan must include a `disk_report.py` that reads `servers.txt`, checks free
  space via `shutil.disk_usage`, and writes `report.html`. Show the actual ~25-line Python.
- [ ] **Step 5: `sample-skill/SKILL.md`** — the **add-server-to-health-check** skill: frontmatter
  (`name: add-server-to-health-check`, `description:`) + a numbered procedure (append a hostname to
  `servers.txt`, run the report, confirm the new row appears). This is the "skills = saved runbook
  recipe" artifact Module 6 runs.
- [ ] **Step 6: Done-criteria.** Run:

```bash
find docs/gtm/enablement/examples/contoso-server-health -type f | sort   # expect all 8 files
grep -qi "add-server-to-health-check" docs/gtm/enablement/examples/contoso-server-health/sample-skill/SKILL.md && echo "skill named OK"
grep -qi "director" docs/gtm/enablement/examples/contoso-server-health/CLAUDE.md || echo "note: spine optional here"
python -c "import ast,glob,sys" && echo "python OK"
# Confidentiality scan — expect PASS.
```
Expected: 8 files listed, `skill named OK`, PASS on the confidentiality scan.

- [ ] **Step 7: Commit.**

```bash
git add docs/gtm/enablement/examples/contoso-server-health
git commit -m "docs(enablement): Contoso Server Health Report fake worked example (seed)"
```

---

## Phase 2 — The reference docs

### Task 3: Setup Guide (Modules 0–3)

**Files:**
- Create: `docs/gtm/enablement/setup-guide.md`
- Create (folder + placeholders): `docs/gtm/enablement/screenshots/.gitkeep`

**Interfaces:**
- Consumes: `00-glossary.md` (link terms), `examples/contoso-server-health/` (the rulebook + memory it
  has the reader create mirror the seed).
- Produces: the Session-1 reference. Establishes the checkpoint style reused by Task 4.

- [ ] **Step 1: Write the guide** covering four modules, each with the "what/why → do it → ✅ checkpoint
  → troubleshooting" shape from Constraint 1:
  - **Module 0 — What you're about to do:** the director/developer spine, the 5 pieces, a pointer to
    the glossary.
  - **Module 1 — Get the tools on your machine:** install Claude Code, sign in with the **Enterprise**
    account (include the spec's "confirm the exact provisioning with your Claude admin" note as a
    callout), install the **VS Code** extension, and "what a terminal is / how to open it in VS Code."
    ✅ checkpoint: *say hello to Claude and get a reply.*
  - **Module 2 — Give Claude its rulebook:** create `CLAUDE.md` + `PROJECT_CONTEXT.md` (point at the
    Contoso seed as the model). ✅ checkpoint: *ask "what are we building?" — right answer.*
  - **Module 3 — Give Claude a memory:** set up the memory folder + `MEMORY.md`; save the first memory.
    ✅ checkpoint: *fresh chat recalls a saved decision.*
- [ ] **Step 2: Screenshot placeholders.** Every "do it" step references a generic screenshot via
  `![screenshot: <desc>](screenshots/<name>.png)`. Create `screenshots/.gitkeep`. Screenshots must be
  **generic** (no client machine content) per the spec guardrail; captured later.
- [ ] **Step 3: Done-criteria.** Run:

```bash
test -f docs/gtm/enablement/setup-guide.md && echo "file OK"
grep -c "✅" docs/gtm/enablement/setup-guide.md          # expect >= 3 (one per Module 1–3)
grep -qi "you are the director" docs/gtm/enablement/setup-guide.md && echo "spine present"
grep -qi "confirm.*admin" docs/gtm/enablement/setup-guide.md && echo "provisioning caveat present"
# Confidentiality scan — expect PASS.
```
Expected: `file OK`, ≥ 3 checkpoints, `spine present`, `provisioning caveat present`, PASS.

- [ ] **Step 4: Commit.**

```bash
git add docs/gtm/enablement/setup-guide.md docs/gtm/enablement/screenshots/.gitkeep
git commit -m "docs(enablement): setup guide (Modules 0-3, plain-language + checkpoints)"
```

---

### Task 4: Workflow Runbook (Modules 4–7 + Module 8 appendix)

**Files:**
- Create: `docs/gtm/enablement/workflow-runbook.md`

**Interfaces:**
- Consumes: `setup-guide.md` (checkpoint style), the Contoso seed (the loop is run against it),
  `microsoft-stack-translation.md` (link the Azure DevOps commands — Task 5 may land after this; use
  the exact commands in the Translation task's cheat-sheet so they match).
- Produces: the Session-2 reference.

- [ ] **Step 1: Write the runbook.** Modules 4–7, each "what/why → do it (against Contoso) → ✅ → fix":
  - **Module 4 — How you'll work every day:** the loop *talk it out (brainstorm) → get a plan →
    let Claude build it → check it → save it.* Do it: brainstorm + plan the `disk_report.py` v1.
    ✅ checkpoint: *a written plan for the disk-check script* (point at `examples/.../sample-plan.md`).
  - **Module 5 — A safe sandbox + saving to Azure DevOps:** worktrees in plain terms ("a sandbox copy
    so you never break the real thing") and commit/PR ("saving = commit; sharing for review = pull
    request"). Do it: commit `disk_report.py` and open a PR with `az repos pr create`. ✅ checkpoint:
    *your work appears as a PR in Azure DevOps.*
  - **Module 6 — Teach Claude repeatable jobs:** skills = saved runbook recipes. Do it: run the
    **add-server-to-health-check** skill. ✅ checkpoint: *the skill runs its steps.*
  - **Module 7 — Connect Claude to your tools:** MCP in plain terms; add the **Azure DevOps MCP**
    server. Do it: ask "what work items are assigned to me?" ✅ checkpoint: *Claude reads your work items.*
  - **Appendix (optional / self-serve) — Module 8, A runbook that maintains itself:** wiki +
    autoresearch as "the living runbook," ~½ page, clearly marked optional.
- [ ] **Step 2: Done-criteria.** Run:

```bash
test -f docs/gtm/enablement/workflow-runbook.md && echo "file OK"
grep -c "✅" docs/gtm/enablement/workflow-runbook.md      # expect >= 4 (Modules 4–7)
grep -qi "az repos pr create" docs/gtm/enablement/workflow-runbook.md && echo "azure PR cmd present"
grep -qiE "appendix.*module 8|module 8.*optional" docs/gtm/enablement/workflow-runbook.md && echo "module 8 appendix present"
# Confidentiality scan — expect PASS.
```
Expected: `file OK`, ≥ 4 checkpoints, `azure PR cmd present`, `module 8 appendix present`, PASS.

- [ ] **Step 3: Commit.**

```bash
git add docs/gtm/enablement/workflow-runbook.md
git commit -m "docs(enablement): workflow runbook (Modules 4-7 + Module 8 appendix)"
```

---

### Task 5: Microsoft-Stack Translation Guide

**Files:**
- Create: `docs/gtm/enablement/microsoft-stack-translation.md`

**Interfaces:**
- Produces: the **command cheat-sheet** the workflow runbook and cheat sheet link to. The exact Azure
  DevOps commands here are the canonical ones (`az repos pr create`, `az repos pr list`,
  `az boards work-item …`).

- [ ] **Step 1: Write the guide.** Required content, in order:
  - **What stays identical (lead with this):** the whole director/developer workflow, all skills &
    memory, worktrees, the context spine, settings/hooks, specs/plans, VS Code, Windows, PowerShell.
  - **The three swaps** — a table exactly matching the spec: GitHub/`gh` → Azure Repos; Issues → Azure
    Boards; Actions → Azure Pipelines, with the command mappings (`gh pr create` → `az repos pr create`,
    `gh pr list` → `az repos pr list`, plus the VS Code "Create Pull Request" click path).
  - **Deployment nuance:** the built software ships to on-prem/managed **Windows Server via PowerShell**,
    not Azure PaaS. **Do not** teach App Service; Key Vault / Monitor get a one-line "optional future" only.
  - **MCP servers, mapped:** Azure DevOps MCP (work items/repos/PRs/wiki); PostgreSQL MCP (only if the
    project has a DB); context7 MCP (unchanged); one line noting the Google→M365/Graph analog is out of scope.
  - **Secrets, the Windows way:** `.gitignore` + a pre-commit secret-scan hook; a `CLAUDE.md` rule to
    never write keys to tracked files; CI secrets in Azure DevOps variable groups / secure files; runtime
    secrets stay Windows-native (DPAPI / Credential Manager).
  - **A one-page command cheat-sheet** table at the end (the "command cheat-sheet" referenced elsewhere).
- [ ] **Step 2: Done-criteria.** Run:

```bash
test -f docs/gtm/enablement/microsoft-stack-translation.md && echo "file OK"
grep -qi "az repos pr create" docs/gtm/enablement/microsoft-stack-translation.md && echo "swap cmds present"
grep -qi "azure boards\|az boards" docs/gtm/enablement/microsoft-stack-translation.md && echo "boards present"
grep -qi "azure pipelines" docs/gtm/enablement/microsoft-stack-translation.md && echo "pipelines present"
grep -riq "app service" docs/gtm/enablement/microsoft-stack-translation.md && echo "WARN: check App Service is only a 'do not teach' mention" || echo "no App Service teaching"
# Confidentiality scan — expect PASS.
```
Expected: `file OK`, the three swap markers present, no App-Service *teaching*, PASS.

- [ ] **Step 3: Commit.**

```bash
git add docs/gtm/enablement/microsoft-stack-translation.md
git commit -m "docs(enablement): Microsoft-stack translation guide (the three swaps + MCP + secrets)"
```

---

### Task 6: Continuity & Governance doc

**Files:**
- Create: `docs/gtm/enablement/continuity-governance.md`

**Interfaces:**
- Produces: the Module-9 stakeholder briefing. Its concern→artifact table is mirrored on the deck's
  continuity slides (Task 9).

- [ ] **Step 1: Write the doc.** Required content:
  - **The problem:** the bus-factor / single-operator risk, in plain terms.
  - **The concern→artifact map** — the exact table from the spec (6 rows: bus factor → memory + wiki +
    specs; backup owner → method is non-dev-followable; runbook is current → wiki + skills; deploy from
    source unaided → Azure DevOps + skills/PowerShell + the deploy-from-source test; decisions on record
    → specs + plans + PR descriptions; secrets safe → `.gitignore` + pre-commit scan + read-only keys +
    `CLAUDE.md` rule).
  - **The proof test:** "deploy from source to a clean Windows box using the runbook alone, no help."
  - **Secrets & safety in one place** (short).
  - **A one-slide governance summary** paragraph a security/leadership stakeholder can read standalone.
- [ ] **Step 2: Done-criteria.** Run:

```bash
test -f docs/gtm/enablement/continuity-governance.md && echo "file OK"
grep -qi "bus.factor\|single-operator" docs/gtm/enablement/continuity-governance.md && echo "problem present"
grep -qi "deploy from source" docs/gtm/enablement/continuity-governance.md && echo "proof test present"
grep -c '|' docs/gtm/enablement/continuity-governance.md   # concern→artifact table (expect >= 8 rows of pipes)
# Confidentiality scan — expect PASS.
```
Expected: `file OK`, `problem present`, `proof test present`, table present, PASS.

- [ ] **Step 3: Commit.**

```bash
git add docs/gtm/enablement/continuity-governance.md
git commit -m "docs(enablement): continuity & governance (concern→artifact map + proof test)"
```

---

## Phase 3 — Facilitation

### Task 7: Facilitator guide + first-week cheat sheet

**Files:**
- Create: `docs/gtm/enablement/facilitator-guide.md`
- Create: `docs/gtm/enablement/first-week-cheat-sheet.md`

**Interfaces:**
- Consumes: all Phase-2 docs (the agenda sequences them).
- Produces: the two small delivery aids. `first-week-cheat-sheet.md` is distinct from the command
  cheat-sheet inside `microsoft-stack-translation.md` — this one is the "your first week" one-pager.

- [ ] **Step 1: `facilitator-guide.md`** — the session plan: **Session 1 (Set it up, Modules 0–3)** and
  **Session 2 (Work with it, Modules 4–7)**, each with an agenda, per-module timing (minutes), the
  hands-on checkpoints to confirm before moving on, and a "before you start" prerequisites box (accounts,
  access, VS Code installed). Plus the **stakeholder continuity briefing** (Module 9) as a short
  replayable segment, and a "what to have ready" list for the live demo.
- [ ] **Step 2: `first-week-cheat-sheet.md`** — a one-page glance card: the daily loop in five words,
  the three Azure DevOps commands, "where memory/skills live," and "when stuck, ask Claude X." Designed
  to print to one page.
- [ ] **Step 3: Done-criteria.** Run:

```bash
test -f docs/gtm/enablement/facilitator-guide.md && test -f docs/gtm/enablement/first-week-cheat-sheet.md && echo "files OK"
grep -qiE "session 1" docs/gtm/enablement/facilitator-guide.md && grep -qiE "session 2" docs/gtm/enablement/facilitator-guide.md && echo "both sessions present"
grep -qi "min" docs/gtm/enablement/facilitator-guide.md && echo "timing present"
# Confidentiality scan — expect PASS.
```
Expected: `files OK`, `both sessions present`, `timing present`, PASS.

- [ ] **Step 4: Commit.**

```bash
git add docs/gtm/enablement/facilitator-guide.md docs/gtm/enablement/first-week-cheat-sheet.md
git commit -m "docs(enablement): facilitator guide + first-week cheat sheet"
```

---

## Phase 4 — The deck (real TDD)

### Task 8: Deck build tooling (`build_deck.py` + tests)

Build the markdown→pptx converter first, tested against a tiny fixture, before authoring the real deck.

**Files:**
- Create: `docs/gtm/enablement/deck/requirements.txt`
- Create: `docs/gtm/enablement/deck/build_deck.py`
- Create: `docs/gtm/enablement/deck/test_build_deck.py`

**Interfaces:**
- Produces: `parse_deck(md: str) -> list[Slide]` and `build(md_path, out_path, logo_path) -> None`.
  `Slide` is a dataclass with fields `title: str`, `layout: str` (`"title"|"section"|"content"`),
  `bullets: list[str]`, `notes: str`. The **deck.md format** (consumed by Task 9): slides separated by a
  line containing only `---`; `# Title` sets the title; an optional `@layout: title|section|content`
  line (default `content`); `-`/`*` lines are bullets; everything after an `@notes:` line is speaker notes.

- [ ] **Step 1: Write `requirements.txt`.**

```
python-pptx>=1.0.2
```

- [ ] **Step 2: Install tooling.**

Run: `python -m pip install -r docs/gtm/enablement/deck/requirements.txt`
Expected: `python-pptx` and its deps install (pytest is already present, v9.0.2).

- [ ] **Step 3: Write the failing test** at `docs/gtm/enablement/deck/test_build_deck.py`:

```python
from pathlib import Path

from pptx import Presentation

from build_deck import parse_deck, build

HERE = Path(__file__).resolve().parent
LOGO = HERE / "assets" / "harbormill-logo.png"

SAMPLE = """\
# Directing Claude
@layout: title
- A training deck
@notes:
Welcome the room. State the one idea.
---
# Session 1
@layout: section
---
# Get the tools
- Install Claude Code
- Sign in
@notes:
Walk them through sign-in slowly.
"""


def test_parse_deck_splits_and_reads_fields():
    slides = parse_deck(SAMPLE)
    assert len(slides) == 3
    assert slides[0].title == "Directing Claude"
    assert slides[0].layout == "title"
    assert slides[1].layout == "section"
    assert slides[2].bullets == ["Install Claude Code", "Sign in"]
    assert "sign-in slowly" in slides[2].notes


def test_build_writes_pptx_with_expected_slide_count(tmp_path):
    md = tmp_path / "deck.md"
    md.write_text(SAMPLE, encoding="utf-8")
    out = tmp_path / "out.pptx"
    build(md, out, LOGO)
    assert out.exists()
    prs = Presentation(str(out))
    assert len(prs.slides) == 3


def test_title_slide_has_logo_picture(tmp_path):
    md = tmp_path / "deck.md"
    md.write_text(SAMPLE, encoding="utf-8")
    out = tmp_path / "out.pptx"
    build(md, out, LOGO)
    prs = Presentation(str(out))
    # picture shape type == 13 (MSO_SHAPE_TYPE.PICTURE)
    pics = [sh for sh in prs.slides[0].shapes if sh.shape_type == 13]
    assert len(pics) >= 1


def test_notes_are_written(tmp_path):
    md = tmp_path / "deck.md"
    md.write_text(SAMPLE, encoding="utf-8")
    out = tmp_path / "out.pptx"
    build(md, out, LOGO)
    prs = Presentation(str(out))
    assert "Welcome the room" in prs.slides[0].notes_slide.notes_text_frame.text
```

- [ ] **Step 4: Run the test to verify it fails.**

Run: `cd docs/gtm/enablement/deck && python -m pytest test_build_deck.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'build_deck'` (script not written yet).

- [ ] **Step 5: Write `build_deck.py`** at `docs/gtm/enablement/deck/build_deck.py`:

```python
"""Build the 'Directing Claude' training deck from deck.md into an editable .pptx.

Usage:
    python build_deck.py                 # deck.md -> Directing-Claude.pptx (this folder)
    python build_deck.py IN OUT [LOGO]   # custom paths

deck.md format (slides separated by a line containing only '---'):

    # Slide title
    @layout: title | section | content        (optional; default content)
    - a bullet
    - another bullet
    @notes:
    Speaker notes, one or more lines, to end of slide.
"""
from __future__ import annotations

import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

HERE = Path(__file__).resolve().parent
DEFAULT_IN = HERE / "deck.md"
DEFAULT_OUT = HERE / "Directing-Claude.pptx"
DEFAULT_LOGO = HERE / "assets" / "harbormill-logo.png"

# Harbormill brand: black wordmark on a warm light plate. Light reads better projected.
INK = RGBColor(0x0A, 0x0A, 0x0A)
MUTED = RGBColor(0x55, 0x55, 0x55)
BG = RGBColor(0xF7, 0xF6, 0xF2)

EMU_W = Inches(13.333)
EMU_H = Inches(7.5)


@dataclass
class Slide:
    title: str = ""
    layout: str = "content"  # title | section | content
    bullets: list[str] = field(default_factory=list)
    notes: str = ""


def parse_deck(md: str) -> list[Slide]:
    slides: list[Slide] = []
    for block in re.split(r"(?m)^---\s*$", md):
        if not block.strip():
            continue
        slide = Slide()
        note_lines: list[str] = []
        in_notes = False
        for line in block.splitlines():
            if line.strip() == "@notes:":
                in_notes = True
                continue
            if in_notes:
                note_lines.append(line)
                continue
            layout_m = re.match(r"@layout:\s*(\w+)", line.strip())
            if layout_m:
                slide.layout = layout_m.group(1).lower()
                continue
            if line.startswith("# "):
                slide.title = line[2:].strip()
                continue
            bullet_m = re.match(r"\s*[-*]\s+(.*)", line)
            if bullet_m:
                slide.bullets.append(bullet_m.group(1).strip())
                continue
            if line.strip():
                slide.bullets.append(line.strip())
        slide.notes = "\n".join(note_lines).strip()
        slides.append(slide)
    return slides


def _fill_background(slide) -> None:
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = BG


def _add_title(slide, text: str, *, size: int, top: float, align=PP_ALIGN.LEFT,
               left: float = 0.7, width: float = 12.0) -> None:
    box = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(2.0))
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = True
    run.font.color.rgb = INK


def _add_bullets(slide, bullets: list[str], *, top: float = 2.3) -> None:
    if not bullets:
        return
    box = slide.shapes.add_textbox(Inches(0.9), Inches(top), Inches(11.5), Inches(4.5))
    tf = box.text_frame
    tf.word_wrap = True
    for i, b in enumerate(bullets):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(10)
        run = p.add_run()
        run.text = "•  " + b
        run.font.size = Pt(22)
        run.font.color.rgb = INK


def _add_logo(slide, logo_path: Path, *, kind: str) -> None:
    if not Path(logo_path).exists():
        return
    if kind == "title":
        slide.shapes.add_picture(str(logo_path), Inches(4.67), Inches(1.3), height=Inches(2.0))
    elif kind == "section":
        slide.shapes.add_picture(str(logo_path), Inches(0.6), Inches(0.5), height=Inches(0.8))
    else:  # content — small, top-right
        slide.shapes.add_picture(str(logo_path), Inches(11.6), Inches(0.4), height=Inches(0.6))


def build(md_path, out_path, logo_path=DEFAULT_LOGO) -> None:
    md = Path(md_path).read_text(encoding="utf-8")
    slides = parse_deck(md)

    prs = Presentation()
    prs.slide_width = EMU_W
    prs.slide_height = EMU_H
    blank = prs.slide_layouts[6]

    for s in slides:
        slide = prs.slides.add_slide(blank)
        _fill_background(slide)
        if s.layout == "title":
            _add_logo(slide, logo_path, kind="title")
            _add_title(slide, s.title, size=44, top=3.6, align=PP_ALIGN.CENTER, left=0.7, width=12.0)
            if s.bullets:
                _add_title(slide, s.bullets[0], size=20, top=4.9, align=PP_ALIGN.CENTER)
        elif s.layout == "section":
            _add_logo(slide, logo_path, kind="section")
            _add_title(slide, s.title, size=40, top=3.2, align=PP_ALIGN.CENTER, left=0.7, width=12.0)
        else:
            _add_logo(slide, logo_path, kind="content")
            _add_title(slide, s.title, size=32, top=0.5)
            _add_bullets(slide, s.bullets, top=2.0)
        if s.notes:
            slide.notes_slide.notes_text_frame.text = s.notes

    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    prs.save(str(out_path))


def main(argv: list[str]) -> None:
    in_path = Path(argv[1]) if len(argv) > 1 else DEFAULT_IN
    out_path = Path(argv[2]) if len(argv) > 2 else DEFAULT_OUT
    logo_path = Path(argv[3]) if len(argv) > 3 else DEFAULT_LOGO
    build(in_path, out_path, logo_path)
    print(f"Built {out_path} from {in_path}")


if __name__ == "__main__":
    main(sys.argv)
```

- [ ] **Step 6: Run the test to verify it passes.**

Run: `cd docs/gtm/enablement/deck && python -m pytest test_build_deck.py -v`
Expected: PASS (4 tests).

- [ ] **Step 7: Commit.**

```bash
git add docs/gtm/enablement/deck/requirements.txt docs/gtm/enablement/deck/build_deck.py docs/gtm/enablement/deck/test_build_deck.py
git commit -m "build(enablement): python-pptx deck builder + tests (markdown -> .pptx)"
```

---

### Task 9: Deck content (`deck.md`) + generate the `.pptx`

**Files:**
- Create: `docs/gtm/enablement/deck/deck.md`
- Create (generated): `docs/gtm/enablement/deck/Directing-Claude.pptx`

**Interfaces:**
- Consumes: the `deck.md` format and `build()` from Task 8; the content of Tasks 1–7 (the deck
  summarizes them).

- [ ] **Step 1: Author `deck.md`** — ~30 slides following the spec's outline, using the Task-8 format
  (`# Title`, `@layout:`, bullets, `@notes:` speaker notes on every content slide). Sections:
  - **Framing (6):** title (`@layout: title`) · "You're the director, Claude's the developer" · what
    you'll be able to do · the 5 pieces · the ~10-term glossary · meet Contoso Server Health Report.
  - **Session 1 — Set it up (`@layout: section` divider + ~7):** get the tools + ✅ · rulebook + ✅ ·
    memory + ✅ · recap. (Each hands-on module ≈ what/why · do it · ✅ checkpoint.)
  - **Session 2 — Work with it (`@layout: section` divider + ~9):** the daily loop · plan the disk-check
    script · safe sandbox + save to Azure DevOps + ✅ · skills = runbook recipes + ✅ · connect your
    tools / MCP + ✅ · recap.
  - **Continuity & Governance (`@layout: section` divider + ~5):** the bus-factor problem · how the
    method answers it (the concern→artifact map, mirrored from `continuity-governance.md`) · the
    deploy-from-source proof · secrets & safety · the one-slide governance summary.
  - **Wrap (3):** first-week cheat sheet · where to get help / what's next · close.
  - Every content slide has `@notes:` speaker notes written for a presenter (Damon).
- [ ] **Step 2: Build the deck.**

Run: `cd docs/gtm/enablement/deck && python build_deck.py`
Expected: `Built .../Directing-Claude.pptx from .../deck.md`.

- [ ] **Step 3: Verify the output** (Done-criteria):

```bash
cd docs/gtm/enablement/deck
python -c "from pptx import Presentation; p=Presentation('Directing-Claude.pptx'); print('slides:', len(p.slides)); assert 26 <= len(p.slides) <= 36"
python -m pytest test_build_deck.py -v   # tests still green
# Confidentiality scan on deck.md (part of the enablement tree) — expect PASS.
grep -riE 'meraki|cradlepoint|fortigate|fortianalyzer|netscaler|noc dashboard' deck.md && echo "FAIL" || echo "PASS"
grep -qi "director" deck.md && echo "spine present"
```
Expected: slide count in 26–36, tests green, PASS, `spine present`.

- [ ] **Step 4: Commit.**

```bash
git add docs/gtm/enablement/deck/deck.md docs/gtm/enablement/deck/Directing-Claude.pptx
git commit -m "docs(enablement): deck.md content + generated Directing-Claude.pptx"
```

---

## Phase 5 — Final QA & ship

### Task 10: Whole-kit verification + PR

**Files:**
- Modify (only if gaps found): any kit file

**Interfaces:**
- Consumes: the entire `docs/gtm/enablement/` tree.

- [ ] **Step 1: Cross-reference check.** Every relative link/path referenced by a kit doc resolves.

```bash
cd docs/gtm/enablement
# List markdown links and check local targets exist (manual review of any miss):
grep -rhoE '\]\(([^)]+)\)' . | sed -E 's/^\]\(//; s/\)$//' | grep -vE '^https?:' | sort -u
```
Review the list; every non-URL target must exist on disk (screenshots may be `.gitkeep` placeholders).

- [ ] **Step 2: Success-criteria walkthrough.** Confirm each spec success criterion (§ "Success
  criteria") is satisfied: (1) Modules 1–3 checkpoints reachable from `setup-guide.md` alone; (2) one
  full loop → a real Azure DevOps PR in `workflow-runbook.md`; (3) every `gh`/Actions step mapped in
  `microsoft-stack-translation.md`; (4) `.pptx` builds from `deck.md`; (5) the concern→artifact map
  stands alone in `continuity-governance.md`; (6) instantiation needs only example/value swaps.
- [ ] **Step 3: Full confidentiality sweep** across the whole tree.

```bash
grep -riE 'meraki|cradlepoint|fortigate|fortianalyzer|netscaler|noc dashboard' docs/gtm/enablement/ && echo "FAIL" || echo "PASS: no domain leak"
grep -rif scratch/deny.txt docs/gtm/enablement/ && echo "FAIL: real name" || echo "PASS: no real names"
grep -ric 'contoso' docs/gtm/enablement/ | grep -v ':0$' >/dev/null && echo "PASS: Contoso is the example"
```
Expected: all PASS.

- [ ] **Step 4: Deck tests green + repo gate unaffected.**

```bash
cd docs/gtm/enablement/deck && python -m pytest -q      # deck builder green
cd - && npm run typecheck && npm run lint               # unaffected by docs-only changes
```
Expected: pytest green; typecheck/lint unchanged (2 known react-refresh warnings OK).

- [ ] **Step 5: Push + open PR** (Damon OKs the merge-to-main prompt separately).

```bash
git push -u origin worktree-hma-improvements
az repos pr create --title "Claude Code Enablement Kit (training + deck)" \
  --description "Reusable, plain-language enablement kit + branded deck. Spec: docs/superpowers/specs/2026-07-23-claude-code-enablement-kit-design.md" \
  2>/dev/null || gh pr create --fill 2>/dev/null || echo "Open the PR via the host's git UI (remote may be GitHub, not Azure DevOps, in this base repo)."
```
Note: this base repo's remote is GitHub; on a client instantiation it is Azure DevOps. Use whichever
matches the remote. Do **not** self-merge to `main` — leave that for Damon's approval.

- [ ] **Step 6: Final commit (if Step 1–2 fixes were made).**

```bash
git add -A && git commit -m "docs(enablement): cross-reference + success-criteria QA fixes"
```

---

## Self-Review (done by plan author)

**Spec coverage:** Every spec section maps to a task — file layout → Tasks 1–9; glossary/README →
T1; fake example (incl. `sample-spec`/`sample-plan`) → T2; Modules 0–3 → T3; Modules 4–8 → T4;
translation layer (3 swaps, MCP, secrets, deployment nuance) → T5; continuity map + proof test → T6;
facilitator guide + first-week cheat sheet → T7; deck builder + branded `.pptx` → T8–T9; success
criteria + confidentiality + reusability → T10. Module 8 has a home (T4 appendix). The screenshot
guardrail is enforced (T3 generic-only + T10 sweep).

**Placeholder scan:** No "TBD/handle appropriately" placeholders. `build_deck.py`, its tests, and the
`deck.md` format are shown in full; content docs carry concrete required sections + grep-able
Done-criteria rather than ghost-written prose (the field-guide-plan precedent).

**Type consistency:** `Slide(title, layout, bullets, notes)`, `parse_deck()`, `build(md, out, logo)`
are used identically across `build_deck.py`, `test_build_deck.py`, and Task 9. Fixed example names are
constant throughout: skill **add-server-to-health-check**, script **`disk_report.py`**.
