// Chunky, toy-like props for each letter. Every factory returns a Group with tick(lt).
import * as THREE from 'three';
import { rbox, box, cyl, sph, tor, cone, at, group, canvasTex, rng } from './kit.js';
import { soft } from './mochi.js';

const M = (c, o) => soft(c, o);
function mesh(geo, m) { const x = new THREE.Mesh(geo, m); x.castShadow = x.receiveShadow = true; return x; }
const tube = (pts, r, m, seg = 40) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), seg, r, 10), m);
const ell = (r, sx, sy, sz, m) => { const s = mesh(new THREE.SphereGeometry(r, 28, 20), m); s.scale.set(sx, sy, sz); return s; };

function cuteEyes(parent, x, y, z, s = 1, spread = 0.12) {
  const inkM = new THREE.MeshPhysicalMaterial({ color: 0x1c1420, roughness: 0.15, clearcoat: 1 });
  for (const k of [-1, 1]) {
    const e = mesh(new THREE.SphereGeometry(0.05 * s, 16, 12), inkM); e.scale.set(0.85, 1.1, 0.5); e.position.set(x + k * spread * s, y, z);
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.016 * s, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); hl.position.set(0.015 * s, 0.02 * s, 0.03 * s); e.add(hl);
    parent.add(e);
  }
  for (const k of [-1, 1]) { const b = new THREE.Mesh(new THREE.CircleGeometry(0.035 * s, 16), new THREE.MeshBasicMaterial({ color: 0xff8fa8, transparent: true, opacity: 0.7 })); b.position.set(x + k * spread * s * 1.7, y - 0.06 * s, z - 0.005); b.scale.y = 0.65; parent.add(b); }
}

export function sparkles(n = 6, color = 0xffffff, R = 1) {
  const g = new THREE.Group(), r = rng(n * 7);
  const m = new THREE.MeshBasicMaterial({ color, toneMapped: false });
  const S = Array.from({ length: n }, () => { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.07), m); s.scale.set(1, 1.8, 0.3); g.add(s); return { s, a: r() * 6.28, rr: R * (0.7 + r() * 0.5), y: r() * R * 1.4, ph: r() * 6 }; });
  g.tick = (t) => S.forEach((o) => { o.s.position.set(Math.cos(o.a) * o.rr, o.y, Math.sin(o.a) * o.rr * 0.5 + 0.3); o.s.scale.setScalar(Math.max(0, Math.sin(t * 4 + o.ph))); o.s.rotation.z = t * 2; });
  return g;
}

// A ---------------------------------------------------------------
export function apple() {
  const g = new THREE.Group();
  const body = ell(0.75, 1.05, 0.95, 1, M(0xe8262f, { clearcoat: 1, clearcoatRoughness: 0.08, roughness: 0.25 })); body.position.y = 0.75; g.add(body);
  g.add(at(cyl(0.04, 0.05, 0.3, 0x6b3d1e), 0.02, 1.55, 0, 0, 0, -0.2));
  const leaf = ell(0.2, 1.4, 0.2, 0.7, M(0x48b53a)); leaf.position.set(0.22, 1.58, 0); leaf.rotation.z = 0.5; g.add(leaf);
  cuteEyes(g, 0, 0.82, 0.72, 2.2);
  const sp = sparkles(7, 0xfff3b0, 1.1); g.add(sp);
  g.tick = (t) => { body.rotation.y = Math.sin(t * 2) * 0.2; leaf.rotation.x = Math.sin(t * 4) * 0.15; sp.tick(t); g.position.y = Math.abs(Math.sin(t * Math.PI * 1.9)) * 0.08; };
  return g;
}

// B ---------------------------------------------------------------
export function balloon(color = 0xff4f6d) {
  const g = new THREE.Group();
  const bal = new THREE.Group(); g.add(bal);
  const b = ell(0.55, 0.92, 1.1, 0.92, M(color, { clearcoat: 1, clearcoatRoughness: 0.05, roughness: 0.2 })); bal.add(b);
  bal.add(at(cone(0.08, 0.12, M(color)), 0, -0.64, 0, Math.PI));
  const hl = ell(0.12, 0.6, 1, 0.3, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })); hl.position.set(-0.2, 0.25, 0.46); bal.add(hl);
  const str = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: 0xffffff })); g.add(str);
  g.string = str; g.bal = bal;
  /** call with the world-space hand position to tie the string */
  g.tie = (handLocal) => {
    const top = bal.position.clone().add(new THREE.Vector3(0, -0.7, 0));
    const mid = top.clone().lerp(handLocal, 0.5).add(new THREE.Vector3(0.15, 0, 0));
    str.geometry.dispose(); str.geometry = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(top, mid, handLocal), 20, 0.012, 6);
  };
  g.tick = (t) => { bal.rotation.z = Math.sin(t * 1.7) * 0.12; bal.position.x = Math.sin(t * 1.3) * 0.12; };
  return g;
}

