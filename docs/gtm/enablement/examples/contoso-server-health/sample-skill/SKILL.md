---
name: add-server-to-health-check
description: Add one more server to the Contoso Server Health Report and confirm it shows up in the next report. Use whenever a new Windows server needs to be added to the daily disk-space check.
---

# Add a server to the health check

A saved runbook recipe: the same three steps, done exactly the same way, every time a new
server needs to be added to the disk-space check — whether the primary owner or the backup
owner runs it. This is the "skills = saved runbook recipes" example Module 6 runs live.

## Procedure

1. **Append the new server** to `servers.txt`, on its own line — a path `shutil.disk_usage`
   can read directly (e.g. `\\SVR-CONTOSO-04\C$`). Do not remove or reorder existing lines.
2. **Run the report:** `python disk_report.py`.
3. **Confirm the new row appears** in `report.html` — open it and check that the new server's
   name, free-GB number, and `OK`/`LOW` status show up as a new table row.

If the new row is missing, re-check step 1 for a typo in the path, then re-run step 2 —
`disk_report.py` only reports what it can read from `servers.txt`.
