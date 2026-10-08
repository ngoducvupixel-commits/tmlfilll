---
name: mochi-film
description: Write or fix a Mochi episode's 3D picture — sets/props (src/set.js) and choreography + camera shot list (src/film.js) — using the shared engine (characters, faceCU camera, shotRunner, captions). Use when building scenes, staging characters, adding props, fixing camera/blocking/occlusion, or changing how a Mochi video looks.
---

# Mochi film code

Start from `episodes/_template/src/` (it is a minimal working example). Engine API:

| module | use |
|---|---|
| `engine/kit.js` | `rbox box cyl sph tor cone plane at group canvasTex` · `lerp prog clamp easeInOut easeOut easeBack bounce rng` |
| `engine/characters/mochi.js` | `FAMILY.milo()` … `bobo()` · `soft(color)` material · `CHARACTERS` |
| `engine/characters/accessories.js` | `berryMochi() sunglasses() cupAndTablet()` |
| `engine/timeline.js` | `clock(cues)` → `t(id, off)`, `e(id, off)`, `between`, `speaking(who,T)` · `mouth(lipsync, who, T)` |
| `engine/camera.js` | `faceCU(k, size, side, up)` · `fixed(p,l,fov)` · `move(p0,p1,l0,l1,a,b,fov)` · `shotRunner(camera, shots, {bounds, blockers, shake})` · `characterBlockers(c)` · `toScreen` |
| `engine/overlay.js` | `captions(ctx,T,cues,font,LINES)` · `star(ctx,x,y,r)` |

## Hard rules

1. **Pure function of T.** `pose(T)` sets every position/rotation/face from scratch each frame
   (reset visibility first). No accumulated state, no `Math.random()` (use `rng(seed)`).
2. **Time with cue ids only**: `t('slap')`, `e('milo_last', 0.2)`. Never hard-code seconds.
3. **Per character each frame**: `setSing(mouth(...))` → `setFace(...)` → `update(T, {bounce, blink})`
   → then override arms/lean. Freeze in comic pauses: `bounce: 0, blink: false`, `setSing(0)`.
4. **Camera**: `[t('cue'), () => faceCU(c.lumi, 1.3, 0.2)]` for each line; `fixed`/`move` for wides.
   `bounds` must clamp the lens inside the current room. `blockers` hides anything in front of the
   subject — include big props too (`[obj, centerHeight, radius]`).
5. **Facing**: `face(x,z,tx,tz) = atan2(tx-x, tz-z)`. Characters who talk while facing a wall/prop
   must turn toward the room (`speaking(who,T)`), otherwise their CU camera lands in the wall.
6. Fallen / lying pose: `root.rotation.x = -π/2`, `root.position.y = 0.5`.
   Tiny: `root.scale.setScalar(0.12)` + floor-level camera, fov ~42.
7. Sets: chunky primitives, pastel `soft()` colours, labels via `canvasTex` (Fredoka font).
   Night = low hemi + `scene.environmentIntensity = 0.12` + emissive dots; day = hemi 1.2.

Then verify with the `mochi-review` skill — don't guess framing, look at a contact sheet.