// C ---------------------------------------------------------------
export function car(color = 0x3a8cff) {
  const g = new THREE.Group(); const bodyG = new THREE.Group(); g.add(bodyG);
  bodyG.add(at(rbox(2.2, 0.6, 1.2, 0.25, M(color, { clearcoat: 1, clearcoatRoughness: 0.1 })), 0, 0.6, 0));
  bodyG.add(at(rbox(1.2, 0.5, 1.05, 0.22, M(color, { clearcoat: 1 })), -0.15, 1.05, 0));
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xbfe8ff, roughness: 0.05, clearcoat: 1 });
  bodyG.add(at(rbox(1.05, 0.36, 1.08, 0.15, glass), -0.15, 1.08, 0));
  for (const z of [-0.45, 0.45]) bodyG.add(at(sph(0.1, M(0xfff4b0, { emissive: 0xffe680, emissiveIntensity: 0.6 })), 1.08, 0.66, z));
  cuteEyes(bodyG, 1.1, 0.72, 0, 1.6, 0.0); // headlight-eyes handled above; tiny smile grill:
  bodyG.add(at(tor(0.12, 0.025, 0x1c1420, {}, Math.PI), 1.11, 0.5, 0, 0, Math.PI / 2, Math.PI));
  const wheels = [];
  for (const x of [-0.7, 0.7]) for (const z of [-0.6, 0.6]) { const w = group(at(cyl(0.3, 0.3, 0.22, 0x2b2b33, {}, 28), 0, 0, 0, Math.PI / 2), at(cyl(0.14, 0.14, 0.24, 0xe8e8f0, {}, 20), 0, 0, 0, Math.PI / 2)); at(w, x, 0.3, z); g.add(w); wheels.push(w); }
  g.seat = new THREE.Vector3(-0.15, 0.85, 0); g.bodyG = bodyG;
  g.tick = (t, speed = 1) => { wheels.forEach((w) => (w.rotation.z = -t * 8 * speed)); bodyG.position.y = Math.abs(Math.sin(t * 10)) * 0.03; };
  return g;
}

// D ---------------------------------------------------------------
export function dinosaur() {
  const g = new THREE.Group(); const gm = M(0x5fcf6a), belly = M(0xd9f5a0), spike = M(0xffb02e);
  const body = ell(0.8, 1.25, 0.95, 0.9, gm); body.position.set(0, 1.1, 0); g.add(body);
  const b2 = ell(0.6, 1.1, 0.85, 0.5, belly); b2.position.set(0.25, 1.0, 0.4); g.add(b2);
  const neck = new THREE.Group(); neck.position.set(0.7, 1.5, 0); g.add(neck);
  neck.add(at(mesh(new THREE.CapsuleGeometry(0.3, 0.5, 8, 16), gm), 0.15, 0.3, 0, 0, 0, -0.5));
  const head = ell(0.45, 1.3, 0.9, 0.95, gm); head.position.set(0.5, 0.85, 0); neck.add(head);
  cuteEyes(neck, 0.62, 0.95, 0.4, 1.6, 0.13);
  const jaw = ell(0.25, 1.4, 0.4, 0.8, M(0x4bb85a)); jaw.position.set(0.7, 0.62, 0); neck.add(jaw);
  const tail = tube([[-0.8, 1.0, 0], [-1.5, 0.75, 0], [-2.0, 0.6, 0.2], [-2.3, 0.65, 0.4]], 0.18, gm); g.add(tail);
  for (let i = 0; i < 5; i++) g.add(at(cone(0.13, 0.28, spike), -0.7 + i * 0.35, 1.85 - Math.abs(i - 2) * 0.08, 0, 0, 0, 0.2));
  const legs = [];
  for (const x of [-0.45, 0.45]) for (const z of [-0.4, 0.4]) { const l = new THREE.Group(); l.position.set(x, 0.65, z); l.add(at(mesh(new THREE.CapsuleGeometry(0.2, 0.35, 6, 12), gm), 0, -0.3, 0)); l.add(at(ell(0.22, 1.2, 0.5, 1.2, gm), 0.05, -0.58, 0)); g.add(l); legs.push(l); }
  g.tick = (t) => {
    const s = Math.sin(t * Math.PI * 1.9);
    legs.forEach((l, i) => { l.rotation.z = ((i % 2) ? 1 : -1) * s * 0.3; l.position.y = 0.65 + Math.max(0, ((i % 2) ? s : -s)) * 0.12; });
    neck.rotation.z = Math.sin(t * 3) * 0.1; jaw.position.y = 0.62 - Math.max(0, Math.sin(t * 6)) * 0.08;
    g.position.y = Math.abs(s) * 0.05;
  };
  return g;
}

