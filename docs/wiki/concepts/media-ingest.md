---
title: Media Ingest
type: concept
created: 2026-07-15
updated: 2026-07-15
sources: [.claude/skills/media-ingest/SKILL.md, scripts/transcribe-media.mjs, scripts/sync-wiki.mjs]
tags: [loops, knowledge, wiki, rag, ingestion, tooling]
---

# Media Ingest

The **media→knowledge path**: anything that plays — a cohort session, a webinar, a recorded call
— becomes a verified transcript, then a wiki page, then part of [[Aria]]'s RAG. Implemented as
the `media-ingest` skill (`.claude/skills/media-ingest/SKILL.md`).

Everything downstream of *"we have a transcript"* already existed ([[Wiki-to-Aria Sync]], the
`wiki-ops` ingest flow, the `transcript-summarize` edge function). This closes the one missing
upstream hop and hands off — it is deliberately **not** a second ingest pipeline.

> **Interface:** media that plays → verified transcript in `docs/wiki/raw/external/` →
> `wiki-ops ingest` → source page → concept/analysis updates.

## Why it exists

Three sessions arrived in a row with **no transcript and downloads disabled**
([[Ditching Hourly (Jonathan Stark, 2026)]]; the *Tool Wars* panel;
[[What Actually Matters in AI Right Now (2026)]]). It passes the [[Four-Condition Loop Test]]
cleanly: it repeats, "done" is objectively checkable, a wasted run costs ~$0.20, and the tools
exist — so it became a skill rather than a third one-off.

**All three are now captured** — Stark ingested 2026-07-15 as the skill's first run *as a skill*
(48:19, gate passed at −24.2 dB, ~$0.29, 0 errors). That run surfaced a failure mode worth
recording: the Frame.io player was **muted with its volume at zero**, and the page carried three
`<video>` elements of which only the blob-backed one was live. Routing was already correct and
the capture would still have been 48 minutes of silence. **Check that the source is actually
emitting audio before trusting the routing** — the gate catches it, but only after you've spent
the wall-clock.

## How it works

It **never touches the video stream** — it records the audio off playback. Downloads-disabled and
DRM are therefore irrelevant: *if it plays, it captures.* The cost is that capture is real-time.

The **signal gate** is the load-bearing step and the objective done-rule for capture: a silent
take is indistinguishable from a good one until it transcribes to nothing, having spent money.
Measured on this hardware: digital silence reads ≈ **−91 dB** mean (with max equal to mean); real
speech ≈ **−21 to −25 dB**. Below ~−60 dB, the capture failed — don't transcribe it.

Transcription is `scripts/transcribe-media.mjs` (Whisper, ~$0.006/min, chunked to clear the
25MB/request cap and stitched onto one timeline).

## Known limits

- **Whisper does not diarize.** Multi-speaker audio returns one unattributed stream; speakers are
  inferred from context. Easier for a two-person interview than a panel, never certain. Say so in
  the output. Speaker labels need a different service (AssemblyAI, Deepgram).
- **Proper nouns get mangled** unless seeded via `--prompt` (observed: Cole Medin, Dave Ebbelaar,
  Henneberry). Only the first ~224 tokens are used.
- **Whisper hallucinates boilerplate** — an unspoken "Transcribed by otter.ai" trailer has been
  observed. Don't trust the tail of a transcript.
- **Capture is manual and real-time.** Audio routing needs a person at the machine, and 33
  minutes of session takes 33 minutes.

## The standing rule: third-party material stays local

**This repo is public** (`github.com/Pdiamondz1/harbormill-aios`). Two guards, and both are
needed:

1. **`.gitignore`** keeps `docs/wiki/raw/external/` out of git.
2. **`EXCLUDE_DIRS` in `scripts/sync-wiki.mjs`** keeps it out of [[Aria]]'s RAG — `sync-wiki`
   walks the filesystem, so being untracked is **no protection on its own**. A verbatim
   transcript would also blow past `text-embedding-3-small`'s ~8k-token limit.

Neither guard covers the **summary page**, which is where quotes would land — and summaries *are*
public. So the rule is editorial, not mechanical:

- Restricted or gated source material (paid cohorts, expiring shares) is **summarized in
  Harbormill's own words** — conclusions and the facts needed to reason, **no verbatim quotes, no
  blow-by-blow reconstruction**.
- It is **input to Harbormill's thinking, never Harbormill's content**. Do not repackage a source
  as marketing.
- Harbormill's *conclusions* are Harbormill's IP and are fine to publish. The source's
  *expression* is not ours to republish.

## See Also

- [[Four-Condition Loop Test]]
- [[Wiki-to-Aria Sync]]
- [[Self-Improving App]]
- [[Knowledge & RAG]]
- [[What Actually Matters in AI Right Now (2026)]]
- [[Ditching Hourly (Jonathan Stark, 2026)]]
- [[Aria]]
- Skill: `.claude/skills/media-ingest/SKILL.md`
