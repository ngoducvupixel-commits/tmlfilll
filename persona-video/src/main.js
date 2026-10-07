// Timeline + compositor. Three.js renders each shot offscreen; a 2D canvas composites
// background → 3D → titles → transitions, so the final frame is a single recordable canvas.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { W, H, prog } from './kit.js';
import * as fx from './fx2d.js';
import * as S from './scenes.js';

const out = document.getElementById('out');
const ctx = out.getContext('2d');

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping;
const env = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;

const bgCanvas = document.createElement('canvas'); bgCanvas.width = W; bgCanvas.height = H;
const bgCtx = bgCanvas.getContext('2d');
const bgTex = new THREE.CanvasTexture(bgCanvas); bgTex.colorSpace = THREE.SRGBColorSpace;

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 1, 0.5, 0.7);
composer.addPass(renderPass); composer.addPass(bloom); composer.addPass(new OutputPass());

// ---------- timeline ----------
const ICONS = [
  { icon: 'code', bg1: '#4fd1b5', bg2: '#2aa88e', fg: '#ffffff', label: 'CODE', labelColor: '#ffffff' },
  { icon: 'write', bg1: '#3a46d8', bg2: '#1f2aa8', fg: '#ff4d8d', label: 'WRITE', labelColor: '#ff4d8d' },
  { icon: 'research', bg1: '#6aa0ee', bg2: '#3d74d6', fg: '#ffffff', label: 'RESEARCH', labelColor: '#ffffff' },
  { icon: 'debug', bg1: '#5a2a24', bg2: '#2a0e0c', fg: '#ff8a1f', label: 'DEBUG', labelColor: '#ff8a1f' },
  { icon: 'analyze', bg1: '#f2b6c8', bg2: '#e391ad', fg: '#ffffff', label: 'ANALYZE', labelColor: '#ffffff' },
  { icon: 'design', bg1: '#36334a', bg2: '#16141f', fg: '#ff4d8d', label: 'DESIGN', labelColor: '#ff4d8d' },
];

const segs = [];
ICONS.forEach((o, i) => segs.push({ dur: 0.55, draw: (c, lt) => fx.iconCard(c, lt, { ...o, idx: String(i + 1).padStart(2, '0') }) }));
segs.push(S.titleHero());
const calm = [S.codeCalm, S.writeCalm, S.researchCalm, S.debugCalm, S.analyzeCalm, S.designCalm].map((f) => f());
const chaos = [S.codeChaos, S.writeChaos, S.researchChaos, S.debugChaos, S.analyzeChaos, S.designChaos].map((f) => f());
const wipes = [];
calm.forEach((c, i) => { c.wipe = S.MODES[i]; segs.push(c, chaos[i]); });
// recap: fast cuts back through every chaos shot
S.MODES.forEach((m, i) => segs.push({
  dur: 0.34,
  draw(c, lt, R) { R.pass(chaos[i], 1.5 + lt * 2); fx.bigWord(c, m.key, { size: 140 + lt * 60 }); },
}));
const outro = S.outroHero(); outro.wipe = { bg: ['#f6efe2', '#e6dccb'], accent: '#ff8a6b' };
segs.push(outro);

let acc = 0;
for (const s of segs) { s.start = acc; acc += s.dur; if (s.wipe) wipes.push({ t: s.start, color: s.wipe.bg[1], accent: s.wipe.accent }); }
export const DURATION = acc;

// ---------- rendering ----------
const R = {
  pass(seg, lt) {
    const { scene, camera } = seg.st;
    scene.environment = env; scene.background = bgTex;
    seg.bg(bgCtx, lt); bgTex.needsUpdate = true;
    seg.update(lt);
    if (seg.bloom) {
      Object.assign(bloom, { strength: seg.bloom.strength, radius: seg.bloom.radius, threshold: seg.bloom.threshold });
      renderPass.scene = scene; renderPass.camera = camera; composer.render();
    } else renderer.render(scene, camera);
    ctx.drawImage(renderer.domElement, 0, 0, W, H);
  },
};

function renderAt(t) {
  t = Math.max(0, Math.min(DURATION - 1e-4, t));
  let i = segs.length - 1; while (i > 0 && segs[i].start > t) i--;
  const seg = segs[i], lt = t - seg.start;
  ctx.clearRect(0, 0, W, H);
  if (seg.draw) seg.draw(ctx, lt, R);
  else { R.pass(seg, lt); seg.overlay?.(ctx, lt); }
  for (const w of wipes) { const k = (t - w.t) / 0.3; if (k > -1 && k < 1) fx.diagonalWipe(ctx, k, w.color, w.accent); }
}

// warm up: compile every shader & upload every texture once so playback doesn't hitch
function warmup() {
  for (const s of segs) if (s.st) { s.st.scene.environment = env; s.st.scene.background = bgTex; s.update(0); renderer.compile(s.st.scene, s.st.camera); }
}

// ---------- playback UI ----------
const ui = {
  play: document.getElementById('play'), scrub: document.getElementById('scrub'), time: document.getElementById('time'),
  rec: document.getElementById('rec'),
};
let playing = false, t = 0, last = 0;
ui.scrub.max = DURATION;
const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
function show() { renderAt(t); ui.scrub.value = t; ui.time.textContent = `${fmt(t)} / ${fmt(DURATION)}`; }
function loop(now) {
  if (!playing) return;
  t += Math.min(0.1, (now - last) / 1000); last = now;
  if (t >= DURATION) { t = DURATION; playing = false; ui.play.textContent = '▶'; stopRec(); }
  show(); if (playing) requestAnimationFrame(loop);
}
function setPlaying(p) { playing = p; ui.play.textContent = p ? '❚❚' : '▶'; if (p) { if (t >= DURATION) t = 0; last = performance.now(); requestAnimationFrame(loop); } }
ui.play.onclick = () => setPlaying(!playing);
ui.scrub.oninput = () => { t = +ui.scrub.value; show(); };
addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); setPlaying(!playing); } });

// real-time WebM recording of the composited canvas
let rec = null;
function stopRec() { if (rec) { rec.stop(); rec = null; ui.rec.textContent = '● Record'; } }
ui.rec.onclick = () => {
  if (rec) return stopRec();
  const chunks = []; rec = new MediaRecorder(out.captureStream(30), { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 12e6 });
  rec.ondataavailable = (e) => chunks.push(e.data);
  rec.onstop = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' })); a.download = 'pip-dual-mode.webm'; a.click(); };
  rec.start(); ui.rec.textContent = '■ Stop'; t = 0; setPlaying(true);
};

// hooks for the offline frame renderer (tools/render.mjs)
window.__duration = DURATION;
window.__seek = (time) => renderAt(time);

await document.fonts.ready;
await Promise.all(['66px Anton', '17px "JetBrains Mono"', '19px "DM Sans"', '44px Caveat'].map((f) => document.fonts.load(f).catch(() => {})));
warmup();
const q = new URLSearchParams(location.search);
t = +(q.get('t') || 0); show();
window.__ready = true;
if (!q.has('paused') && !q.has('t')) setPlaying(true);
