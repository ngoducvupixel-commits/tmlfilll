// Every shot of the film. Each factory returns a "segment":
//   { dur, st:{scene,camera}, bloom?, bg(ctx,lt), update(lt), overlay?(ctx,lt), draw?(ctx,lt,R) }
// All animation is a pure function of local time `lt`, so any frame can be rendered by seeking.
import * as THREE from 'three';
import {
  W, H, clamp, lerp, prog, easeOut, easeIn, easeInOut, easeBack, bounce, rng,
  mat, glow, rbox, box, cyl, sph, tor, cone, plane, at, group, canvasTex, texMat, texGlow, roundRect, FONT, hex,
} from './kit.js';
import {
  makePip, PIP_BLUE, headphones, hoodie, quill, writerCap, mortarboard, roundGlasses, detectiveCap, magnifier,
  goggles, labCoat, beret, stripes, palette, brush,
} from './pip.js';
import * as fx from './fx2d.js';

// ------------------------------------------------------------------ helpers
function stage(o = {}) {
  const { cam = [0, 2.2, 8.5], look = [0, 0.95, 0], fov = 30, shadow = 0.18, hemi = 1.2, key = 2.3,
    keyPos = [3, 7, 5], fill = 0.5, envI = 0.6, hemiGround = 0x9a8f88, keyColor = 0xffffff } = o;
  const scene = new THREE.Scene();
  scene.environmentIntensity = envI;
  const camera = new THREE.PerspectiveCamera(fov, W / H, 0.1, 300);
  const st = { scene, camera };
  scene.add(new THREE.HemisphereLight(0xffffff, hemiGround, hemi));
  const dir = new THREE.DirectionalLight(keyColor, key); dir.position.set(...keyPos); dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  Object.assign(dir.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 0.5, far: 40 });
  dir.shadow.bias = -0.0004; dir.shadow.normalBias = 0.02;
  scene.add(dir); st.dir = dir;
  const f = new THREE.DirectionalLight(0xffffff, fill); f.position.set(-5, 3, 6); scene.add(f);
  if (shadow) {
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.ShadowMaterial({ opacity: shadow }));
    fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
  }
  st.set = (pos, look2) => { camera.position.set(...pos); camera.lookAt(...look2); };
  st.set(cam, look);
  return st;
}
const mixv = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
function camPath(st, keys, lt) { // keys: [[t, pos, look], ...] eased between
  let i = 0; while (i < keys.length - 2 && lt > keys[i + 1][0]) i++;
  const [t0, p0, l0] = keys[i], [t1, p1, l1] = keys[Math.min(i + 1, keys.length - 1)];
  const k = easeInOut(t1 === t0 ? 1 : prog(lt, t0, t1));
  st.set(mixv(p0, p1, k), mixv(l0, l1, k));
}
function shake(cam, lt, amt) {
  cam.position.x += Math.sin(lt * 61.3) * amt; cam.position.y += Math.sin(lt * 47.9 + 1.3) * amt;
  cam.rotation.z += Math.sin(lt * 37.1) * amt * 0.08;
}
const dummy = new THREE.Object3D();

function desk({ w = 3.8, d = 1.25, h = 0.62, top = 0xc98d52, leg = 0xf4f4f4, turned = false, drawer = false } = {}) {
  const g = new THREE.Group();
  g.add(at(rbox(w, 0.1, d, 0.03, top), 0, h, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (w / 2 - 0.2), z = sz * (d / 2 - 0.15);
    if (turned) {
      g.add(at(cyl(0.07, 0.05, h, leg), x, h / 2, z));
      g.add(at(sph(0.09, leg), x, h * 0.62, z)); g.add(at(sph(0.08, leg), x, h * 0.25, z));
    } else g.add(at(rbox(0.07, h, 0.07, 0.02, leg), x, h / 2, z));
  }
  if (!turned) for (const sx of [-1, 1]) g.add(at(rbox(0.07, 0.06, d - 0.2, 0.02, leg), sx * (w / 2 - 0.2), 0.04, 0));
  if (drawer) {
    g.add(at(box(w - 0.5, 0.16, 0.04, top), 0, h - 0.12, d / 2 - 0.05));
    g.add(at(sph(0.035, 0xd4a017, { metalness: 0.8, roughness: 0.3 }), 0, h - 0.12, d / 2 - 0.01));
  }
  g.topY = h + 0.05;
  return g;
}

function bookStack(n, seed, { w = 0.55, d = 0.4, th = 0.09 } = {}) {
  const r = rng(seed), g = new THREE.Group();
  const cols = [0x2d4f8a, 0x3c8a5a, 0xb5463a, 0xe0b040, 0x6a3f8f, 0x24706f, 0xd9772f];
  for (let i = 0; i < n; i++) {
    const b = rbox(w * (0.85 + r() * 0.3), th, d * (0.9 + r() * 0.2), 0.012, cols[Math.floor(r() * cols.length)]);
    at(b, (r() - 0.5) * 0.06, th / 2 + i * th, 0, 0, (r() - 0.5) * 0.3); g.add(b);
    const pages = box(w * 0.8, th * 0.7, 0.02, 0xf4ecd8); at(pages, b.position.x, b.position.y, d / 2 - 0.0, 0, b.rotation.y); g.add(pages);
  }
  return g;
}

function codeTex({ w = 512, h = 320, bg = '#141826', border = null, seed = 1, title = 'fix.ts' } = {}) {
  const t = canvasTex(w, h, (c, W2, H2, state = {}) => {
    c.fillStyle = bg; c.fillRect(0, 0, W2, H2);
    if (border) { c.strokeStyle = border; c.lineWidth = 10; c.strokeRect(5, 5, W2 - 10, H2 - 10); }
    const r = rng(seed);
    c.font = `600 18px ${FONT.mono}`; c.fillStyle = '#9aa3c7'; c.fillText(title, 22, 34);
    const palette = ['#7ee0ff', '#ff8fb1', '#ffd36b', '#9cf59a', '#c3b6ff'];
    const lines = state.lines ?? 9;
    for (let i = 0; i < lines; i++) {
      let x = 22 + Math.floor(r() * 3) * 22; const y = 62 + i * 26;
      if (y > H2 - 16) break;
      const parts = 2 + Math.floor(r() * 3);
      for (let j = 0; j < parts; j++) { const ww = 30 + r() * 90; c.fillStyle = palette[Math.floor(r() * palette.length)]; roundRect(c, x, y, ww, 12, 6); c.fill(); x += ww + 10; }
    }
    if (state.alert) {
      c.fillStyle = 'rgba(30,6,10,0.75)'; c.fillRect(0, 0, W2, H2);
      roundRect(c, W2 * 0.16, H2 * 0.34, W2 * 0.68, H2 * 0.32, 14); c.fillStyle = '#e8323f'; c.fill();
      c.fillStyle = '#fff'; c.font = `700 40px ${FONT.mono}`; c.textAlign = 'center'; c.fillText('847 ISSUES', W2 / 2, H2 * 0.53);
      c.font = `500 17px ${FONT.mono}`; c.fillText('…and counting', W2 / 2, H2 * 0.61); c.textAlign = 'left';
    }
  });
  return t;
}

function monitor(tex) {
  const g = new THREE.Group();
  g.add(at(rbox(0.36, 0.04, 0.26, 0.02, 0x2b2f3a), 0, 0.02, 0));
  g.add(at(cyl(0.025, 0.025, 0.5, 0xc7ccd6, { metalness: 0.6, roughness: 0.3 }), 0, 0.27, 0));
  g.add(at(rbox(1.15, 0.72, 0.06, 0.03, 0x1b1e27), 0, 0.78, 0));
  const scr = plane(1.07, 0.64, texGlow(tex)); scr.castShadow = false; at(scr, 0, 0.78, 0.032); g.add(scr);
  const note = plane(0.14, 0.14, 0xffe066); at(note, -0.5, 1.08, 0.04, 0, 0, 0.12); g.add(note);
  return g;
}

function mug() {
  const g = new THREE.Group();
  g.add(at(cyl(0.11, 0.1, 0.24, 0xfafafa), 0, 0.12, 0));
  g.add(at(tor(0.06, 0.018, 0xfafafa), 0.12, 0.13, 0, 0, 0, 0));
  g.add(at(cyl(0.1, 0.1, 0.01, 0x5a3418), 0, 0.235, 0));
  const dot = plane(0.08, 0.08, 0xe8473a); at(dot, 0, 0.13, 0.112); g.add(dot);
  const steam = [];
  const sm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false });
  for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), sm.clone()); g.add(s); steam.push(s); }
  g.tick = (t) => steam.forEach((s, i) => {
    const a = ((t * 0.6 + i / steam.length) % 1);
    s.position.set(Math.sin(a * 9 + i) * 0.05, 0.3 + a * 0.75, 0); s.scale.setScalar(0.5 + a * 1.4); s.material.opacity = 0.45 * (1 - a);
  });
  return g;
}

function cactus() {
  const g = new THREE.Group();
  g.add(at(cyl(0.12, 0.09, 0.16, 0xd2693c), 0, 0.08, 0));
  const c = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.22, 6, 12), mat(0x3f9a4a)); c.castShadow = true; at(c, 0, 0.32, 0); g.add(c);
  const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.08, 6, 10), mat(0x3f9a4a)); at(a, 0.09, 0.34, 0, 0, 0, -0.6); g.add(a);
  g.add(at(sph(0.025, 0xff6fa0), 0, 0.5, 0));
  return g;
}

