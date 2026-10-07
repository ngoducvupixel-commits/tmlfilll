// "Pip" — an original mascot: a chunky periwinkle robot with a face-screen,
// a bobbling antenna, stubby arms and two little feet. Plus its accessories.
import * as THREE from 'three';
import { rbox, box, cyl, sph, tor, cone, at, group, mat, glow, canvasTex, texMat } from './kit.js';

export const PIP_BLUE = 0x7f8cff;
const PIP_DARK = 0x5561d6;
const SCREEN = 0x161a33;

export function makePip({ color = PIP_BLUE, eye = 0x7ff6ff } = {}) {
  const root = new THREE.Group();
  const bodyG = new THREE.Group(); root.add(bodyG);

  const body = at(rbox(1.3, 1.0, 0.95, 0.2, color), 0, 0.8, 0); bodyG.add(body);
  const screen = at(rbox(1.0, 0.56, 0.12, 0.1, SCREEN, { roughness: 0.2, metalness: 0.1 }), 0, 0.84, 0.44); bodyG.add(screen);
  // little belly bolts
  for (const x of [-0.42, 0.42]) bodyG.add(at(cyl(0.035, 0.035, 0.04, 0xd9dcff, {}, 12), x, 0.42, 0.48, Math.PI / 2));

  // eyes: several shapes, one visible at a time
  const eyeMat = glow(eye, 2.2);
  const eyes = new THREE.Group(); eyes.position.set(0, 0.86, 0.51); bodyG.add(eyes);
  const shapes = {};
  const mk = (name, factory) => {
    const g = new THREE.Group();
    for (const s of [-1, 1]) { const m = factory(s); m.material = eyeMat; m.castShadow = false; g.add(m); }
    shapes[name] = g; eyes.add(g); g.visible = false;
  };
  mk('open', (s) => at(rbox(0.13, 0.22, 0.03, 0.06, eyeMat), s * 0.2, 0, 0));
  mk('wide', (s) => at(rbox(0.18, 0.26, 0.03, 0.08, eyeMat), s * 0.21, 0.01, 0));
  mk('happy', (s) => at(tor(0.08, 0.025, eyeMat, {}, Math.PI), s * 0.2, -0.04, 0));
  mk('flat', (s) => at(rbox(0.2, 0.05, 0.03, 0.02, eyeMat), s * 0.2, 0, 0));
  mk('angry', (s) => at(rbox(0.2, 0.06, 0.03, 0.02, eyeMat), s * 0.2, 0.01, 0, 0, 0, -s * 0.35));
  mk('sad', (s) => at(rbox(0.2, 0.06, 0.03, 0.02, eyeMat), s * 0.2, 0.01, 0, 0, 0, s * 0.35));
  mk('wink', (s) => (s < 0 ? at(tor(0.08, 0.025, eyeMat, {}, Math.PI), -0.2, -0.04, 0) : at(rbox(0.13, 0.22, 0.03, 0.06, eyeMat), 0.2, 0, 0)));
  // cheeks
  for (const s of [-1, 1]) {
    const c = at(new THREE.Mesh(new THREE.CircleGeometry(0.05, 20), new THREE.MeshBasicMaterial({ color: 0xff7aa8, transparent: true, opacity: 0.85 })), s * 0.36, 0.72, 0.505);
    bodyG.add(c);
  }

  // antenna
  const antenna = new THREE.Group(); antenna.position.set(0.42, 1.28, -0.1); bodyG.add(antenna);
  antenna.add(at(cyl(0.025, 0.025, 0.32, 0x9aa3b8, { metalness: 0.6, roughness: 0.3 }), 0, 0.16, 0));
  const bulb = at(sph(0.075, glow(0xffb547, 2.5)), 0, 0.34, 0); antenna.add(bulb);

  // arms
  const mkArm = (s) => {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.68, 0.92, 0.02);
    pivot.add(at(rbox(0.2, 0.42, 0.24, 0.09, color), s * 0.06, -0.17, 0));
    const hand = new THREE.Group(); hand.position.set(s * 0.06, -0.38, 0.02);
    hand.add(sph(0.11, PIP_DARK)); pivot.add(hand);
    pivot.hand = hand; bodyG.add(pivot); return pivot;
  };
  const armL = mkArm(-1), armR = mkArm(1);

  // legs
  for (const s of [-1, 1]) {
    root.add(at(cyl(0.09, 0.1, 0.3, PIP_DARK), s * 0.32, 0.2, 0));
    root.add(at(rbox(0.3, 0.12, 0.38, 0.05, 0x3a4196), s * 0.32, 0.06, 0.05));
  }

  const hatAnchor = new THREE.Group(); hatAnchor.position.set(0, 1.3, 0); bodyG.add(hatAnchor);
  const faceAnchor = new THREE.Group(); faceAnchor.position.set(0, 0.86, 0.56); bodyG.add(faceAnchor);
  const waistAnchor = new THREE.Group(); waistAnchor.position.set(0, 0.5, 0); bodyG.add(waistAnchor);

  let forced = null;
  const pip = {
    root, bodyG, armL, armR, eyes, antenna, bulb, eyeMat, hatAnchor, faceAnchor, waistAnchor,
    setEyes(name) { forced = name; },
    setEyeColor(c, k = 2.2) { eyeMat.emissive.set(c); eyeMat.emissiveIntensity = k; },
    update(t, { bob = 1, blink = true, arms = true } = {}) {
      bodyG.position.y = Math.abs(Math.sin(t * 4)) * 0.035 * bob;
      bodyG.scale.set(1 + Math.sin(t * 8) * 0.008 * bob, 1 - Math.sin(t * 8) * 0.008 * bob, 1);
      antenna.rotation.z = Math.sin(t * 6) * 0.18;
      if (arms) { armL.rotation.z = -0.15 + Math.sin(t * 3) * 0.05; armR.rotation.z = 0.15 - Math.sin(t * 3) * 0.05; }
      let name = forced || 'open';
      if (blink && (name === 'open' || name === 'wide') && (t % 2.7) > 2.58) name = 'flat';
      for (const k in shapes) shapes[k].visible = k === name;
    },
  };
  pip.update(0);
  return pip;
}

