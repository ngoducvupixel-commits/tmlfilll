// The workshop: room, the Machine with its big red button, the DO NOT PRESS sign, a side table, a crate.
import * as THREE from 'three';
import { rbox, box, cyl, sph, tor, cone, at, group, canvasTex, rng } from '../../../engine/kit.js';
import { soft } from '../../../engine/characters/mochi.js';

const M = (c, o) => soft(c, o);
function mesh(geo, m) { const x = new THREE.Mesh(geo, m); x.castShadow = x.receiveShadow = true; return x; }

export function room(scene) {
  const planks = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#d9a46a'; c.fillRect(0, 0, w, h); const r = rng(3);
    for (let y = 0; y < h; y += 64) { c.fillStyle = `hsl(30, 45%, ${58 + r() * 8}%)`; c.fillRect(0, y + 2, w, 60); c.fillStyle = 'rgba(90,50,20,0.35)'; c.fillRect(0, y, w, 3); const x = r() * w; c.fillRect(x, y, 3, 64); }
  });
  planks.wrapS = planks.wrapT = THREE.RepeatWrapping; planks.repeat.set(6, 6);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ map: planks, roughness: 0.75 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  const peg = canvasTex(512, 256, (c, w, h) => {
    c.fillStyle = '#9fd3c7'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(30,70,70,0.25)';
    for (let y = 12; y < h; y += 24) for (let x = 12; x < w; x += 24) { c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); }
  });
  peg.wrapS = peg.wrapT = THREE.RepeatWrapping; peg.repeat.set(5, 2);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), new THREE.MeshStandardMaterial({ map: peg, roughness: 0.9 }));
  wall.position.set(0, 5, -3.2); wall.receiveShadow = true; scene.add(wall);
  scene.add(at(box(30, 0.25, 0.1, M(0xf4efe6)), 0, 0.12, -3.15));

  // window with a soft sky
  const sky = canvasTex(256, 192, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#8fd0ff'); g.addColorStop(1, '#e6f6ff'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; for (const [x, y, r] of [[60, 60, 22], [85, 55, 26], [110, 64, 18], [190, 110, 16], [210, 104, 20]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); } });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.7), new THREE.MeshBasicMaterial({ map: sky, toneMapped: false })); win.position.set(-3.6, 2.6, -3.18); scene.add(win);
  const frameM = M(0xffffff); for (const [w, h, x, y] of [[2.6, 0.1, 0, 0.9], [2.6, 0.1, 0, -0.9], [0.1, 1.8, -1.25, 0], [0.1, 1.8, 1.25, 0], [0.06, 1.7, 0, 0], [2.4, 0.06, 0, 0]]) scene.add(at(box(w, h, 0.08, frameM), -3.6 + x, 2.6 + y, -3.12));

  // shelves with boxes & jars
  const shelf = new THREE.Group(); shelf.position.set(3.4, 0, -2.9); scene.add(shelf);
  const r = rng(11); const cols = [0xff8a2a, 0x5b8cff, 0xffcf33, 0xff8fb3, 0x8fd35a, 0xffffff];
  for (const y of [1.2, 2.1, 3.0]) {
    shelf.add(at(rbox(3.0, 0.08, 0.5, 0.02, M(0xb27a48)), 0, y, 0));
    for (let x = -1.3; x < 1.3; x += 0.45 + r() * 0.2) { const hh = 0.25 + r() * 0.4; shelf.add(r() > 0.5 ? at(rbox(0.35, hh, 0.35, 0.05, M(cols[Math.floor(r() * 6)])), x, y + 0.04 + hh / 2, 0) : at(cyl(0.13, 0.13, hh, M(cols[Math.floor(r() * 6)], { transparent: true, opacity: 0.8 })), x, y + 0.04 + hh / 2, 0)); }
  }
  // hanging lamp
  scene.add(at(cyl(0.01, 0.01, 2.0, 0x333333), 0.3, 5.0, -0.4));
  scene.add(at(cone(0.45, 0.35, M(0xffcf33), 32), 0.3, 3.9, -0.4));
  scene.add(at(sph(0.12, new THREE.MeshBasicMaterial({ color: 0xfff3c0 })), 0.3, 3.75, -0.4));
}

function signTex() {
  return canvasTex(512, 200, (c, w, h) => {
    c.fillStyle = '#ffd400'; c.fillRect(0, 0, w, h);
    c.save(); c.beginPath(); c.rect(0, 0, w, h); c.rect(16, 16, w - 32, h - 32); c.clip('evenodd'); c.fillStyle = '#1c1420';
    for (let x = -h; x < w + h; x += 40) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 20, 0); c.lineTo(x + 20 - h, h); c.lineTo(x - h, h); c.fill(); }
    c.restore();
    c.fillStyle = '#e8202f'; c.font = '700 74px "Fredoka", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('DO NOT PRESS', w / 2, h / 2 + 4);
  });
}

