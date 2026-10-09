"""Builds an episode's whole soundtrack and timing from its beat sheet.

    python audio/build.py <episode>          # reads episodes/<episode>/beats.py

beats.py creates `sheet = Sheet(...)` and adds beats IN STORY ORDER:

    sheet.mark('s1', 1.8)                               # silent acting time (seconds)
    sheet.vo('milo_target', 'milo', 'Target is twelve meters ahead.', whisper=True)
    sheet.fx('whoosh', gap=0.05)                       # SFX from audio/sfx.py
    sheet.fx('ding', gap='@0.2')                       # '@x' = x s after the previous beat STARTED
    sheet.vo('pip_ow', 'pip', 'Ow.', at=33.7)           # or an absolute start time

`gap` (default 0) is measured from the END of the previous beat. Voice lines are synthesised first,
so the layout always follows their real length.
Real voice acting: put episodes/<episode>/recordings/<cue id>.wav (or .m4a/.mp3) and rebuild. Output in episodes/<episode>/assets/:
  vo/*.wav, sfx/*.wav, mix.wav, cues.json (id → start/dur, read by the film), lipsync.json (mouths).
"""
import importlib.util, json, os, subprocess, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from audio_lib import SR, speak, shift, soften, norm, bp, write_wav, room_tone   # noqa: E402
from sfx import SFX                                                               # noqa: E402
from voices import CAST, WHISPER                                                  # noqa: E402


GROUPS = {'both': ('milo', 'pip'), 'all': ('milo', 'pip', 'mimi', 'moss')}   # who='all' → everyone shouts