function duck() {
  const g = new THREE.Group();
  const b = sph(0.12, 0xffd23f); b.scale.set(1.2, 0.85, 1); b.position.y = 0.09; g.add(b);
  g.add(at(sph(0.08, 0xffd23f), 0.08, 0.22, 0));
  g.add(at(cone(0.035, 0.08, 0xff8c1a), 0.17, 0.21, 0, 0, 0, -Math.PI / 2));
  for (const z of [-0.04, 0.04]) g.add(at(sph(0.012, 0x111111), 0.13, 0.24, z));
  return g;
}

function keyboard() {
  const g = new THREE.Group();
  g.add(at(rbox(0.95, 0.04, 0.3, 0.015, 0xe8e8ee), 0, 0.02, 0));
  const keyColors = [0xf7f7fa, 0xc8d4ff, 0xffd0dc];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 10; c++) g.add(at(rbox(0.075, 0.025, 0.07, 0.01, keyColors[(r * 3 + c) % 7 === 0 ? 1 + (c % 2) : 0]), -0.4 + c * 0.089, 0.05, -0.09 + r * 0.09));
  return g;
}

function candle() {
  const g = new THREE.Group();
  g.add(at(cyl(0.1, 0.12, 0.03, 0xd4a017, { metalness: 0.8, roughness: 0.3 }), 0, 0.015, 0));
  g.add(at(cyl(0.045, 0.045, 0.3, 0xfff4dc), 0, 0.18, 0));
  const flame = cone(0.03, 0.1, glow(0xffa53a, 4)); flame.castShadow = false; at(flame, 0, 0.39, 0); g.add(flame);
  const light = new THREE.PointLight(0xffa04a, 1.5, 3, 1.5); light.position.y = 0.45; g.add(light);
  g.tick = (t) => { const f = 0.85 + Math.sin(t * 23) * 0.08 + Math.sin(t * 37) * 0.07; flame.scale.set(1, f, 1); light.intensity = 1.4 * f; };
  return g;
}

function inkwell() {
  const g = new THREE.Group();
  const b = sph(0.1, 0x283a8a, { roughness: 0.15, metalness: 0.2 }); b.scale.set(1, 0.8, 1); b.position.y = 0.08; g.add(b);
  g.add(at(cyl(0.04, 0.05, 0.06, 0x283a8a), 0, 0.17, 0));
  return g;
}

function letterTex() {
  return canvasTex(512, 340, (c, w, h, p = 0) => {
    c.fillStyle = '#fbf6ea'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#3a2a1a'; c.font = `44px ${FONT.hand}`;
    const lines = ['Dear reader,', 'today the code was calm', 'and the coffee was warm…'];
    let budget = p * lines.join('').length;
    lines.forEach((ln, i) => { const n = Math.max(0, Math.min(ln.length, Math.floor(budget))); budget -= ln.length; c.fillText(ln.slice(0, n), 34, 70 + i * 66); });
  });
}

function globe() {
  const tex = canvasTex(256, 128, (c, w, h) => {
    c.fillStyle = '#2f7fd8'; c.fillRect(0, 0, w, h);
    const r = rng(5); c.fillStyle = '#52c26a';
    for (let i = 0; i < 14; i++) { c.beginPath(); c.ellipse(r() * w, 20 + r() * (h - 40), 10 + r() * 26, 6 + r() * 16, r() * 3, 0, 7); c.fill(); }
  });
  const g = new THREE.Group();
  g.add(at(cyl(0.12, 0.14, 0.04, 0xc89b3c, { metalness: 0.8, roughness: 0.3 }), 0, 0.02, 0));
  g.add(at(cyl(0.015, 0.015, 0.14, 0xc89b3c, { metalness: 0.8 }), 0, 0.09, 0));
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.24, 32, 24), texMat(tex, { roughness: 0.4 })); ball.castShadow = true; ball.position.y = 0.4; ball.rotation.z = 0.4; g.add(ball);
  g.add(at(tor(0.27, 0.012, 0xc89b3c, { metalness: 0.8 }, Math.PI), 0, 0.4, 0, 0, 0, Math.PI / 2 + 0.4));
  g.tick = (t) => { ball.rotation.y = t * 0.8; };
  return g;
}

function bankerLamp() {
  const g = new THREE.Group();
  g.add(at(cyl(0.16, 0.18, 0.05, 0xc89b3c, { metalness: 0.8, roughness: 0.3 }), 0, 0.025, 0));
  g.add(at(cyl(0.02, 0.02, 0.55, 0xc89b3c, { metalness: 0.8 }), 0, 0.3, 0));
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 24, 1, false, 0, Math.PI), mat(0x1f7a4a, { roughness: 0.25, side: THREE.DoubleSide }));
  shade.rotation.z = Math.PI / 2; shade.position.set(0, 0.6, 0.06); shade.castShadow = true; g.add(shade);
  const bulb = sph(0.06, glow(0xfff1b0, 3)); bulb.castShadow = false; at(bulb, 0, 0.52, 0.08); g.add(bulb);
  const light = new THREE.PointLight(0xffe7a0, 2, 3.5, 1.4); light.position.set(0, 0.45, 0.2); g.add(light);
  return g;
}

function openBook(pagesTex) {
  const g = new THREE.Group();
  g.add(at(box(1.0, 0.04, 0.66, 0xb5302a), 0, 0.02, 0));
  for (const s of [-1, 1]) {
    const p = plane(0.47, 0.6, pagesTex ? texMat(pagesTex) : 0xfbf6ea); at(p, s * 0.245, 0.06, 0, -Math.PI / 2, 0, s * 0.08); g.add(p);
  }
  return g;
}

function beetle(shell = 0x2ee6c8) {
  const g = new THREE.Group();
  const body = sph(0.18, shell, { metalness: 0.3, roughness: 0.25 }); body.scale.set(1, 0.72, 1.3); body.position.y = 0.16; g.add(body);
  g.add(at(box(0.012, 0.1, 0.4, 0x0d3b35), 0, 0.27, 0));
  g.add(at(sph(0.09, 0x1a1a1a), 0, 0.14, 0.24));
  g.legs = [];
  for (const s of [-1, 1]) for (let i = -1; i <= 1; i++) {
    const l = cyl(0.012, 0.012, 0.2, 0x111111, {}, 6); at(l, s * 0.18, 0.08, i * 0.12, 0, 0, s * 1.1); g.add(l); g.legs.push(l);
  }
  for (const s of [-1, 1]) {
    g.add(at(cyl(0.008, 0.008, 0.22, 0x111111, {}, 6), s * 0.05, 0.25, 0.33, 0.9, 0, -s * 0.3));
    g.add(at(sph(0.022, 0x111111, {}, 8), s * 0.085, 0.33, 0.42));
  }
  g.tick = (t) => g.legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 24 + i * 2) * 0.5; });
  return g;
}

function markerTex(n) {
  return canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#ffd400'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.font = `bold 80px ${FONT.sans}`; c.textAlign = 'center'; c.fillText(String(n), w / 2, 100);
  });
}
function marker(n) {
  const g = new THREE.Group(); const m = texMat(markerTex(n), { side: THREE.DoubleSide });
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.24), m); p.castShadow = true; at(p, 0, 0.11, s * 0.05, -s * 0.4, s > 0 ? 0 : Math.PI); g.add(p); }
  return g;
}

function easel(boardW = 1.3, boardH = 1.0, mtl = 0xffffff) {
  const g = new THREE.Group(); const wood = 0x8a5a2b;
  g.add(at(rbox(0.07, 2.2, 0.07, 0.02, wood), -0.45, 1.05, 0, -0.08, 0, 0.12));
  g.add(at(rbox(0.07, 2.2, 0.07, 0.02, wood), 0.45, 1.05, 0, -0.08, 0, -0.12));
  g.add(at(rbox(0.07, 2.1, 0.07, 0.02, wood), 0, 1.0, -0.42, 0.25, 0, 0));
  g.add(at(rbox(1.2, 0.06, 0.12, 0.02, wood), 0, 0.72, 0.1));
  const board = rbox(boardW, boardH, 0.05, 0.02, 0xfafafa); at(board, 0, 0.75 + boardH / 2 + 0.03, 0.09, -0.08); g.add(board);
  const face = plane(boardW - 0.06, boardH - 0.06, mtl); face.castShadow = false; at(face, 0, 0.75 + boardH / 2 + 0.03, 0.118, -0.08); g.add(face);
  return g;
}

function holoPanel(color, seed) {
  const tex = codeTex({ w: 384, h: 240, bg: 'rgba(4,20,14,0.82)', border: color, seed, title: `agent_${String(seed).padStart(2, '0')}` });
  const m = texGlow(tex, { transparent: true, side: THREE.DoubleSide, depthWrite: false });
  m.color.setScalar(1.5);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.62), m);
  return p;
}

// a lighter "mini" pip used as clones/agents
function miniPip(s = 0.45, eye = 0x7ff6ff) { const p = makePip({ eye }); p.root.scale.setScalar(s); return p; }

// ------------------------------------------------------------------ MODE DATA
export const MODES = [
  { key: 'CODE', calm: 'one small fix', chaos: '12 AGENTS', bg: ['#33dcc4', '#12a892'], accent: '#0a6e60', chaosColor: '#4dff8a' },
  { key: 'WRITE', calm: 'a gentle draft', chaos: 'FULL REWRITE', bg: ['#f8eedb', '#ead7b6'], accent: '#7a1f3a', chaosColor: '#ffffff' },
  { key: 'RESEARCH', calm: 'one good source', chaos: '847 TABS', bg: ['#6aa8f6', '#3a78e0'], accent: '#1d3f8f', chaosColor: '#ffd23f' },
  { key: 'DEBUG', calm: 'hm. a bug.', chaos: 'KILL IT WITH FIRE', bg: ['#f9cb3a', '#e8a514'], accent: '#7a4a10', chaosColor: '#ffbf2e' },
  { key: 'ANALYZE', calm: 'a simple chart', chaos: 'ALL THE DATA', bg: ['#f8bed2', '#ee95b3'], accent: '#8f2a54', chaosColor: '#4ff0ff' },
  { key: 'DESIGN', calm: 'a little sketch', chaos: 'MASTERPIECE', bg: ['#f3f3f7', '#dcdce6'], accent: '#ff3d7f', chaosColor: '#ffffff' },
];

