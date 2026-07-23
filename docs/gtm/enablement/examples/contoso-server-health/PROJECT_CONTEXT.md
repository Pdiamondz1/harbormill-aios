# Project Context — Contoso Server Health Report

Single source of truth for this fake training project. Auto-loaded via a `CLAUDE.md` import,
the same way the real Harbormill `docs/PROJECT_CONTEXT.md` is auto-loaded into that repo.

## 1. Identity
- **Contoso Server Health Report** is a tiny internal tool: it checks a list of Contoso's
  Windows servers for low free disk space and writes a simple daily HTML report.
- This is the **fake worked example** for the Harbormill Claude Code Enablement Kit — no real
  company, person, or project is referenced anywhere in this folder.

## 2. Purpose
Disks fill up quietly until something pages someone at 2 a.m. This tool checks free space on
every server on the list, every day, and puts the answer — `OK` or `LOW` — on one page, so low
disk space gets caught during business hours instead of during an outage.

## 3. Who uses it
**Contoso IT** — a small team. One person is the day-to-day owner; a named backup owner can
also run and extend it without help. See `memory-seed/user-it-lead.md`.

## 4. Continuity requirement
The backup owner must be able to run and modify this tool with **no help from the primary
owner**: clone the repo, read this file and `CLAUDE.md`, run `disk_report.py`. If that fails,
the tool has a bus-factor problem — see `docs/gtm/enablement/continuity-governance.md` for how
the wider methodology answers this.

## 5. Phased shape
- **v1 (current):** one `servers.txt` list → `disk_report.py` → `report.html`. Runs on a
  schedule via Windows Task Scheduler. No email, no database, no alerting.
- **v2 (deferred):** email `report.html` to the IT distribution list every morning instead of
  requiring someone to open the file. See `memory-seed/project-disk-report.md` for the locked
  decision and why v2 waits until v1 has proven itself.

## See Also
- `CLAUDE.md` — the rulebook this file is imported into.
- `sample-spec.md` / `sample-plan.md` — the finished reference spec + plan for v1.
- `sample-skill/SKILL.md` — the one saved runbook recipe built on top of v1.
