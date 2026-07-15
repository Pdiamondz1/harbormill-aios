---
name: media-ingest
description: "Turn any media that plays — a webinar, a cohort session, an expiring Frame.io/Vimeo share, a recorded call — into a verified transcript. Use for 'transcribe this video', 'ingest this session/webinar', 'we have no transcript for X', or when a share has downloads disabled. Works on anything that plays: it records audio off playback, never the video stream."
---

# Media Ingest

Closes the one missing hop in the media→knowledge path: media that plays, but has
no transcript and no download.

**Interface:** media that plays → a *verified* transcript at a path you name.
This skill stops at a good transcript; what happens to it next is the project's business.

> **Source of truth:** maintained in the `harbormill-aios` repo at
> `.claude/skills/media-ingest/`, and deployed to `~/.claude/skills/media-ingest/` so
> every project can reach it. The two are byte-identical copies — if you are reading
> this from `~/.claude/`, fix the repo version and re-copy, or they will drift.

## Scope

Machine-level capability — the hard-won parts below (VB-Cable routing, the Stereo Mix
dead end, the −60 dB gate) are facts about **this laptop**, true in every project.

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

**The automation tab cannot play video — don't try, and don't debug it.** The MCP tab
runs `visibilityState: "hidden"`, and Chrome will not load media in a hidden tab: the
player mounts, shows a spinner, reports `readyState: 0` / `networkState: 2` forever, and
`currentTime` never advances. Clicking play "works" and changes nothing. Verify with
`javascript_tool`: `document.visibilityState` — if it's `hidden`, stop.

This costs you nothing, because **the capture never needed that tab**. ffmpeg records the
*audio device*, so the video plays in the user's own visible tab and the automation tab is
only ever for identifying the asset (title, duration, speaker, slides). Frame.io's player
also reports `duration: null`; read the duration off the UI instead (switch the time format
from Timecode to Standard).

Some players expose a direct asset URL in the DOM (e.g. `assets.frame.io/encode/…`).
**Do not fetch it.** Downloads are disabled on these shares deliberately; capturing off
playback is the sanctioned path precisely so we don't circumvent that.

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

**Start ffmpeg first, then have the user seek to 0:00 and play.** In that order — audio
already playing when capture starts is audio you have permanently lost, and you cannot
tell from the file. Run for the full duration **plus generous margin** (40 min for a 35-min
talk): trailing silence is trimmed for free in step 4, a missing head is not recoverable
without another real-time pass.

```bash
ffmpeg -thread_queue_size 1024 -f dshow \
  -i "audio=CABLE Output (VB-Audio Virtual Cable)" \
  -t <seconds> -c:a pcm_s16le out.wav
```

Run this in the background and let it finish — capture is real-time. List devices
with `ffmpeg -list_devices true -f dshow -i dummy` if the name doesn't match.

Ask the user to keep other audio quiet for the duration: this captures everything the
app sends to CABLE Input, so a notification chime lands in the transcript.

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

