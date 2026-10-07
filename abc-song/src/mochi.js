// The Mochi Family: soft, rounded "mochi" characters built from primitives.
// Milo (orange, inventor) · Lumi (blue, scientist) · Pip (yellow, energizer)
// Mimi (pink, artist) · Moss (green, explorer) · Bobo (the pet pup)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { rbox, box, cyl, sph, tor, cone, at, group, canvasTex } from './kit.js';

const BEAT_S = 60 / 74.07; // song tempo (74 BPM)

// soft vinyl-toy look
export const soft = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.45, sheen: 0.4, sheenColor: 0xffffff, sheenRoughness: 0.6, ...o });
const INK = 0x1c1420;
const ink = () => new THREE.MeshPhysicalMaterial({ color: INK, roughness: 0.15, clearcoat: 1 });

function mesh(geo, m) { const x = new THREE.Mesh(geo, m); x.castShadow = x.receiveShadow = true; return x; }

// mochi body: rounded box, slightly pear-shaped by pinching the top
function mochiGeo(w, h, d, r) {
  const g = new RoundedBoxGeometry(w, h, d, 5, r);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), k = 1 - 0.1 * ((y / h) + 0.5);          // narrower toward the top
    p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * (0.94 + 0.06 * k));
  }
  g.computeVertexNormals(); return g;
}

