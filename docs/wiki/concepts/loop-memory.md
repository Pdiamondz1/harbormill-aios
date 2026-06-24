---
title: Loop Memory
type: concept
created: 2026-06-24
updated: 2026-06-24
sources: [.claude/skills/autoresearch/SKILL.md, docs/wiki/memory.md, autoresearch/program.md, raw/sessions/2026-06-24-loop-verify-and-loop-memory.md]
tags: [loops, autoresearch, memory, learning, architecture]
---

# Loop Memory

**Loop memory** is how an automation loop *learns over runs* instead of repeating itself: at the
end of every run it writes **two files** — (1) the **Output** it produced, and (2) a curated
**memory** of what worked, what failed, and what to remember next run — and it **reads that
memory back at the start of the next run** to steer itself.

In the [[Self-Improving App]]'s `autoresearch` loop this is two files under `docs/wiki/`:

- **`log.md`** — the **append-only audit** ledger (Karpathy's `results.tsv` analog): one raw row
  per iteration, never pruned. *What happened, when.*
- **`memory.md`** — the **curated, bounded lessons** file (~60 lines), rewritten and pruned each
  run. Sections: *What works*, *What fails / avoid*, *Open flags — don't re-research*,
  *Well-covered*, *Try next*. *What the next run should do differently.*

## Read-at-start / update-at-end
- **Read** `memory.md` at run start (with `index.md`); let it steer gap selection — skip
  dead-ends, honor open flags, prefer "try next".
- **Update + prune** `memory.md` at run end so it stays distilled and bounded.

Keeping the two files distinct matters: an append-only "memory" would just duplicate `log.md` and
grow unbounded; the value is in the *curation*.

## Beyond Karpathy
Karpathy's original `autoresearch` carries lessons only implicitly — in the **git history** of
kept commits (the code that worked). Loop memory adds an **explicit, read-back prose memory**, so
the lessons are legible and steer the next run directly.

## Operational, not knowledge
`log.md` and `memory.md` are loop-operational files: no frontmatter, excluded from `index.md` and
from [[Wiki-to-Aria Sync]] (never pushed into Aria's RAG).

## See Also
- [[Self-Improving App]]
- [[Independent Verification]]
- [[Four-Condition Loop Test]]
- [[Wiki-to-Aria Sync]]
