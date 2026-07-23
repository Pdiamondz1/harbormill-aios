# Spec — Contoso Server Health Report, v1 (disk-check script)

- **Date:** 2026-01-01 *(fake, for training only)*
- **Status:** Approved — finished reference answer for Module 4's "written plan" checkpoint
- **Owner:** Contoso IT Lead

## Goal in one line
Read a list of servers, check each one's free disk space, and write a one-page HTML report —
so low disk space gets caught before it pages someone.

## Problem statement
Nobody currently checks free disk space until a server pages an alert or a user complains.
There is no daily list of "which servers are getting low" for Contoso IT to glance at.

## Requirements (v1 scope)
1. Read a plain-text list of servers from `servers.txt` — one entry per line.
2. For each server, check free disk space using Python's `shutil.disk_usage`.
3. Flag any server with less than 20 GB free as `LOW`; everything else is `OK`.
4. Write the results as a simple HTML table to `report.html` — server, free GB, status.
5. Run once a day via a Windows Task Scheduler entry — no one has to remember to run it.

## Non-goals (v1)
- No email — someone has to open `report.html` to read it (v2 adds email; see
  `memory-seed/project-disk-report.md`).
- No database, no history — each run overwrites the previous `report.html`.
- No alerting/paging integration.
- No remote-execution framework (WinRM/WMI) — v1 checks disk usage on paths reachable
  directly from the machine running the script.

## Success criteria
- Running `python disk_report.py` against a real `servers.txt` produces a `report.html` that
  opens in a browser and shows one row per server with a free-GB number and a status.
- A server below the 20 GB threshold shows `LOW`; everything else shows `OK`.
- The backup owner can read `disk_report.py` top to bottom and understand it without help —
  see the continuity requirement in `PROJECT_CONTEXT.md`.

## Open questions
- Exact free-space threshold (20 GB) — confirm with Contoso IT once the real server list is
  known; 20 GB is a placeholder default for this training example.

## See Also
- `sample-plan.md` — the implementation plan (and full script) built from this spec.
