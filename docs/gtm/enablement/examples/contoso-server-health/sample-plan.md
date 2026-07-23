# Plan — Contoso Server Health Report, v1 (`disk_report.py`)

Finished reference answer for Module 4's "written plan" checkpoint. Implements
`sample-spec.md` in full and nothing beyond it.

**Goal:** ship `disk_report.py` — reads `servers.txt`, checks free disk space with
`shutil.disk_usage`, writes `report.html`.

**Architecture:** one Python file, standard library only (`shutil`, `datetime`) — nothing to
install. Three small functions: read the server list, check one server, write the report.

**Files:**
- Create: `disk_report.py`
- Create (by hand, once, for testing): `servers.txt`

## Step 1 — Write `servers.txt` (sample content, for testing)

```
C:\
C:\Windows
C:\Windows\System32
```

Each line is a path `shutil.disk_usage` can read directly — here, local paths so this
walkthrough runs on any Windows machine with no setup. In real use, each line is instead a
server's administrative share, e.g. `\\SERVERNAME\C$` — substitute your own server names when
you point this at an actual fleet. Checking a longer fleet over WinRM/WMI is explicitly out of
scope for v1 (see `sample-spec.md`'s non-goals).

## Step 2 — Write `disk_report.py`

```python
"""disk_report.py -- read servers.txt, check free disk space, write report.html."""
import shutil
from datetime import datetime

LOW_GB = 20  # flag anything below this many free GB


def read_servers(path="servers.txt"):
    with open(path, encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip()]


def check_one(path):
    free_gb = shutil.disk_usage(path).free // (2**30)
    return path, free_gb, "LOW" if free_gb < LOW_GB else "OK"


def write_report(rows, path="report.html"):
    stamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    body = "\n".join(f"<tr><td>{n}</td><td>{gb}</td><td>{s}</td></tr>" for n, gb, s in rows)
    html = (f"<h1>Contoso Server Health Report -- {stamp}</h1>\n"
            f'<table border="1"><tr><th>Server</th><th>Free GB</th><th>Status</th></tr>\n'
            f"{body}</table>")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)


if __name__ == "__main__":
    rows = [check_one(s) for s in read_servers()]
    write_report(rows)
    print(f"Wrote report.html for {len(rows)} server(s).")
```

## Step 3 — Try it

Run: `python disk_report.py`
Expected: a `report.html` appears in the same folder. Opening it in a browser shows one row
per line in `servers.txt`, each with a free-GB number and a status of `OK` or `LOW`.

## Done-criteria

```bash
python -c "import ast; ast.parse(open('disk_report.py').read())" && echo "syntax OK"
python disk_report.py && test -f report.html && echo "report OK"
grep -c "<tr>" report.html   # expect 4 (1 header row + 3 servers)
```
Expected: `syntax OK`, `report OK`, row count `4`.

## Step 4 — Commit

```bash
git add disk_report.py
git commit -m "feat(disk-report): v1 -- read servers.txt, check disk space, write report.html"
```

## Not in this plan
Email delivery, a database, alerting/paging, and remote-execution frameworks (WinRM/WMI) are
all deliberately out of scope for v1 — see `sample-spec.md`'s non-goals and
`memory-seed/project-disk-report.md`'s locked decision.
