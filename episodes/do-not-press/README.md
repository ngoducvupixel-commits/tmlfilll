# Mochi Family: "DO NOT PRESS"

A 35-second comedy short with no background music. The comedy comes from voices, silence and
sound effects. Every sound is generated in code, so no recordings are needed.

## Run it

From the repo root (see the root README for one-time setup):

```bash
npm run serve                                   # open http://localhost:8080/player.html?ep=do-not-press
node tools/render.mjs do-not-press                    # → out/do-not-press.mp4 (1280×720, 30 fps, with sound)
node tools/check.mjs do-not-press --n 24              # contact sheet → out/do-not-press-contact.jpg
.venv/bin/python audio/build.py do-not-press    # rebuild voices + SFX + timing from beats.py
```

## Audio pipeline (`beats.py + audio/build.py`)

```bash
.venv/bin/python audio/build.py do-not-press   # regenerates everything in assets/
```

* **Voices**: espeak-ng with a different voice, pitch, range and speed per character, then
  cartoon pitch-shifting. The two "squeaky" lines are shifted up a further 1.55×.

  | character | voice | sound |
  |---|---|---|
  | Milo | `en-us+m3`, low range | dry and tired |
  | Pip | `en-us+m7`, wide range | bouncy |
  | Lumi | `en-us+f3`, almost no range | deadpan |

* **SFX**: synthesized with numpy and scipy. These are the tool ticks, glasses click, snort and
  giggle, sniffs, the button CLICK (with reverb), motor ramp, alarm, clunk, POOF (noise burst plus
  chime), smoke, and Bobo's tiny "yip".
* **Mix**: `assets/mix.wav` follows the cue sheet in the script. Room tone stops completely for
  the two silences, because the silence is the punchline.
* **Outputs used by the video**:
  * `assets/cues.json` holds the timings that drive captions.
  * `assets/lipsync.json` holds per-line volume envelopes at 60 fps, which open and close each
    character's mouth.

To use real voice acting later, replace the files in `assets/vo/` with recordings of the same
names, then re-run the mix part of the script. Captions and lip sync update automatically.

## Script

| time | what happens |
|---|---|
| 0–3 | Milo fixes the Machine. *tik… tik… tik.* Slow push-in to the button. |
| 3–10 | Pip: "Ooooh… button." Milo: "No." … "NO." Pip: "…I wasn't gonna." |
| 10–18 | Lumi: "Statistically… pressing that is extremely stupid." Pip: "How stupid?" *(1 s stare)* Lumi: "…Pip stupid." Pip: "WOW." Mimi snorts, Moss shakes his head. |
| 18–24 | Bobo appears from under the table, *sniff sniff*, head tilt. Close-ups: Bobo, the button, Bobo. Boop. **CLICK.** |
| 24–27 | Two seconds of dead silence, then Milo, to camera: "…Bobo." |
| 27–29 | The Machine goes wild: motor, alarm, KA-CHUNK. |
| 29–35 | POOF: everyone is 12% size (except Moss's sprout). Pip: "…worth it." Milo: "I need a new family!" Bobo: *yip!* Cut to black. |

## Files

```
src/film.js     choreography for all 6 characters, 18-shot camera list, captions, flash
src/set.js      workshop room, the Machine (button, gauges, coil, alarm lights, steam),
                side table, crate, screwdriver
engine/characters/mochi.js    Mochi Family characters (+ "flat" and "angry" faces for this short)
src/main.js     player + compositor (audio-synced, scrub, record)
beats.py        the beat sheet (absolute times) → audio/build.py makes voices, SFX, mix, cues
```
