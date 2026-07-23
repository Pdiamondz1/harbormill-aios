# Directing Claude
@layout: title
- Building Software You Don't Have to Babysit
@notes:
Welcome the room. Introduce yourself and Harbormill in one line. State the one idea up front:
by the end of these two sessions, this team will be able to install, run, and maintain Claude
Code on their own — no developer background required. Everything today is taught against one
small, deliberately fake example (Contoso Server Health Report) so nothing here ever touches
their real project. Keep this slide short — it's a title card, not a talk.
---
# You're the director
- "You are the director. Claude is the developer. You don't write code — you tell Claude what you want, check what it did, and keep the notes."
@notes:
Read the sentence on the slide close to verbatim — it's the one idea everything else unpacks.
You never need to read or write code yourself. You describe the outcome you want, in plain
English; Claude does the typing; you check the result and decide whether to keep it. That's
the whole job, today and every day after. Everything in the next two sessions is one piece of
standing that up.
---
# What you'll be able to do
- Install, sign in, and talk to Claude in plain English
- Give Claude a rulebook + memory so it knows your project
- Run the daily loop: talk, plan, build, check, save
- Ship real work as a pull request in Azure DevOps
- Run a saved skill and connect Claude to your live tools
- Know how this survives you being out — or gone
@notes:
This is the destination, stated before the map. By the end of Session 2 every attendee will
have done all five of these against the Contoso example — not watched a demo, actually done it
on their own machine. The last bullet is the pitch for the Continuity & Governance section
later: this isn't just "learn a tool," it's "build something that doesn't depend on you."
---
# The 5 pieces
- Rulebook (`CLAUDE.md`) — standing rules Claude reads first
- Memory (2nd brain) — notes that survive between chats
- Skills — saved, reusable job recipes
- Safe sandbox (worktree) — a copy to try things in safely
- Tool connections (MCP) — wired-up access to your real tools
@notes:
Name all five now; don't explain each in depth yet — that's what Modules 1 through 7 are for.
The ask right now is just: can you repeat these five back in your own words? Session 1 builds
the first two (rulebook, memory). Session 2 builds the other three (sandbox, skills, tool
connections). Point out that this is also the checkpoint for Module 0 in the written kit.
---
# The ~10 terms you need
- Claude Code — talk in English, get software built
- Terminal — a plain text window you type into
- Repo — a folder whose full history is tracked
- Commit — a saved, labeled snapshot
- Pull request (PR) — changes held for review
- Branch / worktree — a safe copy to try things in
- `CLAUDE.md` — the rulebook Claude reads first
- Memory (2nd brain) — notes across conversations
- Skill — a saved, reusable job recipe
- MCP — wired-up access to a real tool
@notes:
Don't read all ten aloud word for word — that's what the printed glossary (00-glossary.md) is
for, and every attendee keeps it. Instead, reassure: every one of these has a plain-English
definition and a Windows-admin analogy in the glossary, and nothing later in this deck uses a
term without having introduced it here first. Point at the glossary page itself as the thing
they'll actually flip back to, not this slide.
---
# Meet: Contoso Server Health Report
- A tiny fake IT tool we'll build together today
- Checks a list of Windows servers for low disk space
- Writes one simple report: OK or LOW, per server
- Contoso is Microsoft's own demo-company name — not a real client
- Every hands-on step today uses this same example
@notes:
Set expectations for the whole day: everything hands-on — the plan, the script, the pull
request, the skill — is built against this one small, obviously-fake project. Nothing here is
their real work, and nothing about their real project appears anywhere in this kit. That's
deliberate: it means this same deck and kit gets reused for the next client unchanged.
---
# Session 1: Set It Up
@layout: section
@notes:
Section transition. Session 1 is Modules 0 through 3, roughly 45 to 60 minutes, most of it in
Module 1 where install and sign-in issues are most likely to eat time. By the end, every
attendee has a project-aware Claude Code with a working rulebook and memory.
---
# Get the tools on your machine
- Install Claude Code — one command in PowerShell
- Sign in with your Enterprise account
- Add the VS Code extension
- Open a terminal — just a window where you type and read replies
- Say hello to Claude, get a reply back
@notes:
~20 minutes. Confirm before the session that every attendee's Enterprise account provisioning
method (SSO vs. a console-issued key) is already known — don't guess this live, and don't try
to work around a PowerShell script-execution policy yourselves; that's an IT policy question.
The VS Code extension gives them a chat panel, a plan they can review before Claude acts, and a
side-by-side diff view — same Claude Code, just inside the editor instead of a separate window.
---
# Checkpoint: say hello
- Typed "Hello" to Claude in a terminal
- Got a plain-English reply back
- That's the whole loop working end to end
@notes:
Don't move on until every attendee has actually done this themselves, not just watched you do
it. If `claude` isn't recognized, closing and reopening the terminal once usually fixes it —
that refreshes the list of commands it knows about.
---
# Give Claude its rulebook
- `CLAUDE.md` — standing rules Claude reads first, every time
- `PROJECT_CONTEXT.md` — the fuller story underneath it
- Model both on the Contoso example, then draft your own
- Read what Claude drafts before accepting it
- Correct anything wrong, in plain English
@notes:
~15 minutes. Show the Contoso example pair first so they see the shape (short rulebook, fuller
context doc it points to) before asking Claude to draft their own. Step 3 — reading before
accepting — is the "check what it did" half of the spine, not a formality. If Claude's draft
reads generic, the fix is almost always that the new `CLAUDE.md` doesn't actually point at the
new `PROJECT_CONTEXT.md` yet.
---
# Checkpoint: what are we building?
- Ask, in a new message: "What are we building?"
- It should answer using your own `PROJECT_CONTEXT.md`
- Correctly, in its own words — not Contoso's, not generic
@notes:
This is the single clearest sign the rulebook is wired up correctly. If the answer describes
Contoso instead of their own project, the files were probably saved inside `examples/` instead
of at the project root — check that before anything else.
---
# Give Claude a memory
- Memory = notes Claude keeps between conversations
- Tell Claude one true, useful fact to remember
- Claude saves it — you never hand-edit a file
- Ask "where did you save that?" to see it
- `MEMORY.md` is the index, one line per saved fact
@notes:
~10 minutes. A good first fact to seed: who the backup owner is for this project. That does
double duty — it's a real, useful memory, and it previews the continuity story that closes out
the whole deck. Memory lives per-project on their own machine; a different project folder looks
like a different project to Claude, which is why the checkpoint insists on the same folder.
---
# Checkpoint: a fresh chat remembers
- Close the session entirely, start a brand-new chat
- Ask: "What do you remember about us?"
- Claude answers correctly, unprompted
@notes:
The word "fresh" matters here — make everyone actually close and reopen, not just scroll up in
the same conversation. That's the whole point: memory survives closing the laptop and coming
back tomorrow, not just survives within one chat.
---
# Session 1 recap
- 5 pieces, 2 down: rulebook + memory
- Claude now knows your project, and remembers
- Session 2 covers the daily loop, sandbox, skills, tools
- Keep the spine in mind: you check, you decide
@notes:
Quick recap before a break or before moving straight into Session 2. Reinforce that nothing
scary happened today — they installed a tool, told it about their project, and told it one
fact to remember. Session 2 is where it starts producing real, saved, reviewable work.
---
# Session 2: Work With It
@layout: section
@notes:
Section transition. Session 2 is Modules 4 through 7, roughly 60 to 75 minutes, with Module 5
(sandbox + PR) as the long pole — don't rush that checkpoint, it's this session's proof point.
Picks up from Session 1's project-aware Claude and ends with a real Azure DevOps PR, a skill
run, and a live tool connection.
---
# The daily loop
- Talk it out → get a plan → build it → check it → save it
- Talk it out: describe the outcome, plain English
- Get a plan: what Claude will do, before any code
- Build it: only once you've approved the plan
- Check it: open the result yourself — don't take Claude's word
@notes:
~15 minutes. This is the loop they'll repeat for every piece of work, big or small, from here
on. The single most important habit to drill in this module: if Claude jumps straight to code,
stop it and say plainly, "don't write code yet — write the plan first." Stop the room here,
before any code gets written, and move to the Contoso walkthrough on the next slide.
---
# Plan the disk-check script
- Talk it out: read servers, check free disk space, write a report
- Ask for a plan — explicitly say "don't write code yet"
- Compare it to the reference plan: goal, steps, Done-criteria
- Approve it, then let Claude build `disk_report.py`
- Check the result yourself: open `report.html`
@notes:
This is Module 4's hands-on checkpoint. "Done-criteria" is a term worth pausing on: it just
means the exact check that proves the work worked, which Claude runs and reports back in plain
English. The finished reference plan (`sample-plan.md`) is there for them to compare their own
plan against — it won't read word-for-word the same, and that's fine, it should have the same
shape: a goal, a short list of steps, and a Done-criteria section.
---
# Safe sandbox + save to Azure DevOps
- Ask Claude to set up a safe sandbox for this work
- Confirm `disk_report.py` is built inside it
- Save it — Claude commits with a clear, short message
- Share it for review — open a pull request
- `az repos pr create` — or click Create Pull Request in VS Code
@notes:
~25 minutes, the longest module today. A worktree is a separate, complete copy of the project
on its own branch — nothing done inside it can break the version everyone else relies on until
it's deliberately shared for review. They don't need to type any `git worktree` commands
themselves; asking Claude in plain English is enough. Remind them `<branch>` in the PR command
is whatever branch their sandbox is on — ask Claude "what branch am I on?" if unsure.
---
# Checkpoint: a real PR in Azure DevOps
- Your work appears as a PR in Azure DevOps
- Confirm it with `az repos pr list`
- A reviewer can read and approve it before it goes live
@notes:
This is today's proof point — don't rush past it. If the PR command fails, it's almost always
a sign-in issue (`az login` once per machine) or the commit didn't actually happen inside the
sandbox branch before opening the PR — ask Claude to check both in plain English.
---
# Skills = saved runbook recipes
- A skill: the same steps, done the same way, every time
- Example: `add-server-to-health-check`
- Ask in plain English: "Add SVR-CONTOSO-05 to the health check"
- Claude follows the same 3 saved steps, in order
- Same result whether the primary or backup owner runs it
@notes:
~15 minutes. Show the skill file itself first — name, plain description, a short numbered
procedure, nothing more. The point to land here: they don't need to know or type the skill's
name to trigger it; describing the job in plain English is enough for Claude to recognize a
match. This is also a quiet preview of the continuity story — a skill is a runbook recipe that
doesn't live in one person's head.
---
# Checkpoint: the skill ran its steps
- The new server's row shows up in `report.html`
- Free-GB number and OK/LOW status included
- Same 3 steps, no re-explaining required
@notes:
If the new row is missing, the fix per the skill's own troubleshooting note is to recheck the
new line for a typo and re-run — it only reports what it can actually read.
---
# Connect your tools (MCP)
- MCP: a wired-up connection to a real tool
- For this stack: the Azure DevOps MCP server
- Confirm it: "Are you connected to Azure DevOps?"
- Ask: "What work items are assigned to me?"
- Claude answers from real, live data — not a guess
@notes:
~15 minutes. Connecting the MCP server itself is normally a one-time setup step a facilitator
or IT admin does ahead of time, the same way Module 1's account sign-in is — their job here is
just to confirm it works, not to configure it live. If the answer looks like the wrong project,
ask Claude which Azure DevOps project it's connected to.
---
# Checkpoint: Claude reads your real work items
- A plain-English question
- A real, current list from Azure Boards
- You never opened Azure DevOps yourself
@notes:
This is the moment that usually lands hardest for a non-technical room: they asked a question
in plain English and got their own real, live data back, without touching the Azure DevOps UI.
---
# Session 2 recap
- All 5 pieces are now standing
- You ran the full loop: talk, plan, build, check, save
- Real output today: a PR, a skill run, a live tool connection
- Next: how this survives you being out
@notes:
Recap before moving into Continuity & Governance. Everything from here is stakeholder-facing —
if a security or leadership attendee is joining only for this part, this is a natural point for
them to join the room.
---
# Continuity & Governance
@layout: section
@notes:
~15 minutes, standalone. This section doesn't assume the audience sat through Sessions 1–2 — it
stands alone for a security or leadership reader who was never in the room. If replaying this
separately, the doc and the repo evidence behind it are enough on their own.
---
# The bus-factor problem
- Bus factor: how many people leaving stalls the work?
- If the answer is one, that person is the whole system
- The normal risk with internally-built tools, Claude or not
- The risk isn't the script — it's what only lives in one head
@notes:
~2 minutes. Land this plainly: one engineer writes a script, understands its quirks, and keeps
the rest in their head — why a step exists, what to check before changing it, how to stand it
up again from nothing. The script is fine. It's everything around it that was never written
down that a governance review correctly flags as a single point of failure.
---
# How the method answers it
- Bus factor → knowledge lives in the repo, not a head
- Backup owner → same steps work, no coding background needed
- Runbook stays current → the wiki + skills ARE the runbook
- Deploy unaided → Azure DevOps + skills/PowerShell + a proof test
- Decisions on record → specs, plans, PR descriptions
- Secrets stay safe → `.gitignore` + scan + read-only keys + a rule
@notes:
~5 minutes. Every one of these six pairings is naming something Sessions 1–2 already produced —
nothing new to build. The whole answer to bus factor in one line: move the knowledge out of a
head and into the repo, where it survives whoever wrote it. A second person reading the same
files gets the same context Claude does.
---
# The proof: deploy from source, unaided
- Deploy from source to a clean Windows box, runbook only
- No verbal help from whoever built it
- All the way through → the runbook is sufficient
- They get stuck → a gap found safely, on a test machine
- Run it whenever the runbook changes, and before any handover
@notes:
~4 minutes. A concern-to-artifact table is a claim; this is the test that backs it instead of
asking anyone to take it on faith. Hand a clean machine, the repo URL, and this kit to the
backup owner — or better, someone who was never in the room — and see how far they get with no
"just ask me if you get stuck." Getting stuck isn't a failure of the person; it's a gap in the
written runbook, fixed at that exact step, then re-tested.
---
# Secrets & safety, in one place
- Rule: secrets never live in a tracked file
- Repo: `.gitignore` + a pre-commit secret-scan hook
- `CLAUDE.md`: a rule to never write a key to tracked files
- Tool connections: read-only wherever possible
- Runtime: Windows Credential Manager / DPAPI
@notes:
~2 minutes. One rule, repeated everywhere it applies. The pre-commit hook catches a mistake
before it exists anywhere shared, not after. Read-only keys mean a leaked or misused key can't
write or delete anything, even in the worst case.
---
# The one-slide governance summary
- A documented, repeatable method — not one engineer's head
- A named backup owner can run the same method
- The runbook is current by construction — the same doc used daily
- Tested, not assumed: deployed from source on a clean machine
- Secrets stay out of tracked source, always
@notes:
~2 minutes, read close to verbatim — this is the one slide written to stand completely on its
own for a stakeholder who reads nothing else in this deck. In short: the knowledge this project
depends on is captured in artifacts that outlive any one person, and that claim has been proven
with a test, not taken on trust.
---
# Your first week cheat sheet
- The daily loop, in five words: talk, plan, build, check, save
- Three commands you'll actually type — or ask Claude to
- Where things live: your memory folder, your skills folder
- When stuck, ask Claude — five questions that unstick you
@notes:
Point at the printed one-page cheat sheet every attendee keeps — this slide is the same content,
condensed further. This is a glance card for their first week of real use, not a teaching doc;
the full story is what Sessions 1 and 2 already covered.
---
# Where to get help / what's next
- Full glossary + full command cheat-sheet: always in this kit
- Setup guide + workflow runbook: a lasting reference
- Harbormill available for the deploy-from-source test
- Next: run the loop on your own first real piece of work
@notes:
Set the expectation that this kit doesn't expire after today — every document stays with them
as a leave-behind reference. Suggest a concrete next step: pick one small, real, low-stakes
piece of work and run the full loop on it themselves within the next week, while it's fresh.
---
# Close
- You are the director. Claude is the developer.
- You checked what it did. You kept the notes.
- The knowledge lives in the repo now — not in one head.
- Questions?
@notes:
Close on the spine one more time — it's the whole kit in one sentence, and it's worth them
hearing it a third time today. Open the floor for questions, and remind them the docs and the
Contoso example stay with them after this session ends.
