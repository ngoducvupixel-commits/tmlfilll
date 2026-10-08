# Mochi channel: style & format guide

## Look

- **Visual style**: soft vinyl toys.
  - Rounded boxes, pastel sets, `MeshPhysicalMaterial` via `soft(color)`, soft shadows.
  - Studio environment map (`createRenderer()`).
  - Sets are dioramas made of chunky primitives (`engine/kit.js`), never realistic.
- **Frame**: 1280×720 at 30 fps.
- **Captions**: Fredoka Bold, white with a dark outline, speaker name in the character colour
  (`engine/overlay.js`). Caption every spoken line.
- **Lighting moods**: day is warm (key `0xfff0dc`, hemi 1.2). Night is blue (hemi 0.25,
  `scene.environmentIntensity` 0.12, plus small emissive lights).

## Formats

| kind | length | sound | example |
|---|---|---|---|
| **short** (comedy) | 30–60 s; 75 s max | voices + SFX, **no music** | `do-not-press`, `berry-heist` |
| **song** (kids / ABC) | 60–180 s | the provided song + SRT, karaoke captions | `abc-song` |
| **reference** | n/a | silent | `model-sheet` |

## Comedy rules for shorts

1. **Setup, then tension, then punchline, then a final joke** after the punchline (a button).
2. **Silence is a beat.** A comic pause means a `mark` listed in `keep` + `silences`: the room
   tone drops out and everybody freezes (`bounce: 0, blink: false`). A pause of 1–3 s lands
   harder than any SFX.
3. Keep lines short, one idea per line. Deadpan characters (Lumi, Moss) get the shortest lines.
4. Rule of three for escalations (No. → NO. → "…I wasn't gonna").
5. End on a character beat, not a fade: cut to black, then one more line or sound on black.
6. The Bobo running gag: whenever the team overthinks, Bobo solves or ruins it with one simple action.

## Camera

- Use a **wide** to establish, **CU** for each line (`faceCU(k)`), and hold a **locked wide** for slapstick.
- A speaker who would face a wall turns to address the team (otherwise the CU camera ends up inside the wall).
- Anything between the lens and the subject is hidden automatically (`shotRunner` blockers).
- Use shake only on impacts (0.03–0.05).

## Budget (tokens and time)

- Start **one Claude session per episode**. Long conversations make every tool call expensive.
- Review with **contact sheets** (`tools/check.mjs`): one image per pass. Re-check only the
  times you changed (`--at`). Aim for ≤ 3 review passes.
- A full render takes about 0.6–1.3 s per frame on the cloud box (a 60 s short is about 20–40 min).
  Run it once, at the end.
