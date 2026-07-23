# Claude Code Enablement Kit — Non-Technical Microsoft-Shop Training (Design)

- **Date:** 2026-07-23
- **Status:** Approved design (brainstorming) — pending implementation plan
- **Owner:** Damon "Dame" Williams
- **Goal in one line:** A reusable, plain-language training kit that teaches a non-technical
  Microsoft-stack IT team to set up and run Claude Code the "Harbormill way" (context spine, memory
  2nd-brain, skills, superpowers workflow, worktrees, MCP), delivered as live sessions plus a
  leave-behind kit — and doubling as Harbormill's first client-enablement case study.

## Origin & confidentiality (read first)

This kit was commissioned to train a former colleague and his team at a Microsoft-stack company to
run Claude Code correctly before they build an internal project. **That real client project is NOT
referenced anywhere in the deliverables.** It informed only our understanding of the audience
(non-developer IT/network engineers), the stack (Windows, VS Code, Azure DevOps, Azure/Entra), and
why continuity matters. All worked examples in the kit use a **fake project** (see below). No client
names, no real project details, no internal specifics appear in any artifact.

Because the materials are client-agnostic by construction, the kit *is* the reusable case study: the
next client engagement instantiates the same kit unchanged.

## Problem statement

A non-technical Microsoft-shop IT team needs to adopt Claude Code and produce software that survives
personnel changes and passes internal governance/continuity review. Two gaps:

1. **No enablement path.** There is no plain-language, zero-assumed-knowledge training that stands up
   the full Harbormill Claude environment (context, memory, skills, superpowers loop, worktrees, MCP)
   and teaches the daily workflow.
2. **Platform mismatch.** The Harbormill base template assumes GitHub (`gh`), Google Workspace, and
   Supabase/Vercel/GCP. A Microsoft shop uses Azure DevOps, VS Code, Windows/PowerShell, and
   Azure/Entra. The methodology is platform-agnostic; only a thin translation layer differs, and it
   has never been written down.

## Audience & delivery (decided)

- **Delivery:** Hybrid — Harbormill delivers 1–2 live, deck-driven sessions with a live demo; the
  team keeps a hands-on runbook + reference docs to execute and reuse.
- **Audience:** A **developer core** (the primary owner + a named backup owner) gets deep hands-on;
  a shorter **continuity/governance module** frames how the methodology answers standard IT
  governance/continuity concerns, suitable to replay for security & leadership stakeholders.
- **Reading level:** Treat the audience as **non-technical**. Zero assumed knowledge. This is a
  hard design constraint on every artifact (see Design Principles).

## Design principles (apply to every artifact)

1. **Director / developer framing (the spine).** "You are the director. Claude is the developer. You
   don't write code — you tell Claude what you want, check what it did, and keep the notes." This is
   why a non-developer team can ship real software, and why a non-developer backup owner can maintain
   it.
2. **Plain language, zero jargon.** No term used without a one-line definition and a Windows-admin
   analogy. A glossary leads the kit.
