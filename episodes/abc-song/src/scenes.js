// All shots of the ABC song. Each scene: { st:{scene,camera}, bg(ctx,lt,T), update(lt,T), overlay?(ctx,lt,T) }
// lt = seconds since the shot started, T = song time (used for beat-synced dancing).
import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { W, H, clamp, lerp, prog, easeOut, easeInOut, easeBack, bounce, rng, rbox, box, cyl, sph, at, group, canvasTex, roundRect } from '../../../engine/kit.js';
import { soft, FAMILY, COLORS } from '../../../engine/characters/mochi.js';
import * as P from './props.js';

export const BEAT = 60 / 74.07, PHASE = 0.17;           // measured from the audio
export const beat = (T) => Math.abs(Math.sin(Math.PI * (T - PHASE) / BEAT));   // 1 on every beat
export const FONT = '"Fredoka", "Baloo 2", system-ui, sans-serif';

let FONT3D = null;
export const setFont3D = (f) => { FONT3D = f; };

// ------------------------------------------------------------ shared helpers
function stage({ cam = [0, 2.6, 11], look = [0, 1.4, 0], fov = 32, platform = 0xbfe9a8, rim = 0xa6d98e } = {}) {
  const scene = new THREE.Scene();
  scene.environmentIntensity = 0.75;
  const camera = new THREE.PerspectiveCamera(fov, W / H, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8c8b8, 1.3));
  const key = new THREE.DirectionalLight(0xfff2e0, 2.4); key.position.set(4, 9, 7); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03; key.shadow.radius = 6; scene.add(key);
  const fill = new THREE.DirectionalLight(0xdfe8ff, 0.7); fill.position.set(-6, 4, 6); scene.add(fill);
  if (platform) {
    const top = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.2, 0.5, 72), soft(platform, { clearcoat: 0, roughness: 0.85, sheen: 0 }));
    top.position.set(0, -0.25, -1.2); top.receiveShadow = true; scene.add(top);
    const edge = new THREE.Mesh(new THREE.TorusGeometry(7.2, 0.25, 16, 96), soft(rim, { clearcoat: 0, roughness: 0.8 }));
    edge.rotation.x = Math.PI / 2; edge.position.set(0, -0.25, -1.2); scene.add(edge);
  } else {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.12 })); f.rotation.x = -Math.PI / 2; f.receiveShadow = true; scene.add(f);
  }
  const st = { scene, camera, set(p, l) { camera.position.set(...p); camera.lookAt(...l); } };
  st.set(cam, look);
  return st;
}
const mixv = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
function camPath(st, keys, lt) {
  let i = 0; while (i < keys.length - 2 && lt > keys[i + 1][0]) i++;
  const [t0, p0, l0] = keys[i], [t1, p1, l1] = keys[Math.min(i + 1, keys.length - 1)];
  const k = easeInOut(t1 === t0 ? 1 : prog(lt, t0, t1)); st.set(mixv(p0, p1, k), mixv(l0, l1, k));
}

function decorate(scene, seed, { flowers = true } = {}) {
  const r = rng(seed); const cols = [0xff8fb3, 0xffd23f, 0xffffff, 0x9fd8ff, 0xffa060];
  if (flowers) for (let i = 0; i < 14; i++) {
    const a = r() * Math.PI * 2, R = 2.5 + r() * 4; const x = Math.cos(a) * R, z = -1.2 + Math.sin(a) * R * 0.8;
    if (z > 2.5 && Math.abs(x) < 4.5) continue;
    const f = group(at(cyl(0.02, 0.02, 0.25, 0x5aa23e), 0, 0.12, 0)); const c = cols[i % cols.length];
    for (let k = 0; k < 5; k++) { const p = sph(0.07, soft(c)); p.position.set(Math.cos(k * 1.26) * 0.08, 0.27, Math.sin(k * 1.26) * 0.08); f.add(p); }
    f.add(at(sph(0.05, soft(0xffc23d)), 0, 0.28, 0)); f.position.set(x, 0, z); scene.add(f);
  }
  for (let i = 0; i < 10; i++) { const a = r() * Math.PI * 2, R = 3 + r() * 3.5; const t = sph(0.22 + r() * 0.15, soft(0x8fd36a, { clearcoat: 0 })); t.scale.y = 0.55; t.position.set(Math.cos(a) * R, 0.05, -1.2 + Math.sin(a) * R * 0.7 - 1); scene.add(t); }
}