/** generic mochi character */
export function makeMochi({ color, w = 1.2, h = 1.15, d = 1.0, eyeY = 0.66, name = '' } = {}) {
  const root = new THREE.Group(); root.name = name;
  const bodyG = new THREE.Group(); root.add(bodyG);
  const mat = soft(color);
  const body = mesh(mochiGeo(w, h, d, 0.38), mat); body.position.y = h / 2 + 0.06; bodyG.add(body);
  const fz = d / 2 - 0.005; // front surface

  const face = new THREE.Group(); face.position.set(0, eyeY, fz); bodyG.add(face);
  const shapes = {};
  const add = (name, ...objs) => { const g = group(...objs); g.visible = false; shapes[name] = g; face.add(g); };
  const eye = (x) => { const e = mesh(new THREE.SphereGeometry(0.105, 24, 18), ink()); e.scale.set(0.82, 1.12, 0.45); e.position.set(x, 0, 0.02);
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff })); hl.position.set(0.03, 0.045, 0.1); e.add(hl);
    const hl2 = hl.clone(); hl2.scale.setScalar(0.5); hl2.position.set(-0.03, -0.04, 0.1); e.add(hl2); return e; };
  const arcEye = (x, up = true) => { const a = mesh(new THREE.TorusGeometry(0.07, 0.022, 10, 24, Math.PI), ink()); a.position.set(x, up ? -0.03 : 0.03, 0.03); if (!up) a.rotation.z = Math.PI; return a; };
  add('open', eye(-0.24), eye(0.24));
  add('happy', arcEye(-0.24), arcEye(0.24));
  add('wink', eye(-0.24), arcEye(0.24));
  add('closed', arcEye(-0.24, false), arcEye(0.24, false));
  const wide = [eye(-0.25), eye(0.25)]; wide.forEach((e) => e.scale.multiplyScalar(1.25)); add('wide', ...wide);

  // blush
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.CircleGeometry(0.075, 20), new THREE.MeshBasicMaterial({ color: 0xff8fa8, transparent: true, opacity: 0.75 })); b.position.set(s * 0.38, -0.12, 0.025); b.scale.y = 0.65; face.add(b); }

  // mouth: a smile arc + an open singing mouth whose height is driven per frame
  const smile = mesh(new THREE.TorusGeometry(0.06, 0.018, 10, 24, Math.PI), ink()); smile.rotation.z = Math.PI; smile.position.set(0, -0.13, 0.03); face.add(smile);
  const mouth = new THREE.Group(); mouth.position.set(0, -0.15, 0.03); face.add(mouth);
  const mOuter = new THREE.Mesh(new THREE.CircleGeometry(0.085, 28, Math.PI, Math.PI), new THREE.MeshBasicMaterial({ color: 0x5a1626 })); mouth.add(mOuter);
  const tongue = new THREE.Mesh(new THREE.CircleGeometry(0.045, 20, Math.PI, Math.PI), new THREE.MeshBasicMaterial({ color: 0xff6f8a })); tongue.position.set(0, -0.035, 0.002); mouth.add(tongue);

  // arms & feet
  const arm = (s) => { const p = new THREE.Group(); p.position.set(s * (w / 2 - 0.02), 0.5, 0.05);
    const a = mesh(new THREE.CapsuleGeometry(0.1, 0.16, 6, 12), mat); a.position.set(s * 0.06, -0.08, 0); a.rotation.z = s * 0.5; p.add(a);
    const hand = new THREE.Group(); hand.position.set(s * 0.13, -0.18, 0.02); p.add(hand); p.hand = hand; bodyG.add(p); return p; };
  const armL = arm(-1), armR = arm(1);
  for (const s of [-1, 1]) { const f = mesh(new THREE.SphereGeometry(0.15, 20, 14), mat); f.scale.set(1, 0.6, 1.2); f.position.set(s * 0.27, 0.07, 0.18); root.add(f); }

  const top = new THREE.Group(); top.position.y = h + 0.06; bodyG.add(top);
  let faceName = 'open', sing = 0;
  const c = {
    root, bodyG, armL, armR, top, face, body, mat, w, h, d, fz,
    setFace(n) { faceName = n; }, setSing(v) { sing = v; },
    update(t, { bounce = 1, blink = true, wave = 0 } = {}) {
      const b = Math.abs(Math.sin(Math.PI * t / BEAT_S)); // t is beat-aligned song time
      bodyG.position.y = b * 0.06 * bounce;
      bodyG.scale.set(1 + (1 - b) * 0.035 * bounce, 1 - (1 - b) * 0.035 * bounce, 1 + (1 - b) * 0.035 * bounce);
      armL.rotation.z = -0.1 - Math.sin(t * 6) * 0.15 * bounce; armR.rotation.z = 0.1 + Math.sin(t * 6) * 0.15 * bounce;
      if (wave) armR.rotation.z = 2.2 + Math.sin(t * 12) * 0.35 * wave;
      let n = faceName;
      if (blink && n === 'open' && (t % 3.3) > 3.18) n = 'closed';
      for (const k in shapes) shapes[k].visible = k === n;
      const open = sing > 0.02;
      smile.visible = !open; mouth.visible = open;
      mouth.scale.set(0.8 + sing * 0.3, Math.max(0.05, sing) * 1.2, 1);
    },
  };
  c.update(0);
  return c;
}

// ------------------------------------------------------------------ family members
export const COLORS = { milo: 0xff8a2a, lumi: 0x5b8cff, pip: 0xffcf33, mimi: 0xff8fb3, moss: 0x8fd35a, bobo: 0xfaf3e6 };

export function milo() {
  const c = makeMochi({ color: COLORS.milo, name: 'Milo' });
  // swirl curl on top
  const pts = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2.2, r = 0.16 * (1 - i / 55); pts.push(new THREE.Vector3(Math.cos(a) * r * 0.6 + 0.02, 0.05 + i / 40 * 0.32, Math.sin(a) * r * 0.3)); }
  c.top.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.075, 12), c.mat));
  c.top.add(at(sph(0.1, c.mat), 0, 0.02, 0));
  // headphones
  const hp = new THREE.Group(); hp.position.y = -0.48;
  hp.add(at(tor(0.66, 0.05, 0xf4f1ff), 0, 0, 0));
  hp.children[0].geometry = new THREE.TorusGeometry(0.66, 0.05, 12, 40, Math.PI);
  for (const s of [-1, 1]) { hp.add(at(cyl(0.2, 0.2, 0.14, 0xf4f1ff, {}, 28), s * 0.6, -0.02, 0, 0, 0, Math.PI / 2)); hp.add(at(cyl(0.15, 0.15, 0.15, 0x8fd8ff, {}, 28), s * 0.61, -0.02, 0, 0, 0, Math.PI / 2)); }
  c.top.add(hp); c.headphones = hp;
  return c;
}