const calmOverlay = (i, color) => (ctx, lt) => fx.calmTitle(ctx, lt, { idx: String(i + 1).padStart(2, '0'), title: MODES[i].key, sub: MODES[i].calm, color });
const chaosOverlay = (i) => (ctx, lt) => {
  fx.chaosTitle(ctx, lt, { idx: String(i + 1).padStart(2, '0'), mode: MODES[i].key, title: MODES[i].chaos, color: MODES[i].chaosColor });
  fx.impact(ctx, lt, MODES[i].chaosColor);
};

// Pip sitting behind a desk
function seatedPip(st, d, extras = []) {
  const pip = makePip(); pip.root.position.set(0, 0.22, -0.55); st.scene.add(pip.root);
  for (const [anchor, obj] of extras) pip[anchor].add(obj);
  st.scene.add(d);
  return pip;
}

// ================================================================== 01 CODE
export function codeCalm() {
  const st = stage({ cam: [0, 2.3, 9], look: [0, 0.95, 0] });
  const d = desk({});
  const pip = seatedPip(st, d, [['hatAnchor', at(headphones(), 0, -0.05, 0)], ['waistAnchor', hoodie()]]);
  const screenTex = codeTex({ seed: 4 });
  const mon = at(monitor(screenTex), 1.35, d.topY, -0.25, 0, -0.35); st.scene.add(mon);
  const kb = at(keyboard(), 0, d.topY, 0.25); st.scene.add(kb);
  const m = at(mug(), -1.05, d.topY, 0.15); st.scene.add(m);
  st.scene.add(at(cactus(), -1.55, d.topY, -0.25));
  st.scene.add(at(duck(), 1.45, d.topY, 0.35, 0, -0.6));
  st.scene.add(at(plane(0.18, 0.12, 0xffe066), 0.65, d.topY + 0.005, 0.4, -Math.PI / 2, 0, 0.2));
  let alert = null;
  return {
    dur: 3.6, st,
    bg(ctx, lt) {
      fx.flat(ctx, ...MODES[0].bg); fx.halftone(ctx, '#ffffff', lt, { alpha: 0.16 });
      ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = '#fff'; roundRect(ctx, 90, 40, 220, 150, 26); ctx.fill(); ctx.restore();
    },
    update(lt) {
      pip.update(lt, { arms: false });
      const typing = lt < 2.3 ? 1 : 0.15;
      pip.armL.rotation.set(-1.0 + Math.sin(lt * 26) * 0.12 * typing, 0, -0.1);
      pip.armR.rotation.set(-1.0 + Math.sin(lt * 26 + 2) * 0.12 * typing, 0, 0.1);
      pip.setEyes(lt < 1.1 ? 'open' : lt < 2.2 ? 'happy' : lt < 2.9 ? 'wide' : 'angry');
      const a = lt > 2.25; if (a !== alert) { alert = a; screenTex.redraw({ alert: a }); }
      screenTex.offset.y = a ? 0 : -((lt * 0.15) % 1) * 0;
      m.tick(lt);
      camPath(st, [[0, [0, 2.3, 9.2], [0, 0.95, 0]], [2.4, [0.2, 2.1, 7.8], [0.1, 1.0, 0]], [3.0, [0.4, 1.6, 4.4], [0.3, 1.1, -0.3]], [3.6, [0.4, 1.5, 3.7], [0.3, 1.1, -0.3]]], lt);
    },
    overlay: calmOverlay(0, '#ffffff'),
  };
}

export function codeChaos() {
  const st = stage({ cam: [0, 1.6, 4], hemi: 0.35, key: 0.9, keyColor: 0x9cffc4, shadow: 0.35, envI: 0.25, hemiGround: 0x003311 });
  const d = desk({ top: 0x3a4a44, leg: 0x9aa5a0 });
  const pip = seatedPip(st, d, [['hatAnchor', at(headphones(0x9aa5a0), 0, -0.05, 0)], ['waistAnchor', hoodie(0x2a3a8a)]]);
  pip.setEyeColor(0x4dff8a, 3);
  st.scene.add(at(keyboard(), 0, d.topY, 0.25));
  const tex = codeTex({ seed: 9, bg: '#03140c' }); st.scene.add(at(monitor(tex), 1.35, d.topY, -0.25, 0, -0.35));
  st.scene.add(at(duck(), 1.45, d.topY, 0.35, 0, -0.6));
  const g = new THREE.PointLight(0x4dff8a, 6, 8, 1.2); g.position.set(0, 2.2, 1.5); st.scene.add(g);
  const neon = ['#4dff8a', '#3ae6ff', '#ffd23f'];
  const agents = [];
  for (let i = 0; i < 12; i++) {
    const row = i < 6 ? 0 : 1, k = i % 6;
    const a = (k / 5 - 0.5) * (row ? 2.0 : 1.7);
    const R = row ? 5.4 : 4.0;
    const p = miniPip(0.42, new THREE.Color(neon[i % 3]).getHex());
    const base = new THREE.Vector3(Math.sin(a) * R, row ? 2.5 : 1.05, -Math.cos(a) * R + 1.2);
    p.root.position.copy(base); p.root.lookAt(0, base.y, 3); st.scene.add(p.root);
    const pad = tor(0.32, 0.03, glow(neon[i % 3], 3)); pad.rotation.x = Math.PI / 2; pad.position.copy(base); st.scene.add(pad);
    const panel = holoPanel(neon[(i + 1) % 3], i + 1); panel.position.copy(base).add(new THREE.Vector3(0, 1.05, 0)); panel.lookAt(0, panel.position.y, 4); st.scene.add(panel);
    agents.push({ p, panel, base, phase: i * 0.7 });
  }
  return {
    dur: 3.0, st, bloom: { strength: 0.65, radius: 0.4, threshold: 0.8 },
    bg(ctx, lt) { fx.flat(ctx, '#06231a', '#010805'); fx.matrixRain(ctx, lt); },
    update(lt) {
      pip.update(lt, { arms: false, blink: false }); pip.setEyes('angry');
      pip.armL.rotation.set(-1.0 + Math.sin(lt * 50) * 0.2, 0, -0.1); pip.armR.rotation.set(-1.0 + Math.sin(lt * 50 + 2) * 0.2, 0, 0.1);
      agents.forEach(({ p, panel, base, phase }, i) => {
        const appear = easeBack(prog(lt, 0.15 + i * 0.07, 0.45 + i * 0.07));
        p.root.scale.setScalar(0.42 * appear); panel.scale.setScalar(Math.max(0.001, appear));
        p.update(lt + phase, { arms: false }); p.setEyes('angry');
        p.armL.rotation.x = -1 + Math.sin(lt * 40 + i) * 0.3; p.armR.rotation.x = -1 + Math.sin(lt * 40 + i + 2) * 0.3;
        panel.position.y = base.y + 1.05 + Math.sin(lt * 2 + phase) * 0.06;
      });
      camPath(st, [[0, [0, 1.6, 3.6], [0, 1.2, -0.5]], [1.6, [0.6, 2.4, 8.8], [0, 1.6, -1]], [3.0, [-0.6, 2.6, 10.5], [0, 1.7, -1]]], lt);
      shake(st.camera, lt, 0.03 * (1 - prog(lt, 0, 1.2)) + 0.008);
    },
    overlay: chaosOverlay(0),
  };
}

// ================================================================== 02 WRITE
function writeSet(st, { dark = false } = {}) {
  const d = desk({ w: 3.4, d: 1.2, h: 0.66, top: 0x6e3b1e, leg: 0x6e3b1e, turned: true, drawer: true });
  const cap = writerCap();
  const pip = seatedPip(st, d, [['hatAnchor', cap]]);
  const q = quill(); at(q, 0, 0.05, 0.1, 0.5, 0, -0.3); pip.armR.hand.add(q);
  const lt = letterTex(); const paper = plane(0.9, 0.6, texMat(lt)); at(paper, 0.2, d.topY + 0.006, 0.25, -Math.PI / 2, 0, 0.06); paper.castShadow = false; st.scene.add(paper);
  st.scene.add(at(bookStack(3, 2), -1.2, d.topY, -0.1, 0, 0.3));
  const cup = group(at(cyl(0.12, 0.08, 0.12, 0xfafafa), 0, 0.06, 0), at(cyl(0.18, 0.18, 0.015, 0xfafafa), 0, 0.005, 0)); at(cup, -0.85, d.topY, 0.35); st.scene.add(cup);
  st.scene.add(at(inkwell(), 0.95, d.topY, 0.1));
  const c = at(candle(), 1.35, d.topY, -0.05); st.scene.add(c);
  return { d, pip, cap, q, lt, paper, c };
}

