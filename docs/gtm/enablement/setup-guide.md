# Setup Guide — Session 1: Set It Up (Modules 0–3)

This is the hands-on reference for your first live session. By the end, Claude Code will be
installed on your machine, signed in, and aware of your project — with a working memory that
survives you closing your laptop and coming back tomorrow.

No prior coding experience is assumed. If a term below feels unfamiliar, check
[`00-glossary.md`](00-glossary.md) first — it defines every term this guide uses, with a
Windows-admin analogy for each.

Every worked example in this guide uses the same small, deliberately fake project — the
**Contoso Server Health Report** — so nothing here ever touches a real client's details. See
[`examples/contoso-server-health/`](examples/contoso-server-health/) for the finished files this
guide asks you to model your own on.

**Estimated time:** ~45–60 minutes, most of it in Module 1 (installing and signing in once).

---

## Module 0 — What you're about to do

**What / why.** Before touching a keyboard, get the one idea that makes everything else make
sense:

> You are the director. Claude is the developer. You don't write code — you tell Claude what you
> want, check what it did, and keep the notes.

You never need to read or write code. You describe the outcome you want, in plain English;
Claude does the typing; you check the result and decide whether to keep it. Every module from
here on is one piece of standing that up.

Claude Code, set up the Harbormill way, is **five pieces** working together. This guide (Modules
1–3) sets up the first two; Session 2 (`workflow-runbook.md`) covers the rest:

1. **Rulebook** (`CLAUDE.md`) — the standing rules Claude reads before doing anything: what the
   project is, what it's built on, what it must never do. **Module 2.**
2. **Memory (2nd brain)** — notes Claude keeps between conversations, so it remembers decisions
   and people without being reminded every time. **Module 3.**
3. **Skills** — saved, reusable instructions for a job you'll want done the same way every time.
   Session 2.
4. **Safe sandbox** (branch / worktree) — a separate copy of the project to try changes in,
   without touching the version everyone else relies on. Session 2.
5. **Tool connections** (MCP) — wired-up access to your real tools, so Claude can read and act on
   them directly. Session 2.

If any of those five words is new to you, that's fine — that's what
[`00-glossary.md`](00-glossary.md) is for.

**✅ Checkpoint:** before moving on, you should be able to name the 5 pieces above in your own
words, and repeat the spine sentence back without looking. If you can't yet, re-read this module —
everything else builds on it.

---

## Module 1 — Get the tools on your machine

**What / why.** Claude Code is a program you run from a terminal. You'll install it once, sign in
with your work account, and add a VS Code extension so it feels like a normal part of your editor
instead of a separate tool. Nothing about VS Code, Windows, or PowerShell changes — Claude Code
sits on top of what you already use.

### Do it

1. **Install Claude Code.** Open PowerShell (Start menu → type `PowerShell` → Enter) and run:

   ```powershell
   irm https://claude.ai/install.ps1 | iex
   ```

   This downloads and runs Anthropic's own installer. It does not need Administrator rights and
   finishes in under two minutes.

   ![screenshot: the Claude Code installer running in a PowerShell window](screenshots/claude-code-installer.png)

2. **Sign in with your Enterprise account.** Still in PowerShell, type `claude` and press Enter.
   The first time, it opens a sign-in prompt in your browser.

   > **Before you sign in:** confirm the exact provisioning method with your Claude admin —
   > Enterprise accounts vary (some use single sign-on, others a console-issued key), so don't
   > guess. Your facilitator will confirm this on the day if it isn't settled yet.

   ![screenshot: the Claude Code sign-in prompt in a browser window](screenshots/claude-code-sign-in.png)

3. **Install the VS Code extension.** Open VS Code. Click the Extensions icon on the left-hand
   sidebar (or press `Ctrl+Shift+X`), search for **Claude Code**, and click **Install** on the one
   published by Anthropic. This gives you the same Claude Code inside VS Code — a chat panel, a
   plan you can review before Claude acts, and a side-by-side view of any change it makes —
   instead of a separate window.

   ![screenshot: searching "Claude Code" in the VS Code Extensions panel](screenshots/vscode-extensions-search.png)

