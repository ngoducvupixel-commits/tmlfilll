"""Canonical Mochi Family voices (espeak-ng voice, words/min, pitch 0-99, range 0-99, post pitch-shift).
Keep these stable so the characters sound the same in every episode. See bible/characters.md."""

CAST = {
    'milo': dict(voice='en-us+m3', rate=150, pitch=40, range=15, shift=1.12),   # dry, deadly serious
    'pip':  dict(voice='en-us+m7', rate=175, pitch=72, range=95, shift=1.32),   # bouncy, eager
    'lumi': dict(voice='en-us+f3', rate=135, pitch=50, range=6,  shift=1.08),   # flat deadpan
    'mimi': dict(voice='en-us+f2', rate=165, pitch=80, range=70, shift=1.25),   # bright, artsy
    'moss': dict(voice='en-us+m1', rate=125, pitch=30, range=8,  shift=1.05),   # calm, slow, dry
    # Bobo never speaks: use SFX 'sniff', 'yip', 'woof', 'nom'
}
WHISPER = dict(voice='en-us+whisper', rate=140, pitch=40, range=15, shift=1.08)   # sneaky lines: vo(..., whisper=True)

# voice modifiers available on any vo():
#   whisper=True   use WHISPER
#   squeak=True    tiny/helium voice (pitch ×1.55)
#   slow=True      slowed-down / slow-mo voice (pitch ×0.72)
# special speakers: who='both' (Milo + Pip together), who='laser' (Pip's voice through a cheap speaker; loud=/weak=)
