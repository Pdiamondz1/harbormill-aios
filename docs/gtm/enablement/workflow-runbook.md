# Workflow Runbook — Session 2: Work with It (Modules 4–7)

This is the hands-on reference for your second live session. Session 1 (`setup-guide.md`) left you
with a project-aware Claude Code — a working rulebook (`CLAUDE.md`) and memory. This session covers
the other three of the [5 pieces](README.md) from Module 0 — safe sandbox, skills, tool connections —
strung together with the daily loop that ties all five into one repeatable way of working.

Same rule as Session 1: no prior coding experience is assumed, and every worked example below still
uses the fake **Contoso Server Health Report** — see
[`examples/contoso-server-health/`](examples/contoso-server-health/). By the end of this session
you'll have written a plan, saved real work as a pull request in Azure DevOps, run a saved skill, and
had Claude read your actual work items over a live tool connection.

If a term below feels unfamiliar, check [`00-glossary.md`](00-glossary.md) — it covers terminal,
repo, commit, PR, branch/worktree, skill, and MCP, all of which come up in this session.

Keep the spine from Module 0 in mind — everything below is that one sentence, applied one more time
each day:

> You are the director. Claude is the developer. You don't write code — you tell Claude what you
> want, check what it did, and keep the notes.

**Estimated time:** ~60–75 minutes.

---

## Module 4 — How you'll work every day

**What / why.** This is the loop you'll repeat for every piece of work, big or small, from here on:

> **talk it out → get a plan → let Claude build it → check it → save it.**

- **Talk it out** — describe what you want in plain English, the way you'd explain it to a new
  hire. Claude may ask a few clarifying questions; answering them is not a detour, it's how the job
  gets scoped correctly before anyone writes anything.
- **Get a plan** — ask Claude to write down *what it's going to do*, in plain language, before it
  writes a single line of code. This is the thing you actually read and approve.
- **Let Claude build it** — only once you're happy with the plan, tell Claude to go ahead.
- **Check it** — read what Claude says it did, and see the result for yourself (open the file, run
  the report). You're checking the outcome, not the code.
- **Save it** — covered in full in Module 5.

### Do it

Work through this against the Contoso example's v1 disk-check script:

1. **Talk it out.** In your Claude Code terminal, describe the job in plain English — no code, no
   plan yet:

   ```text
   I want a script that reads a list of servers, checks each one's free disk space, and writes
   a simple report I can open and read. Flag anything low on space.
   ```

2. **Ask for a plan before any code.** Say, explicitly: *"Write a plan for this — don't write the
   code yet."* Claude should come back with a goal, the files it intends to create, the steps it
   will take, and how it (and you) will know the result is correct.

   ![screenshot: Claude presenting a written plan, with no code yet, for review](screenshots/vscode-plan-before-code.png)

