// 2D canvas effects: backgrounds (fed to Three.js as scene.background), title cards, transitions.
import { W, H, FONT, rng, clamp, easeOut, easeBack, prog, roundRect } from './kit.js';

// ---------------- backgrounds ----------------
export function flat(ctx, inner, outer) {
  const g = ctx.createRadialGradient(W * 0.5, H * 0.45, 50, W * 0.5, H * 0.5, W * 0.75);
  g.addColorStop(0, inner); g.addColorStop(1, outer);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

export function halftone(ctx, color, t = 0, { alpha = 0.18, top = 0, bottom = H * 0.55, size = 15, gap = 34 } = {}) {
  ctx.save(); ctx.fillStyle = color;
  const off = (t * 12) % gap;
  for (let y = top - gap; y < bottom; y += gap) {
    const fade = 1 - clamp((y - top) / (bottom - top));
    const r = size * 0.5 * (0.35 + 0.65 * fade);
    ctx.globalAlpha = alpha * fade;
    const shift = (Math.round(y / gap) % 2) * gap * 0.5;
    for (let x = -gap + off + shift; x < W + gap; x += gap) { ctx.beginPath(); ctx.arc(x, y + off, r, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
}

export function sunburst(ctx, c1, c2, t = 0, { n = 22, cx = W / 2, cy = H * 0.45, speed = 0.15 } = {}) {
  ctx.fillStyle = c1; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * speed); ctx.fillStyle = c2;
  const R = W * 1.2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, b = a + (Math.PI / n) * 0.9;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R); ctx.lineTo(Math.cos(b) * R, Math.sin(b) * R); ctx.fill();
  }
  ctx.restore();
  const v = ctx.createRadialGradient(cx, cy, 80, cx, cy, W * 0.8);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

export function speedLines(ctx, t, color = 'rgba(40,30,20,0.55)', { cx = W / 2, cy = H / 2, n = 90, inner = 180, seed = 7 } = {}) {
  const r = rng(seed + Math.floor(t * 18));
  ctx.save(); ctx.strokeStyle = color; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, r0 = inner + r() * 260, len = 300 + r() * 600;
    ctx.lineWidth = 1 + r() * 4;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * (r0 + len), cy + Math.sin(a) * (r0 + len)); ctx.stroke();
  }
  ctx.restore();
}

const GLYPHS = '01<>{}[]=+*/;:#$&ｱｲｳｴｵｶｷｸｹｺ';
export function matrixRain(ctx, t, { color = '#3dff8f', cols = 64, seed = 3 } = {}) {
  const r = rng(seed); const cw = W / cols; ctx.save(); ctx.font = `14px ${FONT.mono}`; ctx.textAlign = 'center';
  for (let i = 0; i < cols; i++) {
    const speed = 140 + r() * 260, len = 8 + Math.floor(r() * 16), phase = r() * H * 2;
    const head = ((t * speed + phase) % (H + len * 18)) - len * 9;
    for (let j = 0; j < len; j++) {
      const y = head - j * 18; if (y < -20 || y > H + 20) continue;
      ctx.globalAlpha = (1 - j / len) * 0.55 * (0.4 + r() * 0.6);
      ctx.fillStyle = j === 0 ? '#e8fff0' : color;
      ctx.fillText(GLYPHS[Math.floor((i * 7 + j * 3 + Math.floor(t * 10)) % GLYPHS.length)], i * cw + cw / 2, y);
    }
  }
  ctx.restore();
}