export function writeCalm() {
  const st = stage({ key: 1.9, keyColor: 0xfff1dc });
  const s = writeSet(st);
  let last = -1;
  return {
    dur: 3.6, st,
    bg(ctx) { fx.flat(ctx, ...MODES[1].bg); },
    update(lt) {
      const { pip, cap } = s;
      pip.update(lt, { arms: false });
      pip.armL.rotation.set(-0.7, 0, -0.2);
      pip.armR.rotation.set(-1.05 + Math.sin(lt * 9) * 0.06, Math.sin(lt * 5) * 0.15, 0.1);
      pip.setEyes(lt < 1.3 ? 'open' : lt < 2.5 ? 'happy' : lt < 2.85 ? 'flat' : 'angry');
      const p = Math.round(clamp(lt / 2.6) * 60) / 60; if (p !== last) { last = p; s.lt.redraw(p); }
      s.c.tick(lt);
      const fly = prog(lt, 3.0, 3.6); // cap flies off
      cap.position.set(fly * 1.4, fly * 2.4 - fly * fly * 0.6, 0); cap.rotation.z = -fly * 4;
      camPath(st, [[0, [0, 2.2, 9], [0, 0.95, 0]], [2.6, [-0.2, 2.0, 7.6], [0, 1, 0]], [3.1, [0, 1.6, 4.2], [0, 1.2, -0.4]], [3.6, [0, 1.6, 4.0], [0, 1.25, -0.4]]], lt);
      if (lt > 2.95) shake(st.camera, lt, 0.03);
    },
    overlay: calmOverlay(1, '#6b1730'),
  };
}

function paperTex() {
  return canvasTex(64, 84, (c, w, h) => {
    c.fillStyle = '#fbf8f0'; c.fillRect(0, 0, w, h); c.fillStyle = '#a7a0c0';
    for (let y = 12; y < h - 6; y += 7) c.fillRect(6, y, 30 + ((y * 13) % 22), 2);
  });
}

export function writeChaos() {
  const st = stage({ cam: [0, 2.3, 9], key: 2.2, shadow: 0.25 });
  const s = writeSet(st);
  s.cap.position.y = 0.05;
  const N = 320, r = rng(21);
  const papers = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.3, 0.4), texMat(paperTex(), { side: THREE.DoubleSide }), N);
  papers.castShadow = true; st.scene.add(papers);
  const P = Array.from({ length: N }, () => ({ a: r() * 6.28, rad: 1.2 + r() * 5, h: r() * 7, sp: 0.6 + r() * 1.2, rise: 0.8 + r() * 1.8, spin: r() * 6 }));
  const stackGeo = new THREE.BoxGeometry(0.62, 0.035, 0.85);
  const stacks = [-2.3, 2.3, -3.2].map((x, k) => { const m = new THREE.InstancedMesh(stackGeo, mat(0xfdfbf5), 60); m.castShadow = m.receiveShadow = true; m.userData.x = x; m.userData.z = k === 2 ? -1.6 : 0.2; st.scene.add(m); return m; });
  const endTex = canvasTex(256, 340, (c, w, h) => {
    c.fillStyle = '#fbf8f0'; c.fillRect(0, 0, w, h); c.fillStyle = '#b8b2c8';
    for (let y = 40; y < h - 40; y += 18) c.fillRect(24, y, 150 + ((y * 7) % 60), 5);
    c.save(); c.translate(w / 2, h * 0.55); c.rotate(-0.25); c.strokeStyle = '#d42a3a'; c.lineWidth = 8; c.strokeRect(-92, -34, 184, 68);
    c.fillStyle = '#d42a3a'; c.font = `46px ${FONT.display}`; c.textAlign = 'center'; c.fillText('THE END', 0, 18); c.restore();
  });
  const endPage = plane(0.75, 1.0, texMat(endTex, { side: THREE.DoubleSide })); st.scene.add(endPage);
  return {
    dur: 3.0, st,
    bg(ctx, lt) { fx.sunburst(ctx, '#1338e6', '#2c5bff', lt, { speed: 0.4 }); },
    update(lt) {
      const { pip } = s;
      pip.update(lt * 2, { arms: false, blink: false }); pip.setEyes('angry');
      pip.armR.rotation.set(-1.1 + Math.sin(lt * 40) * 0.4, Math.sin(lt * 23) * 0.5, 0.2);
      pip.armL.rotation.set(-0.9 + Math.sin(lt * 37) * 0.4, 0, -0.4 + Math.sin(lt * 29) * 0.3);
      s.c.tick(lt);
      P.forEach((p, i) => {
        const a = p.a + lt * p.sp, y = (p.h + lt * p.rise) % 7;
        dummy.position.set(Math.cos(a) * p.rad, y + 0.4, Math.sin(a) * p.rad * 0.6 - 0.5);
        dummy.rotation.set(lt * p.spin + i, lt * p.spin * 0.7, i);
        dummy.scale.setScalar(clamp(lt * 3 - i / N));
        dummy.updateMatrix(); papers.setMatrixAt(i, dummy.matrix);
      });
      papers.instanceMatrix.needsUpdate = true;
      stacks.forEach((m, k) => {
        const n = Math.floor(easeOut(prog(lt, 0.1 + k * 0.2, 2.6)) * 60);
        for (let i = 0; i < 60; i++) {
          dummy.position.set(m.userData.x + Math.sin(i * 1.7) * 0.04, i < n ? 0.02 + i * 0.037 : -10, m.userData.z);
          dummy.rotation.set(0, Math.sin(i * 2.3) * 0.08, 0); dummy.scale.setScalar(1); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
      });
      const e = easeBack(prog(lt, 1.6, 2.2));
      endPage.position.set(0, lerp(0.8, 2.6, e), lerp(-0.6, 0.3, e)); endPage.rotation.set(0, Math.sin(lt * 3) * 0.1, Math.sin(lt * 2) * 0.05); endPage.scale.setScalar(Math.max(0.01, e));
      camPath(st, [[0, [0, 1.8, 4.5], [0, 1.2, 0]], [1.4, [0.5, 2.4, 9.5], [0, 1.5, 0]], [3.0, [-0.5, 2.6, 10.5], [0, 1.7, 0]]], lt);
      shake(st.camera, lt, 0.035);
    },
    overlay: chaosOverlay(1),
  };
}

// ================================================================== 03 RESEARCH
function researchSet(st) {
  const d = desk({ w: 3.4, d: 1.2, h: 0.62, top: 0xd9a05e, leg: 0xb97a3e, turned: true });
  const mb = mortarboard();
  const pip = seatedPip(st, d, [['hatAnchor', at(mb, 0, -0.02, 0)], ['faceAnchor', roundGlasses()]]);
  const pagesTex = canvasTex(128, 160, (c, w, h) => { c.fillStyle = '#fbf6ea'; c.fillRect(0, 0, w, h); c.fillStyle = '#c9bfa8'; for (let y = 16; y < h - 10; y += 11) c.fillRect(12, y, 90 + ((y * 7) % 20), 3); c.fillStyle = '#e8473a'; c.fillRect(12, 90, 60, 4); });
  const book = at(openBook(pagesTex), 0, d.topY, 0.25, 0.12); st.scene.add(book);
  const gl = at(globe(), -1.3, d.topY, 0.05); st.scene.add(gl);
  st.scene.add(at(bookStack(2, 8), -1.25, d.topY, -0.35, 0, -0.2));
  st.scene.add(at(bankerLamp(), 1.3, d.topY, -0.1, 0, -0.5));
  return { d, pip, mb, gl, book };
}

export function researchCalm() {
  const st = stage({});
  const s = researchSet(st);
  return {
    dur: 3.6, st,
    bg(ctx, lt) { fx.flat(ctx, ...MODES[2].bg); fx.halftone(ctx, '#ffffff', lt, { alpha: 0.15 }); },
    update(lt) {
      const { pip, mb } = s;
      pip.update(lt, { arms: false, bob: 0.4 });
      pip.bodyG.rotation.x = 0.1 + Math.sin(lt * 1.5) * 0.04;
      pip.armL.rotation.set(-0.8, 0, -0.1); pip.armR.rotation.set(-0.8 + (lt > 1.6 && lt < 2.0 ? Math.sin((lt - 1.6) * 8) * 0.4 : 0), 0, 0.1);
      pip.setEyes(lt < 2.2 ? 'open' : 'happy');
      mb.tassel.rotation.y = Math.sin(lt * 2) * 0.3;
      s.gl.tick(lt);
      camPath(st, [[0, [0, 2.3, 9.2], [0, 0.95, 0]], [3.6, [0.3, 2.1, 7.4], [0, 1.0, 0]]], lt);
    },
    overlay: calmOverlay(2, '#ffffff'),
  };
}