3. **Granular, checkpointed steps.** Every step is "click *here*, type *this*, press Enter," with a
   screenshot and a "✅ you should now see…" checkpoint. Plain-terms troubleshooting boxes ("if you
   see a red message, do X").
4. **Fake worked example throughout.** Every capability is taught against one small, obviously-fake
   project (below), never the real client project.
5. **Reassure by subtraction.** Lead with what does *not* change (the whole method, VS Code, Windows,
   PowerShell) before the three things that do.

## The fake worked example

**"Contoso Server Health Report."** A tiny internal tool that checks a list of Windows servers for
low disk space and produces a simple daily report, with its source in Azure DevOps.

- *Contoso* is Microsoft's canonical demo-company name — it instantly reads as "just an example."
- Deliberately small (a non-developer can follow it end to end) yet the same *shape* as real internal
  IT work: a Python collector → a simple report, on Windows, in Azure DevOps, with a runbook. Every
  skill taught against it transfers to real work.
- No network-vendor specifics, no real names, no client domain details.

## Non-goals (YAGNI)

- **Not** shipping the Harbormill AIOS product deck (`src/`) to the client. We teach the *methodology
  and environment*, not the product.
- **Not** referencing, embedding, or paraphrasing the real client project anywhere.
- **Not** teaching Azure PaaS deployment (App Service, etc.). A Microsoft shop's Claude footprint is
  Azure DevOps + Entra + Windows; Azure Key Vault / Azure Monitor get a one-line "optional future"
  mention only.
- **Not** a from-scratch rewrite of the superpowers/skills docs — the kit *teaches and translates*
  them for a non-technical Microsoft audience; it links to canonical sources where useful.
- **Not** deep autoresearch/wiki live instruction — Module 8 is optional/advanced self-serve.
- **Not** a hosted LMS or video course — markdown docs + an editable `.pptx` + a facilitator guide.

## Design overview & file layout

One reusable kit, fake example baked in, living in `docs/gtm/enablement/`:

```
docs/gtm/enablement/
  README.md                         ← what the kit is + how to instantiate it for a new client
  00-glossary.md                    ← ~10 core terms, one plain line + Windows-admin analogy each
  setup-guide.md                    ← stand up the environment on Windows (Modules 1–3 reference)
  workflow-runbook.md               ← the daily loop / "process" (Modules 4–7 reference),
                                       plus an optional appendix for Module 8 (wiki/autoresearch, self-serve)
  microsoft-stack-translation.md    ← the three swaps + the command cheat-sheet + MCP mapping
  continuity-governance.md          ← the concern→artifact map (Module 9 + stakeholder briefing)
  facilitator-guide.md              ← session agendas, timing, hands-on checkpoints
  first-week-cheat-sheet.md         ← one-page "your first week" (distinct from the command cheat-sheet
                                       that lives inside microsoft-stack-translation.md)
  deck/
    deck.md                         ← slide source + speaker notes (version-controlled source of truth)
    build_deck.py                   ← python-pptx build script → editable .pptx
    Directing-Claude.pptx           ← generated, Harbormill-branded, editable output
    assets/harbormill-logo.png      ← Harbormill brand logo (owner-provided) for title/section slides
  examples/contoso-server-health/   ← the fake worked example's seed artifacts
    CLAUDE.md, PROJECT_CONTEXT.md    ← starter context spine for the example
    memory-seed/                     ← sample MEMORY.md + a couple of typed memories
    sample-spec.md, sample-plan.md   ← finished reference spec + plan for the disk-check script (Module 4)
    sample-skill/                    ← one example skill (e.g. "add a server to the health check")
```

The kit mirrors Harbormill's own "one template, instantiated per client" philosophy — a deliberate
bit of dogfooding to point to on the call.

## Curriculum (10 modules, capstone-threaded delivery, capability-organized reference)

Delivery follows the fake-project build arc (engaging, de-risks real work); the leave-behind docs are
organized capability-by-capability (reusable manual). Author once, get both.

| # | Module (plain title) | What it really is | Ends with (Contoso step) |
|---|---|---|---|
| 0 | "What you're about to do" | Orientation + director/developer framing + a ~10-term glossary | Team can name the 5 pieces |
| 1 | "Get the tools on your machine" | Claude Code + Enterprise sign-in + VS Code extension + "what's a terminal" | Say hello to Claude, get a reply |
| 2 | "Give Claude its rulebook" | `CLAUDE.md` + `PROJECT_CONTEXT` | Ask "what are we building?" — right answer |
| 3 | "Give Claude a memory" | The 2nd-brain memory folder | Fresh chat recalls a saved decision |
| 4 | "How you'll work every day" | Superpowers loop: talk → plan → build → check → save | A written plan for the disk-check script |
| 5 | "A safe sandbox + saving to Azure DevOps" | Worktrees + commit/PR in plain terms | Your work appears as a PR in Azure DevOps |
| 6 | "Teach Claude repeatable jobs" | Skills = saved runbook recipes | Run a real skill (e.g. pre-release checklist) |
| 7 | "Connect Claude to your tools" | MCP + the Azure DevOps MCP server | Ask "what work items are mine?" — it reads them |
| 8 | "A runbook that maintains itself" *(optional/advanced)* | Wiki + autoresearch = the living runbook | The runbook gets its first pages |
| 9 | "Making it survive you" | Continuity & governance (stakeholder-facing) | Each governance concern mapped to its artifact |

**Live-session grouping** (the leave-behind docs cover every module — Module 8 as an optional
appendix inside `workflow-runbook.md`):
- **Session 1 — "Set it up" (Modules 0–3):** orientation, install, rulebook, memory. They leave with
  a working, project-aware Claude.
- **Session 2 — "Work with it" (Modules 4–7):** the daily loop, Azure DevOps, skills, MCP — done
  live against the Contoso example.
- **Module 9 — "Make it survive you":** a shorter briefing, replayable for security/leadership.
  Module 8 is optional self-serve.

## Microsoft/Azure translation layer

**Stays identical (lead with this):** the whole director/developer workflow, all skills & memory,
worktrees, the context spine, settings/hooks, specs/plans, VS Code, Windows, PowerShell. (The
Harbormill base template already runs on Windows 11 + PowerShell today, so the platform is proven.)

**The three swaps:**

| Harbormill (this repo) | Microsoft shop | Command swap |
|---|---|---|
| GitHub + `gh` CLI | Azure Repos | `gh pr create` → `az repos pr create` · `gh pr list` → `az repos pr list` · or click **Create Pull Request** in VS Code's Azure Repos panel |
| GitHub Issues | Azure Boards | `az boards work-item …` (and Claude reads them via MCP) |
| GitHub Actions | Azure Pipelines | `.github/workflows/*.yml` → `azure-pipelines.yml` (runs secret-scan + `pip audit` + tests) |

Claude Code's default commit/PR trailers (the `Co-Authored-By` line, the PR-body footer) carry over
unchanged — only the command wrapper differs.

**Deployment nuance:** a Microsoft shop's Claude footprint is mainly **Azure DevOps + Entra ID**; the
built software typically ships to on-prem/managed **Windows Server via PowerShell scripts**, not Azure
PaaS. The kit teaches "deploy from source using the runbook," not "deploy to Azure App Service."

**MCP servers, mapped:**
- **Azure DevOps MCP** → Claude sees work items, repos, PRs, wiki (the analog to Harbormill's
  Supabase/Google MCPs).
- **PostgreSQL MCP** → Claude queries a project's own Postgres, the way Harbormill uses the Supabase
  MCP (used only if the client project has a DB).
- **context7 MCP** → carries over unchanged; great for framework docs.
- *(Google Workspace MCPs → not relevant; the M365/Graph analog exists but is out of scope.)*

**Secrets, the Windows way:** teach `.gitignore` + a **pre-commit secret-scan hook**; a `CLAUDE.md`
rule to never write keys to tracked files; point CI secrets at **Azure DevOps variable groups /
secure files**; runtime secrets stay Windows-native (DPAPI / Credential Manager).

**Fill-in-on-the-day flag (not a blocker):** exactly how an Enterprise Claude account provisions
Claude Code (login/SSO vs. an Anthropic Console key) varies by org. The Setup Guide carries a short
"confirm with your Claude admin" step rather than guessing.

## The deck

*"Directing Claude: Building Software You Don't Have to Babysit."* Harbormill-branded (the
owner-provided logo at `deck/assets/harbormill-logo.png` on the title slide and section dividers),
~30 plain-language slides, heavy on screenshots and ✅ checkpoints. Markdown source + speaker notes →
`python-pptx` build → editable `.pptx`. Present the `.pptx`; edit the markdown.

Slide-count note: each hands-on module typically expands to two or three slides — a plain "what/why,"
a "do it" walkthrough, and a "✅ checkpoint" — which is why a section's slide count exceeds its topic
bullets below. Counts are approximate; `deck.md` is the authoritative slide-by-slide source.

- **Framing (6):** title · "You're the director, Claude's the developer" · what you'll be able to do
  · the 5 pieces (rulebook, memory, skills, safe sandbox, tool connections) · ~10-term glossary · meet
  Contoso Server Health Report
- **Session 1 — Set it up (7):** get the tools ✅ · rulebook ✅ · memory ✅ · recap
- **Session 2 — Work with it (9):** the daily loop · plan the disk-check script · safe sandbox + save
  to Azure DevOps ✅ · skills = runbook recipes ✅ · connect your tools / MCP ✅ · recap
- **Continuity & Governance (5):** the bus-factor problem · how the method answers it · the
  "deploy from source to a clean box, no help" proof · secrets & safety · the one-slide governance
  summary for leadership
- **Wrap (3):** first-week cheat sheet · where to get help / what's next · close

## Continuity & governance module — concern→artifact map

The part that makes a non-developer team's work *survivable* — the core pitch.

| Governance concern | The artifact that answers it |
|---|---|
| No single-operator dependency (bus factor) | Memory (2nd brain) + wiki runbook + specs — knowledge lives in the repo, not a head |
| A backup owner can actually run it | The method is followable by a non-dev; the backup owner uses the same skills/runbook |
| The runbook is real and current | The wiki + skills *are* the runbook, updated as part of the daily loop |
| Deploy from source to a clean machine, unaided | Everything in Azure DevOps; skills/PowerShell define setup; the deploy-from-source test |
| Decisions are on the record | Specs + plans + PR descriptions |
| Secrets are safe | `.gitignore` + pre-commit secret scan + read-only keys + a `CLAUDE.md` rule |

## Success criteria

1. A non-technical reader can, using the Setup Guide alone, install Claude Code, sign in, open VS
   Code, and get a project-aware reply — reaching every ✅ checkpoint in Modules 1–3 without help.
2. The Workflow Runbook takes the same reader through one full talk→plan→build→check→save loop on the
   Contoso example, ending in a real Azure DevOps PR.
3. The Microsoft-Stack Translation doc lets a reader map every GitHub/`gh`/Actions step to its Azure
   DevOps equivalent from the cheat-sheet alone.
4. The deck builds to an editable, Harbormill-branded `.pptx` from `deck.md` via `build_deck.py`.
5. The continuity module's concern→artifact map is complete and stands alone as a leadership briefing.
6. **Reusability:** instantiating for a new client requires only swapping the fake example and
   client-agnostic values — no rewrite of the method content. No real client project detail appears
   anywhere in the kit.

## Open questions / to confirm during implementation

- Exact Enterprise → Claude Code provisioning flow (confirm with the client's Claude admin on the day).
- Whether the client wants live screenshots captured on their own machines during Session 1 or
  pre-baked into the kit (default: pre-baked generic screenshots). **Guardrail:** any screenshot
  captured on a client machine lives only in that client's private copy of the kit and never enters
  the reusable `docs/gtm/enablement/` kit — this protects Success Criterion 6 and the confidentiality
  constraint.
- Which single example skill to ship in `examples/contoso-server-health/sample-skill/` (default:
  "add a server to the health check" — smallest complete skill that shows the pattern).