export function stars(ctx, t, { n = 140, seed = 11 } = {}) {
  const r = rng(seed); ctx.save();
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = r() * H * 0.8, s = 0.6 + r() * 2.2, tw = 0.5 + 0.5 * Math.sin(t * (2 + r() * 4) + i);
    ctx.globalAlpha = 0.3 + tw * 0.7; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ---------------- text overlays ----------------
function counter(ctx, idx, x, y, color, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.font = `600 13px ${FONT.mono}`;
  ctx.fillText(idx, x, y); ctx.fillRect(x, y + 8, 24, 2); ctx.restore();
}

/** calm-mode lower-third: "01 / 06" + big condensed title + small subtitle */
export function calmTitle(ctx, lt, { idx, title, sub, color = '#fff' }) {
  const p = easeOut(prog(lt, 0.1, 0.5));
  if (p <= 0) return;
  const x = 48, y = H - 52 + (1 - p) * 30;
  ctx.save(); ctx.globalAlpha = p;
  counter(ctx, `${idx} / 06`, x, y - 66, color, 0.85);
  ctx.fillStyle = color; ctx.font = `66px ${FONT.display}`; ctx.textBaseline = 'alphabetic';
  ctx.fillText(title, x, y);
  const tw = ctx.measureText(title).width;
  ctx.font = `500 19px ${FONT.sans}`; ctx.globalAlpha = p * 0.9; ctx.fillText(sub, x + tw + 14, y - 4);
  ctx.restore();
}

/** chaos-mode slammed title: skewed, outlined, drop shadow, pops in */
export function chaosTitle(ctx, lt, { idx, mode, title, color, size = 92, x = 46, y = H - 46 }) {
  const p = prog(lt, 0.15, 0.45);
  if (p <= 0) return;
  const s = 1.8 - 0.8 * easeBack(p);
  ctx.save();
  ctx.globalAlpha = clamp(p * 3);
  counter(ctx, `${idx} / 06 · ${mode}`, x + 6, y - size - 18, '#fff', 0.8);
  ctx.translate(x, y); ctx.transform(1, 0, -0.18, 1, 0, 0); ctx.scale(s, s); ctx.rotate(-0.035);
  ctx.font = `${size}px ${FONT.display}`; ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillText(title, 7, 7);
  ctx.strokeStyle = '#141018'; ctx.lineWidth = 12; ctx.strokeText(title, 0, 0);
  ctx.fillStyle = color; ctx.fillText(title, 0, 0);
  ctx.restore();
}

export function bigWord(ctx, word, { x = 60, y = H - 80, size = 150, fill = '#fff', stroke = '#141018' } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, -0.15, 1, 0, 0);
  ctx.font = `${size}px ${FONT.display}`; ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillText(word, 8, 8);
  ctx.strokeStyle = stroke; ctx.lineWidth = 14; ctx.strokeText(word, 0, 0);
  ctx.fillStyle = fill; ctx.fillText(word, 0, 0); ctx.restore();
}

export function badge(ctx, text, x, y, { bg = '#fff', fg = '#e8178a' } = {}) {
  ctx.save(); ctx.font = `600 17px ${FONT.mono}`;
  const w = ctx.measureText(text).width + 34;
  roundRect(ctx, x - w, y, w, 38, 19); ctx.fillStyle = bg; ctx.fill();
  ctx.fillStyle = fg; ctx.fillText(text, x - w + 17, y + 25); ctx.restore();
}

// ---------------- transitions ----------------
/** diagonal panel sweep. k in [-1,1]: -1..0 entering from the right (covering), 0..1 leaving to the left. */
export function diagonalWipe(ctx, k, color, accent) {
  if (k <= -1 || k >= 1) return;
  const slant = 260;
  const span = W + slant * 2;
  // leading/trailing edge positions
  let lead, trail;
  if (k < 0) { const e = easeOut(k + 1); lead = W + slant - e * span; trail = W + slant; }
  else { const e = easeOut(k); lead = -slant; trail = W + slant - e * span; }
  const poly = (a, b, c) => { ctx.beginPath(); ctx.moveTo(a + slant, 0); ctx.lineTo(b + slant, 0); ctx.lineTo(b - slant * 0.0, H); ctx.lineTo(a - slant * 0.0, H); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); };
  poly(lead - 40, trail + 40, accent);
  poly(lead, trail, color);
}

/** impact frame used on calm → chaos: flash + sunburst burst that fades */
export function impact(ctx, lt, color) {
  const k = 1 - prog(lt, 0, 0.32);
  if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = k * 0.85; ctx.globalCompositeOperation = 'screen';
  ctx.translate(W / 2, H / 2); ctx.fillStyle = color;
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + lt * 2, b = a + 0.12;
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * 120, Math.sin(a) * 120); ctx.lineTo(Math.cos(a) * 1400, Math.sin(a) * 1400);
    ctx.lineTo(Math.cos(b) * 1400, Math.sin(b) * 1400); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  if (lt < 0.07) { ctx.fillStyle = `rgba(255,255,255,${1 - lt / 0.07})`; ctx.fillRect(0, 0, W, H); }
}