// E ---------------------------------------------------------------
export function elephant() {
  const g = new THREE.Group(); const gm = M(0xa7b0c8), pink = M(0xffb3c6);
  g.add(at(ell(0.85, 1.2, 0.9, 0.95, gm), -0.3, 1.1, 0));
  const head = new THREE.Group(); head.position.set(0.55, 1.45, 0); g.add(head);
  head.add(ell(0.62, 1, 0.95, 0.95, gm));
  const ears = [-1, 1].map((s) => { const e = new THREE.Group(); e.position.set(-0.1, 0.05, s * 0.55); const m = ell(0.5, 0.35, 1.0, 1.0, gm); e.add(m); const i = ell(0.38, 0.3, 0.9, 0.9, pink); i.position.x = 0.04; e.add(i); head.add(e); return e; });
  cuteEyes(head, 0.5, 0.15, 0.32, 1.8, 0.0);
  head.children.slice(-4).forEach((o) => o.rotation.set(0, Math.PI / 2, 0));
  const trunkG = new THREE.Group(); trunkG.position.set(0.55, -0.1, 0); head.add(trunkG);
  const trunk = tube([[0, 0, 0], [0.25, -0.35, 0], [0.35, -0.7, 0], [0.5, -0.85, 0]], 0.13, gm); trunkG.add(trunk);
  for (const x of [-0.85, 0.25]) for (const z of [-0.4, 0.4]) g.add(at(mesh(new THREE.CapsuleGeometry(0.22, 0.4, 6, 12), gm), x, 0.42, z));
  g.add(tube([[-1.3, 1.1, 0], [-1.55, 0.8, 0], [-1.6, 0.55, 0]], 0.04, gm, 12));
  g.tick = (t) => {
    trunkG.rotation.z = 0.3 + Math.sin(t * 2.4) * 0.6;
    ears.forEach((e, i) => (e.rotation.y = (i ? -1 : 1) * (0.2 + Math.sin(t * 5) * 0.2)));
    g.position.y = Math.abs(Math.sin(t * Math.PI * 0.95)) * 0.05;
  };
  return g;
}

// F ---------------------------------------------------------------
export function firetruck() {
  const g = new THREE.Group(); const red = M(0xe8282f, { clearcoat: 1, clearcoatRoughness: 0.1 });
  const bodyG = new THREE.Group(); g.add(bodyG);
  bodyG.add(at(rbox(3.0, 0.8, 1.3, 0.22, red), -0.3, 0.75, 0));
  bodyG.add(at(rbox(1.0, 0.7, 1.25, 0.22, red), 0.9, 1.4, 0));
  bodyG.add(at(rbox(0.55, 0.42, 1.27, 0.12, new THREE.MeshPhysicalMaterial({ color: 0xbfe8ff, roughness: 0.05, clearcoat: 1 })), 1.15, 1.45, 0));
  bodyG.add(at(rbox(3.0, 0.12, 1.32, 0.05, M(0xf4f4f8)), -0.3, 0.6, 0));
  const ladder = new THREE.Group(); ladder.position.set(-0.6, 1.3, 0); bodyG.add(ladder);
  for (const z of [-0.25, 0.25]) ladder.add(at(box(2.2, 0.06, 0.06, M(0xd8d8e0)), 0, 0, z));
  for (let i = 0; i < 8; i++) ladder.add(at(box(0.05, 0.05, 0.5, M(0xd8d8e0)), -1 + i * 0.28, 0, 0));
  const lights = [M(0xff2020, { emissive: 0xff2020 }), M(0x2060ff, { emissive: 0x2060ff })].map((m, i) => { const l = sph(0.12, m); l.position.set(0.8 + i * 0.25, 1.8, 0); bodyG.add(l); return l; });
  cuteEyes(bodyG, 1.41, 0.95, 0, 1.6, 0.0);
  const wheels = [];
  for (const x of [-1.3, -0.5, 0.9]) for (const z of [-0.65, 0.65]) { const w = group(at(cyl(0.33, 0.33, 0.24, 0x2b2b33, {}, 28), 0, 0, 0, Math.PI / 2), at(cyl(0.15, 0.15, 0.26, 0xf0c040, {}, 20), 0, 0, 0, Math.PI / 2)); at(w, x, 0.33, z); g.add(w); wheels.push(w); }
  g.tick = (t) => {
    wheels.forEach((w) => (w.rotation.z = -t * 14));
    const on = Math.floor(t * 6) % 2;
    lights[0].material.emissiveIntensity = on ? 3 : 0.2; lights[1].material.emissiveIntensity = on ? 0.2 : 3;
    bodyG.position.y = Math.abs(Math.sin(t * 14)) * 0.03; bodyG.rotation.z = Math.sin(t * 7) * 0.01;
  };
  return g;
}

