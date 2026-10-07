// Timeline driven by assets/lyrics.srt and assets/song.m4a.
// Three.js renders each shot; a 2D canvas composites background → 3D → karaoke/titles → wipes.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { W, H, clamp, prog, easeOut, easeBack, roundRect } from './kit.js';
import * as S from './scenes.js';

const out = document.getElementById('out');
const ctx = out.getContext('2d');
const audio = document.getElementById('song');

// ---------- lyrics / timing ----------
const toSec = (s) => { const [h, m, rest] = s.split(':'); return +h * 3600 + +m * 60 + parseFloat(rest.replace(',', '.')); };
function parseSRT(txt) {
  return txt.replace(/\r/g, '').trim().split(/\n\n+/).map((b) => {
    const ls = b.split('\n'); const [a, z] = ls[1].split('-->').map((x) => toSec(x.trim()));
    return { start: a, end: z, text: ls.slice(2).join(' ').trim() };
  });
}
const syl = (w) => Math.max(1, (w.toLowerCase().replace(/[^a-z]/g, '').replace(/e$/, '').match(/[aeiouy]+/g) || []).length);
/** spread the words of a line over ~85% of its duration, weighted by syllables (+ a little pause after commas) */
function addWordTimes(line) {
  const words = line.text.split(/\s+/);
  const weights = words.map((w) => syl(w) + (/[,.!?]$/.test(w) ? 0.6 : 0));
  const total = weights.reduce((a, b) => a + b, 0), span = (line.end - line.start) * 0.85;
  let acc = 0;
  line.words = words.map((w, i) => { const t = line.start + (acc / total) * span; acc += weights[i]; return { w, t, end: line.start + (acc / total) * span }; });
  return line;
}

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping;
const env = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const bgCanvas = document.createElement('canvas'); bgCanvas.width = W; bgCanvas.height = H;
const bgCtx = bgCanvas.getContext('2d');
const bgTex = new THREE.CanvasTexture(bgCanvas); bgTex.colorSpace = THREE.SRGBColorSpace;

// ---------- load ----------
await document.fonts.load('700 40px Fredoka');
const [srt, ttf] = await Promise.all([fetch('assets/lyrics.srt').then((r) => r.text()), new Promise((ok, no) => new TTFLoader().load('assets/Fredoka-Bold.ttf', ok, undefined, no))]);
S.setFont3D(new Font(ttf));
const lines = parseSRT(srt).map(addWordTimes);
const DURATION = 60.0;

// ---------- timeline ----------
const segs = [];
segs.push({ ...S.intro(), start: 0 });
lines.forEach((ln, i) => {
  if (i >= 8 && i <= 11) { if (i === 8) segs.push({ ...S.chorus(lines), start: ln.start }); return; }
  const ch = ln.text.trim()[0].toUpperCase();
  segs.push({ ...S.LETTER_SCENES[ch](), start: ln.start });
});
segs.forEach((s, i) => { s.end = i + 1 < segs.length ? segs[i + 1].start : DURATION; s.dur = s.end - s.start; });
const LETTERS = segs.filter((s) => s.letter).map((s) => s.letter);

// ---------- 2D overlays ----------
const hexc = (c) => '#' + new THREE.Color(c).getHexString();

function karaoke(T) {
  const li = lines.findIndex((l) => T >= l.start - 0.15 && T < l.end);
  if (li < 0) return;
  const line = lines[li], seg = segAt(T), color = hexc(seg.color);
  const appear = easeOut(prog(T, line.start - 0.15, line.start + 0.15));
  ctx.save(); ctx.font = `700 40px ${S.FONT}`; ctx.textBaseline = 'middle';
  const gap = 12, widths = line.words.map((w) => ctx.measureText(w.w).width);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1);
  const pw = total + 70, ph = 74, px = (W - pw) / 2, py = H - ph - 26 + (1 - appear) * 40;
  ctx.globalAlpha = appear;
  ctx.fillStyle = 'rgba(70,40,60,0.18)'; roundRect(ctx, px, py + 6, pw, ph, 37); ctx.fill();
  ctx.fillStyle = '#ffffff'; roundRect(ctx, px, py, pw, ph, 37); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.stroke();
  let x = px + 35;
  line.words.forEach((w, i) => {
    const sung = T >= w.t, cur = sung && T < w.end;
    const k = cur ? Math.sin(prog(T, w.t, Math.min(w.end, w.t + 0.35)) * Math.PI) : 0;
    const isLetter = i === 0 && w.w.length <= 2;
    ctx.save(); ctx.translate(x + widths[i] / 2, py + ph / 2 - k * 7); ctx.scale(1 + k * 0.06, 1 + k * 0.06);
    ctx.textAlign = 'center';
    ctx.fillStyle = isLetter ? color : sung ? color : '#9a8f9c';
    if (sung || isLetter) { ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.strokeText(w.w, 0, 0); }
    ctx.fillText(w.w, 0, 0); ctx.restore();
    x += widths[i] + gap;
  });
  ctx.restore();
}