// ---------------- intro icons (original vector drawings) ----------------
export const ICONS = {
  code(c, fg, bg) {
    roundRect(c, -95, -70, 190, 140, 22); c.fillStyle = fg; c.fill();
    c.fillStyle = bg; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(-68 + i * 18, -48, 6, 0, 7); c.fill(); }
    c.strokeStyle = bg; c.lineWidth = 14; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(-58, -12); c.lineTo(-24, 14); c.lineTo(-58, 40); c.stroke();
    c.beginPath(); c.moveTo(4, 40); c.lineTo(62, 40); c.stroke();
  },
  write(c, fg) {
    c.rotate(0.6); c.fillStyle = fg;
    c.beginPath(); c.moveTo(0, -110); c.bezierCurveTo(70, -70, 60, 40, 6, 90); c.lineTo(-6, 90); c.bezierCurveTo(-60, 40, -60, -70, 0, -110); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, -80); c.lineTo(0, 120); c.stroke();
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(0, -50 + i * 32); c.lineTo(i % 2 ? 34 : -34, -70 + i * 32); c.stroke(); }
  },
  research(c, fg, bg) {
    c.fillStyle = fg;
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(0, -50); c.quadraticCurveTo(s * 50, -78, s * 110, -60); c.lineTo(s * 110, 70); c.quadraticCurveTo(s * 50, 52, 0, 80); c.closePath(); c.fill(); }
    c.strokeStyle = bg; c.lineWidth = 7; c.lineCap = 'round';
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(s * 22, -26 + i * 26); c.lineTo(s * 88, -34 + i * 26); c.stroke(); }
  },
  debug(c, fg, bg) {
    c.strokeStyle = fg; c.lineWidth = 12; c.lineCap = 'round';
    for (const s of [-1, 1]) for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(s * 40, i * 34 + 10); c.lineTo(s * 100, i * 44 + 14); c.stroke(); }
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 14, -62); c.quadraticCurveTo(s * 30, -100, s * 56, -104); c.stroke(); }
    c.fillStyle = fg; c.beginPath(); c.ellipse(0, -50, 34, 26, 0, 0, 7); c.fill();
    c.beginPath(); c.ellipse(0, 20, 62, 74, 0, 0, 7); c.fill();
    c.strokeStyle = bg; c.lineWidth = 6; c.beginPath(); c.moveTo(0, -50); c.lineTo(0, 92); c.stroke();
    c.fillStyle = bg; for (const [x, y] of [[-28, 0], [26, 8], [-22, 46], [30, 52]]) { c.beginPath(); c.arc(x, y, 10, 0, 7); c.fill(); }
  },
  analyze(c, fg) {
    c.fillStyle = fg;
    [[-90, 30, 40], [-40, 0, 70], [10, -30, 100], [60, -70, 140]].forEach(([x, y, h]) => { roundRect(c, x, y + (70 - h) + 40 - 40, 36, h, 6); c.fill(); });
    c.strokeStyle = fg; c.lineWidth = 12; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(-96, -10); c.lineTo(-30, -60); c.lineTo(10, -40); c.lineTo(88, -110); c.stroke();
    c.beginPath(); c.moveTo(56, -112); c.lineTo(92, -114); c.lineTo(90, -78); c.stroke();
  },
  design(c, fg) {
    c.save(); c.rotate(-0.75); c.fillStyle = fg;
    roundRect(c, -12, -110, 24, 120, 10); c.fill();
    c.beginPath(); c.moveTo(-20, 10); c.lineTo(20, 10); c.quadraticCurveTo(22, 60, 0, 90); c.quadraticCurveTo(-22, 60, -20, 10); c.fill();
    c.restore();
    c.strokeStyle = fg; c.lineWidth = 12; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-100, 90); c.bezierCurveTo(-60, 40, -20, 130, 30, 80); c.stroke();
  },
};

export function iconCard(ctx, lt, { icon, bg1, bg2, fg, label, idx, labelColor }) {
  flat(ctx, bg1, bg2);
  const p = easeBack(prog(lt, 0, 0.22));
  ctx.save(); ctx.translate(W / 2, H * 0.44 + Math.sin(lt * 5) * 4); ctx.scale(0.4 + 0.6 * p, 0.4 + 0.6 * p); ctx.rotate((1 - p) * -0.3);
  ctx.save(); ctx.translate(8, 12); ctx.globalAlpha = 0.22; ICONS[icon](ctx, '#000', '#000'); ctx.restore();
  ICONS[icon](ctx, fg, bg2);
  ctx.restore();
  counter(ctx, `${idx} / 06`, 48, H - 52, labelColor, 0.7);
  ctx.save(); ctx.font = `46px ${FONT.display}`; ctx.fillStyle = labelColor; ctx.textAlign = 'right'; ctx.fillText(label, W - 48, H - 42); ctx.restore();
}
