"""The channel's sound-effect library. Every effect is synthesised (no samples), deterministic,
and returned as a mono float array at audio_lib.SR. Add new ones here and register them in SFX."""
import numpy as np
from scipy import signal
from audio_lib import (SR, speak, shift, norm, env, noise, bp, lp, hp, tone, verb, t_,
                       sfx_tick, sfx_glasses, sfx_button, sfx_sniff, sfx_hum_ramp, sfx_alarm, sfx_clunk,
                       sfx_poof, sfx_smoke, sfx_yip, sfx_snort, room_tone)

rng = np.random.default_rng(11)

def giggle():
    """Mimi's little "hee hee hee" """
    return norm(shift(speak('hee hee hee', 'en-us+f4', 260, 95, 99), 1.5), 0.5)

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
    # from the DO NOT PRESS short
    'tick': sfx_tick, 'glasses': sfx_glasses, 'button': sfx_button, 'hum_ramp': sfx_hum_ramp, 'alarm': sfx_alarm, 'clunk': sfx_clunk,
    'poof': sfx_poof, 'smoke': sfx_smoke, 'yip': sfx_yip, 'snort': sfx_snort, 'giggle': giggle,
    # from The Last Berry Mochi
    'whoosh': whoosh, 'ding': ding, 'ding2': ding2, 'thud': thud, 'skid': skid, 'glasses_slide': glasses_slide, 'zip': zipper,
    'beep': beep, 'brrr': brrr, 'pop': pop, 'boing': boing, 'slap': slap, 'zap': zap, 'bonk': bonk, 'sniff': sfx_sniff,
    'click': click, 'shimmer': shimmer, 'lightswitch': lightswitch, 'buzz': buzz, 'plop': plop,
    'fwip': lambda: soft('fwip'), 'tap': lambda: soft('tap'), 'softpoof': lambda: soft('poof'), 'snap': snap, 'crash': crash,
    'paper_poof': paper_poof, 'splash': splash, 'nom': nom, 'woof': woof, 'drawer': drawer, 'sigh': sigh, 'gulp': gulp,
}

