---
name: project-disk-report
description: "Contoso Server Health Report -- the v1/v2 scope decision for the disk-space check tool"
metadata:
  node_type: memory
  type: project
  originSessionId: 00000000-0000-4000-8000-000000000002
---

**Decision (v1 scope, locked):** ship the smallest useful version first — read `servers.txt`,
check free disk space with `shutil.disk_usage`, write `report.html`. No email, no database, no
alerting, no scheduling logic beyond a single Windows Task Scheduler entry that runs the
script daily.

**v2 (deferred, not started):** email `report.html` to the IT distribution list every morning
instead of requiring someone to open the file by hand. Do not start v2 until v1 has run
unattended for at least a week — see [[user-it-lead]].

**Why:** matches the Harbormill build philosophy — ship the smallest complete loop, prove it
survives real use, then add the next increment. Revisit this file before adding scope to v1.