function browserTex(kind, seed) {
  return canvasTex(360, 240, (c, w, h) => {
    const r = rng(seed);
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#eceef3'; c.fillRect(0, 0, w, 30);
    ['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(16 + i * 16, 15, 5, 0, 7); c.fill(); });
    c.fillStyle = '#fff'; roundRect(c, 70, 7, 200, 16, 8); c.fill();
    c.strokeStyle = '#d6d9e2'; c.lineWidth = 2; c.strokeRect(1, 1, w - 2, h - 2);
    if (kind === 0) { c.fillStyle = '#20232c'; c.fillRect(20, 44, w - 40, 130); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(w / 2 - 14, 92); c.lineTo(w / 2 + 18, 109); c.lineTo(w / 2 - 14, 126); c.fill(); c.fillStyle = '#c3c7d2'; c.fillRect(20, 186, 200, 10); c.fillRect(20, 204, 140, 8); }
    if (kind === 1) { c.fillStyle = '#1f2330'; c.fillRect(20, 46, 220, 14); c.fillStyle = '#c3c7d2'; for (let y = 72; y < h - 14; y += 14) c.fillRect(20, y, 180 + r() * 120, 6); c.fillStyle = '#5b8def'; c.fillRect(20, 112, 120, 6); }
    if (kind === 2) { ['#4285f4', '#ea4335', '#fbbc05', '#34a853', '#4285f4'].forEach((col, i) => { c.fillStyle = col; c.fillRect(110 + i * 28, 48, 24, 20); }); c.fillStyle = '#f1f3f4'; roundRect(c, 60, 80, 240, 22, 11); c.fill(); for (let k = 0; k < 4; k++) { c.fillStyle = '#3367d6'; c.fillRect(40, 118 + k * 28, 160, 7); c.fillStyle = '#c3c7d2'; c.fillRect(40, 129 + k * 28, 240, 5); } }
    if (kind === 3) { c.fillStyle = '#ffe2a8'; c.fillRect(20, 46, 140, 110); c.fillStyle = '#f2b53a'; c.beginPath(); c.moveTo(30, 146); c.lineTo(80, 90); c.lineTo(120, 146); c.fill(); c.fillStyle = '#c3c7d2'; for (let y = 52; y < 160; y += 14) c.fillRect(176, y, 150, 6); }
  });
}

export function researchChaos() {
  const st = stage({ cam: [0, 2.2, 9], shadow: 0.25 });
  const s = researchSet(st);
  const texs = [0, 1, 2, 3].map((k) => browserTex(k, k + 3));
  const r = rng(77);
  const wins = [];
  for (let i = 0; i < 46; i++) {
    const p = plane(1.25, 0.83, texGlow(texs[i % 4], { side: THREE.DoubleSide })); p.castShadow = false;
    const col = i % 12, row = Math.floor(i / 12);
    const target = new THREE.Vector3((col - 5.5) * 1.15 + (r() - 0.5) * 0.4, 1.6 + row * 0.95 + (r() - 0.5) * 0.3, -3.2 - r() * 1.6 + Math.abs(col - 5.5) * 0.25);
    const ang = r() * Math.PI * 2;
    const from = new THREE.Vector3(Math.cos(ang) * 14, 2 + Math.sin(ang) * 8, 4);
    p.lookAt(0, 1.5, 9);
    st.scene.add(p); wins.push({ p, target, from, t0: 0.15 + r() * 2.2, rz: (r() - 0.5) * 0.4, rot: p.rotation.clone() });
  }
  const bookGeo = new THREE.BoxGeometry(0.62, 0.11, 0.46);
  const cols = [0x2d4f8a, 0x3c8a5a, 0xb5463a, 0xe0b040, 0x6a3f8f, 0x24706f, 0xd9772f, 0xf2efe6];
  const stacksX = [-3.4, -2.5, -1.9, 1.9, 2.6, 3.4, -4.2, 4.3];
  const books = new THREE.InstancedMesh(bookGeo, mat(0xffffff), stacksX.length * 18); books.castShadow = true; st.scene.add(books);
  for (let i = 0; i < books.count; i++) books.setColorAt(i, new THREE.Color(cols[Math.floor(r() * cols.length)]));
  return {
    dur: 3.0, st,
    bg(ctx, lt) { fx.sunburst(ctx, '#ef1a8e', '#ff3aa3', lt, { speed: 0.1, n: 16 }); },
    update(lt) {
      const { pip } = s;
      pip.update(lt * 1.6, { arms: false, blink: false }); pip.setEyes('wide');
      pip.armL.rotation.set(-0.9 + Math.sin(lt * 30) * 0.4, 0, -0.2); pip.armR.rotation.set(-0.9 + Math.sin(lt * 30 + 1.5) * 0.4, 0, 0.2);
      pip.bodyG.rotation.y = Math.sin(lt * 9) * 0.25;
      s.gl.tick(lt * 6);
      wins.forEach((w) => {
        const k = easeOut(prog(lt, w.t0, w.t0 + 0.45));
        w.p.visible = lt > w.t0; w.p.position.lerpVectors(w.from, w.target, k);
        w.p.rotation.set(w.rot.x, w.rot.y, w.rot.z + (1 - k) * 3 + w.rz * k);
      });
      let idx = 0;
      stacksX.forEach((x, sI) => {
        const n = Math.floor(easeIn(prog(lt, 0.2 + sI * 0.1, 2.8)) * 18);
        for (let i = 0; i < 18; i++, idx++) {
          dummy.position.set(x + Math.sin(i * 3.1 + sI) * 0.05, i < n ? 0.055 + i * 0.11 : -20, Math.abs(x) > 4 ? -1.6 : 0.3);
          dummy.rotation.set(0, Math.sin(i * 1.9 + sI) * 0.35, 0); dummy.scale.setScalar(1); dummy.updateMatrix(); books.setMatrixAt(idx, dummy.matrix);
        }
      });
      books.instanceMatrix.needsUpdate = true;
      camPath(st, [[0, [0, 1.7, 4.6], [0, 1.2, 0]], [1.3, [0, 2.2, 8.5], [0, 1.6, -0.5]], [3.0, [0.6, 2.4, 10.5], [0, 1.8, -0.5]]], lt);
      shake(st.camera, lt, 0.012);
    },
    overlay(ctx, lt) {
      chaosOverlay(2)(ctx, lt);
      fx.badge(ctx, `tabs: ${String(Math.floor(easeIn(prog(lt, 0.1, 2.7)) * 847)).padStart(3, '0')}`, W - 32, 28);
    },
  };
}

// ================================================================== 04 DEBUG
export function debugCalm() {
  const st = stage({ cam: [0, 1.8, 8.5], look: [0.4, 0.75, 0] });
  const pip = makePip(); at(pip.root, -1.1, 0, 0, 0, 0.55); st.scene.add(pip.root);
  pip.hatAnchor.add(at(detectiveCap(), 0, -0.04, 0));
  const mg = magnifier(); at(mg, 0, -0.05, 0.12, 0, 0, 0); pip.armR.hand.add(mg);
  const bug = beetle(); st.scene.add(bug);
  [1, 2, 3].forEach((n, i) => st.scene.add(at(marker(n), 0.2 + i * 0.95, 0, 1.1)));
  return {
    dur: 3.6, st,
    bg(ctx, lt) { fx.flat(ctx, ...MODES[3].bg); fx.halftone(ctx, '#ffffff', lt, { alpha: 0.16 }); },
    update(lt) {
      pip.update(lt, { arms: false });
      const lift = easeInOut(prog(lt, 2.4, 2.9));
      pip.armL.rotation.set(0, 0, -0.2);
      pip.armR.rotation.set(-1.2 - lift * 0.9, 0.3 - lift * 0.6, 0.2 + lift * 0.3);
      pip.root.rotation.y = lerp(0.55, 0.15, lift);
      pip.bodyG.rotation.x = 0.15 * (1 - lift) + Math.sin(lt * 2) * 0.03;
      pip.setEyes(lt < 1.5 ? 'open' : lt < 2.4 ? 'flat' : 'wide');
      bug.tick(lt);
      at(bug, lerp(0.0, 2.6, prog(lt, 0, 3.6)), 0, 0.7 + Math.sin(lt * 2) * 0.1, 0, Math.PI / 2 + Math.sin(lt * 3) * 0.2);
      camPath(st, [[0, [0, 1.8, 8.5], [0.4, 0.75, 0]], [2.5, [0.2, 1.7, 7.5], [0.2, 0.8, 0]], [3.1, [-0.7, 1.3, 2.6], [-0.95, 1.05, 0]], [3.6, [-0.7, 1.3, 2.4], [-0.95, 1.05, 0]]], lt);
    },
    overlay: calmOverlay(3, '#4a2a06'),
  };
}

export function debugChaos() {
  const st = stage({ cam: [1.5, 1.6, 8], hemi: 0.5, key: 1.6, keyColor: 0xffc58a, shadow: 0.35, envI: 0.35 });
  const pip = makePip(); at(pip.root, -2.2, 0, 0, 0, Math.PI / 2 - 0.15); st.scene.add(pip.root);
  pip.hatAnchor.add(at(detectiveCap(), 0, -0.04, 0));
  // flamethrower: tank on back + gun in right hand
  pip.bodyG.add(group(at(cyl(0.16, 0.16, 0.7, 0xc0392b), -0.22, 0.95, -0.6), at(cyl(0.16, 0.16, 0.7, 0xc0392b), 0.22, 0.95, -0.6)));
  const gun = group(at(rbox(0.16, 0.16, 0.6, 0.03, 0x2b2b30), 0, 0, 0.2), at(cyl(0.05, 0.07, 0.5, 0x6b6b73, { metalness: 0.8, roughness: 0.3 }), 0, 0.02, 0.7, Math.PI / 2), at(cyl(0.09, 0.06, 0.12, 0xd4a017, { metalness: 0.8 }), 0, 0.02, 0.98, Math.PI / 2));
  pip.armR.hand.add(gun);
  const fire = new THREE.PointLight(0xff8a2a, 0, 10, 1.2); st.scene.add(fire);
  const NF = 280;
  const flames = new THREE.InstancedMesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), NF);
  st.scene.add(flames);
  const r = rng(5), FR = Array.from({ length: NF }, () => ({ o: r(), sx: (r() - 0.5), sy: (r() - 0.5), sz: (r() - 0.5) }));
  const bugCols = [0x2ee6c8, 0xff4d8d, 0x9b5cff, 0x41d18a, 0xffc23d, 0x3aa0ff];
  const bugs = Array.from({ length: 16 }, (_, i) => { const b = beetle(bugCols[i % bugCols.length]); b.scale.setScalar(0.7 + r() * 0.4); st.scene.add(b); return { b, x0: -0.4 + r() * 2.5, z: (r() - 0.5) * 2.6, sp: 1.6 + r() * 2, ph: r() * 6 }; });
  const flag = group(at(cyl(0.012, 0.012, 0.6, 0xdddddd), 0, 0.3, 0), at(plane(0.32, 0.22, mat(0xffffff, { side: THREE.DoubleSide })), 0.17, 0.48, 0));
  st.scene.add(flag);
  const nozzle = new THREE.Vector3(), tmp = new THREE.Color();
  const cols = [new THREE.Color(1.1, 1.0, 0.7), new THREE.Color(1.0, 0.5, 0.08), new THREE.Color(0.7, 0.14, 0.02), new THREE.Color(0.15, 0.02, 0.01)];
  return {
    dur: 3.0, st, bloom: { strength: 0.7, radius: 0.45, threshold: 0.85 },
    bg(ctx, lt) { fx.sunburst(ctx, '#4d0407', '#6e0b10', lt, { speed: 0.25, cx: W * 0.3 }); },
    update(lt) {
      pip.update(lt * 1.5, { arms: false, blink: false }); pip.setEyes(lt < 2.2 ? 'angry' : 'happy');
      pip.armR.rotation.set(-1.45 + Math.sin(lt * 7) * 0.12, 0, 0.12); pip.armL.rotation.set(-1.2, 0, -0.5);
      pip.root.updateMatrixWorld(true);
      gun.localToWorld(nozzle.set(0, 0.02, 1.05));
      const on = prog(lt, 0.25, 0.35) * (1 - prog(lt, 2.2, 2.35));
      fire.position.copy(nozzle).add(new THREE.Vector3(1.2, 0.3, 0)); fire.intensity = on * (5 + Math.sin(lt * 40) * 1.5);
      FR.forEach((f, i) => {
        const a = (lt * 2.2 + f.o) % 1;
        const d = a * 5.5, spread = 0.1 + a * 0.9;
        dummy.position.set(nozzle.x + d, nozzle.y + f.sy * spread + a * a * 0.6, nozzle.z + f.sz * spread);
        dummy.scale.setScalar(on * (0.3 + a * 1.8) * (0.7 + f.sx * 0.6)); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); flames.setMatrixAt(i, dummy.matrix);
        const k = a * 3, j = Math.min(2, Math.floor(k)); tmp.copy(cols[j]).lerp(cols[j + 1], k - j).multiplyScalar(1 - a * 0.7); flames.setColorAt(i, tmp);
      });
      flames.instanceMatrix.needsUpdate = true; flames.instanceColor.needsUpdate = true;
      bugs.forEach((B, i) => {
        const x = B.x0 + lt * B.sp; B.b.tick(lt + B.ph);
        const hop = Math.abs(Math.sin(lt * 9 + B.ph)) * 0.15;
        at(B.b, x, hop, B.z + Math.sin(lt * 4 + B.ph) * 0.2, 0, Math.PI / 2 + Math.sin(lt * 6 + B.ph) * 0.4);
        const burnt = x < nozzle.x + 3.5 && lt > 0.4 + i * 0.03 ? 1 : 0; B.b.rotation.z = burnt ? Math.sin(lt * 30 + i) * 0.4 : 0;
      });
      const fl = easeBack(prog(lt, 2.15, 2.5)); at(flag, 1.4, 0, 0.8, 0, 0, Math.sin(lt * 10) * 0.1); flag.scale.setScalar(Math.max(0.001, fl));
      camPath(st, [[0, [0.6, 1.4, 5.5], [-0.8, 1.0, 0]], [1.2, [2.0, 1.8, 8.5], [0.4, 0.9, 0]], [3.0, [0.4, 1.6, 7.2], [-1.0, 0.9, 0]]], lt);
      shake(st.camera, lt, 0.04 * on);
    },
    overlay: chaosOverlay(3),
  };
}

