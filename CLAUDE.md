# Mochi Family channel

3D comedy shorts and kids songs starring the Mochi Family, generated entirely in code:
Three.js picture, espeak-ng voices, numpy SFX, headless-Chromium → ffmpeg render.

- Channel rules: `bible/characters.md`, `bible/style.md` (read before writing any episode).
- Making videos: use the project skills `mochi-episode` (orchestrates `mochi-script`,
  `mochi-audio`, `mochi-film`, `mochi-review`) or `mochi-song` for songs with a provided track.

## Layout

```
engine/            shared runtime — kit.js (primitives/easing), characters/ (Mochi Family + accessories),
                   camera.js (faceCU, shotRunner, blockers), timeline.js (cue clock, lipsync),
                   overlay.js (captions), player.js (renderer, audio-synced player, __seek hook)
audio/             audio_lib.py (espeak + DSP), sfx.py (SFX library), voices.py (canonical cast),
                   build.py (beat sheet → mix.wav, cues.json, lipsync.json)
episodes/<slug>/   episode.json, beats.py, src/{main,film,set}.js, assets/, README.md
episodes/_template the starting point for new episodes (tools/new-episode.mjs copies it)
episodes/model-sheet  turntable of every character + face (visual regression check)
tools/             render.mjs (MP4), check.mjs (contact sheet), new-episode.mjs
player.html        ?ep=<slug> plays any episode; index.html lists them
archive/           non-Mochi experiments (pip-dual-mode)
reference/         user-supplied reference files
```

## Commands

```bash
npm install                                            # once
python3 -m venv .venv && .venv/bin/pip install espeakng-loader numpy scipy   # once
node tools/new-episode.mjs <slug> "<Title>"
.venv/bin/python audio/build.py <slug>
node tools/check.mjs <slug> --n 24                     # → out/<slug>-contact.jpg
node tools/render.mjs <slug>                           # → out/<slug>.mp4
```

## Conventions

- Every frame is a pure function of time T; all timing comes from cue ids in `assets/cues.json`.
- Episode code imports only from `engine/` and its own `src/`; never edit another episode to fix yours.
- Engine changes must keep old episodes rendering: re-run `tools/check.mjs` on `model-sheet` and one episode.
- `out/`, `node_modules/`, `.venv/` and MP4s are never committed.