// G ---------------------------------------------------------------
export function giraffe() {
  const spots = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#ffd25a'; c.fillRect(0, 0, w, h); const r = rng(4); c.fillStyle = '#c8782e';
    for (let i = 0; i < 26; i++) { c.beginPath(); c.ellipse(r() * w, r() * h, 12 + r() * 14, 10 + r() * 12, r() * 3, 0, 7); c.fill(); }
  });
  spots.wrapS = spots.wrapT = THREE.RepeatWrapping;
  const gm = new THREE.MeshPhysicalMaterial({ map: spots, roughness: 0.55, clearcoat: 0.3 });
  const g = new THREE.Group();
  g.add(at(ell(0.65, 1.3, 0.85, 0.85, gm), 0, 1.6, 0));
  for (const x of [-0.5, 0.5]) for (const z of [-0.3, 0.3]) g.add(at(mesh(new THREE.CapsuleGeometry(0.12, 1.1, 6, 12), gm), x, 0.7, z));
  const neck = new THREE.Group(); neck.position.set(0.55, 1.9, 0); g.add(neck);
  neck.add(at(mesh(new THREE.CapsuleGeometry(0.2, 1.8, 8, 16), gm), 0.2, 0.95, 0, 0, 0, -0.2));
  const head = new THREE.Group(); head.position.set(0.45, 2.05, 0); neck.add(head);
  head.add(ell(0.36, 1.35, 0.95, 0.95, gm));
  head.add(at(ell(0.2, 1.2, 0.8, 0.9, M(0xffe2a8)), 0.38, -0.08, 0));
  for (const z of [-0.12, 0.12]) { head.add(at(cyl(0.035, 0.035, 0.3, 0xc8782e), -0.08, 0.42, z)); head.add(at(sph(0.07, 0xc8782e), -0.08, 0.58, z)); }
  for (const z of [-0.33, 0.33]) head.add(at(ell(0.12, 0.6, 0.35, 1, gm), -0.15, 0.22, z));
  cuteEyes(head, 0.15, 0.1, 0.32, 1.7, 0.0);
  head.children.slice(-4).forEach((o) => o.position.z > 0 ? 0 : 0);
  const eyesR = new THREE.Group(); cuteEyes(eyesR, 0, 0, 0, 1.5, 0.15); eyesR.position.set(0.3, 0.1, 0.0); eyesR.rotation.y = Math.PI / 2; head.add(eyesR);
  g.add(tube([[-0.8, 1.7, 0], [-1.05, 1.3, 0], [-1.1, 1.0, 0]], 0.035, gm, 12));
  g.tick = (t) => { neck.rotation.z = Math.sin(t * 1.5) * 0.06; head.rotation.z = Math.sin(t * 2.3) * 0.1; };
  return g;
}