// ---------------- accessories ----------------
export function headphones(color = 0xf4f4f8, cup = 0x2b2f4a) {
  const g = new THREE.Group();
  const band = tor(0.74, 0.05, color, {}, Math.PI); band.position.y = -0.42; g.add(band);
  for (const s of [-1, 1]) {
    g.add(at(cyl(0.2, 0.2, 0.12, cup, {}, 24), s * 0.72, -0.42, 0, 0, 0, Math.PI / 2));
    g.add(at(cyl(0.16, 0.16, 0.13, 0x8ef0d0, { emissive: 0x2fd3a5, emissiveIntensity: 0.4 }, 24), s * 0.73, -0.42, 0, 0, 0, Math.PI / 2));
  }
  return g;
}

export function hoodie(color = 0x5b4bc4) {
  const tex = canvasTex(256, 128, (c, w, h) => {
    c.fillStyle = '#' + new THREE.Color(color).getHexString(); c.fillRect(0, 0, w, h);
    c.strokeStyle = '#fff'; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(108, 40); c.lineTo(88, 64); c.lineTo(108, 88); c.moveTo(148, 40); c.lineTo(168, 64); c.lineTo(148, 88);
    c.moveTo(136, 36); c.lineTo(120, 92); c.stroke();
  });
  const g = new THREE.Group();
  const shell = rbox(1.38, 0.5, 1.03, 0.16, color); shell.position.y = -0.04; g.add(shell);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), texMat(tex)); front.position.set(0, -0.04, 0.52); g.add(front);
  for (const s of [-1, 1]) g.add(at(cyl(0.012, 0.012, 0.2, 0xffffff), s * 0.12, 0.12, 0.53));
  return g;
}

