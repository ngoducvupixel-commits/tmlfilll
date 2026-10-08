---
name: mochi-review
description: Cheap visual QA and final rendering for Mochi episodes — contact sheets, targeted re-checks, common camera/staging bugs and their fixes, full MP4 render and delivery. Use after changing a Mochi film, when a shot looks wrong, or when the user asks to render/export/send the video.
---

# Review & render

## The loop (≤ 3 passes)

1. `node tools/check.mjs <slug> --n 24` → `out/<slug>-contact.jpg` (one image, times printed by row).
   Read the image once. List every bad tile with its time.
2. Fix all of them in one edit round.
3. Re-check only those times: `node tools/check.mjs <slug> --at 12.3,18,40.5 --cols 4`.
4. Clean → full render in the background: `node tools/render.mjs <slug>` (→ `out/<slug>.mp4`),
   wait for the task notification (don't poll), verify with
   `ffprobe -v error -show_entries format=duration:stream=codec_type -of compact out/<slug>.mp4`,
   then SendUserFile it.

## What bad tiles usually mean

| symptom | cause → fix |
|---|---|
| flat grey / one wall colour | lens inside a wall → tighten `bounds`, or the speaker faces a wall → turn them to the room |
| huge blob of one colour | a character/prop hugging the lens → add it to `blockers`, or move the camera |
| subject hidden behind a friend | blocker radius too small / subject too close to the friend → move people apart |
| face looks wrong for the line | `setFace` timing — check the cue id and `between()` ranges |
| empty-looking prop shot | white prop on white → give it colour; widen fov |
| night shot too bright | lower `scene.environmentIntensity` and hemi |

## Notes

- Check a single frame only when a contact tile is ambiguous: `node tools/render.mjs <slug> --from 12 --to 12.04 --frames out/f`.
- `pkill -f render.mjs` also kills your own shell if the pattern is in its command line — kill by PID.
- Render speed ≈ 0.6–1.3 s/frame (SwiftShader). 60 s ≈ 1800 frames ≈ 20–40 min.