function letterMesh(ch, color, size) {
  const g = new TextGeometry(ch, { font: FONT3D, size, depth: size * 0.28, curveSegments: 10, bevelEnabled: true, bevelThickness: size * 0.08, bevelSize: size * 0.045, bevelSegments: 6 });
  g.computeBoundingBox(); const bb = g.boundingBox; g.translate(-(bb.max.x + bb.min.x) / 2, -bb.min.y, -(bb.max.z + bb.min.z) / 2);
  const m = new THREE.Mesh(g, soft(color, { clearcoat: 1, clearcoatRoughness: 0.2, roughness: 0.35 })); m.castShadow = m.receiveShadow = true;
  return m;
}
/** big "Aa" pair that drops in with a bounce and dances on the beat */
function bigLetter(ch, color) {
  const g = new THREE.Group();
  const U = letterMesh(ch.toUpperCase(), color, 1.9); g.add(U);
  const L = letterMesh(ch.toLowerCase(), new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.35).getHex(), 1.05); L.position.set(1.5, 0, 0.75); g.add(L);
  g.tick = (lt, T) => {
    const d = bounce(prog(lt, 0.05, 0.75)); const b = beat(T);
    U.position.y = (1 - d) * 6; L.position.y = (1 - bounce(prog(lt, 0.2, 0.9))) * 6;
    U.scale.set(1 + (1 - b) * 0.04, 1 - (1 - b) * 0.05, 1); U.rotation.y = Math.sin(T * 1.6) * 0.18;
    L.rotation.y = Math.sin(T * 1.6 + 1) * 0.25; L.rotation.z = Math.sin(T * 3.2) * 0.08;
  };
  return g;
}