export function quill(color = 0xfdf7ee) {
  const g = new THREE.Group();
  const vane = sph(0.12, color, { roughness: 0.9 }); vane.scale.set(0.5, 3.2, 0.12); vane.position.y = 0.38; g.add(vane);
  g.add(at(cyl(0.012, 0.008, 0.85, 0xe8dcc4), 0, 0.3, 0));
  g.add(at(cone(0.02, 0.08, 0x222222), 0, -0.14, 0, Math.PI));
  return g;
}

export function writerCap() {
  const g = new THREE.Group();
  const cap = sph(0.62, 0x9c2c4c, { roughness: 0.85 }); cap.scale.set(1, 0.32, 0.92); cap.position.y = 0.06; g.add(cap);
  g.add(at(cyl(0.06, 0.06, 0.06, 0x7a1f3a), 0, 0.26, 0));
  const q = quill(); q.scale.setScalar(0.8); at(q, 0.4, 0.15, -0.1, 0, 0, -0.5); g.add(q);
  return g;
}

export function mortarboard() {
  const g = new THREE.Group();
  g.add(at(cyl(0.48, 0.5, 0.22, 0x2f3340), 0, 0.1, 0));
  g.add(at(box(1.15, 0.05, 1.15, 0x3a3f4f), 0, 0.23, 0, 0, Math.PI / 4));
  g.add(at(sph(0.05, 0xd8a531), 0, 0.27, 0));
  const tassel = new THREE.Group(); tassel.position.set(0, 0.27, 0);
  tassel.add(at(cyl(0.012, 0.012, 0.55, 0xd8a531), 0.27, -0.01, 0, 0, 0, Math.PI / 2));
  tassel.add(at(cyl(0.035, 0.05, 0.22, 0xd8a531), 0.55, -0.12, 0));
  g.add(tassel); g.tassel = tassel;
  return g;
}

export function roundGlasses(rim = 0x2a2420) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    g.add(at(tor(0.15, 0.025, rim), s * 0.2, 0, 0));
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.15, 32), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, roughness: 0.05 }));
    lens.position.set(s * 0.2, 0, 0); g.add(lens);
  }
  g.add(at(tor(0.05, 0.018, rim, {}, Math.PI), 0, 0.03, 0));
  return g;
}

export function plaidTex(base = '#c9a46c') {
  return canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = base; c.fillRect(0, 0, w, h);
    c.globalAlpha = 0.35; c.fillStyle = '#7a4a24';
    for (let i = 0; i < w; i += 32) { c.fillRect(i, 0, 10, h); c.fillRect(0, i, w, 10); }
    c.globalAlpha = 0.5; c.fillStyle = '#b5302a';
    for (let i = 16; i < w; i += 32) { c.fillRect(i, 0, 2, h); c.fillRect(0, i, w, 2); }
    c.globalAlpha = 1;
  });
}

export function detectiveCap() {
  const tex = plaidTex();
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2, 2);
  const m = texMat(tex, { roughness: 0.9 });
  const g = new THREE.Group();
  const dome = sph(0.6, m); dome.scale.set(1.08, 0.5, 0.95); dome.position.y = 0.04; g.add(dome);
  g.add(at(box(0.85, 0.04, 0.35, m), 0, 0.0, 0.62, -0.25));
  g.add(at(box(0.85, 0.04, 0.3, m), 0, 0.0, -0.6, 0.25));
  for (const s of [-1, 1]) g.add(at(box(0.05, 0.3, 0.42, m), s * 0.63, -0.1, 0, 0, 0, s * 0.15));
  g.add(at(sph(0.05, 0x7a4a24), 0, 0.33, 0));
  return g;
}

export function magnifier() {
  const g = new THREE.Group();
  g.add(at(tor(0.2, 0.035, 0xd4a017, { metalness: 0.8, roughness: 0.25 }), 0, 0.3, 0));
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), new THREE.MeshStandardMaterial({ color: 0xcff6ff, transparent: true, opacity: 0.3, roughness: 0 }));
  lens.position.y = 0.3; g.add(lens);
  g.add(at(cyl(0.035, 0.04, 0.35, 0x5a3418), 0, -0.05, 0));
  return g;
}

