# Claude Code Enablement Kit

A plain-language kit for training a **non-technical Microsoft-stack IT team** to set up and run
Claude Code the Harbormill way. Delivery is hybrid: Harbormill runs 1–2 live, hands-on sessions, and
the team keeps every document in this kit afterward as a leave-behind reference — so the workflow
keeps working once the facilitator leaves the room.

No prior coding experience is assumed anywhere in this kit. Every term is defined the first time
it's used (see [`00-glossary.md`](00-glossary.md)), and every hands-on step spells out exactly what
to click and type.

## The one idea

Everything in this kit is one long unpacking of a single sentence:

> "You are the director. Claude is the developer. You don't write code — you tell Claude what you
> want, check what it did, and keep the notes."

That's the whole job. You never need to read or write code yourself. You describe the outcome you
want, in plain English; Claude does the typing; you check the result and decide whether to keep it.

## How to use this kit

Read in this order:

1. [`00-glossary.md`](00-glossary.md) — the ~10 terms every other document assumes you already know.
   Read this first, even if you skim the rest.
2. `setup-guide.md` (**Session 1**) — install and configure Claude Code, live, on your own machine.
3. `workflow-runbook.md` (**Session 2**) — the daily loop: talk, plan, build, check, save.
4. `continuity-governance.md` — a shorter briefing for stakeholders and leadership: how this method
   survives a team member leaving.
5. `microsoft-stack-translation.md` — the Microsoft-stack reference: the command cheat-sheet
   `setup-guide.md` and `workflow-runbook.md` lean on to translate every step into familiar terms.

Facilitators running the live sessions also read `facilitator-guide.md` (session agendas, timing,
what to check for), rehearse with `rehearsal-walkthrough.md` (run the kit on yourself before you
deliver), and keep `facilitator-run-sheet.md` (a one-page glance card) beside them. Everyone — not
just facilitators — keeps `first-week-cheat-sheet.md`: the one page you'll actually reach for during
your first week of real use.

**Only have one hour?** There's a compressed, demo-driven single-session variant:
`one-hour-edition-run-sheet.md` (the ~52-min running order) plus `prework-sheet.md` (the 15 minutes of
setup attendees do beforehand). The two-session version above stays the thorough, fully-hands-on option.

## The 5 pieces

Claude Code, set up the Harbormill way, is five pieces working together:

- **Rulebook** (`CLAUDE.md`) — the standing rules Claude reads before doing anything: what the
  project is, what stack it's built on, what it must never do.
- **Memory (2nd brain)** — notes Claude keeps between conversations, so it remembers decisions and
  people without being reminded every time.
- **Skills** — saved, reusable instructions for a job you'll want done the same way every time.
- **Safe sandbox** (branch / worktree) — a separate copy of the project to try changes in, without
  touching the version everyone else relies on.
- **Tool connections** (MCP) — wired-up access to your real tools (like a work-item tracker), so
  Claude can read and act on them directly instead of you copy-pasting between windows.

Each piece gets its own hands-on module in `setup-guide.md` and `workflow-runbook.md`.

## How to instantiate this kit for a new client

This kit is written to be reused, not rebuilt, per client:

1. Copy the whole `docs/gtm/enablement/` folder into the new client engagement.
2. Swap only the fake example's values (project name, servers, sample data) for values that fit the
   new client's context.
3. Keep all method content — the glossary, the modules, the runbook, the governance mapping — as
   written. It does not change per client.
4. Never add a real client's specifics to this reusable copy. If a session captures a client's own
   screenshots, those live only in that client's private copy of the kit — they never enter this
   reusable one.

Instantiating this kit is a **swap**, not a rewrite.

## What's a fake example?

Every hands-on step in this kit is taught against one small, deliberately fake project so that no
real client work ever appears in the material — see
[`examples/contoso-server-health/`](examples/contoso-server-health/).
