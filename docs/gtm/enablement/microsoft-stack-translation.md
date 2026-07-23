# Microsoft-Stack Translation Guide

This is the reference doc for a **Microsoft-stack team**: Azure DevOps instead of GitHub, VS Code on
Windows, PowerShell instead of a shell script. If a term below feels unfamiliar, check
[`00-glossary.md`](00-glossary.md) first — it defines terminal, repo, commit, PR, branch/worktree,
skill, and MCP with a Windows-admin analogy for each.

You don't need to read this doc top to bottom before your live sessions — `setup-guide.md` and
`workflow-runbook.md` already use the exact Azure DevOps commands shown here. Come back to this page
whenever you want the full picture in one place, or need the **command cheat-sheet** at the bottom.

---

## What stays identical (read this first)

Before the differences: almost nothing about the method changes. All of this is exactly the same on
a Microsoft-stack team as it is anywhere else:

- The whole **director/developer workflow** — talk it out, get a plan, let Claude build it, check
  it, save it.
- **Skills** and **memory** (the 2nd brain) — saved instructions and notes Claude keeps, unchanged.
- **Worktrees** (the safe sandbox) — same `git worktree` mechanics underneath.
- **The context spine** (`CLAUDE.md` + `PROJECT_CONTEXT.md`) — same two files, same job.
- **Settings and hooks** — Claude Code's own configuration is identical on Windows.
- **Specs and plans** — the same "write the plan before the code" habit from Module 4.
- **VS Code, Windows, PowerShell** — this is the environment Claude Code already runs on; nothing
  about your normal desktop changes.

Only three things swap, because they're the parts of the workflow that talk to an external service
rather than to Claude itself. Those three swaps are the rest of this document.

---

## The three swaps

| Harbormill default (this repo) | Microsoft-shop equivalent | Command / click-path swap |
|---|---|---|
| GitHub + `gh` CLI | **Azure Repos** | `gh pr create` → `az repos pr create` · `gh pr list` → `az repos pr list` · or click **Create Pull Request** in VS Code's Azure Repos panel |
| GitHub Issues | **Azure Boards** | `gh issue create` → `az boards work-item create` · `gh issue list` → `az boards work-item show` / Claude reads them live via the Azure DevOps MCP server (Module 7) |
| GitHub Actions | **Azure Pipelines** | `.github/workflows/*.yml` → `azure-pipelines.yml` at the repo root, running the same checks (secret-scan hook, tests, lint) |

### Swap 1 — Azure Repos (was GitHub / `gh`)

This is the one you'll use every day, saving work as a pull request (see Module 5 of
`workflow-runbook.md`). The canonical form used throughout this kit:

```bash
az repos pr create --title "..." --description "..." --source-branch <branch> --target-branch main
```

```bash
az repos pr list
```

**Or, the click-path:** in VS Code's Source Control / Azure Repos panel, click **Create Pull
Request** — no terminal required. Either way, Claude's default commit and PR trailers (the
`Co-Authored-By` line, the PR-body footer) carry over unchanged — only the command wrapper differs.

You (or Claude, acting for you) need to be signed in once per machine first: `az login`.

### Swap 2 — Azure Boards (was GitHub Issues)

Work items — the Microsoft-stack name for what GitHub calls "issues" — live in Azure Boards instead:

```bash
az boards work-item create --title "..." --type Task
```

```bash
az boards work-item show --id <id>
```

In day-to-day use you'll mostly *read* work items rather than type these commands yourself — that's
what Module 7's **Azure DevOps MCP server** is for: ask Claude, in plain English, "what work items
are assigned to me?" and it answers from your real, live Azure Boards data.

### Swap 3 — Azure Pipelines (was GitHub Actions)

Where Harbormill's own repo defines automated checks in `.github/workflows/*.yml`, a Microsoft shop
defines the same checks in one file, `azure-pipelines.yml`, at the repo root — the same idea (run
tests and checks automatically on every PR), just a different file format and a different place it
runs:

```bash
az pipelines create --name "<pipeline-name>" --repository <repo> --branch main --yml-path azure-pipelines.yml
```

```bash
az pipelines run --name "<pipeline-name>"
```

Whatever your GitHub Actions workflow checks today (the secret-scan hook, tests, lint) is the same
list of checks `azure-pipelines.yml` runs — only the runner changes, not what it checks for.

---

## Deployment nuance — where the software actually ships

This matters, so it's called out on its own: the software you and Claude build together does **not**
get deployed to a managed Azure hosting product. It ships the same way most internal Windows-shop
tools always have — pulled from Azure Repos onto an on-prem or IT-managed **Windows Server**, and run
there with **PowerShell**, exactly like the Contoso disk-check script in this kit. When you're ready
to hand work off, ask Claude for a plain "deploy from source, onto a clean Windows Server" runbook
step, the same way you asked for `disk_report.py` itself — nothing here needs a cloud hosting
product, and this kit does not teach one.