// ================================================================== 05 ANALYZE
function chartTex() {
  return canvasTex(512, 380, (c, w, h, p = 0, pill = 0) => {
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#2a2a33'; c.font = `600 26px ${FONT.sans}`; c.fillText('weekly snacks', 30, 48);
    c.fillStyle = '#e6e6ee'; c.fillRect(40, h - 50, w - 80, 3);
    const vals = [7, 10, 9, 16], cols = ['#3a7bff', '#ffc23d', '#20c48a', '#ff3d8f'];
    vals.forEach((v, i) => {
      const k = easeOut(clamp(p * 4 - i)); const bh = v * 15 * k;
      c.fillStyle = cols[i]; roundRect(c, 70 + i * 105, h - 50 - bh, 64, bh + 1, 6); c.fill();
      if (k > 0.9) { c.fillStyle = '#2a2a33'; c.font = `600 18px ${FONT.mono}`; c.textAlign = 'center'; c.fillText(v, 102 + i * 105, h - 60 - bh); c.textAlign = 'left'; }
    });
    if (pill > 0) { c.globalAlpha = pill; roundRect(c, w - 240, 22, 210, 40, 20); c.fillStyle = '#ff3d5a'; c.fill(); c.fillStyle = '#fff'; c.font = `600 17px ${FONT.mono}`; c.fillText('+ 2,000,000 rows', w - 222, 48); c.globalAlpha = 1; }
  });
}

export function analyzeCalm() {
  const st = stage({ cam: [0, 2.2, 9.5], look: [0.2, 1.2, 0] });
  const pip = makePip(); at(pip.root, -1.1, 0, 0.2, 0, 0.35); st.scene.add(pip.root);
  pip.hatAnchor.add(at(goggles(), 0, -0.08, 0)); pip.waistAnchor.add(labCoat());
  const stick = cyl(0.015, 0.015, 1.1, 0x2a2a2a); at(stick, 0, 0.5, 0.05); pip.armR.hand.add(stick);
  const ct = chartTex();
  const e = easel(1.5, 1.1, texGlow(ct)); at(e, 1.25, 0, -0.2, 0, -0.35); st.scene.add(e);
  let key = '';
  return {
    dur: 3.6, st,
    bg(ctx, lt) {
      fx.flat(ctx, ...MODES[4].bg);
      ctx.save(); ctx.globalAlpha = 0.14; ctx.fillStyle = '#fff'; [60, 100, 80, 140].forEach((hh, i) => { roundRect(ctx, 80 + i * 60, 220 - hh, 40, hh, 8); ctx.fill(); }); ctx.restore();
    },
    update(lt) {
      pip.update(lt, { arms: false });
      const p = prog(lt, 0.3, 2.4), pill = prog(lt, 2.5, 2.8);
      const k = `${Math.round(p * 80)}|${Math.round(pill * 10)}`; if (k !== key) { key = k; ct.redraw(p, pill); }
      const point = 0.3 + p * 0.9;
      pip.armR.rotation.set(-1.0 - point * 0.6, 0.3, 0.3 + Math.sin(lt * 3) * 0.05); pip.armL.rotation.set(0, 0, -0.25);
      pip.setEyes(lt < 1.6 ? 'open' : lt < 2.6 ? 'happy' : 'wide');
      camPath(st, [[0, [0, 2.2, 9.5], [0.2, 1.2, 0]], [3.6, [0.4, 2.0, 8.0], [0.3, 1.25, 0]]], lt);
    },
    overlay: calmOverlay(4, '#ffffff'),
  };
}

function donut(r, cols) {
  const g = new THREE.Group(); const n = cols.length;
  cols.forEach((c, i) => { const m = tor(r, r * 0.38, glow(c, 1.6), {}, (Math.PI * 2) / n - 0.06); m.rotation.z = (i / n) * Math.PI * 2; m.castShadow = false; g.add(m); });
  return g;
}

