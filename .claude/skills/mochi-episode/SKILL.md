---
name: mochi-episode
description: End-to-end production of a new Mochi Family video (comedy short or kids song) in this repo — from the user's idea or script to a rendered MP4. Use whenever the user asks to make, produce, render, or adapt a Mochi episode/short/video/story, or gives a new Mochi script. Orchestrates mochi-script → mochi-audio → mochi-film → mochi-review.
---

# Make a Mochi episode

Read `bible/characters.md` and `bible/style.md` first (short — they are the channel rules).
Songs with a provided audio + SRT use the `mochi-song` skill instead of steps 2–4.

## Pipeline (follow in order, one step at a time)

1. **Script** — `mochi-script` skill. Turn the idea into a scene table + beat list. If the user
   gave a full script, keep their jokes; only tighten timing and flag lines that break a character.
   Agree the length target (default short: 45–60 s) before building.
2. **Scaffold** — `node tools/new-episode.mjs <slug> "<Title>"` (copies `episodes/_template`).
3. **Audio & timing** — `mochi-audio` skill: write `episodes/<slug>/beats.py`, then
   `python audio/build.py <slug>`. Read the printed cue table: it IS the timeline. If the duration
   is off target, fix it here (rate_k / gap_scale / mark_scale / cut beats) — never in the film.
4. **Film** — `mochi-film` skill: `src/set.js` (props/sets) and `src/film.js` (choreography +
   shot list), all timed with `t('cue_id')`.
5. **Review** — `mochi-review` skill: contact sheet, fix, re-check only changed times. ≤ 3 passes.
6. **Render** — `node tools/render.mjs <slug>` (→ `out/<slug>.mp4`, run in background, 20–40 min),
   then send the MP4 to the user with SendUserFile.
7. **Commit** — `episodes/<slug>/` (beats.py, src/, episode.json, README.md, assets incl. wav/json).
   Never commit `out/` or MP4s.

## Environment setup (once per container)

```bash
npm install                                   # three + playwright (uses preinstalled Chromium)
python3 -m venv .venv && .venv/bin/pip install espeakng-loader numpy scipy
.venv/bin/python audio/build.py <slug>        # use the venv python for audio
```
`ffmpeg` must be on PATH. The renderer serves three.js from node_modules and Google Fonts are not
needed (Fredoka is in `engine/assets/fonts`).

## Token & time budget

- One session per episode. Don't re-read big files you just wrote; don't paste whole files back.
- Review with ONE contact-sheet image per pass (`tools/check.mjs`), not individual frames.
- Don't render the full MP4 until the contact sheet is clean.
