"""Shared audio toolkit: espeak-ng voices via ctypes + numpy SFX synthesis (from the red-button short)."""
import ctypes, json, os, wave
import numpy as np
from scipy import signal
import espeakng_loader

SR = 48000
rng = np.random.default_rng(7)

# ------------------------------------------------------------------ espeak-ng via ctypes
lib = ctypes.CDLL(espeakng_loader.get_library_path())
CB = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.POINTER(ctypes.c_short), ctypes.c_int, ctypes.c_void_p)
lib.espeak_Initialize.restype = ctypes.c_int
ES_SR = lib.espeak_Initialize(1, 0, espeakng_loader.get_data_path().encode(), 0)  # AUDIO_OUTPUT_RETRIEVAL
_buf = []
@CB
def _cb(wav, n, ev):
    if n > 0: _buf.append(np.ctypeslib.as_array(wav, shape=(n,)).copy())
    return 0
lib.espeak_SetSynthCallback(_cb)
RATE, VOLUME, PITCH, RANGE = 1, 2, 3, 4

def speak(ssml, voice, rate, pitch, rng_, vol=100):
    _buf.clear()
    lib.espeak_SetVoiceByName(voice.encode())
    for p, v in ((RATE, rate), (PITCH, pitch), (RANGE, rng_), (VOLUME, vol)): lib.espeak_SetParameter(p, v, 0)
    txt = f'<speak>{ssml}</speak>'.encode()
    lib.espeak_Synth(txt, len(txt) + 1, 0, 0, 0, 0x10 | 0x00, None, None)  # espeakSSML
    lib.espeak_Synchronize()
    x = np.concatenate(_buf).astype(np.float32) / 32768
    x = signal.resample_poly(x, SR, ES_SR)
    nz = np.flatnonzero(np.abs(x) > 0.01)                      # trim silence
    return x[max(0, nz[0] - 200): nz[-1] + 600] if len(nz) else x

def shift(x, factor):
    """cartoon pitch shift: resample (raises pitch AND speeds up), like a sped-up tape"""
    return signal.resample_poly(x, 100, int(round(100 * factor)))

def soften(x):
    """take the edge off the synthetic buzz: gentle low-pass + a touch of room"""
    b, a = signal.butter(2, 6500 / (SR / 2)); x = signal.lfilter(b, a, x)
    ir = np.zeros(int(SR * 0.12)); ir[0] = 1; ir[int(SR * 0.017)] = 0.18; ir[int(SR * 0.041)] = 0.1; ir[int(SR * 0.073)] = 0.05
    return signal.fftconvolve(x, ir)[: len(x) + len(ir) // 2]

def norm(x, peak=0.8): return x * (peak / (np.max(np.abs(x)) + 1e-9))

# characters: espeak voice, rate (wpm), pitch 0-99, range 0-99, post pitch factor
CAST = {
    'milo': dict(voice='en-us+m3', rate=150, pitch=42, range=18, shift=1.12),   # dry, tired
    'pip':  dict(voice='en-us+m7', rate=175, pitch=72, range=95, shift=1.32),   # bouncy, eager
    'lumi': dict(voice='en-us+f3', rate=140, pitch=52, range=10, shift=1.10),   # calm, deadpan
    'mimi': dict(voice='en-us+f4', rate=190, pitch=90, range=90, shift=1.35),
}

# ------------------------------------------------------------------ SFX synthesis
t_ = lambda d: np.arange(int(SR * d)) / SR
def env(d, a=0.002, r=None):
    t = t_(d); r = r or d; return np.minimum(1, t / a) * np.exp(-t / (r / 5))
def noise(d): return rng.standard_normal(int(SR * d))
def bp(x, lo, hi, o=2): b, a = signal.butter(o, [lo / (SR / 2), hi / (SR / 2)], 'band'); return signal.lfilter(b, a, x)
def lp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2)); return signal.lfilter(b, a, x)
def hp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2), 'high'); return signal.lfilter(b, a, x)
def tone(f, d):  # f: scalar or per-sample array
    f = np.broadcast_to(f, (int(SR * d),)); return np.sin(2 * np.pi * np.cumsum(f) / SR)
def verb(x, d=0.6, wet=0.25):
    ir = noise(d) * np.exp(-t_(d) / (d / 6)); ir = lp(ir, 5000)
    y = signal.fftconvolve(x, ir)[: len(x) + int(SR * d)]; y = y / (np.max(np.abs(y)) + 1e-9) * np.max(np.abs(x))
    out = np.zeros(len(y)); out[: len(x)] += x; return out + wet * y