export function goggles() {
  const g = new THREE.Group();
  g.add(at(box(1.34, 0.1, 0.98, 0x5a3a1e), 0, 0, 0));
  for (const s of [-1, 1]) {
    g.add(at(cyl(0.16, 0.16, 0.12, 0xc89b3c, { metalness: 0.8, roughness: 0.3 }), s * 0.22, 0.04, 0.5, Math.PI / 2));
    g.add(at(cyl(0.12, 0.12, 0.13, 0x9ff3ff, { emissive: 0x3ad7ff, emissiveIntensity: 0.6, roughness: 0.05 }), s * 0.22, 0.04, 0.51, Math.PI / 2));
  }
  return g;
}

export function labCoat() {
  const g = new THREE.Group();
  g.add(at(rbox(1.38, 0.55, 1.02, 0.16, 0xf6f6f2), 0, -0.02, 0));
  g.add(at(box(0.08, 0.3, 0.02, 0xd8343c), 0, 0.02, 0.52));
  g.add(at(cone(0.07, 0.12, 0xd8343c, {}, 4), 0, -0.18, 0.52, Math.PI));
  for (const s of [-1, 1]) g.add(at(box(0.04, 0.5, 0.02, 0xdcdcd4), s * 0.16, -0.02, 0.52));
  g.add(at(box(0.18, 0.12, 0.02, 0xe2e2da), 0.38, 0.06, 0.52));
  for (let i = 0; i < 3; i++) g.add(at(box(0.02, 0.11, 0.02, [0xd8343c, 0x2d6bff, 0x222][i]), 0.33 + i * 0.05, 0.1, 0.535));
  return g;
}

export function beret(color = 0x2b2b30) {
  const g = new THREE.Group();
  const b = sph(0.6, color, { roughness: 0.95 }); b.scale.set(1.12, 0.3, 1); b.position.set(-0.08, 0.05, 0); b.rotation.z = 0.12; g.add(b);
  g.add(at(cyl(0.025, 0.035, 0.1, color), -0.08, 0.25, 0));
  return g;
}

export function stripes() {
  const tex = canvasTex(64, 64, (c, w, h) => {
    c.fillStyle = '#f7f4ec'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#26324f'; for (let y = 4; y < h; y += 16) c.fillRect(0, y, w, 7);
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(4, 2);
  const g = new THREE.Group();
  g.add(at(rbox(1.36, 0.5, 1.0, 0.16, texMat(tex)), 0, -0.03, 0));
  g.add(at(box(0.9, 0.4, 0.02, 0xf2e3c2), 0, -0.06, 0.51)); // apron
  for (const [x, c] of [[-0.2, 0xff4d8d], [0.05, 0x3aa0ff], [0.22, 0xffc23d]]) g.add(at(sph(0.04, c), x, -0.1 + x * 0.2, 0.525));
  return g;
}

export function palette() {
  const g = new THREE.Group();
  const p = cyl(0.3, 0.3, 0.03, 0xd9a86c, {}, 32); p.scale.set(1, 1, 0.75); p.rotation.x = Math.PI / 2; g.add(p);
  const cols = [0xff4d8d, 0xffc23d, 0x3aa0ff, 0x41d18a, 0x9b5cff];
  cols.forEach((c, i) => { const a = (i / cols.length) * Math.PI * 1.4 + 0.3; g.add(at(sph(0.05, c), Math.cos(a) * 0.19, Math.sin(a) * 0.14, 0.03)); });
  return g;
}

export function brush(tip = 0xff4d8d) {
  const g = new THREE.Group();
  g.add(at(cyl(0.018, 0.022, 0.6, 0x8a5a2b), 0, 0, 0));
  g.add(at(cyl(0.024, 0.024, 0.06, 0xc0c0c8, { metalness: 0.7 }), 0, 0.32, 0));
  g.add(at(cone(0.03, 0.1, tip), 0, 0.4, 0));
  return g;
}
