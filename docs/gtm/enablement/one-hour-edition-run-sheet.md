# One-Hour Edition — Run-Sheet (single ~52-min session)

For when you have **one hour, not two half-days**. This is a **demo-driven overview**, not the full
hands-on workshop: you drive the whole flow once on the shared screen against the Contoso example,
attendees watch and lightly follow the low-risk parts, and they do the real hands-on themselves
afterward with the kit.

**The tradeoff, stated plainly:** an hour buys *understanding + a working setup*, not *reps*. Everyone
leaves able to follow the loop and with Claude Code running; they get their own hands dirty later using
`setup-guide.md` / `workflow-runbook.md` and the `first-week-cheat-sheet.md`. If you need every
attendee to actually build and open a PR *in the room*, use the two-session version
(`facilitator-guide.md`) — install and live PRs are the long poles that don't fit an hour.

**Two things make the hour work:**
1. **Install moves to prework.** Attendees do Module 1 before the session — see `prework-sheet.md`.
   They arrive with Claude Code signed in and a working "Hello."
2. **The Azure org is pre-warmed.** `az login` done and the target Azure DevOps Repos + Boards + MCP
   already connected on the machine you demo from, so the Module 5 PR is instant, not a live setup.

## The session (~52 min, demo-driven)

| By | Beat | Show them (✅) |
|---|---|---|
| 0:00 | **Framing + M0 Orient** — 6m — director/developer, the spine, the 5 pieces, meet Contoso | Room can name the 5 pieces |
| 0:06 | **M2 Rulebook** — 6m — `CLAUDE.md` + `PROJECT_CONTEXT` on Contoso | "What are we building?" → right |
| 0:12 | **M3 Memory** — 5m — save a fact, show where it lives | Fresh chat recalls the fact |
| 0:17 | **M4 The loop** — 7m — talk → plan; stop at *plan*, no code | A written plan appears |
| 0:24 | **M5 Sandbox → Azure DevOps PR** — 13m ⟵ *long pole, don't rush the PR* | A real PR (`az repos pr list`) |
| 0:37 | **M6 Skills** — 6m — run `add-server-to-health-check` | The skill runs its 3 steps |
| 0:43 | **M7 Connect tools (MCP)** — 6m — confirm MCP; "What work items are mine?" | Claude reads real Boards items |
| 0:49 | **Wrap** — 3m — hand out the cheat sheet, point to the kit, what's next | — |
| **~0:52** | ~8 min buffer to the hour | — |

## What moves out of the hour

- **Install → prework** (`prework-sheet.md`) — the biggest saver.
- **Deep hands-on → self-serve** — they watch the flow, then do it themselves with the kit docs.
- **Module 9 continuity briefing → its own ~15-min stakeholder segment** — it's already designed to
  run standalone for security/leadership (`continuity-governance.md`); don't spend the team hour on it.

## Pacing watch

Module 5 is where the hour slips. Keep the Azure DevOps org, `az login`, and the MCP connection warm
before the room arrives (see the prework and the facilitator guide's "what to have ready"). If you
fall behind, shorten M6/M7 to a quick show-and-tell — the PR checkpoint in M5 is the one that must land.
