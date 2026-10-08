# Mochi Family ABC Song

A 60-second music video for the "ABC" song, built in the browser with **Three.js + Canvas 2D**.
It is synced to `assets/song.m4a` and the line timings in `assets/lyrics.srt`.
The cast is the **Mochi Family**, modeled in 3D from the character sheet: Milo, Lumi, Pip, Mimi,
Moss and Bobo.

## Run it

From the repo root (see the root README for one-time setup):

```bash
npm run serve                                   # open http://localhost:8080/player.html?ep=abc-song
node tools/render.mjs abc-song                    # → out/abc-song.mp4 (1280×720, 30 fps, with sound)
node tools/check.mjs abc-song --n 24              # contact sheet → out/abc-song-contact.jpg
```

## How the timing works

* `lyrics.srt` is parsed at load time. Each subtitle line becomes a shot, starting at the line's
  start time.
* Inside each line, words are spread across about 85% of the line by syllable count. This drives
  the karaoke highlight and moments like the "BEEP!" bubbles and the "1 2 3" numbers.
* The tempo was measured from the audio (**74 BPM**, first beat at 0.17 s). Characters bounce,
  letters squash and the dinosaur stomps on that beat grid.
* Lines 9–12 (the chorus) form one shot with the whole family dancing.

To retime the video, edit `lyrics.srt`. To use a different song, replace `song.m4a` and
`lyrics.srt`, and update `BEAT`/`PHASE` in `src/scenes.js`.

## Shot list

| time | shot |
|---|---|
| 0–5.2 | Title "Mochi Family · ABC SONG", the family drops in one by one |
| A–H | apple · balloon · car (BEEP!) · dinosaur (STOMP!) · elephant · fire truck (WEE-OO!) · giraffe · helicopter |
| 31.5–44.3 | Chorus: ABC blocks pop in, a ring of letters, jumping with 1 2 3, hearts |
| I–N | ice cream · jellyfish (underwater) · kite · lion (ROAR!) · monkey swinging · nest with bees |

Each letter shot has a big 3D "Aa" (Fredoka font, extruded) that drops in, the object, and a
family member singing along with an animated mouth. Shots change with a circular wipe that shows
the next letter.

## Files

```
index.html          player (canvas, play/scrub/record, <audio>)
src/main.js         SRT parsing, word timing, timeline, compositor, karaoke bar, letter progress row
src/scenes.js       intro, 14 letter scenes, chorus; stage/platform, 2D backgrounds
engine/characters/mochi.js        the Mochi Family characters (faces, singing mouth, arms, accessories)
src/props.js        apple, balloon, car, dinosaur, elephant, fire truck, giraffe, helicopter,
                    ice cream, jellyfish, kite, lion, tree, monkey, nest, clouds
engine/kit.js          primitives, canvas textures, easing, seeded RNG
assets/             song.m4a, lyrics.srt, Fredoka-Bold.ttf (SIL Open Font License)
tools/render.mjs    headless Chromium → ffmpeg, frame-exact, muxes the song
```