// ------------------------------------------------------------ 2D backgrounds
export function skyBg(ctx, T, top, bottom, { bokeh = 'rgba(255,255,255,0.35)', seed = 1 } = {}) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const r = rng(seed); ctx.fillStyle = bokeh;
  for (let i = 0; i < 14; i++) {
    const x = (r() * W + T * (8 + r() * 14)) % (W + 200) - 100, y = r() * H * 0.6, rad = 20 + r() * 60;
    ctx.globalAlpha = 0.25 + 0.25 * Math.sin(T + i); ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function clouds2d(ctx, T, n = 5, speed = 20, seed = 3) {
  const r = rng(seed); ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < n; i++) {
    const s = 0.6 + r() * 0.9, x = ((r() * W + T * speed * s) % (W + 400)) - 200, y = 50 + r() * 260;
    ctx.beginPath(); for (const [dx, dy, rr] of [[0, 0, 40], [40, -10, 34], [-40, 4, 30], [16, -30, 30], [-16, -22, 26]]) ctx.arc(x + dx * s, y + dy * s, rr * s, 0, 7); ctx.fill();
  }
}
function underwaterBg(ctx, T) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5fd3f5'); g.addColorStop(1, '#1f6fc0'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) { const x = 150 + i * 200 + Math.sin(T * 0.5 + i) * 40; const gr = ctx.createLinearGradient(x, 0, x - 120, H); gr.addColorStop(0, 'rgba(255,255,255,0.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x - 30, 0); ctx.lineTo(x + 30, 0); ctx.lineTo(x - 80, H); ctx.lineTo(x - 200, H); ctx.fill(); }
  ctx.restore();
  const r = rng(9); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
  for (let i = 0; i < 30; i++) { const x = r() * W + Math.sin(T * 2 + i) * 8, sp = 40 + r() * 80, y = H - ((T * sp + r() * H) % (H + 40)), rad = 3 + r() * 9; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.stroke(); }
}
function speedLines(ctx, T, color = 'rgba(255,255,255,0.75)') {
  const r = rng(Math.floor(T * 14)); ctx.strokeStyle = color; ctx.lineCap = 'round';
  for (let i = 0; i < 18; i++) { const y = 80 + r() * H * 0.6, x = r() * W, len = 80 + r() * 220; ctx.lineWidth = 3 + r() * 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke(); }
}
function bubbleText(ctx, text, x, y, size, fill, { stroke = '#ffffff', shadow = 'rgba(80,40,60,0.35)', rot = 0, scale = 1, align = 'center' } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scale, scale);
  ctx.font = `700 ${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.fillStyle = shadow; ctx.fillText(text, 0, size * 0.08 + 4);
  ctx.strokeStyle = stroke; ctx.lineWidth = size * 0.2; ctx.strokeText(text, 0, 0);
  ctx.fillStyle = fill; ctx.fillText(text, 0, 0);
  ctx.restore();
}
export { bubbleText };

// sing animation for a character while its line is being sung
const singAmt = (T) => 0.25 + 0.75 * Math.abs(Math.sin(T * 10.5));

// ------------------------------------------------------------ LETTERS
// layout: big letter left (x≈-3.7), the object centre, a family member on the right
export const LETTER_COLORS = { A: 0xff4f6d, B: 0xff8a2a, C: 0x3a8cff, D: 0x3cc46a, E: 0x8a7bff, F: 0xff3b3b, G: 0xf2b400, H: 0x2ab3e8, I: 0xff6fae, J: 0x9a5cff, K: 0x2ec4a6, L: 0xf29a1a, M: 0x9a5a32, N: 0x6aa83a };

function letterScene(ch, { sky = ['#ffe3ec', '#fff6e8'], platform = 0xbfe9a8, rim = 0xa6d98e, noPlatform = false, flowers = true, build, bg }) {
  const st = stage({ platform: noPlatform ? 0 : platform, rim });
  if (!noPlatform) decorate(st.scene, ch.charCodeAt(0), { flowers });
  const L = bigLetter(ch, LETTER_COLORS[ch]); L.position.set(-3.2, 0, 0.6); st.scene.add(L);
  const s = build(st, L) || {};
  return {
    st, color: LETTER_COLORS[ch], letter: ch,
    bg: bg || ((ctx, lt, T) => skyBg(ctx, T, sky[0], sky[1], { seed: ch.charCodeAt(0) })),
    update(lt, T, dur) { L.tick(lt, T); s.update?.(lt, T, dur); if (!s.camera) camPath(st, [[0, [0, 2.3, 10.2], [0, 1.25, 0]], [dur, [0.3, 2.4, 9.3], [0.2, 1.3, 0]]], lt); },
    overlay: s.overlay,
  };
}

const chr = (name, x, z = 0.3, ry = -0.35, s = 1) => { const c = FAMILY[name](); c.root.position.set(x, 0, z); c.root.rotation.y = ry; c.root.scale.setScalar(s); return c; };

export const LETTER_SCENES = {
  A: () => letterScene('A', {
    sky: ['#ffd6e0', '#fff1e6'],
    build(st) {
      const apple = P.apple(); apple.position.set(0.2, 0, 0.4); st.scene.add(apple);
      const m = chr('mimi', 2.9); st.scene.add(m.root);
      return { update(lt, T) { apple.tick(T); m.setFace(lt > 1.6 ? 'happy' : 'open'); m.setSing(singAmt(T)); m.update(T - PHASE, { wave: lt > 0.5 && lt < 1.5 ? 1 : 0 }); m.root.position.y = 0; } };
    },
  }),
  B: () => letterScene('B', {
    sky: ['#cfe9ff', '#f3fbff'], platform: 0xc8ecb0,
    build(st) {
      const l = chr('lumi', 1.4, 0.4, -0.15); st.scene.add(l.root);
      const bal = P.balloon(0xff4f6d); st.scene.add(bal);
      const extra = [[0xffd23f, -1.4, 3.4], [0x5fd06a, 4.2, 3.8], [0x9a5cff, 2.6, 4.6]].map(([c, x, y]) => { const b = P.balloon(c); b.position.set(x, y, -2); b.scale.setScalar(0.6); st.scene.add(b); return { b, x, y }; });
      const hand = new THREE.Vector3();
      return {
        update(lt, T) {
          const lift = easeInOut(prog(lt, 0.8, 2.2)) * 0.5;
          l.root.position.y = lift + Math.sin(T * 2) * 0.05 * (lift > 0 ? 1 : 0);
          l.setFace('happy'); l.setSing(singAmt(T)); l.update(T - PHASE, { bounce: 1 - lift });
          l.armR.rotation.z = 2.6; l.root.updateMatrixWorld(true);
          l.armR.hand.getWorldPosition(hand);
          bal.position.set(hand.x + 0.2, hand.y + 1.6, hand.z); bal.tick(T); bal.tie(bal.worldToLocal(hand.clone()));
          extra.forEach(({ b, x, y }, i) => { b.position.set(x + Math.sin(T + i) * 0.2, y + Math.sin(T * 1.3 + i) * 0.2, -2); b.tick(T + i); b.tie(new THREE.Vector3(0, -1.6, 0)); });
        },
      };
    },
  }),
  C: () => letterScene('C', {
    sky: ['#fff2b8', '#fffaf0'], platform: 0xd0eeb8,
    build(st) {
      const car = P.car(0x3a8cff); car.rotation.y = -0.25; st.scene.add(car);
      const p = chr('pip', 0, 0, 0, 0.62); car.bodyG.add(p.root); p.root.position.copy(car.seat).add(new THREE.Vector3(0, -0.35, 0)); p.root.rotation.y = Math.PI / 2 - 0.2;
      // road
      const road = rbox(13, 0.04, 1.6, 0.02, soft(0x8a8f9e, { clearcoat: 0, roughness: 0.9 })); road.position.set(0, 0.02, 0.6); st.scene.add(road);
      for (let i = 0; i < 9; i++) st.scene.add(at(box(0.6, 0.02, 0.1, soft(0xffffff)), -6 + i * 1.5, 0.05, 0.6));
      const beeps = [1.5, 2.0, 2.5];
      return {
        update(lt, T) {
          const x = lerp(7, 0.8, easeOut(prog(lt, 0, 1.2)));
          const hop = beeps.reduce((a, b) => a + Math.max(0, 1 - Math.abs(lt - b) * 8), 0);
          car.position.set(x, hop * 0.12, 0.6); car.tick(lt, lt < 1.2 ? 1 : 0.15); car.bodyG.scale.set(1 + hop * 0.06, 1 - hop * 0.06, 1);
          p.setFace(hop > 0.3 ? 'happy' : 'open'); p.setSing(singAmt(T)); p.update(T - PHASE, { bounce: 0.6 });
        },
        overlay(ctx, lt) {
          beeps.forEach((b, i) => { const k = prog(lt, b - 0.05, b + 0.35); if (k > 0 && k < 1) bubbleText(ctx, 'BEEP!', 800 + i * 110, 230 - i * 40, 54, '#3a8cff', { scale: easeBack(Math.min(1, k * 3)) * (1 - Math.max(0, k - 0.7) * 3), rot: -0.15 + i * 0.12 }); });
        },
      };
    },
  }),
  D: () => letterScene('D', {
    sky: ['#d4f5e4', '#f6fff2'], platform: 0xc6eba6,
    build(st) {
      const d = P.dinosaur(); d.position.set(0.1, 0, 0.1); d.rotation.y = -0.35; st.scene.add(d);
      const m = chr('moss', 3.2, 0.6, -0.4); st.scene.add(m.root);
      let shakeAmt = 0;
      return {
        camera: true,
        update(lt, T, dur) {
          d.tick(T);
          const stomp = Math.pow(beat(T), 8) * (lt > dur * 0.55 ? 1 : 0.35);
          m.root.position.y = Math.max(0, Math.sin(Math.PI * (T - PHASE) / BEAT)) * 0;
          m.setFace(lt > dur * 0.55 ? 'wide' : 'happy'); m.setSing(singAmt(T)); m.update(T - PHASE, { bounce: 1.4 });
          shakeAmt = (1 - beat(T)) < 0.15 && lt > dur * 0.55 ? 0.06 : 0;
          camPath(st, [[0, [0, 2.3, 10.2], [0, 1.3, 0]], [dur, [0.3, 2.1, 9.2], [0.2, 1.3, 0]]], lt);
          st.camera.position.y += shakeAmt * Math.sin(T * 80); st.camera.position.x += shakeAmt * Math.sin(T * 63); void stomp;
        },
        overlay(ctx, lt, T) { if (lt > 2.2) bubbleText(ctx, 'STOMP!', 720, 160, 50, '#3cc46a', { scale: 0.8 + beat(T) * 0.2, rot: -0.1 }); },
      };
    },
  }),
  E: () => letterScene('E', {
    sky: ['#e6e0ff', '#fbf8ff'], platform: 0xc8e8b4,
    build(st) {
      const e = P.elephant(); e.position.set(0.2, 0, 0); e.rotation.y = -0.4; st.scene.add(e);
      const m = chr('milo', 3.2, 0.6, -0.45); st.scene.add(m.root);
      return { update(lt, T) { e.tick(T); m.setFace('open'); m.setSing(singAmt(T)); m.update(T - PHASE, { wave: lt < 1.4 ? 1 : 0 }); } };
    },
  }),
  F: () => letterScene('F', {
    sky: ['#ffe0c8', '#fff7ee'], platform: 0xcde9b0,
    build(st) {
      const tr = P.firetruck(); tr.rotation.y = -0.18; st.scene.add(tr);
      const b = FAMILY.bobo(); b.root.position.set(3.6, 0, 1.2); b.root.rotation.y = Math.PI / 2 - 0.3; b.root.scale.setScalar(0.8); st.scene.add(b.root);
      return {
        update(lt, T) {
          const x = lt < 1 ? lerp(-9, 0.4, easeOut(prog(lt, 0, 1))) : 0.4 + Math.sin(lt * 4) * 0.05;
          tr.position.set(x, 0, 0.3); tr.tick(T);
          b.setSing(Math.abs(Math.sin(T * 7))); b.update(T * 2, { bounce: 2 }); b.root.position.y = Math.abs(Math.sin(T * 8)) * 0.15;
        },
        overlay(ctx, lt, T) { if (lt > 0.4) bubbleText(ctx, 'WEE-OO!', 640, 140, 46, '#ff3b3b', { scale: 0.9 + 0.1 * Math.sin(T * 12), rot: Math.sin(T * 6) * 0.06 }); },
      };
    },
    bg(ctx, lt, T) { skyBg(ctx, T, '#ffe0c8', '#fff7ee', { seed: 70 }); speedLines(ctx, T); },
  }),
  G: () => letterScene('G', {
    sky: ['#fff4c4', '#f4fff0'], platform: 0xc9eba7,
    build(st) {
      const g = P.giraffe(); g.position.set(0.1, 0, -0.2); g.rotation.y = -0.45; g.scale.setScalar(1.15); st.scene.add(g);
      const l = chr('lumi', 3.0, 0.8, -0.5); st.scene.add(l.root);
      const sun = sph(0.6, new THREE.MeshBasicMaterial({ color: 0xffe066 })); sun.position.set(-1.5, 6.5, -6); st.scene.add(sun);
      return {
        camera: true,
        update(lt, T, dur) {
          g.tick(T); l.setFace(lt > dur * 0.5 ? 'happy' : 'wide'); l.setSing(singAmt(T)); l.update(T - PHASE); l.bodyG.rotation.x = -0.25;
          camPath(st, [[0, [0, 1.6, 11.8], [0, 1.0, 0]], [dur * 0.55, [0.4, 3.6, 11.2], [0.3, 3.0, 0]], [dur, [0.6, 3.4, 10.8], [0.3, 2.6, 0]]], lt);
        },
      };
    },
  }),
  H: () => letterScene('H', {
    noPlatform: true,
    build(st, L) {
      L.position.set(-3.9, 0.6, 0.6);
      const h = P.helicopter(0xffb02e); st.scene.add(h);
      const m = chr('milo', 0, 0, 0, 0.5); h.add(m.root); m.root.position.copy(h.seat); m.root.rotation.y = Math.PI / 2;
      const clouds = [[-6, 1.2, -3, 1.4], [4, 4.6, -4, 1.8], [7, 1.0, -2, 1.2], [-2, 5.0, -6, 2.0], [1, -0.4, -1, 1.0]].map(([x, y, z, s]) => { const c = P.cloud(s); c.position.set(x, y, z); st.scene.add(c); return { c, x }; });
      return {
        update(lt, T) {
          h.position.set(0.8 + Math.sin(T * 0.8) * 0.4, 2.0 + Math.sin(T * 1.6) * 0.25, 0.2); h.rotation.set(0, -0.35, -0.08 + Math.sin(T * 1.2) * 0.06); h.tick(T);
          m.setFace('happy'); m.setSing(singAmt(T)); m.update(T - PHASE, { bounce: 0.3, wave: 1 });
          clouds.forEach(({ c, x }, i) => { c.position.x = ((x - lt * (1.2 + i * 0.25) + 9) % 18 + 18) % 18 - 9; });
        },
      };
    },
    bg(ctx, lt, T) { skyBg(ctx, T, '#7fd0ff', '#d8f2ff', { seed: 8 }); clouds2d(ctx, T, 6, 60); },
  }),
  I: () => letterScene('I', {
    sky: ['#ffd9ec', '#e8fff6'], platform: 0xd6f0c0,
    build(st) {
      const ic = P.iceCream(); ic.position.set(0.3, 0, 0.2); ic.scale.setScalar(0.85); st.scene.add(ic);
      const m = chr('mimi', 3.0, 0.6, -0.5); st.scene.add(m.root);
      const flakes = P.sparkles(10, 0xbfefff, 1.3); flakes.position.set(0.3, 1.0, 0); st.scene.add(flakes);
      return { update(lt, T, dur) { ic.tick(T); flakes.tick(T); m.setFace(lt > dur * 0.5 ? 'closed' : 'happy'); m.setSing(singAmt(T)); m.update(T - PHASE, { wave: lt < 1 ? 1 : 0 }); } };
    },
  }),
  J: () => letterScene('J', {
    platform: 0xf2dcae, rim: 0xe4c891, flowers: false,
    build(st) {
      const j = P.jellyfish(); j.position.set(0.3, 0, 0); st.scene.add(j);
      const l = chr('lumi', 3.1, 0.6, -0.5); st.scene.add(l.root);
      const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.95, 32, 24), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, roughness: 0, clearcoat: 1 })); helmet.position.y = 0.75; l.bodyG.add(helmet);
      // seaweed + shells
      const kelp = [-1.6, 1.8, 4.6, -5.2].map((x, i) => { const g = new THREE.Group(); g.position.set(x, 0, -2 - i * 0.3); for (let k = 0; k < 5; k++) g.add(at(sph(0.16, soft(0x3cb878)), 0, 0.2 + k * 0.32, 0)); st.scene.add(g); return g; });
      return { update(lt, T) { j.tick(T); l.setFace('wide'); l.setSing(singAmt(T)); l.update(T - PHASE); kelp.forEach((g, i) => g.children.forEach((c, k) => (c.position.x = Math.sin(T * 1.5 + i + k * 0.5) * 0.06 * k))); } };
    },
    bg: (ctx, lt, T) => underwaterBg(ctx, T),
  }),
  K: () => letterScene('K', {
    sky: ['#9fdcff', '#eafaff'], platform: 0xb8e69a,
    build(st) {
      const m = chr('moss', 1.6, 0.6, -0.2); st.scene.add(m.root);
      const k = P.kite(); k.position.set(1.0, 0.6, -0.6); st.scene.add(k);
      const hand = new THREE.Vector3();
      return {
        camera: true,
        update(lt, T, dur) {
          m.setFace('happy'); m.setSing(singAmt(T)); m.update(T - PHASE); m.armR.rotation.z = 2.3 + Math.sin(T * 2) * 0.1;
          m.root.updateMatrixWorld(true); m.armR.hand.getWorldPosition(hand); k.tick(T, k.worldToLocal(hand.clone()));
          camPath(st, [[0, [0, 2.0, 11.6], [0, 1.6, 0]], [dur, [0.4, 2.8, 11.0], [0.4, 2.6, 0]]], lt);
        },
      };
    },
    bg(ctx, lt, T) { skyBg(ctx, T, '#9fdcff', '#eafaff', { seed: 11 }); clouds2d(ctx, T, 5, 25, 4); },
  }),
  L: () => letterScene('L', {
    sky: ['#ffe2b0', '#fff8ea'], platform: 0xd9e9a0, rim: 0xc3d48a,
    build(st) {
      const lion = P.lion(); lion.position.set(0.0, 0, 0); lion.rotation.y = -0.35; st.scene.add(lion);
      const p = chr('pip', 2.8, 0.7, -0.5); st.scene.add(p.root);
      const b = FAMILY.bobo(); b.root.position.set(4.1, 0, 1.3); b.root.rotation.y = -0.6; b.root.scale.setScalar(0.75); st.scene.add(b.root);
      let roar = 0;
      return {
        camera: true,
        update(lt, T, dur) {
          roar = easeOut(prog(lt, dur * 0.42, dur * 0.55)) * (1 - prog(lt, dur * 0.9, dur));
          lion.tick(T, roar);
          p.setFace(roar > 0.3 ? 'wide' : 'happy'); p.setSing(roar > 0.3 ? 0.9 : singAmt(T)); p.update(T - PHASE);
          p.root.position.x = 2.8 + roar * 0.4; p.bodyG.rotation.z = -roar * 0.2;
          b.setSing(roar); b.update(T); b.root.position.y = roar * Math.abs(Math.sin(T * 9)) * 0.25;
          camPath(st, [[0, [0, 2.3, 10.2], [0, 1.3, 0]], [dur, [0.3, 2.4, 9.3], [0.2, 1.35, 0]]], lt);
          if (roar > 0.5) { st.camera.position.x += Math.sin(T * 70) * 0.04 * roar; st.camera.position.y += Math.sin(T * 53) * 0.04 * roar; }
        },
        overlay(ctx, lt, T) { if (roar > 0.05) bubbleText(ctx, 'ROAR!', 700, 170, 80, '#f29a1a', { scale: 0.6 + roar * 0.5 + Math.sin(T * 30) * 0.02, rot: -0.08 }); },
      };
    },
  }),
  M: () => letterScene('M', {
    sky: ['#d8f3c8', '#fffbe8'], platform: 0xb9e49a,
    build(st) {
      const t = P.tree(); t.position.set(-0.6, 0, -0.8); st.scene.add(t);
      const mk = P.monkey(); mk.position.set(1.2, 3.0, -0.8); st.scene.add(mk);
      const m = chr('milo', 3.4, 0.8, -0.5); st.scene.add(m.root);
      return { update(lt, T) { mk.tick(T - PHASE); m.setFace('happy'); m.setSing(singAmt(T)); m.update(T - PHASE, { wave: 1 }); } };
    },
  }),
  N: () => letterScene('N', {
    sky: ['#fff0c0', '#f4ffe8'], platform: 0xc2e6a2,
    build(st) {
      const stump = group(at(cyl(0.5, 0.6, 1.2, soft(0x8a5a32), {}, 24), 0, 0.6, 0), at(cyl(0.48, 0.48, 0.03, soft(0xd9b07a), {}, 24), 0, 1.21, 0));
      stump.position.set(0.3, 0, 0); st.scene.add(stump);
      const n = P.nest(); n.position.set(0.3, 1.2, 0); st.scene.add(n);
      const m = chr('moss', 3.0, 0.7, -0.5); st.scene.add(m.root);
      return { update(lt, T) { n.tick(T); m.setFace(lt > 1 ? 'happy' : 'open'); m.setSing(singAmt(T)); m.update(T - PHASE); } };
    },
  }),
};

// ------------------------------------------------------------ INTRO (family pops in)
function familyRow(st, spacing = 1.45) {
  const names = ['mimi', 'lumi', 'milo', 'pip', 'moss', 'bobo'];
  return names.map((n, i) => { const c = FAMILY[n](); c.root.position.set((i - 2.5) * spacing, 0, n === 'bobo' ? 0.6 : 0); c.root.rotation.y = n === 'bobo' ? -0.5 : 0; if (n === 'bobo') c.root.scale.setScalar(0.85); st.scene.add(c.root); return c; });
}

export function intro() {
  const st = stage({ cam: [0, 2.2, 11], look: [0, 1.2, 0], platform: 0xffe0b8, rim: 0xffc98f });
  decorate(st.scene, 99);
  const fam = familyRow(st);
  return {
    st, color: 0xff8a2a,
    bg: (ctx, lt, T) => skyBg(ctx, T, '#ffd7b5', '#fff4e6', { seed: 2 }),
    update(lt, T) {
      fam.forEach((c, i) => {
        const k = prog(lt, 0.9 + i * 0.32, 1.35 + i * 0.32);
        c.root.visible = k > 0; c.root.position.y = (1 - bounce(k)) * 4;
        c.setFace?.(lt > 3.5 ? 'happy' : 'open'); c.setSing?.(0); c.update(T - PHASE, { wave: lt > 3 && i % 2 === 0 ? 1 : 0 });
      });
      camPath(st, [[0, [0, 3.2, 12.5], [0, 1.6, 0]], [5.2, [0, 2.0, 9.6], [0, 1.15, 0]]], lt);
    },
    overlay(ctx, lt) {
      const k = easeBack(prog(lt, 0.1, 0.7));
      if (k > 0) {
        bubbleText(ctx, 'Mochi', W / 2 - 110, 110, 104, '#ff8a2a', { scale: k, rot: -0.06, stroke: '#fff4e6' });
        bubbleText(ctx, 'Family', W / 2 + 150, 128, 72, '#4a2a1a', { scale: easeBack(prog(lt, 0.3, 0.9)), rot: 0.04, stroke: '#fff4e6' });
      }
      const k2 = easeBack(prog(lt, 0.8, 1.3));
      if (k2 > 0) { const word = 'ABC SONG', cols = ['#ff4f6d', '#ff8a2a', '#3a8cff', '#ffffff', '#3cc46a', '#8a7bff', '#2ab3e8', '#f2b400'];
        ctx.save(); ctx.font = `700 52px ${FONT}`; const wds = [...word].map((c) => ctx.measureText(c).width); ctx.restore();
        let x = W / 2 - wds.reduce((a, b) => a + b, 0) / 2;
        [...word].forEach((c, i) => { const kk = easeBack(prog(lt, 0.8 + i * 0.06, 1.2 + i * 0.06)); if (c !== ' ' && kk > 0) bubbleText(ctx, c, x + wds[i] / 2, 205 + Math.sin(lt * 6 + i) * 4, 52, cols[i], { scale: kk }); x += wds[i]; });
      }
    },
  };
}

// ------------------------------------------------------------ CHORUS (lines 9–12)
function blockTex(ch, bg) {
  return canvasTex(256, 256, (c, w, h) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(14, 14, w - 28, h - 28); c.fillStyle = '#fff'; c.font = `700 190px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ch, w / 2, h / 2 + 10); });
}