export function lumi() {
  const c = makeMochi({ color: COLORS.lumi, name: 'Lumi' });
  for (const s of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(s * 0.22, -0.05, 0); e.rotation.z = -s * 0.15;
    e.add(mesh(new THREE.CapsuleGeometry(0.075, 0.28, 6, 12), c.mat)); e.children[0].position.y = 0.2;
    e.add(at(sph(0.11, c.mat), 0, 0.45, 0)); c.top.add(e); (c.ears ||= []).push(e);
  }
  // round glasses
  const gl = new THREE.Group(); gl.position.set(0, 0, 0.05);
  for (const s of [-1, 1]) {
    gl.add(at(tor(0.15, 0.022, 0x1c1420), s * 0.24, 0, 0));
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.15, 28), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, roughness: 0 })); lens.position.x = s * 0.24; gl.add(lens);
  }
  gl.add(at(tor(0.05, 0.016, 0x1c1420, {}, Math.PI), 0, 0.02, 0));
  c.face.add(gl);
  return c;
}

export function pip() {
  const c = makeMochi({ color: COLORS.pip, name: 'Pip' });
  const capTex = canvasTex(128, 128, (x, w, h) => {
    x.fillStyle = '#f3ead6'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#ffb000'; x.beginPath(); x.arc(64, 64, 34, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.moveTo(70, 36); x.lineTo(50, 68); x.lineTo(64, 68); x.lineTo(56, 92); x.lineTo(80, 58); x.lineTo(66, 58); x.closePath(); x.fill();
  });
  const dome = mesh(new THREE.SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xf3ead6, roughness: 0.8 }));
  dome.scale.set(1.08, 0.62, 1.0); dome.position.y = -0.18; c.top.add(dome);
  const badge = new THREE.Mesh(new THREE.CircleGeometry(0.14, 28), new THREE.MeshStandardMaterial({ map: capTex, roughness: 0.7 })); badge.position.set(0, -0.02, 0.43); badge.rotation.x = -0.45; c.top.add(badge);
  const brim = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 32, 1, false, -0.95, 1.9), new THREE.MeshStandardMaterial({ color: 0x7a4a2a, roughness: 0.7 }));
  brim.scale.set(1.1, 1, 1.25); brim.position.set(0, -0.17, 0.12); c.top.add(brim);
  c.top.add(at(sph(0.05, 0x7a4a2a), 0, 0.14, 0));
  return c;
}

export function mimi() {
  const c = makeMochi({ color: COLORS.mimi, name: 'Mimi' });
  const bowM = soft(0xff4f8b);
  const bow = new THREE.Group(); bow.position.set(-0.18, 0.0, 0.1); bow.rotation.z = 0.25;
  for (const s of [-1, 1]) { const l = mesh(new THREE.SphereGeometry(0.2, 24, 16), bowM); l.scale.set(1.2, 0.85, 0.55); l.position.x = s * 0.2; l.rotation.z = s * 0.35; bow.add(l); }
  bow.add(mesh(new THREE.SphereGeometry(0.09, 16, 12), bowM));
  c.top.add(bow); c.bow = bow;
  return c;
}

