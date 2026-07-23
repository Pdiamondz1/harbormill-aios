# Facilitator Guide — Running Sessions 1–2 (+ the Module 9 Briefing)

This guide is for whoever **facilitates** the two live sessions — not the trainee. It assumes you've
already read `setup-guide.md`, `workflow-runbook.md`, and `continuity-governance.md` yourself; this
page is the session plan layered on top: the agenda, per-module timing, the checkpoint to confirm
before moving on, and what to have ready going in.

Nothing here replaces the teaching content in those three docs — this is the running order, not a
script to read aloud. When in doubt about *what* to say for a given module, go read that module's
own "What / why" and "Do it" sections; this guide only tells you *when* and *for how long*.

> **Only have one hour?** This guide is the full two-session, everyone-does-every-step workshop. For a
> single ~52-min **demo-driven** session (install moved to prework, attendees complete the hands-on
> themselves afterward), use `one-hour-edition-run-sheet.md` + `prework-sheet.md` instead.
>
> **Delivering for the first time?** Run `rehearsal-walkthrough.md` on yourself first — it walks you
> through the whole thing as if you were an attendee, so you feel every beat before you're in the room.

---

## Before you start — prerequisites box

Confirm every line below is true **before the day of the session**, not during it:

- **Accounts.** Every attendee has a Claude Code Enterprise account provisioned — or, if not, you
  know the exact provisioning method (single sign-on vs. a console-issued key) confirmed with the
  client's Claude admin ahead of time. Don't guess this live; `setup-guide.md` Module 1 calls this
  out for the same reason.
- **Access.** Every attendee has a live Azure DevOps account with access to the target project's
  Repos *and* Boards — the actual project this session's Contoso work will land in, not a
  placeholder org.
- **VS Code installed.** Every attendee already has VS Code installed on the machine they're
  bringing, with permission to install extensions (the Claude Code extension goes in during
  Module 1).
- **`az login` done.** The Azure CLI is installed and signed in once per machine — or you're
  prepared to walk one attendee through it live. Modules 5 and 7 both depend on it working.
- **Azure DevOps MCP server connected** for the target project (a one-time setup done before
  Session 2). Module 7 only confirms this connection live — it isn't set up during the session.
- **A copy of the kit.** The `docs/gtm/enablement/` folder (or the client's private copy of it) is
  reachable on every attendee's machine before the session starts.

If any of these isn't true yet, fix it before scheduling the session — none of it is recoverable
live without burning agenda time from the modules below.

---

## Session 1 — Set It Up (Modules 0–3)

Taught from `setup-guide.md`. Ends with a project-aware Claude Code — a working rulebook and memory.

| Module | Timing | Agenda | Checkpoint — confirm before moving on |
|---|---|---|---|
| 0 — What you're about to do | 10 min | Orient the room: the director/developer framing, the spine sentence, the 5-pieces overview. | Each attendee can name the 5 pieces in their own words and repeat the spine sentence back without looking. |
| 1 — Get the tools on your machine | 20 min | Install Claude Code, sign in with the Enterprise account, install the VS Code extension, open a terminal. | Each attendee typed "Hello" to Claude in a terminal and got a reply back. |
| 2 — Give Claude its rulebook | 15 min | Model `CLAUDE.md` + `PROJECT_CONTEXT.md` on the Contoso example, then have Claude draft each attendee's own pair. | Ask Claude "What are we building?" — it answers correctly from the attendee's own `PROJECT_CONTEXT.md`, not Contoso's. |
| 3 — Give Claude a memory | 10 min | Tell Claude one true, useful fact to remember; find where it saved it. | Start a brand-new chat and ask "What do you remember about us?" — Claude recalls the saved fact, unprompted. |

**Total: ~55 min.** `setup-guide.md` estimates ~45–60 minutes for this session — the slack is mostly
for Module 1, where install and sign-in issues are most likely to eat time.

---

## Session 2 — Work With It (Modules 4–7)

Taught from `workflow-runbook.md`. Picks up from Session 1's project-aware Claude and ends with a
real Azure DevOps PR, a skill run, and a live tool connection.

| Module | Timing | Agenda | Checkpoint — confirm before moving on |
|---|---|---|---|
| 4 — How you'll work every day | 15 min | Walk the daily loop — talk it out, get a plan, let Claude build it, check it, save it — against the Contoso disk-check script. Stop at "get a plan," no code yet. | Each attendee has a written plan for the disk-check script, same shape as the reference `sample-plan.md`, written *before* any code. |
| 5 — A safe sandbox + saving to Azure DevOps | 25 min | Set up a worktree, build the script inside it, commit, then open a real PR (`az repos pr create` or the VS Code click-path). | Each attendee's work appears as a real PR in Azure DevOps — confirm with `az repos pr list`. |
| 6 — Teach Claude repeatable jobs | 15 min | Walk the `add-server-to-health-check` sample skill; have Claude run it from a plain-English request. | The skill runs its three saved steps in order, and the new server's row shows up in `report.html`. |
| 7 — Connect Claude to your tools | 15 min | Confirm the Azure DevOps MCP server connection; ask Claude "What work items are assigned to me?" | Claude answers with the attendee's real, live Azure Boards work items — not a guess, not a memory. |

**Total: ~70 min.** `workflow-runbook.md` estimates ~60–75 minutes — Module 5 is the long pole; don't
rush the PR checkpoint, it's this session's proof point.

---

## Module 9 — Stakeholder Continuity Briefing (replayable segment)

**~15 min, standalone.** Content lives in `continuity-governance.md`. Unlike Modules 0–8, this
segment does not assume the audience sat through Sessions 1–2 — it's written to be replayed on its
own for a security or leadership stakeholder who was never in the room. Run it either way:

- **Tacked onto the end of Session 2**, if the same audience includes a decision-maker who wants the
  governance case made explicit before signing off.
- **As its own short, separate meeting**, for whoever owns the continuity/security sign-off — the
  doc and the repo evidence behind it are enough; you don't need to have run Sessions 1–2 in front of
  that person first.

Inside the 15 minutes: the bus-factor problem (2 min) → the concern→artifact map (5 min) → the
"deploy from source, unaided" proof test (4 min) → secrets & safety (2 min) → the one-paragraph
governance summary, read close to verbatim (2 min). There's no hands-on checkpoint here — it's a
briefing, not a hands-on module. The actual proof is the deploy-from-source test itself, run
separately, as described in `continuity-governance.md`.

---

## What to have ready for the live demo

Beyond the prerequisites box above (each attendee's own machine), the facilitator's own setup:

- The Contoso example (`examples/contoso-server-health/`) already reachable on the machine you're
  screen-sharing from — don't clone it live.
- A terminal and VS Code already open, side by side, before attendees arrive.
- `setup-guide.md` and `workflow-runbook.md` open in tabs for quick reference mid-session.
- The target Azure DevOps project's Repos and Boards already created and reachable — `az repos pr
  create` needs somewhere to land, and Module 7 needs real work items for Claude to read.
- `az login` already confirmed working from the demo machine, ahead of time.
- The pre-baked images in `screenshots/` open or printed as a fallback, in case the live
  install/sign-in step misbehaves on the projector.
- A clock or timer visible to you — the agenda above is tight enough that Module 1 or Module 5
  running long will eat into the checkpoint at the end of the session.

---

## What's next

Session 1 and Session 2 are taught from `setup-guide.md` and `workflow-runbook.md`; the Module 9
briefing is `continuity-governance.md`. Once the sessions are over, keep `first-week-cheat-sheet.md`
printed or open for every attendee — it's the one page they'll actually reach for during their first
week of real use.
