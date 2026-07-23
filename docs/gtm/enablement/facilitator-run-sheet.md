# Facilitator Run-Sheet — *Directing Claude* (glance card)

One page to keep beside you during delivery. Beats + timings only — the teaching content is in
`setup-guide.md` / `workflow-runbook.md` / `continuity-governance.md`; the full plan is
`facilitator-guide.md`. **Long poles:** Module 1 and Module 5 — if you're behind, it's here.

## Session 1 — Set It Up (~55 min) · *from the deck + `setup-guide.md`*

| By | Beat | Land it before moving on (✅) |
|---|---|---|
| 0:00 | **Deck framing** (6 slides) + **M0 Orient** — 10m — director/developer, the spine, the 5 pieces, meet Contoso | Room can name the 5 pieces + repeat the spine |
| 0:10 | **M1 Get the tools** — 20m — install, sign in, VS Code extension, open a terminal | Each person: typed "Hello" → got a reply |
| 0:30 | **M2 Rulebook** — 15m — model `CLAUDE.md`+`PROJECT_CONTEXT` on Contoso, draft their own | "What are we building?" → right, from *their* project |
| 0:45 | **M3 Memory** — 10m — save one true fact, find where it landed | New chat: "What do you remember about us?" → recalls it |
| 0:55 | **End** — project-aware Claude (rulebook + memory) | — |

## Session 2 — Work With It (~70 min) · *from `workflow-runbook.md`*

| By | Beat | Land it before moving on (✅) |
|---|---|---|
| 0:00 | **Reconnect + M4 The loop** — 15m — talk → plan → build → check → save; stop at *plan*, no code | A written plan (like `sample-plan.md`), before any code |
| 0:15 | **M5 Sandbox → Azure DevOps PR** — 25m — worktree, build, commit, open a real PR ⟵ *proof point, don't rush* | PR appears — confirm with `az repos pr list` |
| 0:40 | **M6 Skills** — 15m — run `add-server-to-health-check` from plain English | 3 steps run; new server row in `report.html` |
| 0:55 | **M7 Connect tools (MCP)** — 15m — confirm Azure DevOps MCP; "What work items are mine?" | Claude reads real, live Azure Boards items |
| 1:10 | **End** — real PR + a skill run + a live tool connection | — |

## Module 9 — Continuity Briefing (~15 min, standalone/replayable) · *from `continuity-governance.md`*

| By | Beat |
|---|---|
| 0:00 | Bus-factor problem — 2m |
| 0:02 | Concern → artifact map — 5m |
| 0:07 | "Deploy from source, unaided" proof — 4m |
| 0:11 | Secrets & safety — 2m |
| 0:13 | Governance summary — read close to verbatim — 2m |

No hands-on checkpoint — it's a briefing. Run it tacked onto Session 2 *or* as its own meeting for the
security/leadership sign-off.

---

**Before the room arrives:** terminal + VS Code open side by side · Contoso example reachable (don't
clone live) · target Azure DevOps Repos + Boards created · `az login` confirmed · MCP connected ·
`screenshots/` open as a fallback. **After:** hand everyone `first-week-cheat-sheet.md`.