**Confirm something was actually playing before you blame the routing.** A silent take has
two causes — wrong routing, or nothing playing — and the dB reading cannot tell them apart.
Check playback first (in the user's tab: is it running? did `currentTime` advance?), *then*
interpret the gate. Sending the user to re-do their audio routing when the real problem was
a paused video wastes their time and your credibility.

**Reconstruct what you actually got with `silencedetect` before transcribing:**

```bash
ffmpeg -i out.wav -af silencedetect=noise=-50dB:d=2 -f null -
```

Speech-end minus the known duration tells you where the recording sits inside the talk. If
speech ends at 1978s on a 2088s video, capture began 110s late and **you are missing the
first 1:50** — say so plainly rather than presenting a partial transcript as complete.

**Trim trailing silence before step 5.** Whisper hallucinates text over long digital
silence, so feeding it dead minutes actively pollutes the transcript (and you pay for it):

```bash
ffmpeg -i out.wav -t <speech_end_seconds> -c copy body.wav
```

### 5. Transcribe

The script ships beside this skill. Call it by absolute path — cwd varies by project:

```bash
node ~/.claude/skills/media-ingest/scripts/transcribe-media.mjs \
  <file> --prompt "<proper nouns>" [--out <path>]
```

Run `--dry-run` first — it reports duration, chunk plan, and cost, and makes no
network calls. Rate is ~$0.006/min (a 33-min session ≈ $0.20).

`OPENAI_API_KEY` comes from the shell env (already set on this machine), or from a
`.env` beside the script. Shell wins. Zero third-party deps — only `node:` builtins,
so it runs from any directory with no install step.

**Always pass `--out` explicitly.** The default output path is derived from the script's
own location (`__dirname/..`), which was repo-relative by design — in the deployed copy it
resolves to `~/.claude/skills/media-ingest/docs/wiki/raw/external/…`, inside the skill
directory. `--dry-run` prints the resolved path; read it.

**`--prompt` is load-bearing.** Whisper reliably mangles proper nouns — verified
`"Henneberry" → "Hanbury"`. Pass every name, product, and bit of jargon you expect:
speakers, companies, "Harbormill", "Aria". Only the first ~224 tokens are used.

**…but `--prompt` bleeds.** Whisper often echoes the prompt back as the opening
"speech" — especially when the audio starts mid-stream — and will pull names *from your
prompt list* into that echo. Verified: a prompt naming both the uploader and the speaker
produced an opening line attributing the talk to the wrong person. **Treat the first block
as suspect**, check it against the audio's real start, and never source a speaker
attribution from it. Pass only names you expect to actually be said; every extra name is a
hallucination target.

**Whisper does not diarize.** A multi-speaker recording returns one unattributed
stream. Attribute speakers from context, and say in the output that attribution is
inferred, not certain. If attribution must be exact, use a service with speaker
labels (AssemblyAI, Deepgram) instead.

### 6. Hand off

Depends on the project:

- **`harbormill-aios`** — write the transcript to `docs/wiki/raw/external/<slug>.md`
  and invoke `wiki-ops ingest` on it. `wiki-ops` owns everything downstream: source
  pages, entity/concept updates, cross-refs, `index.md`, `log.md`. Do not duplicate it.
- **Any other project** — there is no wiki to feed. Leave the transcript where the
  user asked and stop.

Either way, the provenance note must record: no transcript existed / downloads
disabled, audio captured from playback via VB-Cable, transcribed with
`transcribe-media.mjs`, and **speaker attribution inferred from context**.

## Rules

- **Raw third-party transcripts never leave the machine.** Someone else's full text is
  not yours to publish. Do not commit it, do not sync it into a RAG index, do not paste
  it into a durable file.
  - *In `harbormill-aios`:* they live in `docs/wiki/raw/external/` — gitignored **and**
    excluded from Aria's RAG by `EXCLUDE_DIRS` in `scripts/sync-wiki.mjs`. Both guards
    are needed: `sync-wiki` walks the filesystem, so gitignore alone protects nothing.
  - *Elsewhere:* keep it out of the repo. Check what indexes the filesystem before you
    assume gitignore is enough.
- **The durable artifact is the summary, in your own words** — not someone else's
  content verbatim. In `harbormill-aios` that's `docs/wiki/sources/`, written by
  `wiki-ops`.
- **This is third-party material.** It is input to Harbormill's own thinking. Do not
  republish it, and do not turn it into public/marketing copy that resells their
  content. Original insight informed by it is fine; their words as our content is not.
- **Verify before spending.** `--dry-run` for cost, `volumedetect` for signal.

## Prior runs

- Hyperagent "Tool Wars" panel (2026-07-15) — 37 min, downloads disabled, no captions.
  → `docs/wiki/sources/tool-wars-panel-2026.md`. The run that produced this method,
  including the Stereo Mix dead end and the `raw/external` RAG leak found by a
  `sync:wiki` dry-run during verification.
- AIS LIVE Day 2, "The Client Didn't Ask for AI" (2026-07-15) — 34:48, downloads disabled.
  → `docs/wiki/sources/the-client-didnt-ask-for-ai-2026.md`. First run of the deployed
  global copy. Produced the hidden-tab finding (step 1), the prompt-bleed finding (step 5),
  and the `--out` wart. Also the cautionary one: a −91 dB test capture was misread as a
  routing failure when the real cause was a paused video, and capture was started *after*
  playback — permanently losing the first 1:49. Both are why steps 3 and 4 now say what
  they say. The gate did its job twice: it caught the dead take, and correctly rejected a
  silent top-up attempt rather than paying to transcribe nothing.
