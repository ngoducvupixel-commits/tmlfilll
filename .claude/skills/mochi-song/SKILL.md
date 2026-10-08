---
name: mochi-song
description: Make a Mochi Family music video (kids/ABC/educational song) from a provided audio file and SRT — karaoke captions, beat-synced dancing, one scene per lyric line. Use when the user supplies a song (m4a/mp3/wav) and lyrics/SRT for a Mochi video.
---

# Mochi song videos

Pattern: `episodes/abc-song` (copy it: `cp -r episodes/abc-song episodes/<slug>` and edit).

1. Put the user's files in `episodes/<slug>/assets/` (`song.m4a` — convert to AAC with
   `ffmpeg -i in -vn -c:a aac -b:a 160k song.m4a` — and `lyrics.srt`). Set `episode.json`
   `{"kind": "song", "audio": "assets/song.m4a"}`. Only use audio/lyrics the user provides.
2. Tempo: measure BPM + first-beat phase from the audio (onset envelope autocorrelation, see the
   abc-song README) and set `BEAT`/`PHASE` in `src/scenes.js`; characters bounce with `beat(T)`.
3. `src/main.js` parses the SRT; every line becomes a scene (`LETTER_SCENES`-style factories);
   a chorus range can be one scene. Words are spread over 85% of each line by syllables for the
   karaoke highlight; word-level timestamps, if the user has them, beat the estimate.
4. Each scene: big 3D text (Fredoka TTF via `TTFLoader`) + the object + one Mochi singing
   (`setSing(0.25 + 0.75·|sin(10.5T)|)`) + iris wipe showing the next scene's letter/colour.
5. Review/render with `mochi-review` (the renderer muxes the song automatically from episode.json).