// H ---------------------------------------------------------------
export function helicopter(color = 0xffb02e) {
  const g = new THREE.Group(); const cm = M(color, { clearcoat: 1, clearcoatRoughness: 0.1 });
  g.add(at(ell(0.85, 1.25, 0.95, 0.95, cm), 0, 0, 0));
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xbfe8ff, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.55 });
  g.add(at(ell(0.62, 1, 0.85, 0.95, glass), 0.5, 0.08, 0));
  g.add(tube([[-0.8, 0.1, 0], [-1.6, 0.25, 0], [-2.1, 0.45, 0]], 0.13, cm, 16));
  const tailRotor = new THREE.Group(); tailRotor.position.set(-2.1, 0.45, 0.12); g.add(tailRotor);
  for (let i = 0; i < 2; i++) tailRotor.add(at(rbox(0.06, 0.6, 0.03, 0.02, 0x2b2b33), 0, 0, 0, 0, 0, i * Math.PI / 2));
  g.add(at(cyl(0.06, 0.06, 0.3, 0x2b2b33), 0, 0.95, 0));
  const rotor = new THREE.Group(); rotor.position.y = 1.1; g.add(rotor);
  for (let i = 0; i < 4; i++) rotor.add(at(rbox(2.6, 0.04, 0.18, 0.02, 0x2b2b33), 0, 0, 0, 0, i * Math.PI / 4, 0));
  for (const z of [-0.5, 0.5]) { g.add(at(rbox(1.7, 0.06, 0.08, 0.03, 0x6b6b73), 0.1, -0.95, z)); g.add(at(cyl(0.03, 0.03, 0.3, 0x6b6b73), -0.2, -0.8, z)); g.add(at(cyl(0.03, 0.03, 0.3, 0x6b6b73), 0.5, -0.8, z)); }
  g.seat = new THREE.Vector3(0.35, -0.35, 0);
  g.tick = (t) => { rotor.rotation.y = t * 30; tailRotor.rotation.z = t * 40; };
  return g;
}

// I ---------------------------------------------------------------
export function iceCream() {
  const waffle = canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#e9a85a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#c47c35'; c.lineWidth = 6; for (let i = -w; i < w * 2; i += 26) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + h, h); c.stroke(); c.beginPath(); c.moveTo(i, h); c.lineTo(i + h, 0); c.stroke(); } });
  waffle.wrapS = waffle.wrapT = THREE.RepeatWrapping; waffle.repeat.set(3, 2);
  const g = new THREE.Group();
  const c = mesh(new THREE.ConeGeometry(0.5, 1.5, 32, 1, true), new THREE.MeshStandardMaterial({ map: waffle, roughness: 0.8, side: THREE.DoubleSide })); c.rotation.x = Math.PI; c.position.y = 0.75; g.add(c);
  const scoops = [[0xff9ec4, 1.65, 0.62], [0xa8f0d0, 2.25, 0.55], [0xfff3d6, 2.75, 0.45]].map(([col, y, r]) => { const s = ell(r, 1, 0.88, 1, M(col, { roughness: 0.6, clearcoat: 0.6 })); s.position.y = y; g.add(s); return s; });
  g.add(at(sph(0.14, M(0xe8102f, { clearcoat: 1, roughness: 0.15 })), 0.05, 3.25, 0));
  g.add(at(tube([[0.05, 3.3, 0], [0.12, 3.5, 0], [0.25, 3.6, 0]], 0.02, M(0x3a7a2a), 8)));
  const sprCols = [0xff4f8b, 0x4fc3ff, 0xffd23f, 0x7b6cff, 0x5fd06a]; const r = rng(3);
  for (let i = 0; i < 26; i++) { const a = r() * 6.28, y = 2.25 + (r() - 0.5) * 0.6; const s = mesh(new THREE.CapsuleGeometry(0.018, 0.07, 4, 6), M(sprCols[i % 5])); s.position.set(Math.cos(a) * 0.5, y + 0.15, Math.sin(a) * 0.5); s.rotation.set(r() * 3, r() * 3, r() * 3); g.add(s); }
  const drip = ell(0.09, 1, 1.6, 1, M(0xff9ec4)); g.add(drip);
  cuteEyes(g, 0, 1.65, 0.6, 2.0);
  g.tick = (t) => { scoops.forEach((s, i) => (s.rotation.y = Math.sin(t * 2 + i) * 0.15)); const d = (t * 0.5) % 1; drip.position.set(0.42, 1.45 - d * 0.6, 0.25); drip.scale.set(1, 1.2 + d, 1); };
  return g;
}

