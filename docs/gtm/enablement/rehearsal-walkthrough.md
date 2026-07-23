# Rehearsal Walkthrough — Run the Kit on Yourself

Before you deliver this to anyone, **run the whole thing on yourself as if you were an attendee.** It's
the single best prep: you feel every beat, hit every checkpoint, and find out exactly where a real
person will get stuck. Budget ~45–60 minutes for a full pass.

This walks the same Modules 0–7 the sessions teach (from `setup-guide.md` and `workflow-runbook.md`),
using the fake **Contoso Server Health Report** example — but *you* do the doing.

## Two ground rules

1. **Work in a fresh scratch folder outside this repo.** That gives Claude a clean project and its own
   memory namespace, and keeps you from tangling with the kit's own `CLAUDE.md`.
2. **Azure DevOps:** Modules 5 and 7 need it. For a faithful full run, set up a free org first (~15
   min — you can capture real screenshots while you're in there). For a quick first pass, do Modules
   0–4 + 6 and stop Module 5 at the commit.

Keep the **answer key** open the whole way: `examples/contoso-server-health/` — the reference
`CLAUDE.md`, `PROJECT_CONTEXT.md`, `sample-plan.md`, `sample-skill/`, and `memory-seed/`.

## Step 0 — Build your sandbox

```powershell
mkdir C:\rehearsal\contoso-noc          # anywhere outside the repo
```

*(Optional, for the full run)* free Azure DevOps org at **dev.azure.com** → new project **Contoso-NOC**
with **Repos + Boards** → add 1–2 Boards work items assigned to you (for Module 7). Then once per machine:

```powershell
az extension add --name azure-devops
az login
az devops configure --defaults organization=https://dev.azure.com/<your-org> project=Contoso-NOC
```

## Step 1 — Open a fresh Claude session in the sandbox

Open a **new terminal** (or a new VS Code window on the folder), then:

```powershell
cd C:\rehearsal\contoso-noc
claude
```

That is the same clean starting point an attendee has.

## The module walk

**Module 0 — Orient (1 min).** Center yourself: *"I'm the director, Claude's the developer."* The 5
pieces: rulebook, memory, skills, sandbox, tool connections.
✅ You can say the 5 pieces + the spine without looking.

**Module 1 — Get the tools.** In the fresh session, type `Hello`.
✅ Claude replies. *(Full sessions install Claude Code here; you already have it.)*

**Module 2 — Give Claude its rulebook.** Type:
> Create a CLAUDE.md and a PROJECT_CONTEXT.md for a project called "Contoso Server Health Report" — a
> small Python tool that runs on Windows, checks a list of servers for low disk space, and writes a
> simple daily HTML report. Source lives in Azure DevOps. Keep it plain.

Then ask: *"What are we building?"* (Compare Claude's files to the answer key's.)
✅ It answers correctly from the rulebook.

**Module 3 — Give Claude a memory.** Type:
> Remember that the backup owner for this project is Jordan, and we deploy to a Windows Server 2022 VM.

Ask *"Where did you save that?"* and open the `MEMORY.md` it points to. Then **quit and restart**
`claude` in the same folder and ask *"What do you remember about us?"*
✅ It recalls the fact, unprompted, in a brand-new session.

**Module 4 — The loop (talk → plan).** Type:
> Let's plan version 1 of the disk-check script — talk me through the approach first, then write a
> short plan. Don't write any code yet.

Compare to the reference `sample-plan.md`.
✅ You have a written plan, before any code.

**Module 5 — Sandbox + save to Azure DevOps.**

```powershell
git init; git checkout -b feature/disk-report
```

> Now build disk_report.py from the plan — read servers.txt, check free space with shutil.disk_usage,
> and write report.html.

Make a `servers.txt` with a couple of local paths (`C:\`, `C:\Windows`), run `python disk_report.py`,
open `report.html`. Then commit and open the PR:

```powershell
git add -A; git commit -m "feat: disk report v1"
az repos pr create --title "Disk report v1" --description "First cut" --source-branch feature/disk-report --target-branch main
```

✅ It shows in `az repos pr list`. *(No Azure org yet? Stop at the commit for this pass.)*

**Module 6 — Teach Claude a repeatable job (skills).** Copy the answer key's skill into your project at
`.claude\skills\add-server-to-health-check\SKILL.md`, then:
> Add server SVR-CONTOSO-05 to the health check.

✅ Claude runs the skill's three steps; a new row appears in `report.html`.

**Module 7 — Connect Claude to your tools (MCP).** Connect the Azure DevOps MCP (per
`microsoft-stack-translation.md`), then:
> What work items are assigned to me?

✅ Claude lists your real Azure Boards items. *(No org? Narrate this beat from the doc.)*

## Reset and redo

Delete the scratch folder and its matching `~/.claude/projects/<…contoso-noc…>/memory/` folder, then
start clean from Step 0.

## What to watch for as you go

- **Time yourself against the run-sheet** (`facilitator-run-sheet.md` or `one-hour-edition-run-sheet.md`).
- **Mark the sticky points** — Module 1 (install/sign-in) and Module 5 (the PR) are where real rooms
  slow down; that's where your pre-warming and patience matter.
- **Notice where you'd rephrase** for a non-technical room — every place you reach for jargon is a place
  to swap in the glossary's Windows-admin analogy instead.