export function chorus(lines) {
  const st = stage({ cam: [0, 2.4, 12], look: [0, 1.3, 0], platform: 0xffd6e6, rim: 0xffb3cf });
  const fam = familyRow(st, 1.5);
  fam.forEach((c) => (c.root.position.z = 1.0));
  const blocks = [['A', '#ff4f6d'], ['B', '#ff8a2a'], ['C', '#3a8cff']].map(([ch, col], i) => {
    const t = blockTex(ch, col); const m = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.45, clearcoat: 0.5 }));
    m.castShadow = true; m.position.set((i - 1) * 2.2, 0.7, -2.2); st.scene.add(m); return m;
  });
  // ring of letters for "learning letters"
  const ring = new THREE.Group(); ring.position.set(0, 3.0, -1.8); st.scene.add(ring);
  'ABCDEFGHIJKLMN'.split('').forEach((ch, i, a) => { const m = letterMesh(ch, LETTER_COLORS[ch], 0.55); const ang = (i / a.length) * Math.PI * 2; m.position.set(Math.cos(ang) * 3.6, Math.sin(ang) * 0.35, Math.sin(ang) * 1.4); ring.add(m); });
  // music notes
  const noteM = soft(0x7b6cff); const notes = Array.from({ length: 8 }, (_, i) => { const g = group(at(sph(0.13, noteM), 0, 0, 0), at(cyl(0.025, 0.025, 0.45, noteM), 0.11, 0.22, 0)); g.children[0].scale.set(1.3, 1, 1); st.scene.add(g); return g; });
  const start = lines[8].start;
  const rel = (li) => lines[li].start - start;
  const wordT = (li, wi) => lines[li].words[wi].t - start;
  return {
    st, color: 0xff70a6,
    bg(ctx, lt, T) {
      skyBg(ctx, T, '#ffd1e8', '#fff1d6', { seed: 5 });
      ctx.save(); ctx.translate(W / 2, H * 0.42); ctx.rotate(T * 0.15); ctx.fillStyle = 'rgba(255,255,255,0.22)';
      for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 1100, a, a + 0.12); ctx.fill(); } ctx.restore();
    },
    update(lt, T) {
      const jumpBig = lt > rel(10) && lt < rel(11);
      fam.forEach((c, i) => {
        const ph = (T - PHASE) / BEAT + (i % 2) * 0.5;
        const j = Math.abs(Math.sin(Math.PI * ph));
        c.root.position.y = jumpBig ? j * 0.7 : j * 0.12;
        c.root.rotation.y = (c.root.scale.x < 1 ? -0.5 : 0) + Math.sin(T * 2 + i) * 0.25;
        c.setFace?.(lt > rel(11) ? 'happy' : i % 3 === 0 ? 'wink' : 'open'); c.setSing(singAmt(T + i * 0.1)); c.update(T - PHASE, { wave: lt > rel(11) ? 1 : 0 });
        if (c.armL && !jumpBig && lt < rel(11)) { c.armL.rotation.z = -2.2 - Math.sin(T * 8 + i) * 0.4; c.armR.rotation.z = 2.2 + Math.sin(T * 8 + i) * 0.4; }
      });
      blocks.forEach((b, i) => { const k = easeBack(prog(lt, wordT(8, i) - 0.05, wordT(8, i) + 0.3)); b.scale.setScalar(Math.max(0.001, k)); b.position.y = 0.7 + beat(T) * 0.15 * (i % 2 ? 1 : 0.6); b.rotation.y = Math.sin(T * 1.5 + i) * 0.3; });
      const rk = easeOut(prog(lt, rel(9) - 0.2, rel(9) + 0.6)) * (1 - easeOut(prog(lt, rel(10) - 0.3, rel(10) + 0.2))); ring.scale.setScalar(Math.max(0.001, rk)); ring.rotation.y = T * 0.8;
      ring.children.forEach((m) => m.lookAt(st.camera.position));
      notes.forEach((n, i) => { const a = ((lt * 0.35 + i / notes.length) % 1); n.position.set(-5 + i * 1.4 + Math.sin(T + i) * 0.3, 1 + a * 4.5, -1.5 + Math.cos(i) * 1.5); n.rotation.z = Math.sin(T * 3 + i) * 0.3; n.scale.setScalar(Math.sin(a * Math.PI) * 1.2); });
      camPath(st, [[0, [0, 2.6, 12.5], [0, 1.4, 0]], [rel(9), [2.5, 3.0, 11.5], [0, 1.8, -0.5]], [rel(10), [-1.2, 1.5, 11.0], [0, 1.5, 0]], [rel(11), [0, 1.8, 10.8], [0, 1.4, 0]], [rel(11) + 3.3, [0, 3.0, 13.5], [0, 1.6, 0]]], lt);
    },
    overlay(ctx, lt) {
      const nums = ['1', '2', '3'], cols = ['#ff4f6d', '#ffb000', '#3a8cff'];
      const line = lines[10]; const n = line.words.length;
      nums.forEach((s, i) => { const t0 = line.words[n - 3 + i].t - start; const k = prog(lt, t0 - 0.05, t0 + 0.35); if (k > 0 && lt < rel(11) + 0.2) bubbleText(ctx, s, 420 + i * 220, 150 + (i % 2) * 30, 120, cols[i], { scale: easeBack(Math.min(1, k * 1.5)), rot: (i - 1) * 0.12 }); });
      if (lt > rel(11)) { const r = rng(5); for (let i = 0; i < 16; i++) { const x = r() * W, sp = 60 + r() * 80, y = H - ((lt - rel(11)) * sp + r() * 200) % (H + 50); bubbleText(ctx, '♥', x, y, 34 + r() * 24, ['#ff4f6d', '#ff8fb3', '#ffb000'][i % 3], { stroke: '#fff' }); } }
    },
  };
}
