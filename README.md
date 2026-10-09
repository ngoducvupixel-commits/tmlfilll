# Mochi Family channel 🍡

Small friends, big ideas. This repo makes every Mochi Family video **from code**:
3D picture with Three.js, voices with espeak-ng, all sound effects synthesised, rendered frame-exact to MP4.

| Episode | Kind | Length |
|---|---|---|
| [`surprise-party`](episodes/surprise-party) — *Surprise!* (cute look) | comedy short | 44 s |
| [`berry-heist`](episodes/berry-heist) — *The Last Berry Mochi* | comedy short | 74 s |
| [`do-not-press`](episodes/do-not-press) — *DO NOT PRESS* | comedy short | 35 s |
| [`abc-song`](episodes/abc-song) — *Mochi Family ABC Song* | kids song | 60 s |
| [`model-sheet`](episodes/model-sheet) | character reference | 8 s |

Characters & rules: [`bible/characters.md`](bible/characters.md) · [`bible/style.md`](bible/style.md)

## Setup (once)

```bash
npm install                                            # three.js + Playwright (needs Chromium + ffmpeg)
python3 -m venv .venv && .venv/bin/pip install espeakng-loader numpy scipy
```

## Watch

```bash
npm run serve        # http://localhost:8080  → pick an episode (Space = play/pause, scrub, ● Record)
```

## Make a new episode

```bash
node tools/new-episode.mjs pancake-panic "Pancake Panic"   # copies episodes/_template
# 1. write episodes/pancake-panic/beats.py  (the script as beats: lines, SFX, pauses)
.venv/bin/python audio/build.py pancake-panic               # voices + SFX + mix + cues.json
# 2. write episodes/pancake-panic/src/set.js + film.js   (sets, choreography, shot list)
node tools/check.mjs pancake-panic --n 24                   # one contact-sheet image to review
node tools/render.mjs pancake-panic                         # → out/pancake-panic.mp4
```

With Claude Code, just give it the script: the `.claude/skills/mochi-*` skills walk through
script → audio → film → review → render and keep token use low.

## How it fits together

```
beats.py ──audio/build.py──► mix.wav + cues.json + lipsync.json
                                       │
film.js (pose(T) + shot list, timed by cue ids) ──► player.html / tools/render.mjs ──► MP4
```

Real voice acting later? Drop `episodes/<slug>/recordings/<cue id>.wav` and rebuild: timing,
captions and lip-sync follow the recordings.
