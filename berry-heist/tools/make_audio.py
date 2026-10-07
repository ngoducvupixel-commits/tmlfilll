"""Mochi Family: "The Last Berry Mochi". Every voice and sound is generated here, and so is the timeline.

The BEATS list below is the whole film in order. Each beat starts `gap` seconds after the
previous beat ENDS. A string gap "@x" means x seconds after the previous beat STARTS, for
overlaps. Beats are voice lines ('vo'), sound effects ('sfx') or silent 'mark's that hold
time for acting. The resulting start times go to assets/cues.json, and the film looks every
action up by id there, so picture and sound can never drift.

    pip install espeakng-loader numpy scipy
    python tools/make_audio.py
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from audio_lib import (SR, speak, shift, soften, norm, write_wav, env, noise, bp, lp, hp, tone, verb, t_,
                       sfx_sniff, sfx_poof, sfx_button, sfx_tick, room_tone)
from scipy import signal

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
A = os.path.join(ROOT, 'assets')
rng = np.random.default_rng(11)

CAST = {
    'milo': dict(voice='en-us+m3', rate=150, pitch=40, range=15, shift=1.12),   # deadly serious "super spy"
    'pip':  dict(voice='en-us+m7', rate=175, pitch=72, range=95, shift=1.32),   # eager inventor
    'mimi': dict(voice='en-us+f2', rate=165, pitch=80, range=70, shift=1.25),   # bright, artsy
    'moss': dict(voice='en-us+m1', rate=125, pitch=30, range=8,  shift=1.05),   # calm, slow, dry
    'lumi': dict(voice='en-us+f3', rate=135, pitch=50, range=6,  shift=1.08),   # flat deadpan
}
RATE_K = 1.5   # espeak is slow; everyone talks a bit faster
WHISPER = dict(voice='en-us+whisper', rate=140, pitch=40, range=15, shift=1.08)

# ------------------------------------------------------------------ extra SFX
def whoosh(d=0.45):
    t = t_(d); e = np.sin(np.pi * t / d) ** 2
    x = noise(d); return norm(((1 - t / d) * bp(x, 300, 1200) + (t / d) * bp(x, 1200, 4000)) * e, 0.6)
def ding():
    d = 1.2; return norm(sum(a * tone(f, d) * env(d, 0.002, 0.9) for f, a in ((1318, 1), (2637, 0.3), (1760, 0.6))), 0.45)
def ding2():
    d = 1.0; return norm(sum(a * tone(f, d) * env(d, 0.002, 0.7) for f, a in ((1760, 1), (3520, 0.25))), 0.4)
def thud():
    d = 0.4; x = tone(np.interp(t_(d), [0, d], [110, 50]), d) * env(d, 0.001, 0.2) + 0.6 * lp(noise(d), 500) * env(d, 0.0005, 0.06)
    return norm(x, 0.9)
def skid(d=0.8):
    t = t_(d); return norm(bp(noise(d), 800, 3000) * (1 - t / d) * np.minimum(1, t / 0.02) * (0.7 + 0.3 * np.sin(t * 90)), 0.35)
def glasses_slide():
    d = 0.5; t = t_(d); return norm(bp(noise(d), 3000, 8000) * (1 - t / d) ** 2 * 0.7, 0.18)
def zipper():
    d = 0.5; t = t_(d); teeth = (np.sin(2 * np.pi * np.cumsum(np.interp(t, [0, d], [60, 110])) / SR) > 0.6).astype(float)
    return norm(bp(noise(d), 2000, 7000) * teeth * np.sin(np.pi * t / d), 0.35)
def beep():
    d = 0.18; return norm(signal.square(2 * np.pi * 1500 * t_(d)) * np.minimum(1, (d - t_(d)) / 0.02) * 0.4, 0.3)
def brrr(d=1.4):
    t = t_(d); f = 55 + 25 * np.sin(t * 7)
    x = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 18 * t)))
    return norm(lp(x, 900) * np.minimum(1, t / 0.1) * np.minimum(1, (d - t) / 0.1), 0.45)
def pop():
    d = 0.12; t = t_(d); return norm(tone(np.interp(t, [0, d], [900, 200]), d) * np.exp(-t / 0.03) + 0.5 * bp(noise(d), 1000, 5000) * np.exp(-t / 0.01), 0.7)
def boing():
    d = 0.7; t = t_(d); f = 220 + 140 * np.sin(2 * np.pi * 9 * t) * np.exp(-t / 0.3)
    return norm(tone(f, d) * np.exp(-t / 0.3) + 0.3 * tone(2 * f, d) * np.exp(-t / 0.2), 0.6)
def slap():
    d = 0.25; t = t_(d); return norm(verb(bp(noise(d), 800, 6000) * np.exp(-t / 0.015) + 0.4 * lp(noise(d), 400) * np.exp(-t / 0.03), 0.3, 0.2), 0.9)
def zap(d=0.6):
    t = t_(d); crackle = (rng.random(len(t)) > 0.985).astype(float)
    x = bp(noise(d), 2000, 9000) * crackle * 6 + 0.25 * signal.square(2 * np.pi * 120 * t) * (rng.random(len(t)) > 0.5)
    return norm(lp(x, 8000) * np.minimum(1, (d - t) / 0.05), 0.4)
def bonk():
    d = 0.35; t = t_(d); x = sum(a * tone(f, d) * np.exp(-t / dd) for f, a, dd in ((180, 1, 0.12), (430, 0.5, 0.08), (1010, 0.3, 0.05)))
    return norm(x + 0.5 * lp(noise(d), 1500) * np.exp(-t / 0.01), 0.75)
def click():
    d = 0.08; t = t_(d); return norm(bp(noise(d), 2000, 8000) * np.exp(-t / 0.006) + 0.3 * tone(2500, d) * np.exp(-t / 0.01), 0.5)
def shimmer(d=1.6):
    out = np.zeros(int(SR * d))
    for i, f in enumerate((1568, 2093, 2637, 3136, 3951, 4186)):
        s = int(SR * i * 0.11); seg = tone(f, d - i * 0.11)[: len(out) - s] * env(d - i * 0.11, 0.005, 0.9)[: len(out) - s]; out[s:s + len(seg)] += seg
    return norm(verb(out, 1.2, 0.4), 0.3)
def lightswitch():
    d = 0.25; t = t_(d); return norm(bp(noise(d), 1500, 6000) * np.exp(-t / 0.008) + 0.6 * tone(320, d) * np.exp(-t / 0.02) + 0.4 * lp(noise(d), 300) * np.exp(-t / 0.05), 0.85)
def buzz(d=3.0):
    t = t_(d); x = signal.sawtooth(2 * np.pi * 120 * t) * 0.5 + signal.square(2 * np.pi * 240 * t) * 0.15
    return norm(lp(x, 1500) * (0.8 + 0.2 * np.sin(t * 13)) * np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.1), 0.12)
def plop():
    d = 0.2; t = t_(d); return norm(tone(np.interp(t, [0, 0.05, d], [500, 900, 700]), d) * np.exp(-t / 0.05), 0.35)
def soft(kind):
    d = 0.5; t = t_(d)
    if kind == 'fwip': return norm(bp(noise(d), 600, 3000) * np.sin(np.pi * t / d) ** 2, 0.18)
    if kind == 'tap': return norm(tone(420, d) * np.exp(-t / 0.05) + 0.2 * lp(noise(d), 1200) * np.exp(-t / 0.02), 0.2)
    return norm(lp(noise(d), 1500) * np.sin(np.pi * t / d) ** 3, 0.2)  # paper poof
def snap():
    d = 0.3; t = t_(d); return norm(bp(noise(d), 1500, 9000) * np.exp(-t / 0.01) + tone(np.interp(t, [0, d], [700, 150]), d) * np.exp(-t / 0.08) * 0.5, 0.85)
def crash():
    d = 1.0; t = t_(d); x = lp(noise(d), 4000) * np.exp(-t / 0.15)
    for f in (180, 410, 733, 1290, 2210): x += 0.3 * tone(f * (1 + rng.random() * 0.03), d) * np.exp(-t / (0.1 + rng.random() * 0.2))
    return norm(verb(x, 0.6, 0.3), 0.95)
def paper_poof():
    d = 0.6; t = t_(d); return norm(bp(noise(d), 400, 5000) * np.minimum(1, t / 0.005) * np.exp(-t / 0.15), 0.7)
def splash():
    d = 0.8; t = t_(d); drops = sum(tone(1000 + 1500 * rng.random(), d) * np.exp(-np.maximum(0, t - s) / 0.03) * (t > s) * 0.15 for s in rng.random(14) * 0.5)
    return norm(bp(noise(d), 500, 6000) * np.exp(-t / 0.12) + drops, 0.7)
def nom():
    d = 0.22; t = t_(d); return norm(lp(noise(d), 1200) * np.sin(np.pi * t / d) ** 2 + 0.3 * tone(260, d) * np.sin(np.pi * t / d), 0.4)
def woof():
    d = 0.3; t = t_(d); f = np.interp(t, [0, 0.06, d], [380, 520, 300])
    x = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.01) * np.exp(-t / 0.12)
    return norm(lp(x, 2500) + 0.3 * bp(noise(d), 600, 3000) * np.exp(-t / 0.05), 0.75)
def drawer():
    d = 0.6; t = t_(d); return norm(bp(noise(d), 200, 1500) * np.minimum(1, t / 0.03) * np.exp(-t / 0.25) + 0.4 * tone(140, d) * np.exp(-np.maximum(0, t - 0.45) / 0.04) * (t > 0.45), 0.5)
def sigh():
    d = 0.9; t = t_(d); return norm(bp(noise(d), 300, 2500) * np.sin(np.pi * t / d) ** 2, 0.15)
def gulp():
    d = 0.25; t = t_(d); return norm(tone(np.interp(t, [0, d], [300, 140]), d) * np.sin(np.pi * t / d) ** 2, 0.4)

SFX = {
    'whoosh': whoosh, 'ding': ding, 'ding2': ding2, 'thud': thud, 'skid': skid, 'glasses_slide': glasses_slide, 'zip': zipper,
    'beep': beep, 'brrr': brrr, 'pop': pop, 'boing': boing, 'slap': slap, 'zap': zap, 'bonk': bonk, 'sniff': sfx_sniff,
    'click': click, 'shimmer': shimmer, 'lightswitch': lightswitch, 'buzz': buzz, 'plop': plop,
    'fwip': lambda: soft('fwip'), 'tap': lambda: soft('tap'), 'softpoof': lambda: soft('poof'), 'snap': snap, 'crash': crash,
    'paper_poof': paper_poof, 'splash': splash, 'nom': nom, 'woof': woof, 'drawer': drawer, 'sigh': sigh, 'gulp': gulp,
}

# ------------------------------------------------------------------ the film, beat by beat
# (gap, kind, id, who-or-sfx, text/ssml, [dur for marks])
B = []
def vo(gap, id, who, text, **k): B.append(dict(gap=gap, kind='vo', id=id, who=who, text=text, **k))
def fx(gap, id, name=None, gain=1.0): B.append(dict(gap=gap, kind='sfx', id=id, name=name or id, gain=gain))
KEEP = {'silence2', 's6', 'cut_lumi', 'lumi_stare', 'black', 'silence3'}   # comic silences keep their full length
def mark(gap, id, dur): B.append(dict(gap=gap, kind='mark', id=id, dur=dur if id in KEEP else round(dur * 0.55, 2)))

# SCENE 1 — top-secret mission (corridor, night)
mark(0, 's1', 1.8)
vo(0.1, 'milo_target', 'milo', 'Target is twelve meters ahead.', whisper=True)
mark(0.15, 'pip_looks', 0.6)
vo(0, 'pip_twelve', 'pip', 'Twelve?')
vo(0.35, 'milo_never', 'milo', 'Never question the mission.', whisper=True)
mark(0.1, 'milo_points', 0.9)
vo(0, 'milo_last', 'milo', '<prosody rate="85%">The last Berry Mochi.</prosody>', whisper=True)
fx(0.2, 'gulp')
vo(0.1, 'pip_beautiful', 'pip', '<prosody rate="80%">So beautiful...</prosody>')
vo(0.2, 'milo_focus', 'milo', 'Focus.', whisper=True)
# SCENE 2 — super spy
mark(0.3, 's2', 1.3)                                    # Mimi & Moss peek, Milo backs up
vo(0, 'milo_3', 'milo', 'Three...')
vo(0.15, 'pip_2', 'pip', 'Two...')
vo(0.15, 'mimi_1', 'mimi', '<prosody pitch="+20%">One!</prosody>')
fx(0.05, 'whoosh')
fx('@0.2', 'ding')
fx('@0.5', 'thud')
fx('@0.05', 'skid')
fx('@0.55', 'glasses_slide')
mark(0.2, 'silence2', 1.0)
vo(0, 'pip_stealthy', 'pip', 'Very stealthy.')
vo(0.4, 'milo_thanks', 'milo', '<prosody rate="80%">...thank you.</prosody>')
# SCENE 3 — LASER 9000
mark(0.4, 's3', 0.8)
vo(0, 'milo_pip', 'milo', 'Pip.')
vo(0.3, 'pip_waiting', 'pip', "I've been waiting my entire life for this.")
fx(0.1, 'zip')
mark(0, 'device_out', 0.7)
vo(0.2, 'moss_why', 'moss', 'Why nine thousand?')
vo(0.3, 'pip_8000', 'pip', "Eight thousand wasn't enough.")
mark(0.1, 'attach', 0.5)
fx(0, 'beep')
fx(0.05, 'brrr')
vo('@0.6', 'pip_watch', 'pip', 'Watch this.')
fx(0.25, 'pop')
fx('@0.04', 'boing')
fx('@0.16', 'slap')
mark(0.15, 'silence3', 1.0)
vo(0, 'mimi_liked', 'mimi', 'I liked it.')
vo(0.3, 'pip_thankyou', 'pip', 'Thank you.')
fx(0.3, 'zap')
vo(0.1, 'laser_1', 'laser', "Pip's super secret laser! Pip is smart! Pip is handsome! Pip")
vo('@2.1', 'pip_nonono', 'pip', '<prosody rate="140%">No no no no no!</prosody>')
fx('@0.4', 'bonk1', 'bonk')
fx('@0.35', 'bonk2', 'bonk')
vo(0.1, 'laser_2', 'laser', '<prosody volume="+60%">Pip is very handsome!</prosody>', loud=True)
mark(0.1, 'facepalm', 0.6)
# SCENE 4 — Bobo solves it
mark(0.2, 's4', 0.3)
fx(0, 'sniff')
mark(0.1, 'bobo_looks', 1.2)                            # lock → down → the little OPEN button
fx(0, 'click')
fx('@0.25', 'ding2')
mark(0.3, 'turn_heads', 1.2)
mark(0, 'bobo_sits', 0.6)
vo(0, 'moss_about', 'moss', '...I was about to suggest that.')
vo(0.3, 'milo_nope', 'milo', "No you weren't.")
# SCENE 5 — the treasure
mark(0.4, 's5', 0.3)
fx(0, 'shimmer')
mark('@0.0', 'push_mochi', 1.4)
vo(0, 'pip_rich', 'pip', '<prosody rate="85%">We\'re rich.</prosody>', whisper=False)
vo(0.3, 'mimi_one', 'mimi', "It's one mochi.")
vo(0.3, 'pip_emo', 'pip', 'Emotionally rich.')
mark(0.2, 'reach', 1.3)
fx(0, 'lightswitch')
# SCENE 6 — Lumi
mark(0, 's6', 3.0)                                      # three seconds of silence...
fx('@0.0', 'buzz')                                      # ...except the Laser 9000
vo(0, 'laser_3', 'laser', '<prosody rate="70%">Pip is handsome...</prosody>', weak=True)
fx(0.25, 'bonk3', 'bonk')
mark(0.1, 'withdraw', 0.9)
vo(0, 'milo_lumi', 'milo', 'Lumi.')
vo(0.35, 'lumi_milo', 'lumi', 'Milo.')
vo(0.35, 'milo_funny', 'milo', 'Funny story.')
mark(0.1, 'lumi_scan', 0.7)
vo(0, 'lumi_doubt', 'lumi', 'I doubt that.')
# SCENE 7 — the worst lie
vo(0.35, 'milo_security', 'milo', "We're performing a security inspection.")
mark(0.15, 'lumi_looks', 2.6)                           # Pip, laser, Mimi, the bag, Moss
vo(0, 'moss_plant', 'moss', "I'm<break time='300ms'/> a plant.")
fx(0.3, 'plop')
mark(0, 'noreact', 0.9)
# SCENE 8 — RUN!
vo(0, 'lumi_five', 'lumi', "I'll give you five seconds.")
mark(0.1, 'milo_glance', 0.8)
vo(0, 'milo_run', 'milo', '<prosody volume="+50%" pitch="+25%">RUN!</prosody>')
mark(0.1, 'slowmo', 4.2)
fx('@0.2', 'fwip1', 'fwip')
fx('@0.8', 'softpoof', 'softpoof')
fx('@0.6', 'tap1', 'tap')
vo('@0.5', 'pip_uhoh', 'pip', 'Uh oh.', slow=True)
fx('@0.9', 'snap')
fx('@0.6', 'fwip2', 'fwip')
# SCENE 9 — total disaster (back to normal speed)
fx(0.9, 'crash')
fx('@0.22', 'boing2', 'boing')
fx('@0.22', 'paper_poof')
fx('@0.22', 'splash')
mark(0, 'chaos_end', 0.3)
# SCENE 10 — deadpan
mark(0.2, 's10', 1.4)
fx(0, 'nom1', 'nom'); fx(0.25, 'nom2', 'nom'); fx(0.25, 'nom3', 'nom')
mark(0.2, 'bobo_stops', 1.1)
fx(0, 'nom4', 'nom')
mark(0.1, 'cut_lumi', 1.8)
vo(0, 'lumi_so', 'lumi', 'So...')
vo(0.7, 'lumi_who', 'lumi', '...who exactly were you stealing it for?')
vo(0.35, 'both_him', 'both', 'Him.')
fx(0.15, 'woof')
# SCENE 11 — punchline
mark(0.4, 's11', 0.8)
fx(0, 'sigh')
fx(0.1, 'drawer')
fx('@0.4', 'shimmer2', 'shimmer')
mark('@0.0', 'reveal', 1.4)
vo(0, 'pip_said', 'pip', '<prosody rate="85%">...you said it was the last one.</prosody>')
vo(0.35, 'milo_was', 'milo', 'It was the last one...')
mark(0.1, 'milo_points_up', 0.7)
vo(0, 'milo_shelf', 'milo', '...on that shelf.')
mark(0.2, 'lumi_stare', 0.9)
vo(0, 'lumi_out', 'lumi', 'Get out.')
mark(0.3, 'black', 0.6)
vo(0, 'pip_road', 'pip', 'Can I take one for the road?')
fx(0.3, 'thud_end', 'thud')
vo(0.3, 'pip_ow', 'pip', 'Ow.')
mark(0, 'end', 1.0)

def voice(b):
    who = b['who']
    if who == 'both':
        a, p = voice(dict(b, who='milo')), voice(dict(b, who='pip'))
        n = max(len(a), len(p)); out = np.zeros(n); out[:len(a)] += a; out[:len(p)] += p; return norm(out, 0.85)
    c = WHISPER if b.get('whisper') else CAST['pip' if who == 'laser' else who]
    x = speak(b['text'], c['voice'], int(c['rate'] * RATE_K), c['pitch'], c['range'])
    if who == 'laser':   # Pip's self-recorded kid voice through a cheap speaker
        x = shift(x, 1.75); x = bp(x, 500, 3500); x = np.tanh(x * (6 if b.get('loud') else 3)); x = norm(x, 0.5 if b.get('weak') else 0.75)
        return x
    x = shift(x, c['shift'] * (0.72 if b.get('slow') else 1.0))
    return norm(soften(x), 0.85 if not b.get('whisper') else 0.7)

def main():
    sounds, cues, lips = {}, [], {}
    for b in B:
        if b['kind'] == 'vo': sounds[b['id']] = voice(b)
        elif b['kind'] == 'sfx' and b['name'] not in sounds: sounds[b['name']] = SFX[b['name']]()
    t, prev_start = 0.0, 0.0
    for b in B:
        g = b['gap']
        start = prev_start + float(g[1:]) if isinstance(g, str) else t + g * 0.55
        dur = b['dur'] if b['kind'] == 'mark' else len(sounds[b['id'] if b['kind'] == 'vo' else b['name']]) / SR
        b['t'], b['d'] = start, dur
        hold = dur if b['kind'] != 'sfx' else min(dur, 0.3)   # sound tails ring out under the next beat
        prev_start = start; t = max(t, start + hold)
        cues.append({'id': b['id'], 't': round(start, 3), 'dur': round(dur, 3), 'kind': b['kind'], **({'who': b['who']} if b['kind'] == 'vo' else {})})
    DUR = round(t + 0.2, 2)
    mix = np.zeros(int(SR * DUR))
    def place(x, t0, g=1.0):
        i = int(t0 * SR); n = min(len(x), len(mix) - i); mix[i:i + n] += g * x[:n]
    # quiet night room tone, but true silence inside the deadpan pauses
    silent = [(c['t'], c['t'] + c['dur']) for c in cues if c['id'] in ('silence2', 's6', 'cut_lumi', 'lumi_stare', 'black')]
    rt = room_tone(DUR) * 0.8; tt = np.arange(len(rt)) / SR
    for a, b2 in silent: rt *= 1 - np.clip(np.minimum((tt - a + 0.15) / 0.15, (b2 + 0.15 - tt) / 0.15), 0, 1)
    place(rt, 0)
    for b in B:
        if b['kind'] == 'vo':
            x = sounds[b['id']]; place(x, b['t']); write_wav(f"{A}/vo/{b['id']}.wav", x)
            who = b['who']
            hop = SR // 60; rms = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x), hop)])
            rms = np.convolve(rms, np.ones(3) / 3, 'same'); rms = np.clip(rms / (np.percentile(rms, 95) + 1e-9), 0, 1)
            for w in (('milo', 'pip') if who == 'both' else (who,)):
                lips.setdefault(w, []).append({'t': round(b['t'], 3), 'v': [round(float(v), 2) for v in rms]})
        elif b['kind'] == 'sfx':
            place(sounds[b['name']], b['t'], b['gain']); write_wav(f"{A}/sfx/{b['name']}.wav", sounds[b['name']])
    mix = mix / max(1.0, np.max(np.abs(mix)) / 0.95)
    write_wav(f'{A}/mix.wav', mix)
    with open(f'{A}/cues.json', 'w') as f: json.dump({'duration': DUR, 'cues': cues}, f, indent=1)
    with open(f'{A}/lipsync.json', 'w') as f: json.dump({'fps': 60, 'tracks': lips}, f)
    for c in cues: print(f"{c['t']:6.2f} {c['dur']:5.2f}  {c['kind']:4} {c['id']}")
    print('duration', DUR)

if __name__ == '__main__':
    main()
