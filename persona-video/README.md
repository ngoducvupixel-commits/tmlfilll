# Pip: Dual Mode

A ~52-second motion piece built entirely in the browser with **Three.js + Canvas 2D**.
It recreates the structure and style of the reference "persona" video (6 work modes, each shown as a
calm take and then a chaotic take). The star is an original mascot, **Pip**, a periwinkle robot with a
face-screen and an antenna.

## Run it

Any static server works (ES modules don't load from `file://`):

```bash
cd persona-video
npx http-server -p 8080 -c-1 .     # or: python3 -m http.server 8080
# open http://localhost:8080
```

* **Space**: play/pause. **Scrubber**: seek to any frame (every frame is a pure function of time).
* `?t=23.5` opens paused at a given second.
* **● Record** saves a real-time `.webm` of the canvas from the browser.

## Render a frame-exact MP4

```bash
npm install
npm run render                    # → pip-dual-mode.mp4  (1280×720, 30 fps, H.264)
node tools/render.mjs out.mp4 --from 20 --to 30 --fps 60
node tools/render.mjs --frames frames/          # PNG sequence instead of mp4
```

`tools/render.mjs` opens the page in headless Chromium, calls `window.__seek(t)` for every frame,
and pipes the canvas into `ffmpeg`. It needs `ffmpeg` on your PATH.

## Shot list

| time | shot |
|---|---|
| 0.0–3.3 | Icon cards: CODE · WRITE · RESEARCH · DEBUG · ANALYZE · DESIGN |
| 3.3–6.0 | Title: Pip pops in over speed lines, "PIP", then a diagonal split into **DUAL MODE** |
| 6.0–45.6 | 6 modes × (3.6 s calm + 3.0 s chaos) |
| 45.6–47.6 | Recap: fast cuts back through every chaos shot |
| 47.6–52.6 | Outro: every hat stacks on Pip, "one bot · every mode", DUAL MODE split |

| mode | calm | chaos |
|---|---|---|
| CODE | *one small fix*: desk, monitor, mug steam; the screen turns to "847 ISSUES" | **12 AGENTS**: matrix rain, 12 mini-Pips with neon holo panels, bloom |
| WRITE | *a gentle draft*: a letter writes itself by candlelight | **FULL REWRITE**: 320 instanced pages in a vortex, paper towers, "THE END" |
| RESEARCH | *one good source*: mortarboard, globe, banker's lamp | **847 TABS**: browser windows fly in, book stacks grow, tab counter |
| DEBUG | *hm. a bug.*: a magnifier, evidence markers, a beetle | **KILL IT WITH FIRE**: additive particle flamethrower, fleeing bugs, white flag |
| ANALYZE | *a simple chart*: an easel chart animates bar by bar | **ALL THE DATA**: a 22×22 instanced bar city, donut charts, a glowing trend line |
| DESIGN | *a little sketch*: Pip paints a pixel self-portrait | **MASTERPIECE**: giant growing paint-tube strokes and falling paint drops |

## How it's built

```
index.html        player UI + import map (three@0.169 from unpkg) + Google Fonts
src/main.js       timeline, compositor, bloom, playback/record, __seek hook
src/scenes.js     every shot (stage helper, props, calm/chaos segments, hero/outro)
src/pip.js        the Pip character (eye expressions, arms, antenna) + accessories
src/fx2d.js       2D backgrounds (halftone, sunburst, speed lines, matrix rain), titles, wipes, icons
src/kit.js        primitives (rounded boxes etc. with geometry cache), canvas textures, easing, seeded RNG
tools/render.mjs  headless frame-exact MP4 export
```

Each frame is built in four steps:

1. A segment draws its **2D background** into a canvas. That canvas becomes `scene.background`
   as a `CanvasTexture`.
2. `segment.update(lt)` poses everything as a pure function of local time. Seeded RNG and no
   accumulated state mean any frame renders the same way on any run.
3. Three.js renders the frame (soft shadows, a `RoomEnvironment` IBL, and `UnrealBloomPass` on the
   neon shots). The result is drawn into the output canvas.
4. **Titles, impact flashes and diagonal wipes** are drawn on top in 2D. The title and outro shots
   render the 3D scene twice (a light and a dark variant) and clip the dark one to a diagonal
   polygon for the split-screen effect.

To change the timing, edit the `dur` of a segment. To add a mode, add an entry to `MODES` plus a
`fooCalm()`/`fooChaos()` pair and push them in `main.js`.
