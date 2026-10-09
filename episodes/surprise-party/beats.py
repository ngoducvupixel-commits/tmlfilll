"""Surprise!: beat sheet, in story order. Build: python audio/build.py surprise-party

The family throws Lumi a surprise birthday party. It goes wrong, and it is next week anyway.
"""
from build import Sheet

sheet = Sheet(
    rate_k=1.3,
    keep={'hide_hold', 'next_week_pause', 'black'},                 # comic silences keep full length
    silences=['hide_hold', 'next_week_pause', 'black'],
)

# SCENE 1 — the banner
sheet.mark('s1', 3.2)                                               # establishing: sunny pink living room
sheet.vo('mimi_left', 'mimi', 'A little left.')
sheet.mark('milo_shuffle', 1.2, gap=0.1)
sheet.vo('mimi_more', 'mimi', 'More left...', gap=0.1)
sheet.mark('milo_lean', 0.9, gap=0.1)
sheet.fx('banner_fall', name='paper_poof', gap=0.05)
sheet.fx('banner_thud', name='thud', gap='@0.3', gain=0.5)
sheet.mark('banner_still', 1.0, gap=0.15)
sheet.vo('moss_fine', 'moss', "<prosody rate='85%'>...I'm fine.</prosody>")
# SCENE 2 — the cake
sheet.fx('roll', gap=0.4)
sheet.vo('pip_behold', 'pip', '<prosody pitch="+15%">Behold! The cake!</prosody>', gap='@0.7')
sheet.fx('shimmer', gap='@0.2')
sheet.vo('mimi_beautiful', 'mimi', "It's beautiful!", gap=0.2)
sheet.fx('sniff', gap=0.2)
sheet.mark('bobo_drool', 1.2)
# SCENE 3 — she's coming
sheet.fx('keys', gap=0.2)
sheet.vo('moss_coming', 'moss', "She's coming.", gap=0.15)
sheet.vo('milo_hide', 'milo', 'Everybody hide!', whisper=True, gap=0.2)
sheet.fx('scramble1', name='fwip', gap=0.05)
sheet.fx('scramble2', name='tap', gap='@0.25')
sheet.fx('scramble3', name='fwip', gap='@0.25')
sheet.mark('hidden', 1.2, gap=0.1)
# SCENE 4 — the door, the silence, the early popper
sheet.fx('door', name='click', gap=0.1)
sheet.mark('lumi_enters', 1.8)
sheet.mark('hide_hold', 2.6)                                        # dead silence: Lumi looks around
sheet.fx('popper', name='pop', gap=0.0)
sheet.fx('confetti', gap='@0.05')
sheet.vo('pip_oops', 'pip', '<prosody rate="80%">...oops.</prosody>', gap=0.3)
sheet.vo('all_surprise', 'all', '<prosody volume="+40%" pitch="+20%">SURPRISE!</prosody>', gap=0.3)
sheet.fx('horn', gap='@0.05')
sheet.vo('mimi_happy', 'mimi', 'Happy birthday, Lumi!', gap=0.4)
# SCENE 5 — wrong day
sheet.mark('lumi_stare', 1.2, gap=0.2)
sheet.vo('lumi_birthday', 'lumi', '...Is it my birthday?')
sheet.vo('milo_yes', 'milo', '<prosody pitch="+20%">Yes!</prosody>', gap=0.3)
sheet.mark('lumi_checks', 1.0, gap=0.2)
sheet.vo('lumi_next', 'lumi', "It's next week.")
sheet.mark('next_week_pause', 2.2, gap=0.1)                         # dead silence
sheet.vo('milo_early', 'milo', '<prosody rate="85%">...Early surprise.</prosody>')
sheet.vo('pip_eat', 'pip', 'So... can we eat the cake now?', gap=0.6)
# SCENE 6 — the button
sheet.mark('reveal_bobo', 1.8, gap=0.3)                             # Bobo face-first in the cake
sheet.fx('nom1', name='nom', gap='@0.3')
sheet.fx('nom2', name='nom', gap='@0.4')
sheet.mark('lumi_smile', 1.0, gap=0.2)
sheet.vo('lumi_best', 'lumi', '...Best birthday ever.')
sheet.fx('woof', gap=0.3)
sheet.fx('cream', name='splat', gap='@0.05')
sheet.mark('splat_hold', 1.4)
sheet.mark('black', 1.0)