export function moss() {
  const c = makeMochi({ color: COLORS.moss, name: 'Moss' });
  const leafM = soft(0x4caf3a);
  c.top.add(at(cyl(0.03, 0.04, 0.22, 0x5aa23e), 0, 0.05, 0));
  for (const s of [-1, 1]) { const l = mesh(new THREE.SphereGeometry(0.16, 20, 14), leafM); l.scale.set(1.4, 0.25, 0.8); l.position.set(s * 0.17, 0.2, 0); l.rotation.z = s * 0.35; c.top.add(l); }
  // backpack
  const bp = group(at(rbox(0.8, 0.75, 0.32, 0.14, 0x9a6a3a), 0, 0, 0), at(rbox(0.55, 0.3, 0.12, 0.06, 0x7d5430), 0, -0.12, -0.18), at(cyl(0.03, 0.03, 0.04, 0xd4a017), 0, 0.1, -0.2, Math.PI / 2));
  bp.position.set(0, 0.62, -c.d / 2 - 0.12); c.bodyG.add(bp); c.backpack = bp;
  return c;
}

/** Bobo the pup: a long, lying mochi with floppy ears */
export function bobo() {
  const root = new THREE.Group(); const bodyG = new THREE.Group(); root.add(bodyG);
  const white = soft(COLORS.bobo), brown = soft(0x9a5a32);
  const body = mesh(mochiGeo(0.9, 0.62, 1.35, 0.3), white); body.position.set(0, 0.34, -0.25); bodyG.add(body);
  const patch = mesh(new THREE.SphereGeometry(0.3, 20, 14), brown); patch.scale.set(0.9, 0.4, 1); patch.position.set(0.12, 0.62, -0.45); bodyG.add(patch);
  const head = new THREE.Group(); head.position.set(0, 0.62, 0.35); bodyG.add(head);
  head.add(mesh(mochiGeo(0.95, 0.78, 0.8, 0.32), white));
  for (const s of [-1, 1]) { const e = mesh(new THREE.SphereGeometry(0.26, 20, 16), brown); e.scale.set(0.55, 1.0, 0.4); e.position.set(s * 0.5, -0.05, 0); e.rotation.z = s * 0.25; head.add(e); }
  const fz = 0.4;
  for (const s of [-1, 1]) { const e = mesh(new THREE.SphereGeometry(0.075, 20, 14), ink()); e.scale.set(0.85, 1.1, 0.5); e.position.set(s * 0.2, 0.08, fz); head.add(e); const hl = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })); hl.position.set(0.02, 0.03, 0.04); e.add(hl); }
  const nose = mesh(new THREE.SphereGeometry(0.06, 16, 12), ink()); nose.scale.set(1.2, 0.8, 0.8); nose.position.set(0, -0.05, fz + 0.02); head.add(nose);
  const tongue = mesh(new THREE.SphereGeometry(0.06, 16, 12), soft(0xff6f8a)); tongue.scale.set(0.9, 1.2, 0.4); tongue.position.set(0, -0.19, fz - 0.01); head.add(tongue);
  for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), new THREE.MeshBasicMaterial({ color: 0xff9fb0, transparent: true, opacity: 0.7 })); b.position.set(s * 0.3, -0.05, fz - 0.02); head.add(b); }
  for (const [x, z] of [[-0.3, 0.45], [0.3, 0.45], [-0.3, -0.7], [0.3, -0.7]]) { const p = mesh(new THREE.SphereGeometry(0.14, 16, 12), white); p.scale.set(1, 0.6, 1.3); p.position.set(x, 0.07, z); root.add(p); }
  const tail = mesh(new THREE.CapsuleGeometry(0.06, 0.2, 6, 10), brown); tail.position.set(0, 0.6, -0.95); tail.rotation.x = -0.8; bodyG.add(tail);
  let sing = 0;
  return {
    root, bodyG, head, top: head, setFace() {}, setSing(v) { sing = v; },
    update(t, { bounce = 1 } = {}) {
      bodyG.position.y = Math.abs(Math.sin(Math.PI * t / BEAT_S)) * 0.04 * bounce;
      head.rotation.z = Math.sin(t * 3) * 0.08; head.rotation.x = -sing * 0.15;
      tail.rotation.z = Math.sin(t * 18) * 0.6;
      tongue.scale.y = 1.2 + sing * 0.6;
    },
  };
}

export const FAMILY = { milo, lumi, pip, mimi, moss, bobo };
