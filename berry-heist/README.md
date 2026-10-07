# Mochi Family: "The Last Berry Mochi"

A 3D comedy heist in 11 scenes (about 74 s), with no music. Every voice, sound effect and
camera move is generated in code from the script.

## Run it

```bash
cd berry-heist
npx http-server -p 8080 -c-1 .                         # open http://localhost:8080
npm install && npm run render                           # → berry-heist.mp4 (1280×720, 30 fps, with sound)
pip install espeakng-loader numpy scipy && python tools/make_audio.py   # rebuild all audio + timing
```

## How the timing works

The whole film is written as a beat sheet in `tools/make_audio.py`: voice lines, sound effects
and silent "acting" beats, in story order.

1. The script synthesizes each voice line first.
2. It lays every beat end to end, using the real durations of the lines. A gap like `'@0.2'`
   means "0.2 s after the previous beat started", which lets beats overlap (whoosh, then the door
   ding, then the THUD).
3. It writes `assets/cues.json`. `src/film.js` looks up every action and camera cut by cue id
   (`t('slap')`, `e('milo_last')`). Retiming a line therefore moves the picture with it.

Comic silences keep their full length: the 3 seconds when Lumi appears, the 2 seconds before
"So…", the beat after the faceplant, and the pause after the slap. The room tone drops out
completely during them.

## Cast & voices (espeak-ng, then cartoon pitch-shift)

| | character | voice settings | sound |
|---|---|---|---|
| Milo | serious "super spy" | `+m3`, low range | whispers in the corridor |
| Pip | inventor | `+m7`, wide range | eager |
| Lumi | deadpan | `+f3`, almost no range | flat |
| Mimi | artist | `+f2` | bright |
| Moss | dry and calm | `+m1`, slow | low |

**Laser 9000** is Pip's own voice sped up and played through a "cheap speaker" (band-pass filter
plus distortion).

## Sets & gags (`src/set.js`)

* **Night corridor:** indicator lights along the walls, a corner for the lookouts, and a
  "LUMI'S LAB" automatic glass door that slides open with a DING.
* **Lab:**
  * A glass-door mini fridge with an electronic lock, the tiny green **OPEN** button, and the
    Berry Mochi under its own light.
  * A drawer cabinet hiding 30 more mochi, plus the empty shelf above the fridge.
  * A desk, lamp, trash bin, the very nice chair, the far-too-small plant, and the pen Milo slips on.
* **Props:** the **LASER 9000** (tape, wires, red bulb, spring-loaded toy hand), the red handprint,
  the "DEFINITELY NOT STOLEN" bag, sunglasses (Pip's are on backwards), Mimi's lampshade and Moss's
  paper wrap.

## Editing cheats (`src/film.js`)

* Close-ups are placed in front of each character's face, using the character's own facing.
  Characters who are talking turn to address the team.
* Anything standing between the lens and the subject is hidden for that shot.
* The camera is kept inside whichever room the scene is in.
