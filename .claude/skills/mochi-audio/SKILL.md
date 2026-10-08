---
name: mochi-audio
description: Build a Mochi episode's voices, sound effects, mix and timing (cues.json, lipsync.json) from a beat sheet with audio/build.py; add new SFX; retime or shorten an episode; swap in real voice recordings. Use for any Mochi audio, voice, SFX, timing or duration work.
---

# Mochi audio & timing

Everything audible is generated: espeak-ng voices (`audio/voices.py`) + numpy SFX (`audio/sfx.py`),
mixed by `audio/build.py`. The cue table it prints is the episode's timeline.

## beats.py

```python
from build import Sheet
sheet = Sheet(rate_k=1.4, gap_scale=1.0, mark_scale=1.0,
              keep={'pause1'},          # marks never shortened by mark_scale
              silences=['pause1'])      # room tone drops out → true silence
sheet.mark('s1', 1.5)                                   # acting time, no sound
sheet.vo('milo_no', 'milo', 'No.', gap=0.3)             # gap = after previous END
sheet.fx('ding', gap='@0.2')                            # '@x' = after previous START (overlaps)
sheet.vo('pip_ow', 'pip', 'Ow.', squeak=True)           # whisper= squeak= slow=  who: both | laser
sheet.fx('tick2', name='tick', at=1.4)                  # absolute time; repeated SFX need unique ids
```
Text can use espeak SSML: `<prosody rate="85%" pitch="+20%" volume="+40%">`, `<break time="300ms"/>`,
`<emphasis>`. Ids must be unique; the film refers to them, so pick readable ids (`lumi_doubt`).

Build: `.venv/bin/python audio/build.py <slug>` → `assets/{mix.wav,cues.json,lipsync.json,vo/,sfx/}`.

## Fixing duration

Too long? In this order: cut beats → shorten marks → `gap_scale` 0.6–0.8 → `rate_k` up to 1.5.
Never shorten the comic silences (put them in `keep`). Re-run build; the film follows automatically.

## SFX library (`audio/sfx.py` → `SFX`)

tick glasses button hum_ramp alarm clunk poof smoke yip snort giggle whoosh ding ding2 thud skid
glasses_slide zip beep brrr pop boing slap zap bonk sniff click shimmer lightswitch buzz plop fwip tap
softpoof snap crash paper_poof splash nom woof drawer sigh gulp

New SFX: write a function returning a mono float array (helpers: `tone noise env bp lp hp verb t_ norm`
from `audio_lib`), register it in `SFX`. Keep them short and mixed ≤ 0.9 peak.
An SFX can drive a mouth: `sheet.fx('giggle', lips='mimi')`.

## Voices

Canonical settings in `audio/voices.py` — don't change per episode (an episode may override via
`Sheet(cast={...})` only for a special voice). **Real recordings**: save them as
`episodes/<slug>/recordings/<cue id>.wav|m4a|mp3` and rebuild — the layout, captions and lip-sync
all follow the real lengths automatically.