3. **Read the plan, and compare it to the finished reference.** Open
   [`examples/contoso-server-health/sample-plan.md`](examples/contoso-server-health/sample-plan.md)
   side by side. Yours won't read word-for-word the same, but it should have the same shape: a goal,
   a short list of steps, and a "how we'll know it worked" section (this repo calls that last part
   **Done-criteria** — you'll see the term again later in this kit; it just means "the exact check
   that proves it worked," which Claude runs and reports back in plain English).

   ![screenshot: the Contoso example's sample-plan.md open next to a freshly drafted plan](screenshots/contoso-sample-plan-open.png)

4. **Only once you're happy with the plan, tell Claude to build it.** *"That plan looks right — go
   ahead and build it."*

5. **Check what it built.** Ask Claude to run the script and show you the result (in the Contoso
   example this is `disk_report.py` writing `report.html`). Open the result yourself rather than
   taking Claude's word for it — that's the "check what it did" half of the spine.

**✅ Checkpoint:** you have a written plan for the disk-check script sitting in front of you, written
*before* any code — the same shape as the finished reference answer at
[`examples/contoso-server-health/sample-plan.md`](examples/contoso-server-health/sample-plan.md).

### Troubleshooting

- **Claude jumps straight to writing code.** Stop it and say plainly: *"Don't write code yet — write
  the plan first, in plain language."* This is the single most important habit in this whole module.
- **The plan itself reads like code.** Ask Claude to rewrite it "in plain English, for someone who
  doesn't read code" — a good plan is readable by anyone on the team, not just a developer.
- **Something in the plan doesn't make sense to you.** Ask Claude to explain that part in plainer
  terms before you approve it. Not understanding a plan is a sign to ask, never a sign to just say
  "go ahead" anyway.

---

## Module 5 — A safe sandbox + saving to Azure DevOps

**What / why.** Two new ideas, both simple once named:

- **Worktree (safe sandbox)** — a sandbox copy of the project so you never break the real thing:
  a separate, complete copy of the project's folder, checked out on its own branch, so you can try
  something without ever touching the copy everyone else relies on. Nothing you do in a sandbox can
  break the real thing until you deliberately share it for review.
- **Commit and pull request (PR)** — **saving = commit** (a labeled snapshot of the files at one
  moment, with a short note about what changed); **sharing for review = pull request** (holding that
  change up for someone to look at before it becomes part of the real project — like a
  change-request ticket that nothing goes live without).

### Do it

1. **Ask Claude, in plain English, to set up a sandbox for this piece of work.** For example:
   *"Set up a safe sandbox copy of the project for the disk-check script."* Claude creates the
   worktree and its branch for you — you don't need to type any `git worktree` commands yourself
   unless you want to.

   ![screenshot: a new worktree/sandbox folder confirmed and ready in the terminal](screenshots/vscode-worktree-created.png)

2. **Confirm `disk_report.py` is built inside that sandbox**, matching the plan from Module 4 (ask
   Claude to build it now if you did Module 4 as a dry run only).

3. **Save it.** Say: *"Save this."* Claude commits the file with a short, clear message describing
   what changed and why — the labeled snapshot you can always come back to.

   ![screenshot: a completed git commit for disk_report.py shown in the terminal](screenshots/terminal-git-commit.png)

4. **Share it for review.** Ask Claude to open a pull request. In an Azure DevOps shop, this runs:

   ```bash
   az repos pr create --title "Add disk_report.py v1" \
     --description "Reads servers.txt, checks free disk space, writes report.html." \
     --source-branch <branch> --target-branch main
   ```

   `<branch>` is whatever branch your sandbox is on — ask Claude *"what branch am I on?"* if you're
   not sure; it will also happily run this command for you rather than you typing it by hand.

   **Or, the click-path:** in VS Code's Source Control / Azure Repos panel, click **Create Pull
   Request** — same result, no terminal required.

   ![screenshot: the "Create Pull Request" button in VS Code's Azure Repos panel](screenshots/vscode-create-pull-request-button.png)

5. **Confirm it landed.** Run `az repos pr list` (or ask Claude to) to see your new PR in the list.

   ![screenshot: az repos pr list showing the newly opened pull request](screenshots/azure-devops-pr-list.png)

**✅ Checkpoint:** your work appears as a PR in Azure DevOps — you (or a reviewer) can open it, read
the change, and approve it before it becomes part of the real project. The full command cheat-sheet
for Azure Repos lives in `microsoft-stack-translation.md`.

### Troubleshooting

- **`az` isn't recognized as a command.** The Azure CLI isn't installed on this machine yet — that's
  a one-time IT setup step, not something to work around yourself; ask your facilitator or IT admin.
- **The PR command fails with a sign-in or permission error.** You (or Claude, acting on your
  behalf) need to be signed in to the right Azure DevOps organization first — `az login` once per
  machine, or ask your facilitator to confirm this was done during setup.
- **The PR shows no changes, or the wrong ones.** Confirm the commit from step 3 actually happened
  *inside* the sandbox branch, and that it was pushed before opening the PR — ask Claude to check
  both for you in plain English: *"did we commit and push before opening this PR?"*
- **You don't know what to name the branch.** You don't have to decide — ask Claude to pick a short,
  sensible branch name for the work when it sets up the sandbox in step 1.

---

## Module 6 — Teach Claude repeatable jobs

**What / why.** A **skill** is a saved, reusable set of instructions for a job you'll ask Claude to
do again and again, written down once so it's done the same way every time — whether the primary
owner or a backup runs it. Think of it as a documented runbook recipe, or a saved script, except
Claude reads and follows it instead of you.

The Contoso example already has one saved:
[`examples/contoso-server-health/sample-skill/SKILL.md`](examples/contoso-server-health/sample-skill/SKILL.md)
— **add-server-to-health-check** — a three-step recipe for adding one more server to the daily
disk-space check.

### Do it

1. **Skim the skill file once.** Notice it has a name and a plain description at the top, then a
   short numbered procedure — nothing more. That's the whole shape of a skill.

   ![screenshot: sample-skill/SKILL.md open in VS Code, showing the numbered procedure](screenshots/contoso-skill-file-open.png)

2. **Ask Claude to do the job, in plain English.** You don't need to know or type the skill's name —
   describing the job is enough for Claude to recognize it matches a saved skill:

   ```text
   Add SVR-CONTOSO-05 to the health check.
   ```

   If you want to be explicit instead, you can name it directly: *"Run the
   add-server-to-health-check skill for SVR-CONTOSO-05."* Either way, Claude follows the same three
   saved steps: append the server, run `disk_report.py`, confirm the new row.

   ![screenshot: Claude running through the skill's three steps in the terminal](screenshots/claude-running-skill-steps.png)

3. **Confirm it yourself.** Open `report.html` and check the new server's row is there, with a
   free-GB number and an `OK`/`LOW` status — same as the skill file's own final step tells Claude to
   check.

**✅ Checkpoint:** the skill runs its steps — you asked for the job in plain English, and Claude
carried out the same three saved steps, in the same order, every time, without you re-explaining any
of them.

### Troubleshooting

- **Claude does the job a different way than the skill describes.** Ask directly: *"Did you use the
  add-server-to-health-check skill for that?"* If not, tell it to redo the job following that skill
  exactly.
- **Claude says it doesn't see the skill.** Confirm the skill file is saved where this project keeps
  its skills — ask Claude, in plain English, *"where do you look for skills in this project?"*
- **The new row doesn't show up in `report.html`.** Per the skill's own troubleshooting note, recheck
  the new line you added for a typo, then re-run the script — it only reports what it can read.

---

## Module 7 — Connect Claude to your tools

**What / why.** **MCP (tool connection)** is a wired-up link that lets Claude read — and sometimes
act in — one of your real tools directly, instead of you copy-pasting details back and forth between
windows. For a Microsoft-stack team, the one to know is the **Azure DevOps MCP server**: once it's
connected, Claude can see your work items, repos, PRs, and wiki, the same way it already reads
your rulebook and memory.

Connecting the MCP server itself is normally a one-time setup step your facilitator or IT admin does
for the project, similar to Module 1's account sign-in — your job here is to confirm it works.

### Do it

1. **Confirm the connection is in place.** Ask your facilitator, or ask Claude directly: *"Are you
   connected to Azure DevOps?"*

   ![screenshot: the Azure DevOps MCP server listed as connected in Claude Code's settings](screenshots/mcp-azure-devops-added.png)

2. **Ask Claude, in plain English:**

   ```text
   What work items are assigned to me?
   ```

3. **Read the answer.** Claude should come back with your actual, current list of Azure Boards work
   items — pulled live from Azure DevOps, not guessed or remembered from an earlier conversation.

   ![screenshot: Claude's answer listing real Azure Boards work items assigned to the user](screenshots/claude-work-items-answer.png)

**✅ Checkpoint:** Claude reads your work items — a plain-English question came back with a real,
correct, *your-own* list from Azure Boards, without you opening Azure DevOps yourself.

### Troubleshooting

- **Claude says it has no tool for that, or can't answer.** The Azure DevOps MCP server likely isn't
  connected yet for this project — that's a one-time admin setup step, not something you configure
  yourself; ask your facilitator or IT admin.
- **The list looks like the wrong project or organization.** Ask Claude *"which Azure DevOps project
  are you connected to?"* — the connection may be pointed at the wrong one.
- **You get a permission error instead of a list.** Your Azure AD account may not have access to that
  Azure Boards project yet — ask IT to grant you access; this is the same kind of access request
  you'd make for any other work tool.

---

## Appendix — Module 8 (optional): A runbook that maintains itself

Everything above is enough to run the daily loop on your own. This last piece is optional, self-serve
reading for later — nothing in Modules 4–7 depends on it, and it isn't covered live in this session.

**What it is.** A **wiki** is a folder of structured notes Claude can read and add to, the same way
it reads memory — except a wiki is organized as a small knowledge base (topics, cross-links) rather
than one-line facts. **Autoresearch** is a loop that finds gaps in that wiki and researches them —
using the web and your own project — without you asking for each page one at a time. Together, they
turn the runbook from something you maintain by hand into one that mostly keeps itself current: new
answers get filed as new wiki pages instead of living only in a chat you'll forget you had.

**Why optional.** Most teams get everything they need from the five pieces (rulebook, memory,
skills, safe sandbox, tool connections) covered in Modules 0–7. Wiki + autoresearch is worth adopting
once those five feel routine and you want Claude's knowledge of the project to keep growing between
sessions with less manual upkeep — not something to set up on day one.

**If you want to try it.** Ask Claude, in plain English, to look for a gap in the project's knowledge
and research it, or to answer a question by first checking the wiki. There's no new syntax to learn —
it's the same "describe what you want, check what it did" pattern as everything else in this kit.

---

## What's next

You've now run the full daily loop against the Contoso example, opened a real pull request, run a
saved skill, and connected Claude to a live tool. The command cheat-sheet for every Azure DevOps swap
used above (and a few more) lives in `microsoft-stack-translation.md`. `continuity-governance.md`
covers the shorter, stakeholder-facing briefing on how this way of working survives a team member
leaving — worth reading even if you're not in a leadership role yourself. Keep
`first-week-cheat-sheet.md` nearby for your first week of real use.
