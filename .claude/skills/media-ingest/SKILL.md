---
name: media-ingest
description: "Turn any media that plays — a webinar, a cohort session, an expiring Frame.io/Vimeo share, a recorded call — into a verified transcript, then hand it to wiki-ops for ingestion. Use for 'transcribe this video', 'ingest this session/webinar', 'we have no transcript for X', or when a share has downloads disabled. Works on anything that plays: it records audio off playback, never the video stream."
---

# Media Ingest

Closes the one missing hop in the media→knowledge path. Everything downstream of
"we have a transcript" already exists — this skill produces it and hands off.

**Interface:** media that plays → a *verified* transcript at
`docs/wiki/raw/external/<slug>.md` → invoke `wiki-ops ingest` on that file.

**Do not** duplicate `wiki-ops`. Source pages, entity/concept updates, cross-refs,
`index.md`, and `log.md` are its job. This skill stops at a good transcript.

## Why it works

It never touches the video stream, so downloads-disabled and DRM are irrelevant.
**If it plays, it captures.** The cost is that capture is real-time — a 33-minute
session takes 33 minutes.

## Steps

### 1. Identify the asset

Use the Chrome tools: `navigate` to the share, then `get_page_text` for title and
duration, and a `screenshot` of the player to identify speakers and on-screen slides.

Note the expiry if shown — these shares are often time-limited (~9 days), which
makes capture the clock-bound step. Say so.

**Never imply you watched it.** Until step 5 produces a transcript, you have a
title, a duration, and a screenshot. State that plainly.

### 2. Route audio (manual — the user must do this)

Windows: route **just the source app**, not the whole system, so notifications and
Slack pings stay out of the recording:

> Settings → System → Sound → Volume mixer → *the app* → Output device → **CABLE Input**

Install [VB-Audio Virtual Cable](https://vb-audio.com/Cable/) if absent. To hear it
while capturing, tick **Listen** on CABLE Output.

**Stereo Mix is a trap on this hardware — do not spend time on it.** The Conexant
ISST driver enumerates it in both DirectShow and WASAPI, and the Sound panel shows
it enabled with jack info, but it never opens: dshow reports `could not find output
pin`, WASAPI returns `AUDCLNT_E_DEVICE_IN_USE` (`0x8889000a`) at every sample rate
and channel count. It is a phantom endpoint. Use VB-Cable.

### 3. Capture

Have the user seek to 0:00 and press play, then run for the full duration plus margin:

```bash
ffmpeg -thread_queue_size 1024 -f dshow \
  -i "audio=CABLE Output (VB-Audio Virtual Cable)" \
  -t <seconds> -c:a pcm_s16le out.wav
```

Run this in the background and let it finish — capture is real-time. List devices
with `ffmpeg -list_devices true -f dshow -i dummy` if the name doesn't match.

### 4. Verify signal — this is a gate, not a suggestion

A silent take is **indistinguishable from a good one** until it transcribes to
nothing, 30 minutes later, having spent money.

```bash
ffmpeg -i out.wav -af volumedetect -f null -
```

Measured on this setup:

| Result | `mean_volume` | Verdict |
|---|---|---|
| Dead capture (silence) | **−91.0 dB** (and `max_volume` == `mean_volume`) | Routing is wrong. Go back to step 2. |
| Real speech | **≈ −21 to −25 dB** | Proceed. |

**Rule: `mean_volume` below ~−60 dB means the capture failed.** Do not transcribe
it. `max_volume` equal to `mean_volume` is the giveaway for true digital silence.

Verify on a short test capture *before* committing to a long one.

### 5. Transcribe

```bash
node scripts/transcribe-media.mjs <file> --prompt "<proper nouns>" [--out <path>]
```

Run `--dry-run` first — it reports duration, chunk plan, and cost, and makes no
network calls. Rate is ~$0.006/min (a 33-min session ≈ $0.20).

`OPENAI_API_KEY` comes from the shell env or a repo-root `.env` (shell wins).

**`--prompt` is load-bearing.** Whisper reliably mangles proper nouns — verified
`"Henneberry" → "Hanbury"`. Pass every name, product, and bit of jargon you expect:
speakers, companies, "Harbormill", "Aria". Only the first ~224 tokens are used.

**Whisper does not diarize.** A multi-speaker recording returns one unattributed
stream. Attribute speakers from context, and say in the output that attribution is
inferred, not certain. If attribution must be exact, use a service with speaker
labels (AssemblyAI, Deepgram) instead.

### 6. Hand off

Invoke `wiki-ops ingest` on the transcript. When it appends to `docs/wiki/log.md`,
the provenance note must record: no transcript existed / downloads disabled, audio
captured from playback via VB-Cable, transcribed with `scripts/transcribe-media.mjs`,
and **speaker attribution inferred from context**.

## Rules

- **Raw third-party transcripts never leave the machine.** They live in
  `docs/wiki/raw/external/` — gitignored, and excluded from Aria's RAG by
  `EXCLUDE_DIRS` in `scripts/sync-wiki.mjs`. Do not commit them, do not sync them,
  do not paste them into a durable file. Both guards are needed: `sync-wiki` walks
  the filesystem, so gitignore alone protects nothing.
- **The durable artifact is the summary** in `docs/wiki/sources/`, written by
  `wiki-ops` — not someone else's content verbatim.
- **This is third-party material.** It is input to Harbormill's own thinking. Do not
  republish it, and do not turn it into public/marketing copy that resells their
  content. Original insight informed by it is fine; their words as our content is not.
- **Verify before spending.** `--dry-run` for cost, `volumedetect` for signal.

## Prior runs

- Hyperagent "Tool Wars" panel (2026-07-15) — 37 min, downloads disabled, no captions.
  → `docs/wiki/sources/tool-wars-panel-2026.md`. The run that produced this method,
  including the Stereo Mix dead end and the `raw/external` RAG leak found by a
  `sync:wiki` dry-run during verification.