function gaugeTex() {
  return canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(64, 64, 60, 0, 7); c.fill();
    c.strokeStyle = '#1c1420'; c.lineWidth = 3; for (let i = 0; i <= 8; i++) { const a = Math.PI * 0.8 + i / 8 * Math.PI * 1.4; c.beginPath(); c.moveTo(64 + Math.cos(a) * 44, 64 + Math.sin(a) * 44); c.lineTo(64 + Math.cos(a) * 54, 64 + Math.sin(a) * 54); c.stroke(); }
    c.strokeStyle = '#e8202f'; c.lineWidth = 6; c.beginPath(); c.arc(64, 64, 49, Math.PI * 1.85, Math.PI * 2.2); c.stroke();
  });
}

/** the Machine. Returns { group, button world pos, tick(T, {shake, alarm, pressed}) } */
export function machine() {
  const g = new THREE.Group(); const body = new THREE.Group(); g.add(body);
  const shell = M(0x7cc6c0), trim = M(0xf4efe6), dark = M(0x2b3a44, { roughness: 0.4 });
  body.add(at(rbox(2.4, 1.6, 1.3, 0.22, shell), 0, 0.85, 0));
  body.add(at(rbox(2.5, 0.16, 1.4, 0.06, trim), 0, 0.08, 0));
  body.add(at(rbox(2.0, 0.14, 1.1, 0.06, trim), 0, 1.68, 0));
  for (const x of [-1.05, 1.05]) for (const y of [0.3, 1.4]) body.add(at(sph(0.04, M(0xd4a017, { metalness: 0.7, roughness: 0.3 })), x, y, 0.66));
  // slanted control panel with the button
  const panel = new THREE.Group(); panel.position.set(0, 0.95, 0.62); panel.rotation.x = -0.55; body.add(panel);
  panel.add(at(rbox(1.4, 0.75, 0.16, 0.06, trim), 0, 0, 0));
  panel.add(at(cyl(0.36, 0.36, 0.06, M(0x1c1420), 40), 0, 0, 0.1, Math.PI / 2));
  panel.add(at(tor(0.33, 0.03, M(0xffd400)), 0, 0, 0.14));
  const btnMat = new THREE.MeshPhysicalMaterial({ color: 0xe8202f, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05, emissive: 0xff1020, emissiveIntensity: 0 });
  const btn = mesh(new THREE.SphereGeometry(0.28, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), btnMat); btn.rotation.x = Math.PI / 2; btn.scale.set(1, 0.55, 1); btn.position.z = 0.13; panel.add(btn);
  const leds = [0xff4040, 0xffd400, 0x40ff80, 0x40c0ff].map((c, i) => { const m = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: c, emissiveIntensity: 0.3 }); const l = mesh(new THREE.SphereGeometry(0.045, 12, 8), m); l.position.set(-0.55 + i * 0.12 + (i > 1 ? 0.86 : 0), 0.25, 0.09); panel.add(l); return m; });
  // gauges
  const gt = gaugeTex(); const needles = [-0.75, 0.75].map((x) => {
    const gg = new THREE.Group(); gg.position.set(x, 1.3, 0.66); body.add(gg);
    gg.add(at(cyl(0.24, 0.24, 0.06, M(0xd4a017, { metalness: 0.7, roughness: 0.3 }), 32), 0, 0, 0, Math.PI / 2));
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), new THREE.MeshStandardMaterial({ map: gt })); face.position.z = 0.035; gg.add(face);
    const n = new THREE.Group(); n.position.z = 0.04; n.add(at(box(0.02, 0.16, 0.01, M(0xe8202f)), 0, 0.07, 0)); gg.add(n); return n;
  });
  // chimney + coil antenna
  body.add(at(cyl(0.16, 0.2, 0.7, dark), -0.8, 2.05, -0.2)); body.add(at(cyl(0.24, 0.16, 0.12, dark), -0.8, 2.45, -0.2));
  const coil = new THREE.Group(); coil.position.set(0.75, 1.75, -0.2); body.add(coil);
  coil.add(at(cyl(0.03, 0.03, 0.8, M(0xb08040, { metalness: 0.6 })), 0, 0.4, 0));
  for (let i = 0; i < 5; i++) coil.add(at(tor(0.12 - i * 0.012, 0.018, M(0xd4a017, { metalness: 0.8, roughness: 0.3 })), 0, 0.15 + i * 0.12, 0, Math.PI / 2));
  const orbMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x7fe6ff, emissiveIntensity: 0.6 });
  coil.add(at(mesh(new THREE.SphereGeometry(0.11, 20, 14), orbMat), 0, 0.88, 0));
  // sign on a post
  const sign = new THREE.Group(); sign.position.set(0, 1.72, 0.25); body.add(sign);
  sign.add(at(cyl(0.025, 0.025, 0.5, dark), 0, 0.25, 0));
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.49), new THREE.MeshStandardMaterial({ map: signTex(), roughness: 0.6, side: THREE.DoubleSide })); plate.position.set(0, 0.68, 0.02); plate.rotation.x = -0.12; plate.castShadow = true; sign.add(plate);
  sign.add(at(rbox(1.32, 0.56, 0.03, 0.02, M(0x1c1420)), 0, 0.68, -0.01, -0.12));
  // warning lights + steam
  const warn = new THREE.PointLight(0xff3020, 0, 9, 1.5); warn.position.set(0, 2.4, 1.2); g.add(warn);
  const steamM = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, roughness: 1 });
  const steam = Array.from({ length: 8 }, () => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), steamM.clone()); body.add(s); return s; });

  const btnPos = new THREE.Vector3();
  return {
    group: g, body, panel, btn,
    buttonWorld() { g.updateMatrixWorld(true); return btn.getWorldPosition(btnPos); },
    tick(T, { shake = 0, alarm = 0, pressed = 0 } = {}) {
      body.position.set(Math.sin(T * 71) * 0.03 * shake, Math.abs(Math.sin(T * 53)) * 0.04 * shake, Math.sin(T * 61) * 0.02 * shake);
      body.rotation.z = Math.sin(T * 37) * 0.015 * shake;
      btn.position.z = 0.13 - pressed * 0.05; btnMat.emissiveIntensity = pressed * (0.6 + alarm * 0.6 * (Math.sin(T * 30) > 0 ? 1 : 0));
      leds.forEach((m, i) => (m.emissiveIntensity = alarm ? ((Math.floor(T * 10) + i) % 2 ? 3 : 0.1) : 0.3 + 0.2 * Math.sin(T * 2 + i)));
      needles.forEach((n, i) => (n.rotation.z = alarm ? Math.sin(T * (17 + i * 5)) * 2.2 : -0.6 + Math.sin(T * 0.7 + i) * 0.1));
      orbMat.emissiveIntensity = 0.6 + alarm * 3 * Math.abs(Math.sin(T * 25));
      warn.intensity = alarm * (Math.sin(T * 14) > 0 ? 8 : 0);
      steam.forEach((s, i) => { const a = ((T * 1.6 + i / steam.length) % 1); s.visible = alarm > 0; s.position.set(-0.8 + Math.sin(i * 3) * 0.1 * a, 2.5 + a * 1.4, -0.2); s.scale.setScalar(0.4 + a * 1.8); s.material.opacity = 0.8 * (1 - a); });
    },
  };
}