// J ---------------------------------------------------------------
export function jellyfish() {
  const g = new THREE.Group();
  const bell = mesh(new THREE.SphereGeometry(0.85, 36, 24, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0xb06cff, roughness: 0.2, transmission: 0.0, transparent: true, opacity: 0.88, clearcoat: 1, emissive: 0x6a2ad0, emissiveIntensity: 0.35, side: THREE.DoubleSide }));
  bell.scale.set(1, 0.85, 1); g.add(bell);
  const gold = M(0xffcc33, { emissive: 0xffaa00, emissiveIntensity: 0.6, metalness: 0.4, roughness: 0.3 });
  const r = rng(12); for (let i = 0; i < 9; i++) { const a = r() * 6.28, el = 0.3 + r() * 0.9; const s = sph(0.08, gold); s.position.set(Math.cos(a) * Math.cos(el) * 0.85, Math.sin(el) * 0.72, Math.sin(a) * Math.cos(el) * 0.85); g.add(s); }
  g.add(at(tor(0.82, 0.07, gold), 0, 0.02, 0, Math.PI / 2));
  cuteEyes(g, 0, 0.32, 0.78, 2.2);
  const tents = [];
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const tg = new THREE.Group(); tg.position.set(Math.cos(a) * 0.55, -0.02, Math.sin(a) * 0.55); g.add(tg); tents.push({ tg, a, ph: i }); }
  const tm = M(i => i, {}); void tm;
  const purple = M(0xc58cff, { transparent: true, opacity: 0.9, emissive: 0x6a2ad0, emissiveIntensity: 0.3 }), goldT = M(0xffd25a, { emissive: 0xffaa00, emissiveIntensity: 0.3 });
  g.tick = (t) => {
    const pulse = 1 + Math.sin(t * 4) * 0.06; bell.scale.set(pulse, 0.85 / pulse, pulse);
    tents.forEach(({ tg, a, ph }, i) => {
      tg.clear();
      const pts = []; for (let k = 0; k <= 6; k++) pts.push([Math.sin(t * 3 + k * 0.8 + ph) * 0.12 * k * 0.4, -k * 0.28, Math.cos(t * 2.5 + k + ph) * 0.06 * k * 0.3]);
      tg.add(tube(pts, 0.035, i % 2 ? purple : goldT, 16));
    });
    g.position.y = 2.0 + Math.sin(t * 2) * 0.25;
  };
  return g;
}

// K ---------------------------------------------------------------
export function kite() {
  const g = new THREE.Group();
  const kiteG = new THREE.Group(); g.add(kiteG);
  const cols = [0xff4f6d, 0xffd23f, 0x4fc3ff, 0x5fd06a];
  const quads = [[[0, 0.9], [0.6, 0], [0, 0]], [[0, 0.9], [-0.6, 0], [0, 0]], [[0, -1.2], [0.6, 0], [0, 0]], [[0, -1.2], [-0.6, 0], [0, 0]]];
  quads.forEach((tri, i) => { const s = new THREE.Shape(tri.map(([x, y]) => new THREE.Vector2(x, y))); const m = mesh(new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }), M(cols[i])); kiteG.add(m); });
  kiteG.add(at(cyl(0.02, 0.02, 2.1, 0x8a5a2b), 0, -0.15, 0.06)); kiteG.add(at(cyl(0.02, 0.02, 1.2, 0x8a5a2b), 0, 0, 0.06, 0, 0, Math.PI / 2));
  cuteEyes(kiteG, 0, 0.15, 0.09, 2.0);
  const bows = []; for (let i = 0; i < 5; i++) { const b = group(at(cone(0.08, 0.14, M(cols[i % 4])), -0.07, 0, 0, 0, 0, Math.PI / 2), at(cone(0.08, 0.14, M(cols[i % 4])), 0.07, 0, 0, 0, 0, -Math.PI / 2)); g.add(b); bows.push(b); }
  const tail = new THREE.Mesh(new THREE.BufferGeometry(), M(0xffffff)); g.add(tail);
  const line = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0xffffff })); g.add(line);
  g.kiteG = kiteG;
  g.tick = (t, hand) => {
    kiteG.position.set(Math.sin(t * 0.9) * 0.4, 3.2 + Math.sin(t * 1.3) * 0.25, 0); kiteG.rotation.set(0.1, Math.sin(t) * 0.2, Math.sin(t * 1.4) * 0.25);
    const base = kiteG.position.clone().add(new THREE.Vector3(0, -1.2, 0));
    const pts = []; for (let k = 0; k <= 10; k++) pts.push(base.clone().add(new THREE.Vector3(Math.sin(t * 4 - k * 0.6) * 0.18 * k * 0.15, -k * 0.16, 0)));
    tail.geometry.dispose(); tail.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.012, 5);
    bows.forEach((b, i) => { b.position.copy(pts[2 + i * 2]); b.rotation.z = Math.sin(t * 4 + i) * 0.3; });
    if (hand) { const mid = kiteG.position.clone().lerp(hand, 0.5).add(new THREE.Vector3(0.3, -0.3, 0)); line.geometry.dispose(); line.geometry = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(kiteG.position.clone(), mid, hand), 24, 0.008, 4); }
  };
  return g;
}