Two related Azure services are worth knowing the *names* of, in case IT leadership or security asks,
but neither is taught in this kit — both are optional future upgrades, not something you need on day
one: **Azure Key Vault** (a more central place to store secrets than Windows Credential Manager, once
you outgrow it) and **Azure Monitor** (centralized logging and alerting, once you have more than one
server to watch).

---

## MCP servers, mapped

An **MCP (tool connection)** lets Claude read — and sometimes act in — one of your real tools
directly. Here's how the ones this kit uses map onto a Microsoft-stack toolbox:

| Tool connection (MCP) | What it connects Claude to | Notes |
|---|---|---|
| **Azure DevOps MCP** | Work items, repos, pull requests, and the team wiki | The main new connection for a Microsoft shop — Module 7 walks through confirming it works. The official server is Microsoft's own `azure-devops-mcp`. |
| **PostgreSQL MCP** | The project's own Postgres database | Only relevant if the project you're building actually has a database — plays the same role Harbormill's own Supabase MCP plays in the base template. Skip it if there's no DB yet. |
| **context7 MCP** | Up-to-date framework and library documentation | Unchanged — carries over exactly as-is, nothing Microsoft-specific about it. |
| *(Google Workspace MCPs)* | *(Gmail, Drive, Calendar, etc. — not used here)* | Not relevant to a Microsoft shop. An M365/Graph analog exists, but it's out of scope for this kit. |

---

## Secrets, the Windows way

Same rule everywhere — **secrets never live in a tracked file** — expressed with Windows-native
tools instead of the usual Linux/macOS ones:

- **In the repo:** a `.gitignore` entry for anything that could hold a key (`.env`, config files with
  credentials), plus a **pre-commit secret-scan hook** that blocks a commit before it can ever leave
  your machine with a secret in it.
- **In `CLAUDE.md`:** a standing rule that Claude never writes an API key, password, or connection
  string into a tracked file — the same rulebook mechanism from Module 2, just one more rule in it.
- **In CI (Azure Pipelines):** secrets used by `azure-pipelines.yml` live in an **Azure DevOps
  variable group** or a **secure file** in the Library, never typed into the YAML itself.
- **At runtime, on the Windows Server the software actually runs on:** secrets stay Windows-native —
  **DPAPI** or the **Windows Credential Manager** — not a plaintext config file sitting next to the
  script.

---

## Command cheat-sheet

The one-page reference `setup-guide.md` and `workflow-runbook.md` both point back to. Everything on
the left is what Harbormill's own base template (and most GitHub-based tutorials) would tell you;
everything on the right is what you actually type — or ask Claude to type for you — on this project.

| Task | GitHub-style (Harbormill default) | Microsoft shop (this project) |
|---|---|---|
| Sign in once per machine | `gh auth login` | `az login` |
| Create a pull request | `gh pr create --title "..." --body "..."` | `az repos pr create --title "..." --description "..." --source-branch <branch> --target-branch main` |
| List pull requests | `gh pr list` | `az repos pr list` |
| Create a PR without the terminal | — | VS Code's Azure Repos panel → **Create Pull Request** button |
| Create a work item | `gh issue create --title "..." --body "..."` | `az boards work-item create --title "..." --type Task` |
| Look up a work item | `gh issue view <id>` | `az boards work-item show --id <id>` |
| See "what's assigned to me" | `gh issue list --assignee @me` | Ask Claude in plain English (Azure DevOps MCP) or `az boards work-item show` |
| CI/automated-checks file | `.github/workflows/*.yml` | `azure-pipelines.yml` |
| Create a pipeline | (automatic on push) | `az pipelines create --name "..." --repository <repo> --branch main --yml-path azure-pipelines.yml` |
| Run a pipeline manually | `gh workflow run` | `az pipelines run --name "..."` |
| Where the built software runs | (varies) | On-prem/managed **Windows Server**, via **PowerShell** — not a cloud hosting product |
| CI secrets | GitHub Actions repo/org secrets | Azure DevOps **variable groups** / **secure files** |
| Runtime secrets on the server | environment variables / `.env` | **DPAPI** / **Windows Credential Manager** |
| Work-item / repo / PR / wiki tool connection | (GitHub-flavored MCP) | **Azure DevOps MCP** server |
| Framework/library docs tool connection | context7 MCP | context7 MCP (unchanged) |

---

## What's next

You've now got the full Microsoft-stack translation in one place. `continuity-governance.md` covers
how this way of working survives a team member leaving — worth reading even outside a leadership
role. Keep `first-week-cheat-sheet.md` nearby for your first week of real use; it's a different,
shorter page than the command cheat-sheet above.