class Sheet:
    def __init__(self, rate_k=1.0, gap_scale=1.0, mark_scale=1.0, keep=(), cast=None, duration=None,
                 silences=(), room_ranges=None, room_gain=0.8, sfx_hold=0.3):
        """
        rate_k      speed-up for every voice (espeak is slow; 1.3–1.5 feels natural)
        gap_scale   multiplies every numeric gap; mark_scale multiplies mark durations, except ids in `keep`
        cast        per-episode voice overrides {who: {...}}
        silences    cue ids whose span must be dead silent (room tone dips out) — the comic pauses
        room_ranges alternatively, [(a, b), ...] seconds where room tone plays (silent elsewhere)
        sfx_hold    how long an SFX "holds" the timeline before the next beat may start
        """
        self.B, self.rate_k, self.gap_scale, self.mark_scale, self.keep = [], rate_k, gap_scale, mark_scale, set(keep)
        self.cast = {**CAST, **(cast or {})}
        self.duration, self.silences, self.room_ranges, self.room_gain, self.sfx_hold = duration, list(silences), room_ranges, room_gain, sfx_hold

    def vo(self, id, who, text, gap=0, at=None, **mods): self.B.append(dict(kind='vo', id=id, who=who, text=text, gap=gap, at=at, **mods))
    def fx(self, id, name=None, gap=0, at=None, gain=1.0, lips=None): self.B.append(dict(kind='sfx', id=id, name=name or id, gap=gap, at=at, gain=gain, lips=lips))
    def mark(self, id, dur, gap=0, at=None):
        d = dur if id in self.keep else round(dur * self.mark_scale, 2)
        self.B.append(dict(kind='mark', id=id, dur=d, gap=gap, at=at))

    # -------------------------------------------------------------- synthesis
    def voice(self, b):
        who = b['who']
        if who in GROUPS:   # several characters shouting together, slightly staggered
            parts = [self.voice(dict(b, who=w)) for w in GROUPS[who]]
            lag = int(SR * 0.025); n = max(len(x) + i * lag for i, x in enumerate(parts)); out = np.zeros(n)
            for i, x in enumerate(parts): out[i * lag:i * lag + len(x)] += x
            return norm(out, 0.85)
        c = WHISPER if b.get('whisper') else self.cast['pip' if who == 'laser' else who]
        x = speak(b['text'], c['voice'], int(c['rate'] * self.rate_k), c['pitch'], c['range'])
        if who == 'laser':   # Pip's self-recorded voice through a cheap speaker
            x = shift(x, 1.75); x = bp(x, 500, 3500); x = np.tanh(x * (6 if b.get('loud') else 3))
            return norm(x, 0.5 if b.get('weak') else 0.75)
        x = shift(x, c['shift'] * (0.72 if b.get('slow') else 1.0) * (1.55 if b.get('squeak') else 1.0))
        return norm(soften(x), 0.7 if b.get('whisper') else 0.85)

    @staticmethod
    def envelope(x):
        hop = SR // 60; rms = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x), hop)])
        rms = np.convolve(rms, np.ones(3) / 3, 'same'); rms = np.clip(rms / (np.percentile(rms, 95) + 1e-9), 0, 1)
        return [round(float(v), 2) for v in rms]

    @staticmethod
    def recording(path):
        """decode any audio file to mono float32 at SR (real voice acting replaces the synthetic line)"""
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
        return norm(np.frombuffer(raw, dtype=np.float32).astype(float), 0.85)

    def build(self, out):
        sounds, cues, lips = {}, [], {}
        rec_dir = os.path.join(out, '..', 'recordings')
        for b in self.B:
            if b['kind'] == 'vo':
                rec = next((os.path.join(rec_dir, f) for f in (os.listdir(rec_dir) if os.path.isdir(rec_dir) else []) if os.path.splitext(f)[0] == b['id']), None)
                sounds[b['id']] = self.recording(rec) if rec else self.voice(b)
                if rec: print(f"  using recording {os.path.basename(rec)}")
            elif b['kind'] == 'sfx' and b['name'] not in sounds:
                if b['name'] not in SFX: raise SystemExit(f"unknown SFX '{b['name']}' (see audio/sfx.py)")
                sounds[b['name']] = SFX[b['name']]()
        t, prev = 0.0, 0.0
        for b in self.B:
            g = b['gap']
            if b['at'] is not None: start = b['at']
            elif isinstance(g, str): start = prev + float(g[1:])
            else: start = t + g * self.gap_scale
            dur = b['dur'] if b['kind'] == 'mark' else len(sounds[b['id'] if b['kind'] == 'vo' else b['name']]) / SR
            b['t'], b['d'] = start, dur
            hold = dur if b['kind'] != 'sfx' else min(dur, self.sfx_hold)
            prev = start; t = max(t, start + hold)
            cues.append({'id': b['id'], 't': round(start, 3), 'dur': round(dur, 3), 'kind': b['kind'], **({'who': b['who']} if b['kind'] == 'vo' else {})})
        if len({c['id'] for c in cues}) != len(cues): raise SystemExit('duplicate cue ids')
        D = self.duration or round(t + 0.2, 2)
        mix = np.zeros(int(SR * D))
        def place(x, t0, g=1.0):
            i = int(t0 * SR); n = min(len(x), len(mix) - i)
            if n > 0: mix[i:i + n] += g * x[:n]
        tt = lambda d: np.arange(int(SR * d)) / SR
        if self.room_ranges is not None:
            for a, b in self.room_ranges:
                r = room_tone(b - a); x = tt(b - a); place(r * np.minimum(1, np.minimum(x, (b - a) - x) / 0.3), a)
        else:
            rt = room_tone(D) * self.room_gain; x = np.arange(len(rt)) / SR
            for a, b2 in [(c['t'], c['t'] + c['dur']) for c in cues if c['id'] in self.silences]:
                rt *= 1 - np.clip(np.minimum((x - a + 0.15) / 0.15, (b2 + 0.15 - x) / 0.15), 0, 1)
            place(rt, 0)
        for b in self.B:
            if b['kind'] == 'vo':
                x = sounds[b['id']]; place(x, b['t']); write_wav(f"{out}/vo/{b['id']}.wav", x)
                for w in GROUPS.get(b['who'], (b['who'],)):
                    lips.setdefault(w, []).append({'t': round(b['t'], 3), 'v': self.envelope(x)})
            elif b['kind'] == 'sfx':
                x = sounds[b['name']]; place(x, b['t'], b['gain']); write_wav(f"{out}/sfx/{b['name']}.wav", x)
                if b.get('lips'): lips.setdefault(b['lips'], []).append({'t': round(b['t'], 3), 'v': self.envelope(x)})
        mix = mix / max(1.0, np.max(np.abs(mix)) / 0.95)
        write_wav(f'{out}/mix.wav', mix)
        with open(f'{out}/cues.json', 'w') as f: json.dump({'duration': D, 'cues': cues}, f, indent=1)
        with open(f'{out}/lipsync.json', 'w') as f: json.dump({'fps': 60, 'tracks': lips}, f)
        for c in cues: print(f"{c['t']:6.2f} {c['dur']:5.2f}  {c['kind']:4} {c['id']}")
        print('duration', D)
        return cues


def main():
    if len(sys.argv) < 2: raise SystemExit(__doc__)
    ep = sys.argv[1]
    root = os.path.join(HERE, '..', 'episodes', ep)
    spec = importlib.util.spec_from_file_location('beats', os.path.join(root, 'beats.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    mod.sheet.build(os.path.join(root, 'assets'))


if __name__ == '__main__':
    main()