// L ---------------------------------------------------------------
export function lion() {
  const g = new THREE.Group(); const fur = M(0xffc04a), mane = M(0xd9762a);
  g.add(at(ell(0.75, 1.3, 0.85, 0.85, fur), -0.4, 0.9, 0));
  for (const x of [-0.95, 0.15]) for (const z of [-0.35, 0.35]) g.add(at(mesh(new THREE.CapsuleGeometry(0.17, 0.35, 6, 12), fur), x, 0.35, z));
  g.add(tube([[-1.3, 1.0, 0], [-1.7, 1.2, 0], [-1.85, 1.6, 0]], 0.05, fur, 12)); g.add(at(sph(0.13, mane), -1.85, 1.65, 0));
  const head = new THREE.Group(); head.position.set(0.55, 1.45, 0); g.add(head);
  const maneG = new THREE.Group(); head.add(maneG);
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; const s = sph(0.3, mane); s.position.set(-0.1, Math.sin(a) * 0.62, Math.cos(a) * 0.62); maneG.add(s); }
  maneG.add(at(ell(0.6, 0.6, 1, 1, mane), -0.15, 0, 0));
  const face = ell(0.55, 0.9, 0.95, 1, fur); head.add(face);
  for (const z of [-0.38, 0.38]) head.add(at(sph(0.14, fur), 0.0, 0.45, z));
  const eyes = new THREE.Group(); cuteEyes(eyes, 0, 0, 0, 1.8, 0.11); eyes.position.set(0.48, 0.15, 0); eyes.rotation.y = Math.PI / 2; head.add(eyes);
  head.add(at(ell(0.22, 1, 0.7, 1.2, M(0xfff0d0)), 0.42, -0.12, 0));
  head.add(at(ell(0.07, 1, 0.8, 1.2, M(0x5a2a1a)), 0.62, -0.02, 0));
  const mouth = ell(0.14, 0.5, 1, 1.2, new THREE.MeshBasicMaterial({ color: 0x5a1626 })); mouth.position.set(0.58, -0.26, 0); head.add(mouth);
  const rings = [0, 1, 2].map(() => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.04, 8, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, toneMapped: false })); r.rotation.y = Math.PI / 2; g.add(r); return r; });
  g.roar = 0;
  g.tick = (t, roar = 0) => {
    mouth.scale.set(0.5, 0.3 + roar * 1.4, 1.2); maneG.scale.setScalar(1 + roar * 0.15 + Math.sin(t * 30) * 0.02 * roar);
    head.rotation.z = roar * 0.2; head.position.x = 0.55 + roar * 0.1;
    rings.forEach((r, i) => { const k = ((t * 1.6 + i / 3) % 1); r.position.set(1.4 + k * 2.5, 1.35, 0); r.scale.setScalar(0.4 + k * 2); r.material.opacity = roar * (1 - k) * 0.9; });
  };
  return g;
}

// tree for M and N
export function tree({ branch = true } = {}) {
  const g = new THREE.Group();
  g.add(at(cyl(0.3, 0.42, 3.2, M(0x8a5a32), {}, 16), 0, 1.6, 0));
  const leaves = M(0x5cc456);
  for (const [x, y, z, r] of [[0, 3.6, 0, 1.2], [-0.9, 3.2, 0.2, 0.8], [0.9, 3.3, -0.1, 0.85], [0.3, 4.3, 0, 0.8], [-0.5, 4.0, -0.3, 0.7]]) g.add(at(sph(r, leaves), x, y, z));
  if (branch) g.add(at(cyl(0.1, 0.14, 2.2, M(0x8a5a32), {}, 12), 1.2, 3.0, 0, 0, 0, Math.PI / 2 - 0.1));
  return g;
}

