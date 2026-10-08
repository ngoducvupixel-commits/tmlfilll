// 2D overlays drawn on top of the 3D frame: captions with speaker names, sparkle stars.
import { W, H, clamp, prog } from './kit.js';
import { NAME_COLORS } from './characters/mochi.js';

export function star(ctx, x, y, r, glow = 'rgba(255,200,230,0.95)') {
  if (r <= 0.5) return;
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#fff'; ctx.shadowColor = glow; ctx.shadowBlur = 14;
  ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.28 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.restore();
}

/**
 * Speaker caption for the voice cue playing at T. `lines` maps cue id → [speaker, text];
 * cues without an entry (giggles, barks...) are not captioned.
 */
export function captions(ctx, T, cues, font, lines, colors = {}) {
  const live = cues.filter((q) => q.kind === 'vo' && lines[q.id] && T >= q.t - 0.05 && T < q.t + Math.max(q.dur + 0.4, 0.9));
  const cue = live[live.length - 1]; if (!cue) return;
  const [who, text] = lines[cue.id]; const end = cue.t + Math.max(cue.dur + 0.4, 0.9);
  const a = clamp(prog(T, cue.t - 0.05, cue.t + 0.08)) * (1 - prog(T, end - 0.12, end));
  ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const size = text.length > 36 ? 38 : 46, y = H - 78;
  ctx.font = `700 26px ${font}`; ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.fillStyle = colors[who] || NAME_COLORS[who] || '#fff';
  ctx.strokeText(who.toUpperCase(), W / 2, y - size); ctx.fillText(who.toUpperCase(), W / 2, y - size);
  ctx.font = `700 ${size}px ${font}`; ctx.strokeStyle = '#1c1420'; ctx.lineWidth = 9; ctx.strokeText(text, W / 2, y); ctx.fillStyle = '#fff'; ctx.fillText(text, W / 2, y);
  ctx.restore();
}
