# Glossary

The ~10 terms the rest of this kit assumes you already know. Read this page first — every later
document links back here instead of re-explaining a term.

Each row gives a plain-English definition, then a Windows-admin analogy — something you already
manage today that works the same way.

| Term | Plain definition | Windows-admin analogy |
|---|---|---|
| **Claude Code** | The command-line AI assistant you talk to in plain English to get software written and changed. | Like calling the help desk and describing what you need, instead of configuring it yourself by hand. |
| **Terminal** | A plain text window where you type commands and see typed replies back — no icons, no mouse clicks. | Like a PowerShell window — same idea, just where you and Claude talk to each other. |
| **Repository (repo)** | A folder whose full history is tracked. | Like a shared network folder that remembers every version of every file. |
| **Commit** | A saved, labeled snapshot of the files at one moment, with a short note about what changed and why. | Like a labeled system checkpoint — "before patch Tuesday" — you can always come back to. |
| **Pull request (PR)** | A proposed set of changes, held up for review before it becomes part of the real project. | Like a change-request ticket in change management — nothing goes live until it's reviewed and approved. |
| **Branch / worktree** | A separate, safe copy of the project to try something in, without touching the version everyone else relies on. | Like testing a change on a lab VM before you touch the production server. |
| **`CLAUDE.md` (the rulebook)** | The one file that tells Claude the project's standing rules — what stack it's built on, what commands to run, what to never do. | Like a runbook or standard operating procedure a new tech reads on day one — except Claude reads it every single time. |
| **Memory (2nd brain)** | A folder of notes Claude keeps between conversations, so it remembers decisions and people without being told twice. | Like a ticketing system's notes field that follows the issue (or the person) across every future call. |
| **Skill** | A saved, reusable set of instructions for a job you'll ask Claude to do again and again. | Like a saved PowerShell script or a documented runbook recipe — write it once, run it every time after. |
| **MCP (tool connection)** | A wired-up connection that lets Claude directly read (and sometimes act in) one of your real tools, like a work-item tracker. | Like giving the help desk read access to your ticketing system, instead of you copy-pasting ticket details into an email. |

## Where these terms come up

- **Rulebook, memory, skills, safe sandbox, tool connections** — the [5 pieces](README.md#the-5-pieces)
  every hands-on module builds toward.
- **Terminal, repo, commit, branch / worktree, PR** — the day-to-day mechanics covered in
  `workflow-runbook.md`.
- **Claude Code, `CLAUDE.md`, memory, skill, MCP** — set up once, in `setup-guide.md`.