def sfx_tick():
    return norm(bp(noise(0.05), 2500, 7000) * env(0.05, 0.0005, 0.03) + 0.6 * tone(3200, 0.05) * env(0.05, 0.0003, 0.015), 0.5)
def sfx_glasses():
    return norm(bp(noise(0.03), 4000, 11000) * env(0.03, 0.0003, 0.012) + 0.4 * tone(5200, 0.03) * env(0.03, 0.0002, 0.01), 0.3)
def sfx_button():
    thock = tone(170, 0.25) * env(0.25, 0.001, 0.12) + 0.7 * lp(noise(0.25), 900) * env(0.25, 0.0005, 0.04)
    click = bp(noise(0.25), 2000, 8000) * env(0.25, 0.0003, 0.012)
    return norm(verb(thock + click, 0.9, 0.35), 0.9)
def sfx_sniff():
    out = []
    for d in (0.11, 0.09):
        e = np.sin(np.pi * np.clip(t_(d) / d, 0, 1)) ** 2
        out += [bp(noise(d), 1800, 6000) * e, np.zeros(int(SR * 0.05))]
    return norm(np.concatenate(out), 0.35)
def sfx_hum_ramp():
    d = 2.0; t = t_(d); k = np.clip(t / 1.5, 0, 1)
    f = 45 + 110 * k ** 1.6
    saw = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR)
    rattle = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * np.cumsum(8 + 30 * k) / SR))
    x = ((1 - k) * lp(saw, 600) + k * lp(saw, 2600)) * (0.25 + 0.75 * k) * (0.7 + 0.3 * rattle)  # filter opens as it spins up
    x += 0.15 * bp(noise(d), 200, 2000) * k
    return norm(x * np.minimum(1, (d - t) / 0.08), 0.65)
def sfx_alarm():
    d = 1.3; t = t_(d); f = 850 + 450 * np.sin(2 * np.pi * t / 0.65 - np.pi / 2)
    x = signal.square(2 * np.pi * np.cumsum(f) / SR, 0.5) * 0.4 + tone(f, d) * 0.6
    return norm(lp(x, 4000) * np.minimum(1, t / 0.03) * np.minimum(1, (d - t) / 0.1), 0.45)
def sfx_clunk():
    d = 0.7; x = tone(70, d) * env(d, 0.001, 0.35) * 1.0
    for f, a in ((233, 0.4), (517, 0.3), (1093, 0.2), (1871, 0.12)): x += a * tone(f, d) * env(d, 0.001, 0.25)
    x += 0.8 * lp(noise(d), 1200) * env(d, 0.0005, 0.05)
    return norm(verb(x, 0.8, 0.3), 0.85)
def sfx_poof():
    d = 0.9; t = t_(d); burst = noise(d)
    x = bp(burst, 300, 5000) * (np.minimum(1, t / 0.004) * np.exp(-t / 0.12))
    x += 0.5 * lp(burst, 400) * np.exp(-t / 0.2)
    sparkle = sum(0.12 * tone(f, d) * env(d, 0.01, 0.6) for f in (2093, 2637, 3136, 4186))
    return norm(verb(x + sparkle, 1.0, 0.3), 0.95)
def sfx_smoke():
    d = 2.0; t = t_(d); return norm(bp(noise(d), 500, 3000) * np.sin(np.pi * t / d) ** 2, 0.08)
def sfx_yip():
    d = 0.16; t = t_(d); f = np.interp(t, [0, 0.04, 0.16], [1100, 1700, 1250])
    x = tone(f, d) + 0.5 * tone(2 * f, d) + 0.25 * tone(3 * f, d)
    x *= np.minimum(1, t / 0.008) * np.exp(-t / 0.09)
    return norm(x + 0.1 * bp(noise(d), 2000, 6000) * np.exp(-t / 0.03), 0.6)
def sfx_snort():
    d = 0.18; t = t_(d)
    pig = signal.sawtooth(2 * np.pi * np.cumsum(np.full(len(t), 95.0)) / SR) * np.sin(np.pi * t / d)
    return norm(lp(pig, 1500) + 0.3 * bp(noise(d), 300, 2500) * np.sin(np.pi * t / d), 0.5)
def room_tone(d):
    x = lp(noise(d), 300) * 0.006 + hp(lp(noise(d), 3000), 1000) * 0.0015
    return x


def write_wav(path, x, sr=SR):
    import wave
    x = np.clip(x, -1, 1); os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((x * 32767).astype('<i2').tobytes())