export function sideTable() {
  const g = new THREE.Group(); const wood = M(0xb27a48);
  g.add(at(rbox(1.9, 0.09, 1.1, 0.03, wood), 0, 0.95, 0));
  for (const x of [-0.85, 0.85]) for (const z of [-0.45, 0.45]) g.add(at(rbox(0.08, 0.95, 0.08, 0.02, wood), x, 0.47, z));
  g.add(at(rbox(0.5, 0.3, 0.4, 0.05, M(0xff8a2a)), -0.5, 1.15, 0)); g.add(at(cyl(0.1, 0.1, 0.25, M(0x5b8cff)), 0.4, 1.12, 0.1));
  return g;
}

export function crate() {
  const g = new THREE.Group(); const w = M(0xc8925a);
  g.add(at(rbox(0.6, 0.4, 0.55, 0.04, w), 0, 0.2, 0));
  for (const y of [0.1, 0.3]) g.add(at(box(0.62, 0.04, 0.57, M(0xa87442)), 0, y, 0));
  return g;
}

export function screwdriver(scale = 1) {
  const g = new THREE.Group();
  g.add(at(rbox(0.07, 0.2, 0.07, 0.03, M(0xffcf33)), 0, 0.1, 0));
  g.add(at(cyl(0.012, 0.012, 0.22, M(0xc8ccd6, { metalness: 0.8, roughness: 0.25 })), 0, 0.31, 0));
  g.scale.setScalar(scale); return g;
}