4. **What a terminal is, and how to open one in VS Code.** A terminal is a plain text window
   where you type commands and see typed replies back — no icons, no mouse clicks. It's exactly
   like the PowerShell windows you already use; this is just where you and Claude talk to each
   other. In VS Code: menu bar → **Terminal** → **New Terminal** (or press `` Ctrl+` ``).

   ![screenshot: opening a new terminal panel from VS Code's Terminal menu](screenshots/vscode-terminal-open.png)

5. **Say hello.** In the terminal, inside any folder, type `claude` and press Enter to start a
   session (skip this if it's still running from step 2). Type `Hello` and press Enter.

   ![screenshot: a plain "Hello" typed to Claude Code with its reply shown](screenshots/claude-hello-reply.png)

**✅ Checkpoint:** you said hello to Claude in the terminal and got a reply back. That's the whole
loop working end to end — you typed plain English, Claude answered in plain English.

### Troubleshooting

- **The install command does nothing, or PowerShell says it can't run scripts.** Some
  organization-managed machines restrict what PowerShell can run. This is a policy setting your
  Claude admin or IT policy owner controls — ask them, don't try to bypass it yourself.
- **Signing in opens a browser page that just spins, or shows an error.** This almost always means
  the account provisioning method doesn't match what you tried (see the callout above). Stop and
  confirm with your Claude admin rather than retrying repeatedly.
- **`claude` isn't recognized as a command.** Close and reopen PowerShell (or VS Code's terminal)
  once after installing — this refreshes the list of commands your terminal knows about.
- **The VS Code extension search shows nothing, or several similarly-named results.** Confirm the
  publisher is **Anthropic** before installing; a similarly-titled community extension is not the
  same thing.

---

## Module 2 — Give Claude its rulebook

**What / why.** `CLAUDE.md` is the one file Claude reads before doing anything on your project —
what it's built on, what commands to run, what to never do. `PROJECT_CONTEXT.md` is the fuller
story underneath it (identity, purpose, who it's for) that `CLAUDE.md` points to. Together they're
why Claude answers "what are we building?" correctly instead of guessing.

You won't write these from a blank page. You'll model them on the finished pair already in this
kit — [`examples/contoso-server-health/CLAUDE.md`](examples/contoso-server-health/CLAUDE.md) and
[`examples/contoso-server-health/PROJECT_CONTEXT.md`](examples/contoso-server-health/PROJECT_CONTEXT.md)
— and have Claude draft your own version in the same shape.

### Do it

1. **Skim the example pair once**, just to see the shape — you don't need to memorize anything.
   Notice `CLAUDE.md` is short (stack, commands, rules, where things live) and it points at
   `PROJECT_CONTEXT.md` for the fuller story.

   ![screenshot: the Contoso example's CLAUDE.md open in VS Code's editor](screenshots/vscode-claude-md-example.png)

2. **In your Claude Code terminal, inside your own project's folder**, type this — filling the
   bracket with a couple of true sentences about what you're actually building — and press Enter:

   ```text
   Create a CLAUDE.md and PROJECT_CONTEXT.md for this project, in the same shape as
   examples/contoso-server-health/CLAUDE.md and examples/contoso-server-health/PROJECT_CONTEXT.md
   from the enablement kit. Our project is: [one or two sentences about what you're building].
   ```

3. **Read what Claude drafts before accepting it.** This is the "check what it did" half of the
   spine, not a formality — correct anything wrong in plain English ("change the stack line to
   say PowerShell, not Python"). Claude will redo it and show you the change again.

   ![screenshot: Claude's drafted CLAUDE.md shown for review, with an edit requested in plain English](screenshots/vscode-new-file-claude-md.png)

4. Once both files read correctly, save them.

**✅ Checkpoint:** start a new message and ask Claude, in plain English: **"What are we
building?"** It should answer using the `PROJECT_CONTEXT.md` you just made — correctly describing
*your* project, in its own words, not a generic answer and not Contoso's.

### Troubleshooting

- **Claude answers about Contoso, not your project.** It's reading the example instead of your
  new files — confirm your `CLAUDE.md` and `PROJECT_CONTEXT.md` were saved at the root of your
  own project folder, not inside `examples/`.
- **Claude gives a vague, generic answer.** Check that your new `CLAUDE.md` actually points to
  `PROJECT_CONTEXT.md` — the Contoso example's first section does this with a line like
  `@PROJECT_CONTEXT.md`; your version needs the same line.
- **Nothing seems to have happened after step 2.** Confirm you're inside your project's folder in
  that terminal, and that the session is the same one signed in from Module 1.

---

## Module 3 — Give Claude a memory

**What / why.** Memory is a folder of notes Claude keeps *between* conversations — the "2nd
brain" from the glossary — so it remembers decisions and people without you repeating yourself.
Claude keeps one memory folder per project, on your own machine, under
`~/.claude/projects/<your-project>/memory/`. You never type or compute that path yourself —
Claude finds or creates it automatically based on the folder you're working in.

Inside, you'll find `MEMORY.md` (a short index — one line per saved memory) plus one small file
per topic Claude has been told to remember. This is exactly the shape of the kit's own seed at
[`examples/contoso-server-health/memory-seed/`](examples/contoso-server-health/memory-seed/) — its
`MEMORY.md` indexes two saved memories, one about the project's IT lead and one about a locked
scope decision. Yours will grow the same way, one saved fact at a time.

### Do it

1. **Tell Claude, in plain English, to remember something true and useful.** A decision you've
   made, or who the backup owner is, works well. For example:

   ```text
   Please remember: the backup owner for this project is [name], in case I'm out.
   ```

2. **Claude saves this on its own** — you don't create or format any file by hand. To see what it
   did, ask Claude "where did you save that?" and open the folder it names in VS Code's Explorer.

   ![screenshot: a project's memory folder open in VS Code's file Explorer, showing MEMORY.md](screenshots/vscode-memory-folder.png)

3. **Open `MEMORY.md`** inside that folder — a short index, one line per memory, in the same shape
   as the kit's own example.

**✅ Checkpoint:** close this session entirely and start a brand-new one — a **fresh chat** — from
the same project folder (type `claude` again). Ask it: **"What do you remember about us?"** or
name the specific fact you saved. Claude should answer correctly, without you reminding it first.

![screenshot: a fresh Claude Code session correctly recalling a previously saved memory](screenshots/claude-remembers-checkpoint.png)

### Troubleshooting

- **The fresh chat doesn't recall anything.** Confirm you started the new session from the
  *same* project folder — memory is tied to the folder's path, so a different folder (or a
  different clone of the same project) looks like a different project to Claude.
- **You don't see a `memory` folder yet.** It's only created the first time you actually ask
  Claude to remember something — go back to do-it step 1.
- **Claude creates a new file instead of updating an existing one.** That's normal for a genuinely
  new fact — related but separate decisions get separate files, the same way the Contoso seed has
  one file for its IT lead and a second, different file for its scope decision. Check `MEMORY.md`'s
  index rather than worrying about the file count.

---

## What's next

You now have a project-aware Claude Code with a working rulebook and memory — the first two of
the 5 pieces from Module 0. Session 2 (`workflow-runbook.md`) picks up from here: the daily loop
of talk → plan → build → check → save, skills, the safe sandbox, and connecting Claude to your
real tools.
