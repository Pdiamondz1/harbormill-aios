# First Week Cheat Sheet

Print this. Keep it next to your keyboard for your first week of real use — it's a glance card, not
a teaching doc. The full story lives in `setup-guide.md`, `workflow-runbook.md`, and the full
command cheat-sheet inside `microsoft-stack-translation.md` (this page is shorter, and different).

## The daily loop, in five words

> **talk it out → get a plan → let Claude build it → check it → save it.**

Every job, big or small, is this loop. If you remember one line from the whole kit, remember this
one.

## The three commands you'll actually type

| What | Command |
|---|---|
| Save your work for review | `az repos pr create --title "..." --description "..." --source-branch <branch> --target-branch main` |
| Confirm your PR landed | `az repos pr list` |
| Look up a work item | `az boards work-item show --id <id>` |

Don't want to type them yourself? Ask Claude — it runs these for you just as well as you can.

## Where things live

- **Memory (2nd brain):** `~/.claude/projects/<your-project>/memory/` — `MEMORY.md` is the index,
  one line per saved fact. You never create or edit these by hand; Claude does.
- **Skills:** `.claude/skills/` in your project — one saved recipe per job you'll want done the same
  way every time.

## When stuck, ask Claude

- **"What are we building?"** — if the answer sounds wrong, `CLAUDE.md` / `PROJECT_CONTEXT.md`
  needs fixing (Module 2).
- **"What do you remember about us?"** — checks memory is actually working (Module 3).
- **"What branch am I on?"** — before opening a pull request (Module 5).
- **"Are you connected to Azure DevOps?"** — if a live-data question comes back wrong or empty
  (Module 7).
- **"Explain that in plainer terms."** — anytime a plan or an answer doesn't make sense. Asking is
  never the wrong move.

## What's next

Full glossary: `00-glossary.md`. Full command cheat-sheet (every swap, not just the three above):
inside `microsoft-stack-translation.md`. If something here doesn't ring a bell, that's what
Sessions 1–2 (`setup-guide.md`, `workflow-runbook.md`) already covered — go back to the module named
above.
