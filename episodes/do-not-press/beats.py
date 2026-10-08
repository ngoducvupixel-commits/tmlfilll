"""DO NOT PRESS: beat sheet with absolute times (the script was timed by hand). Build: python audio/build.py do-not-press"""
from build import Sheet

sheet = Sheet(
    duration=35.0,
    # this episode predates the canonical cast: slightly different Milo / Lumi / Mimi settings
    cast={'milo': dict(voice='en-us+m3', rate=150, pitch=42, range=18, shift=1.12),
          'lumi': dict(voice='en-us+f3', rate=140, pitch=52, range=10, shift=1.10),
          'mimi': dict(voice='en-us+f4', rate=190, pitch=90, range=90, shift=1.35)},
    room_ranges=[(0.0, 21.0), (26.2, 29.0)],   # room tone only here: 21–26 s and after the POOF are truly silent
)

sheet.fx('tick', at=0.6)
sheet.fx('tick2', name='tick', at=1.4)
sheet.fx('tick3', name='tick', at=2.2)
sheet.vo('pip_ooh', 'pip', '<prosody rate="70%" pitch="+20%">Oooooh...</prosody><break time="250ms"/> button.', at=3.4)
sheet.vo('milo_no', 'milo', 'No.', at=5.3)
sheet.vo('milo_NO', 'milo', '<prosody volume="+40%" pitch="+15%">NO!</prosody>', at=7.0)
sheet.vo('pip_wasnt', 'pip', '<break time="150ms"/>I wasn\'t gonna?', at=8.6)
sheet.fx('glasses', at=10.3)
sheet.vo('lumi_stat', 'lumi', '<prosody rate="130%">Statistically<break time="120ms"/> pressing that is <emphasis>extremely</emphasis> stupid.</prosody>', at=10.6)
sheet.vo('pip_how', 'pip', 'How stupid?', at=13.2)
sheet.vo('lumi_pip', 'lumi', 'Pip stupid.', at=15.1)
sheet.vo('pip_wow', 'pip', '<prosody pitch="+30%" volume="+30%">Wow!</prosody>', at=16.1)
sheet.fx('snort', at=16.6, gain=0.9)
sheet.fx('giggle', at=16.85, gain=0.8, lips='mimi')
sheet.fx('sniff', at=18.6)
sheet.fx('sniff2', name='sniff', at=19.4)
sheet.fx('button', at=23.5)
sheet.vo('milo_bobo', 'milo', '<prosody rate="80%">Bobo.</prosody>', at=26.4)
sheet.fx('hum_ramp', at=27.0)
sheet.fx('alarm', at=27.6, gain=0.8)
sheet.fx('clunk', at=28.6)
sheet.fx('poof', at=29.0)
sheet.fx('smoke', at=29.3)
sheet.vo('pip_worth', 'pip', '<prosody rate="85%">worth it.</prosody>', at=31.8, squeak=True)
sheet.vo('milo_family', 'milo', '<prosody volume="+30%">I need a new family!</prosody>', at=33.2, squeak=True)
sheet.fx('yip', at=34.4)