export function analyzeChaos() {
  const st = stage({ cam: [0, 2, 10], hemi: 0.6, key: 1.4, keyColor: 0xc9b8ff, shadow: 0.3, envI: 0.4, hemiGround: 0x22114a });
  const N = 22, geo = new THREE.BoxGeometry(0.42, 1, 0.42); geo.translate(0, 0.5, 0);
  const bars = new THREE.InstancedMesh(geo, mat(0xffffff, { roughness: 0.35 }), N * N); bars.castShadow = bars.receiveShadow = true; st.scene.add(bars);
  const r = rng(9), cA = [0x37e0ff, 0x8fe9ff, 0xb9a3ff, 0xd8a8e8, 0xffc93a];
  const info = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const x = (i - N / 2) * 0.55, z = (j - N / 2) * 0.55 - 2; const dist = Math.hypot(x, z + 2);
    const gold = r() < 0.035; info.push({ x, z, dist, h: gold ? 2 + r() * 3 : 0.2 + r() * 1.6, ph: r() * 6 });
    bars.setColorAt(i * N + j, new THREE.Color(gold ? cA[4] : cA[Math.min(3, Math.floor(dist / 2.2 + r()))]));
  }
  const pillar = rbox(0.9, 1, 0.9, 0.04, 0xffc93a); pillar.geometry = pillar.geometry.clone().translate(0, 0.5, 0); st.scene.add(pillar);
  const pip = makePip(); pip.hatAnchor.add(at(goggles(), 0, -0.08, 0)); pip.waistAnchor.add(labCoat()); pip.setEyeColor(0x9ffcff, 3); st.scene.add(pip.root);
  const donuts = [[-3, 4.2, -2, 0.6], [3.2, 3.6, -1, 0.45], [-1.8, 2.6, 1, 0.3], [4.4, 5, -4, 0.8]].map(([x, y, z, s], i) => { const d = donut(s, ['#ff3d8f', '#ffc23d', '#3ae6ff', '#9b5cff', '#41d18a'].slice(0, 3 + (i % 3))); d.position.set(x, y, z); st.scene.add(d); return d; });
  const curve = new THREE.CatmullRomCurve3([[-7, 1, -1], [-4, 2, -2], [-2, 1.6, -1], [0, 3.4, -2], [2, 3, -2], [4, 5, -3], [7, 6.5, -4]].map((p) => new THREE.Vector3(...p)));
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 240, 0.07, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 3, 1), toneMapped: false })); st.scene.add(tube);
  const NC = 90, conf = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), NC); st.scene.add(conf);
  const CC = ['#ff3d8f', '#ffc23d', '#3ae6ff', '#ffffff', '#41d18a'];
  const C = Array.from({ length: NC }, (_, i) => { conf.setColorAt(i, new THREE.Color(CC[i % 5]).multiplyScalar(2)); return { x: (r() - 0.5) * 14, y: r() * 7, z: -r() * 6 + 1, s: 0.3 + r() }; });
  return {
    dur: 3.0, st, bloom: { strength: 0.85, radius: 0.5, threshold: 0.75 },
    bg(ctx, lt) { fx.flat(ctx, '#2a1677', '#08061f'); fx.stars(ctx, lt); },
    update(lt) {
      info.forEach((b, i) => {
        const grow = easeOut(clamp(lt * 1.6 - b.dist * 0.12));
        dummy.position.set(b.x, 0, b.z); dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, Math.max(0.001, b.h * grow * (1 + Math.sin(lt * 3 + b.ph) * 0.12)), 1); dummy.updateMatrix(); bars.setMatrixAt(i, dummy.matrix);
      });
      bars.instanceMatrix.needsUpdate = true;
      const ph = 0.4 + easeOut(prog(lt, 0, 2.2)) * 2.6;
      pillar.position.set(0, 0, 0.6); pillar.scale.set(1, ph, 1);
      pip.root.position.set(0, ph, 0.6); pip.root.scale.setScalar(0.6);
      pip.update(lt * 1.4, { arms: false, blink: false }); pip.setEyes('happy');
      pip.armR.rotation.set(0, 0, 2.6 + Math.sin(lt * 9) * 0.3); pip.armL.rotation.set(0, 0, -2.4 - Math.sin(lt * 9) * 0.3);
      donuts.forEach((d, i) => { d.rotation.set(Math.sin(lt + i) * 0.4, lt * (0.8 + i * 0.2), lt * 1.5); d.scale.setScalar(easeBack(prog(lt, 0.3 + i * 0.2, 0.8 + i * 0.2)) || 0.001); });
      const segs = Math.floor(prog(lt, 0.4, 2.4) * 240); tube.geometry.setDrawRange(0, segs * 8 * 6);
      C.forEach((c, i) => { dummy.position.set(c.x + Math.sin(lt + i) * 0.2, c.y + Math.sin(lt * 2 + i) * 0.3, c.z); dummy.scale.setScalar(c.s); dummy.updateMatrix(); conf.setMatrixAt(i, dummy.matrix); });
      conf.instanceMatrix.needsUpdate = true;
      const a = lt * 0.35 - 0.3;
      camPath(st, [[0, [0, 1.2, 9], [0, 1.4, 0]], [3.0, [0, 1.2, 9], [0, 1.4, 0]]], lt);
      const R = lerp(6.5, 10.5, easeOut(prog(lt, 0, 3)));
      st.set([Math.sin(a) * R, lerp(1.6, 3.4, prog(lt, 0, 3)), Math.cos(a) * R + 0.6], [0, ph + 0.3, 0.2]);
    },
    overlay: chaosOverlay(4),
  };
}

// ================================================================== 06 DESIGN
const PIX = [
  '......Y...',
  '......A...',
  '.BBBBBBBB.',
  '.BSSSSSSB.',
  'BBSESSESBB',
  '.BSSSSSSB.',
  '.BBBBBBBB.',
  '..L....L..',
  '..F....F..',
];
const PIXC = { Y: '#ffb547', A: '#9aa3b8', B: '#7f8cff', S: '#161a33', E: '#7ff6ff', L: '#5561d6', F: '#3a4196' };
function paintingTex() {
  const cells = []; PIX.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') cells.push([x, y, ch]); }));
  const t = canvasTex(320, 320, (c, w, h, n = 0) => {
    c.fillStyle = '#fbf9f2'; c.fillRect(0, 0, w, h);
    const s = 26, ox = (w - 10 * s) / 2, oy = (h - 9 * s) / 2;
    cells.slice(0, n).forEach(([x, y, ch]) => { c.fillStyle = PIXC[ch]; c.fillRect(ox + x * s, oy + y * s, s + 0.5, s + 0.5); });
  });
  t.cells = cells.length; return t;
}

function designSet(st) {
  const pt = paintingTex();
  const e = easel(1.15, 1.15, texMat(pt)); at(e, -0.7, 0, -0.3, 0, 0.25); st.scene.add(e);
  const stool = group(at(cyl(0.3, 0.3, 0.06, 0x8a5a2b), 0, 0.75, 0), ...[0, 1, 2].map((i) => at(cyl(0.025, 0.03, 0.78, 0x8a5a2b), Math.cos(i * 2.1) * 0.2, 0.37, Math.sin(i * 2.1) * 0.2, Math.sin(i * 2.1) * 0.12, 0, -Math.cos(i * 2.1) * 0.12)));
  stool.add(at(cyl(0.08, 0.07, 0.2, 0x88aacc, { transparent: true, opacity: 0.6, roughness: 0.05 }), 0, 0.88, 0));
  for (let i = 0; i < 3; i++) stool.add(at(brush([0xff4d8d, 0xffc23d, 0x3aa0ff][i]), (i - 1) * 0.03, 1.05, 0, 0, 0, (i - 1) * 0.25));
  at(stool, -2.4, 0, -0.6); st.scene.add(stool);
  const pip = makePip(); at(pip.root, 1.25, 0, 0.2, 0, -0.55); st.scene.add(pip.root);
  pip.hatAnchor.add(at(beret(), 0, -0.04, 0)); pip.waistAnchor.add(stripes());
  const pal = palette(); at(pal, 0.05, -0.05, 0.2, 0, 0.6, 0); pip.armL.hand.add(pal);
  const br = brush(); at(br, 0, 0.0, 0.1, Math.PI / 2 - 0.3, 0, 0); pip.armR.hand.add(br);
  return { pt, pip, e };
}

export function designCalm() {
  const st = stage({ cam: [0, 2.0, 9.5], look: [0, 1.0, 0], shadow: 0.14 });
  const s = designSet(st);
  let last = -1;
  return {
    dur: 3.6, st,
    bg(ctx) { fx.flat(ctx, ...MODES[5].bg); },
    update(lt) {
      const { pip } = s;
      pip.update(lt, { arms: false });
      const dab = lt < 2.4 ? Math.max(0, Math.sin(lt * 7)) : 0;
      pip.armR.rotation.set(-1.3 - dab * 0.3, 0.2, 0.2); pip.armL.rotation.set(-0.5, 0, -0.5);
      const n = Math.floor(prog(lt, 0.3, 2.4) * s.pt.cells); if (n !== last) { last = n; s.pt.redraw(n); }
      pip.setEyes(lt < 1.4 ? 'open' : lt < 2.5 ? 'happy' : lt < 3.0 ? 'wink' : 'angry');
      camPath(st, [[0, [0, 2.0, 9.5], [0, 1.0, 0]], [2.8, [0.2, 1.9, 8.4], [0.1, 1.05, 0]], [3.3, [1.4, 1.5, 4.2], [1.2, 1.1, 0]], [3.6, [1.4, 1.5, 4.0], [1.2, 1.1, 0]]], lt);
      if (lt > 3.05) shake(st.camera, lt, 0.025);
    },
    overlay: calmOverlay(5, '#23233a'),
  };
}

