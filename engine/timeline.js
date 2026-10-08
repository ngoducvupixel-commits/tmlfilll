// Cue-sheet helpers: everything in a beat-sheet episode is timed by cue id (assets/cues.json),
// and mouths follow assets/lipsync.json. Both files are produced by audio/build.py.

/** clock({cues}) → { t(id, off), e(id, off), Q, duration, between } */
export function clock(cues) {
  const Q = Object.fromEntries(cues.map((c) => [c.id, c]));
  const need = (id) => { if (!Q[id]) throw new Error(`unknown cue "${id}"`); return Q[id]; };
  return {
    Q,
    t: (id, off = 0) => need(id).t + off,               // start of a cue
    e: (id, off = 0) => need(id).t + need(id).dur + off, // end of a cue
    duration: cues.reduce((m, c) => Math.max(m, c.t + c.dur), 0),
    between: (T, a, b) => T >= a && T < b,
    speaking: (who, T, pre = 0.25, post = 0.3) => cues.find((q) => q.kind === 'vo' && q.who === who && T >= q.t - pre && T < q.t + q.dur + post),
  };
}

/** mouth-open amount 0..1 for a character at time T */
export function mouth(lipsync, who, T) {
  for (const tr of lipsync.tracks[who] || []) { const i = Math.floor((T - tr.t) * lipsync.fps); if (i >= 0 && i < tr.v.length) return tr.v[i]; }
  return 0;
}
