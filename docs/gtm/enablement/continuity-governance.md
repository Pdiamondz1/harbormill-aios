# Continuity & Governance — Module 9: Making It Survive You

This is the short, stakeholder-facing briefing in the kit — written for a security or leadership
reader who was never in the room for Sessions 1–2, not for the hands-on team. It stands alone: you
can hand this single page to someone and they'll have the whole picture without reading anything
else first. (If a term below is unfamiliar, [`00-glossary.md`](00-glossary.md) defines it in one
line with a Windows-admin analogy — but nothing here requires reading that first.)

It's also the content this kit's deck presents back to leadership as its Continuity & Governance
section — same problem, same table, same proof test, same order, just as slides instead of prose.

---

## The problem: single-operator risk (bus factor)

**Bus factor** is a plain question: how many people would have to become unavailable — leave,
go on leave, get hit by a bus — before a piece of work stalls because no one else knows how to run
it? If the answer is one, that one person *is* the whole system, whether anyone planned it that
way or not.

This is the standard risk with internally-built tools, Claude Code or otherwise: one engineer
writes a script, understands its quirks, and keeps the rest in their head. The script itself is
fine. The risk is everything *around* it that was never written down — why a step exists, what to
check before changing it, how to stand it up again from nothing. When that person is unavailable,
the knowledge goes with them, and a governance or continuity review correctly flags this as a
single point of failure.

The method this kit teaches is built specifically to not have that failure mode. Every piece of
context Claude needs — the project's rules, its history, its saved recipes, its decisions — lives
in files inside the project's own repository, not inside one engineer's memory. A second person
reading the same files gets the same context Claude does. That's the whole answer to bus factor:
move the knowledge out of a head and into the repo, where it survives whoever wrote it.

## How the method answers it — the concern→artifact map

Each standard governance/continuity concern below maps to a specific, already-existing artifact
from this kit — nothing new to build, just naming what Sessions 1–2 already produced:

| Governance concern | The artifact that answers it |
|---|---|
| No single-operator dependency (bus factor) | Memory (2nd brain) + wiki runbook + specs — knowledge lives in the repo, not a head |
| A backup owner can actually run it | The method is followable by a non-dev; the backup owner uses the same skills/runbook |
| The runbook is real and current | The wiki + skills *are* the runbook, updated as part of the daily loop |
| Deploy from source to a clean machine, unaided | Everything in Azure DevOps; skills/PowerShell define setup; the deploy-from-source test |
| Decisions are on the record | Specs + plans + PR descriptions |
| Secrets are safe | `.gitignore` + pre-commit secret scan + read-only keys + a `CLAUDE.md` rule |

A few of these are worth spelling out for a reader who didn't sit through Sessions 1–2:

- **Memory (2nd brain), wiki, specs** aren't extra paperwork layered on top of the work — they're
  the same files Claude reads and writes as part of doing the work every day (Modules 3–4). Nobody
  has to remember to "go document this later."
- **A backup owner can actually run it** because the whole method is designed for a non-developer:
  the primary owner and the backup owner both work the same way — describe what's needed in plain
  English, review the plan, check the result. Neither one needs to read or write code, so neither
  one is a bottleneck the other can't cover.
- **Decisions are on the record** because every piece of real work in this method produces a spec
  or a plan (Module 4) and lands as a pull request with a description (Module 5) — a plain-English
  paper trail of what was decided and why, sitting in Azure DevOps, not in a chat thread nobody can
  find later.

## The proof test: deploy from source, unaided

A concern→artifact table is a claim. This kit backs the claim with a test instead of asking anyone
to take it on faith:

> **Deploy from source to a clean Windows box using the runbook alone, no help.**

Concretely: hand a clean Windows machine, the Azure DevOps repo URL, and this kit to the backup
owner — or better, to an IT team member who was never in the room for Sessions 1–2 — and see
whether they can go from nothing to a running deployment using only what's written down in
`setup-guide.md`, `workflow-runbook.md`, and `microsoft-stack-translation.md`. No verbal help from
whoever originally built it. No "just ask me if you get stuck."

Two outcomes, both useful:

- **They get all the way through.** That's the proof — the runbook is genuinely sufficient, not
  merely believed to be sufficient, and continuity doesn't depend on anyone's availability.
- **They get stuck somewhere.** That's not a failure of the person — it's a gap in the written
  runbook, found safely, on a test machine, instead of during a real handover under time pressure.
  Fix the doc at that exact step, then run the test again. The runbook only earns the word "current"
  once it has survived this test with nobody in the room to fill a gap verbally.

Run this test whenever the runbook changes meaningfully, and again before any planned handover — it
takes an afternoon and it's the cheapest insurance a continuity review can ask for.

## Secrets & safety, in one place

One rule, repeated everywhere it applies: **secrets never live in a tracked file.** Concretely:

- **In the repo:** a `.gitignore` entry for anything that could hold a credential, plus a
  **pre-commit secret-scan hook** that blocks a commit before it can leave the machine with a key
  in it — the mistake is caught before it exists anywhere shared, not cleaned up after.
- **In `CLAUDE.md`:** a standing rule that Claude never writes an API key, password, or connection
  string into a tracked file — the same rulebook mechanism from Module 2, just one more rule in it,
  so this isn't a policy anyone has to remember to enforce by hand.
- **In every tool connection (MCP):** keys are scoped to the least access that does the job —
  **read-only** wherever a connection only ever needs to read, so a leaked or misused key can't
  write or delete anything even in the worst case.
- **In CI and at runtime:** CI secrets live in Azure DevOps variable groups or secure files, never
  typed into pipeline YAML; secrets on the server the software actually runs on stay Windows-native
  (DPAPI or Windows Credential Manager), never sitting in a plaintext config file next to a script.

## The one-paragraph governance summary

The paragraph below is written to be read on its own — by a security or leadership stakeholder who
reads nothing else in this kit:

> This team runs a documented, repeatable method for building and maintaining internal software
> with Claude Code, where every rule, decision, saved recipe, and runbook step lives as a file in
> the project's own repository — not in one engineer's head. A named backup owner can run the same
> method the primary owner does, because the method assumes no coding background and requires only
> following written steps that Claude carries out. The runbook is current by construction, because
> it is the same document the team uses to do daily work, not a separate artifact someone has to
> remember to update. This has been tested, not assumed: the software has been deployed from source
> onto a clean machine using only the written runbook, with no verbal help from whoever built it.
> Secrets are never stored in tracked project source — they live in the repository's own ignore
> rules and pre-commit scan, in least-privilege tool-connection keys, and in the organization's
> existing credential stores. In short: the knowledge this project depends on is captured in
> artifacts that outlive any one person, and that claim has been proven with a test, not taken on
> trust.

---

## What's next

That's the whole continuity & governance briefing — short enough to replay for a stakeholder who
skipped Sessions 1–2 entirely. `facilitator-guide.md` and `first-week-cheat-sheet.md` round out the
kit: the first for whoever runs the live sessions, the second as the one page the team keeps open
during their first week of real use.