// M ---------------------------------------------------------------
export function monkey() {
  const g = new THREE.Group(); const fur = M(0x8a5230), skin = M(0xf2c9a0);
  const body = new THREE.Group(); g.add(body);
  body.add(at(ell(0.38, 0.9, 1.1, 0.8, fur), 0, -1.75, 0));
  body.add(at(ell(0.25, 0.8, 1.0, 0.4, skin), 0.0, -1.78, 0.25));
  const head = new THREE.Group(); head.position.set(0, -1.15, 0); body.add(head);
  head.add(sph(0.38, fur)); head.add(at(ell(0.28, 1.1, 0.8, 0.6, skin), 0, -0.06, 0.2));
  for (const s of [-1, 1]) { head.add(at(sph(0.13, fur), s * 0.4, 0.05, 0)); head.add(at(sph(0.08, skin), s * 0.42, 0.05, 0.04)); }
  cuteEyes(head, 0, 0.04, 0.36, 1.5, 0.09);
  head.add(at(tor(0.06, 0.016, 0x1c1420, {}, Math.PI), 0, -0.12, 0.37, 0, 0, Math.PI));
  // arms up holding the vine
  for (const s of [-1, 1]) body.add(at(mesh(new THREE.CapsuleGeometry(0.07, 0.65, 6, 10), fur), s * 0.18, -0.65, 0, 0, 0, s * -0.25));
  for (const s of [-1, 1]) body.add(at(mesh(new THREE.CapsuleGeometry(0.08, 0.3, 6, 10), fur), s * 0.18, -2.15, 0.05, 0.3, 0, 0));
  body.add(tube([[0, -2.0, -0.25], [0, -2.3, -0.5], [0.25, -2.4, -0.6], [0.35, -2.2, -0.6]], 0.04, fur, 16));
  const vine = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.6, 8), M(0x3f9a3a)); vine.position.y = -0.3; body.add(vine);
  g.tick = (t) => { body.rotation.z = Math.sin(t * Math.PI * 0.95) * 0.75; head.rotation.z = -Math.sin(t * Math.PI * 0.95) * 0.3; };
  return g;
}

// N ---------------------------------------------------------------
export function nest() {
  const g = new THREE.Group(); const twig = M(0xa06a38, { roughness: 0.9 });
  const r = rng(8);
  for (let i = 0; i < 9; i++) { const t = mesh(new THREE.TorusGeometry(0.7 - i * 0.015, 0.09, 8, 24), twig); t.rotation.set(Math.PI / 2 + (r() - 0.5) * 0.3, (r() - 0.5) * 0.3, r() * 3); t.position.y = 0.1 + i * 0.04; t.scale.set(1, 1, 0.8); g.add(t); }
  g.add(at(ell(0.65, 1, 0.3, 1, twig), 0, 0.08, 0));
  [[-0.2, 0.32, 0.05], [0.18, 0.3, -0.1], [0.05, 0.34, 0.25]].forEach(([x, y, z]) => g.add(at(ell(0.17, 0.85, 1.1, 0.85, M(0xa8e0ff, { clearcoat: 1, roughness: 0.2 })), x, y, z)));
  const bees = []; const stripes = canvasTex(64, 32, (c, w, h) => { c.fillStyle = '#ffd23f'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a2020'; for (let x = 8; x < w; x += 20) c.fillRect(x, 0, 9, h); });
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Group(); const body = ell(0.16, 1.3, 1, 1, new THREE.MeshPhysicalMaterial({ map: stripes, roughness: 0.4, clearcoat: 0.6 })); b.add(body);
    cuteEyes(b, 0.2, 0.04, 0.08, 0.8, 0.07);
    const wings = [-1, 1].map((s) => { const w = ell(0.12, 1, 0.25, 0.6, new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, roughness: 0.1 })); w.position.set(-0.02, 0.17, s * 0.08); b.add(w); return w; });
    g.add(b); bees.push({ b, wings, ph: i * 1.6, R: 0.9 + i * 0.25 });
  }
  g.tick = (t) => bees.forEach(({ b, wings, ph, R }, i) => {
    const a = t * (1.8 + i * 0.3) + ph;
    b.position.set(Math.cos(a) * R, 0.9 + Math.sin(a * 2) * 0.25 + i * 0.12, Math.sin(a) * R * 0.6);
    b.rotation.y = -a - Math.PI / 2 * (i % 2 ? 1 : 1);
    wings.forEach((w, k) => (w.rotation.x = Math.sin(t * 60 + k) * 0.6));
  });
  return g;
}

export function cloud(s = 1) {
  const g = new THREE.Group(); const m = M(0xffffff, { roughness: 0.9, clearcoat: 0 });
  for (const [x, y, r] of [[0, 0, 0.5], [0.5, -0.05, 0.4], [-0.5, -0.08, 0.38], [0.2, 0.25, 0.4], [-0.25, 0.2, 0.35]]) { const p = sph(r, m); p.position.set(x, y, 0); p.castShadow = false; g.add(p); }
  g.scale.setScalar(s); return g;
}
