"""EPISODE_TITLE: beat sheet, in story order. Build: python audio/build.py EPISODE_SLUG

Beat ids are the contract with src/film.js: every action and camera cut is timed with t('id') / e('id').
  sheet.mark(id, seconds)            silent acting time
  sheet.vo(id, who, text, **mods)    who: milo pip lumi mimi moss | both | laser   mods: whisper squeak slow
  sheet.fx(id, name=None)            SFX from audio/sfx.py (Bobo = 'sniff' 'yip' 'woof' 'nom')
  gap=0.3 → after previous END · gap='@0.2' → after previous START · at=12.0 → absolute
"""
from build import Sheet

sheet = Sheet(
    rate_k=1.4,                     # espeak speaks slowly; 1.3–1.5 sounds natural
    keep={'beat_pause'},            # marks listed here never get shortened
    silences=['beat_pause'],        # room tone drops out: silence is the punchline
)

# SCENE 1 — setup
sheet.mark('s1', 1.2)
sheet.vo('pip_idea', 'pip', 'I have an amazing idea!')
sheet.vo('milo_no', 'milo', 'No.', gap=0.3)
sheet.mark('beat_pause', 1.2, gap=0.1)
sheet.vo('pip_hear', 'pip', "You didn't even hear it!")
sheet.vo('lumi_dont', 'lumi', "We don't need to.", gap=0.35)
sheet.fx('woof', gap=0.3)
sheet.mark('end', 1.0, gap=0.2)