export function designChaos() {
  const st = stage({ cam: [0, 2, 11], look: [0, 1.6, 0], shadow: 0.12 });
  const s = designSet(st); s.pt.redraw(s.pt.cells);
  s.pip.armR.hand.clear();
  const roller = group(at(cyl(0.02, 0.02, 0.9, 0x555555), 0, 0.45, 0), at(cyl(0.12, 0.12, 0.5, 0xffc23d), 0, 0.92, 0, 0, 0, Math.PI / 2));
  s.pip.armR.hand.add(roller);
  [[2.3, 0xff3d8f], [2.75, 0x3aa0ff], [-1.7, 0x9b5cff]].forEach(([x, c]) => st.scene.add(at(group(at(cyl(0.2, 0.17, 0.36, 0x6b6b73, { metalness: 0.6, roughness: 0.4 }), 0, 0.18, 0), at(cyl(0.18, 0.18, 0.01, c), 0, 0.36, 0)), x, 0, 0.6)));
  const strokes = [
    { c: 0xff3d8f, r: 0.42, pts: [[-8, 1.2, -3], [-4, 2.8, -2], [0, 3.6, -3], [4, 2.6, -2], [8, 3.4, -4]], t0: 0.2 },
    { c: 0xffc23d, r: 0.5, pts: [[-2, 1, -4], [-1.5, 4.5, -3.5], [1.5, 5.4, -3], [3, 3.2, -2.5], [2, 1.5, -2]], t0: 0.6 },
    { c: 0x3aa0ff, r: 0.38, pts: [[-7, 4, -2], [-5, 2, -1], [-3.5, 3.5, -1.5], [-5, 5.5, -2]], t0: 1.0 },
    { c: 0x9b5cff, r: 0.45, pts: [[-4, 6, -5], [-2, 4.2, -3], [-3.5, 2.5, -2], [-1.2, 1.4, -1.5]], t0: 1.3 },
    { c: 0xff7a1a, r: 0.36, pts: [[8, 0.6, -2], [5, 1.4, -1], [2.5, 4.4, -2.5], [5, 5.6, -4]], t0: 1.6 },
    { c: 0x2ed47a, r: 0.25, pts: [[-6, 0.15, 1], [-2, 0.15, 1.6], [2, 0.15, 1.2], [6, 0.15, 1.8]], t0: 2.0 },
  ].map((S) => {
    const curve = new THREE.CatmullRomCurve3(S.pts.map((p) => new THREE.Vector3(...p)));
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, S.r, 14), mat(S.c, { roughness: 0.3 })); m.castShadow = true; st.scene.add(m);
    return { ...S, curve, m };
  });
  const r = rng(31), ND = 140;
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 12, 10), mat(0xffffff, { roughness: 0.3 }), ND); drops.castShadow = true; st.scene.add(drops);
  const D = Array.from({ length: ND }, (_, i) => { const S = strokes[i % strokes.length]; drops.setColorAt(i, new THREE.Color(S.c)); return { S, u: r(), t: S.t0 + r() * 2.2, s: 0.5 + r() * 1.3, vx: (r() - 0.5) * 2, vz: (r() - 0.5) * 2 }; });
  const tmpV = new THREE.Vector3();
  return {
    dur: 3.0, st,
    bg(ctx) { fx.flat(ctx, '#ffffff', '#e7e7ef'); },
    update(lt) {
      const { pip } = s;
      pip.update(lt * 1.5, { arms: false, blink: false }); pip.setEyes(lt < 1.5 ? 'angry' : 'happy');
      pip.armR.rotation.set(-1.5 + Math.sin(lt * 12) * 0.9, 0, 0.3); pip.armL.rotation.set(-0.6, 0, -0.6);
      strokes.forEach((S) => S.m.geometry.setDrawRange(0, Math.floor(easeOut(prog(lt, S.t0, S.t0 + 0.7)) * 160) * 14 * 6));
      D.forEach((d, i) => {
        const age = lt - d.t;
        if (age < 0 || lt < d.S.t0 + d.u * 0.7) { dummy.scale.setScalar(0.0001); }
        else {
          d.S.curve.getPoint(d.u, tmpV);
          const y = tmpV.y - 4.9 * age * age;
          if (y > 0.02) { dummy.position.set(tmpV.x + d.vx * age, y, tmpV.z + d.vz * age); dummy.scale.set(d.s, d.s * 1.3, d.s); }
          else { const tl = Math.sqrt(tmpV.y / 4.9); dummy.position.set(tmpV.x + d.vx * tl, 0.01, tmpV.z + d.vz * tl); dummy.scale.set(d.s * 2.4, 0.15, d.s * 2.4); }
        }
        dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); drops.setMatrixAt(i, dummy.matrix);
      });
      drops.instanceMatrix.needsUpdate = true;
      camPath(st, [[0, [1.5, 1.5, 4.5], [1.2, 1.2, 0]], [1.4, [0, 2.4, 10.5], [0, 2.2, -1]], [3.0, [-1, 2.6, 12], [0, 2.4, -1]]], lt);
      shake(st.camera, lt, 0.02);
    },
    overlay: chaosOverlay(5),
  };
}

// ================================================================== HERO (title & outro)
const DARK_BG = (ctx, lt) => { fx.flat(ctx, '#1f4fd8', '#071a63'); fx.halftone(ctx, '#7fd6ff', lt, { alpha: 0.18, bottom: H * 0.7 }); };
const splitPoly = (ctx, k) => { // diagonal split; k 0→1 slides the dark side in from the right
  const x = lerp(W + 400, W * 0.55, easeOut(k));
  ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(x - 300, H); ctx.closePath();
};
function dualModeText(ctx, k) {
  if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = clamp(k * 2); ctx.font = `86px ${FONT.display}`; ctx.textAlign = 'right';
  const x = W - 40 + (1 - easeOut(k)) * 200, y = H - 40;
  const mw = ctx.measureText('MODE').width;
  ctx.fillStyle = '#4ff0ff'; ctx.fillText('MODE', x, y);
  ctx.fillStyle = '#ff8a6b'; ctx.fillText('DUAL ', x - mw, y); ctx.restore();
}
function heroTitle(ctx, k, sub) {
  if (k <= 0) return;
  const p = easeBack(k);
  ctx.save(); ctx.globalAlpha = clamp(k * 3); ctx.translate(46, 120); ctx.scale(p, p);
  ctx.font = `120px ${FONT.display}`; ctx.fillStyle = '#2a1f1a'; ctx.fillText('PIP', 0, 0);
  if (sub) { ctx.font = `500 17px ${FONT.mono}`; ctx.fillText(sub, 4, 38); }
  ctx.restore();
}

function heroStage() {
  const st = stage({ cam: [0, 1.3, 7], look: [0, 0.95, 0], shadow: 0.2 });
  const pip = makePip(); st.scene.add(pip.root);
  const rim = new THREE.DirectionalLight(0x4ff0ff, 0); rim.position.set(4, 3, -3); st.scene.add(rim);
  return { st, pip, rim };
}

export function titleHero() {
  const { st, pip, rim } = heroStage();
  let dark = false;
  const seg = {
    dur: 2.7, st,
    bg(ctx, lt) {
      if (dark) return DARK_BG(ctx, lt);
      fx.flat(ctx, '#f6efe2', '#e6dccb');
      const a = 1 - prog(lt, 0.3, 1.0); if (a > 0) { ctx.globalAlpha = a; fx.speedLines(ctx, lt); ctx.globalAlpha = 1; }
    },
    update(lt) {
      const pop = easeBack(prog(lt, 0.05, 0.45));
      pip.root.scale.setScalar(Math.max(0.001, pop)); pip.root.rotation.y = (1 - pop) * 2 + Math.sin(lt * 1.5) * 0.15;
      pip.update(lt); pip.setEyes(lt < 0.9 ? 'open' : lt < 1.4 ? 'happy' : 'open');
      pip.setEyeColor(dark ? 0x4ff0ff : 0x7ff6ff, dark ? 4 : 2.2); rim.intensity = dark ? 5 : 0;
      st.set([lerp(0, 0.4, lt / 2.7), 1.3, lerp(7, 6.2, lt / 2.7)], [0, 0.95, 0]);
    },
    draw(ctx, lt, R) {
      dark = false; R.pass(seg, lt);
      const k = prog(lt, 1.5, 1.95);
      if (k > 0) { dark = true; ctx.save(); splitPoly(ctx, k); ctx.clip(); R.pass(seg, lt); ctx.restore(); dark = false; }
      heroTitle(ctx, prog(lt, 0.45, 0.75));
      dualModeText(ctx, prog(lt, 1.8, 2.2));
    },
  };
  return seg;
}

export function outroHero() {
  const { st, pip, rim } = heroStage();
  pip.hatAnchor.add(at(headphones(), 0, -0.05, 0));
  const hats = [writerCap(), mortarboard(), detectiveCap(), goggles(), beret()];
  const off = [0.0, 0.26, 0.52, 0.8, 1.0];
  hats.forEach((h) => pip.hatAnchor.add(h));
  let dark = false;
  const seg = {
    dur: 5.0, st,
    bg(ctx, lt) {
      if (dark) return DARK_BG(ctx, lt);
      fx.flat(ctx, '#f6efe2', '#e6dccb');
      const a = 1 - prog(lt, 0.4, 0.9); if (a > 0) { ctx.globalAlpha = a; fx.speedLines(ctx, lt, 'rgba(40,30,20,0.5)', { seed: 19 }); ctx.globalAlpha = 1; }
    },
    update(lt) {
      const fly = easeOut(prog(lt, 0, 0.7));
      pip.root.position.set(0, 0, lerp(-30, 0, fly));
      pip.update(lt); pip.setEyes(lt < 2.8 ? (Math.floor(lt * 3.6) % 4 === 3 ? 'flat' : 'open') : 'happy');
      hats.forEach((h, i) => {
        const t0 = 0.8 + i * 0.3, k = prog(lt, t0, t0 + 0.4);
        h.visible = lt > t0; h.position.set(Math.sin(i * 2.1) * 0.05, off[i] + (1 - bounce(k)) * 4, 0); h.rotation.set(0, Math.sin(i * 1.3) * 0.3, Math.sin(i * 2.7) * 0.08 * (1 + (1 - k) * 4));
      });
      pip.setEyeColor(dark ? 0x4ff0ff : 0x7ff6ff, dark ? 4 : 2.2); rim.intensity = dark ? 5 : 0;
      st.set([lerp(0, 0.6, prog(lt, 1, 5)), lerp(1.5, 1.9, prog(lt, 0.8, 2.6)), lerp(7.2, 8.6, prog(lt, 0.8, 2.6))], [0, lerp(1.0, 1.75, prog(lt, 0.8, 2.6)), 0]);
    },
    draw(ctx, lt, R) {
      dark = false; R.pass(seg, lt);
      const k = prog(lt, 3.2, 3.7);
      if (k > 0) { dark = true; ctx.save(); splitPoly(ctx, k); ctx.clip(); R.pass(seg, lt); ctx.restore(); dark = false; }
      heroTitle(ctx, prog(lt, 2.6, 2.9), 'one bot · every mode');
      dualModeText(ctx, prog(lt, 3.5, 3.9));
      const f = prog(lt, 4.6, 5.0); if (f > 0) { ctx.fillStyle = `rgba(0,0,0,${f})`; ctx.fillRect(0, 0, W, H); }
    },
  };
  return seg;
}
