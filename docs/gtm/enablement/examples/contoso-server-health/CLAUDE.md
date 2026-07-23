# Contoso Server Health Report — agent guide

A tiny internal tool that checks a list of Contoso's Windows servers for low free disk space
and writes a simple daily HTML report. This is a **fake training example** — no real Contoso
company exists; the name is a widely-used fictional company name in software documentation,
used here exactly the way this repo's own `CLAUDE.md` is used for the real Harbormill product.

**Project context:** the single source of truth is @PROJECT_CONTEXT.md (auto-imported).

## Stack
Python 3.12 on Windows Server · standard library only (`shutil`, `datetime`) — no external
packages in v1 · a Windows Task Scheduler entry runs it daily · output is a static
`report.html`. Source lives in **Azure DevOps** (Azure Repos), not GitHub.

## Commands (the gate — run before claiming done)
```bash
python disk_report.py     # reads servers.txt, writes report.html
python -m pytest          # unit tests, once added (v1 ships with none — see sample-plan.md)
```

## Rules
1. **Secrets never go in Git.** No passwords, connection strings, or API keys in any tracked
   file — ever. Use `.gitignore` + a pre-commit secret-scan hook. Real credentials stay in
   Windows Credential Manager or an Azure DevOps variable group, never in `servers.txt` or code.
2. **Every commit ends with a trailer** identifying the assistant and session — same
   convention as the base Harbormill template:
   ```
   Co-Authored-By: Claude <noreply@anthropic.com>
   Claude-Session: <session URL>
   ```
3. Keep v1 boringly simple (see `PROJECT_CONTEXT.md`'s phased shape) — don't add scope before
   v1 has proven itself running unattended.

## Where things live
- `disk_report.py` — the whole v1 tool.
- `servers.txt` — one server (a path `shutil.disk_usage` can read) per line.
- `report.html` — generated output; regenerated on every run, never hand-edited.
- `memory-seed/`, `sample-spec.md`, `sample-plan.md` — this training kit's reference answers,
  not part of the tool itself.

## Conventions
- Plain, boring code over clever code — the backup owner must be able to read it cold.
- This file mirrors the shape of the real Harbormill `CLAUDE.md` it's modeled on — it is
  itself a teaching artifact, not just a rulebook.