function progressRow(T, seg) {
  if (!seg.letter && seg !== segs[0]) return;
  const a = clamp((T - 4.6) * 2); if (a <= 0) return;
  const n = LETTERS.length, r = 17, gap = 44, x0 = W / 2 - ((n - 1) * gap) / 2, y = 40;
  ctx.save(); ctx.globalAlpha = a; ctx.font = `700 20px ${S.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  LETTERS.forEach((L, i) => {
    const s = segs.find((g) => g.letter === L), done = T >= s.start, cur = s === seg;
    const pop = cur ? 1 + 0.35 * easeBack(prog(T, s.start, s.start + 0.4)) : 1;
    ctx.save(); ctx.translate(x0 + i * gap, y); ctx.scale(pop, pop);
    ctx.fillStyle = done ? hexc(S.LETTER_COLORS[L]) : 'rgba(255,255,255,0.75)';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.fillStyle = done ? '#fff' : '#b9aab8'; ctx.fillText(L, 0, 1); ctx.restore();
  });
  ctx.restore();
}

/** circular iris: k∈(-1,0) a disc of `color` grows to cover; k∈(0,1) a hole grows to reveal */
function iris(k, color, letter) {
  const R = Math.hypot(W, H) / 2 + 20;
  ctx.save(); ctx.fillStyle = color;
  if (k < 0) { const r = easeOut(k + 1) * R; ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, 7); ctx.fill(); ctx.lineWidth = 14; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke(); }
  else { const r = easeOut(k) * R; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(W / 2, H / 2, r, 0, 7, true); ctx.fill('evenodd'); }
  if (letter) { const s = 1 - Math.abs(k); if (s > 0.15) S.bubbleText(ctx, letter, W / 2, H / 2, 220, color, { scale: easeBack(s), stroke: '#ffffff' }); }
  ctx.restore();
}

// ---------- render ----------
function segAt(T) { let i = segs.length - 1; while (i > 0 && segs[i].start > T) i--; return segs[i]; }
function renderAt(T) {
  T = clamp(T, 0, DURATION - 1e-3);
  const seg = segAt(T), lt = T - seg.start;
  const { scene, camera } = seg.st;
  scene.environment = env; scene.background = bgTex;
  seg.bg(bgCtx, lt, T); bgTex.needsUpdate = true;
  seg.update(lt, T, seg.dur);
  renderer.render(scene, camera);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(renderer.domElement, 0, 0, W, H);
  seg.overlay?.(ctx, lt, T);
  progressRow(T, seg);
  karaoke(T);
  for (let i = 1; i < segs.length; i++) { const k = (T - segs[i].start) / 0.22; if (k > -1 && k < 1) iris(k, hexc(segs[i].color), segs[i].letter); }
  const f = prog(T, DURATION - 0.6, DURATION); if (f > 0) { ctx.fillStyle = `rgba(255,248,240,${f})`; ctx.fillRect(0, 0, W, H); }
}
for (const s of segs) { s.st.scene.environment = env; s.st.scene.background = bgTex; s.update(0, s.start, s.dur); renderer.compile(s.st.scene, s.st.camera); }

// ---------- player ----------
const ui = { play: document.getElementById('play'), scrub: document.getElementById('scrub'), time: document.getElementById('time'), rec: document.getElementById('rec') };
ui.scrub.max = DURATION;
let t = 0;
const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
function show() { renderAt(t); ui.scrub.value = t; ui.time.textContent = `${fmt(t)} / ${fmt(DURATION)}`; }
function loop() { if (audio.paused) return; t = audio.currentTime; show(); requestAnimationFrame(loop); }
audio.onplay = () => { ui.play.textContent = '❚❚'; requestAnimationFrame(loop); };
audio.onpause = audio.onended = () => { ui.play.textContent = '▶'; stopRec(); };
ui.play.onclick = () => { if (audio.paused) { if (audio.currentTime >= DURATION - 0.05) audio.currentTime = 0; audio.play(); } else audio.pause(); };
ui.scrub.oninput = () => { t = +ui.scrub.value; audio.currentTime = t; show(); };
addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); ui.play.click(); } });

let rec = null;
function stopRec() { if (rec) { rec.stop(); rec = null; ui.rec.textContent = '● Record'; } }
ui.rec.onclick = () => {
  if (rec) return stopRec();
  const stream = out.captureStream(30);
  try { (audio.captureStream?.() || audio.mozCaptureStream?.()).getAudioTracks().forEach((tr) => stream.addTrack(tr)); } catch {}
  const chunks = []; rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus', videoBitsPerSecond: 12e6 });
  rec.ondataavailable = (e) => chunks.push(e.data);
  rec.onstop = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' })); a.download = 'mochi-abc-song.webm'; a.click(); };
  audio.currentTime = 0; rec.start(); ui.rec.textContent = '■ Stop'; audio.play();
};

window.__duration = DURATION;
window.__seek = (time) => renderAt(time);
const q = new URLSearchParams(location.search);
t = +(q.get('t') || 0); audio.currentTime = t; show();
window.__ready = true;
