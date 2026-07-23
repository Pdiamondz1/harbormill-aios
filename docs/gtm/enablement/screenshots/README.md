# Screenshots — capture guide

These are the 19 images the kit's docs reference. This guide says exactly what each one should show,
what to name it, and how to capture them **without leaking anything** into the reusable kit.

The docs reference each image by an exact filename (e.g. `![screenshot: …](screenshots/claude-hello-reply.png)`).
Use the filenames below verbatim, or the image won't appear.

## Before you start

- **Capture against the fake "Contoso Server Health Report" example** — the one the sessions build.
  Never capture real client work as the subject.
- **Capture on whatever machine runs the sessions.** If that is a client or production machine, the
  *content* (Contoso) is fake and safe, but the *environment chrome* around it is real. Before an image
  goes into this reusable kit, **crop or blur** the identifying chrome:
  - the signed-in **account email / name**
  - the **Azure DevOps organization URL** (`dev.azure.com/<org>`) and repo name
  - the **machine hostname / username** in terminal prompts and file paths
  - any **real work-item text** (see "The one to watch" below)
  Shots that show this are marked **🔒** below.
- **If you can't cleanly redact a shot, keep it in a private client-only copy** and leave the
  placeholder here. This reusable kit stays client-agnostic (it is also the case-study template).
- Aim for legible text (a 16:9-ish crop, light or dark theme — whatever reads clearly on a projector).

## Session 1 — referenced by `setup-guide.md`

| File | What it should show |
|---|---|
| `claude-code-installer.png` | The Claude Code installer running in a PowerShell window |
| 🔒 `claude-code-sign-in.png` | The sign-in prompt in a browser — crop the account email |
| `vscode-extensions-search.png` | Searching "Claude Code" in the VS Code Extensions panel |
| `vscode-terminal-open.png` | Opening a new terminal from VS Code's Terminal menu |
| `claude-hello-reply.png` | ✅ A plain "Hello" typed to Claude Code, with its reply shown |
| `vscode-claude-md-example.png` | The Contoso example's `CLAUDE.md` open in the editor |
| `vscode-new-file-claude-md.png` | Claude's drafted `CLAUDE.md` shown for review |
| 🔒 `vscode-memory-folder.png` | The memory folder with `MEMORY.md` — crop the project/user in the path |
| `claude-remembers-checkpoint.png` | ✅ A fresh session correctly recalling a saved memory |

## Session 2 — referenced by `workflow-runbook.md`

| File | What it should show |
|---|---|
| `vscode-plan-before-code.png` | Claude presenting a written plan, with no code yet |
| `contoso-sample-plan-open.png` | The Contoso `sample-plan.md` open next to a freshly drafted plan |
| 🔒 `vscode-worktree-created.png` | A new worktree/sandbox confirmed — crop repo path / hostname |
| 🔒 `terminal-git-commit.png` | A completed commit for `disk_report.py` — crop path / username |
| 🔒 `vscode-create-pull-request-button.png` | The "Create Pull Request" button in the Azure Repos panel — crop org / repo |
| 🔒 `azure-devops-pr-list.png` | ✅ `az repos pr list` output — crop the org URL |
| `contoso-skill-file-open.png` | `sample-skill/SKILL.md` open in VS Code, showing the numbered steps |
| `claude-running-skill-steps.png` | ✅ Claude running the skill's three steps in the terminal |
| 🔒 `mcp-azure-devops-added.png` | The Azure DevOps MCP server shown connected in Claude Code's settings — crop the org |
| 🔒 `claude-work-items-answer.png` | ✅ Claude listing your Azure Boards work items — **highest risk** (see below) |

## The one to watch

`claude-work-items-answer.png` is the Module 7 checkpoint: Claude answers "what work items are
assigned to me?" On a real machine that query returns **real internal work items**. Do one of:

1. Run it against a **test / Contoso project** in Azure Boards so the items are fake, or
2. **Redact** the item titles before committing, or
3. Keep this one in the **client-only copy** and leave the placeholder in the reusable kit.

## Capture-as-you-go (during the sessions)

The easiest way to get all 19 is to grab each one **the moment it appears** while you demo — you're
already on that screen. On Windows: **Win + Shift + S** → drag the region → paste into Paint or the
Snipping Tool editor → crop any **🔒** chrome → **Save As** the exact filename into this folder.

Follow this top to bottom; it matches the session flow.

**Session 1 — "Set it up" (`setup-guide.md`)**

- Module 1 — Get the tools
  1. Installer running in PowerShell → `claude-code-installer.png`
  2. 🔒 Browser sign-in prompt *(crop the email)* → `claude-code-sign-in.png`
  3. Extensions panel with "Claude Code" searched → `vscode-extensions-search.png`
  4. New terminal opened from the Terminal menu → `vscode-terminal-open.png`
  5. ✅ "Hello" typed + Claude's reply → `claude-hello-reply.png`
- Module 2 — Rulebook
  6. Contoso `CLAUDE.md` open in the editor → `vscode-claude-md-example.png`
  7. Claude's drafted `CLAUDE.md` shown for review → `vscode-new-file-claude-md.png`
- Module 3 — Memory
  8. 🔒 Memory folder with `MEMORY.md` *(crop the path)* → `vscode-memory-folder.png`
  9. ✅ Fresh session recalling a saved memory → `claude-remembers-checkpoint.png`

**Session 2 — "Work with it" (`workflow-runbook.md`)**

- Module 4 — The loop
  10. Claude presenting a written plan, no code yet → `vscode-plan-before-code.png`
  11. Contoso `sample-plan.md` next to the drafted plan → `contoso-sample-plan-open.png`
- Module 5 — Sandbox + save to Azure DevOps
  12. 🔒 New worktree confirmed in the terminal *(crop path/hostname)* → `vscode-worktree-created.png`
  13. 🔒 Completed commit for `disk_report.py` *(crop path/username)* → `terminal-git-commit.png`
  14. 🔒 "Create Pull Request" button in the Azure Repos panel *(crop org/repo)* → `vscode-create-pull-request-button.png`
  15. 🔒 ✅ `az repos pr list` output *(crop org URL)* → `azure-devops-pr-list.png`
- Module 6 — Skills
  16. `sample-skill/SKILL.md` open, numbered steps → `contoso-skill-file-open.png`
  17. ✅ Claude running the skill's three steps → `claude-running-skill-steps.png`
- Module 7 — Tool connections (MCP)
  18. 🔒 Azure DevOps MCP shown connected in settings *(crop org)* → `mcp-azure-devops-added.png`
  19. 🔒 ✅ Claude's work-items answer → `claude-work-items-answer.png`
      *(use a test/Contoso Boards project or redact the item titles — see "The one to watch")*

**Tip:** capture on the projected/shared screen during the run-through, so the shots match exactly
what the team just watched. If a moment passes before you grab it, every step is repeatable — just
re-run it after the session.

## When you're done

Drop the finished `.png` files into this folder (`docs/gtm/enablement/screenshots/`) using the exact
names above. The docs already point at them — no edits needed. Re-open each guide to confirm the
images render where expected.
