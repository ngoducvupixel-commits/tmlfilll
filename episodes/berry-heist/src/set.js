// Corridor (z > 0) → automatic glass door (z = 0) → Lumi's lab (z < 0), plus every prop the heist needs.
import * as THREE from 'three';
import { rbox, box, cyl, sph, tor, cone, at, group, canvasTex, rng } from '../../../engine/kit.js';
import { soft } from '../../../engine/characters/mochi.js';
import { berryMochi } from '../../../engine/characters/accessories.js';

const M = (c, o) => soft(c, o);
function mesh(geo, m) { const x = new THREE.Mesh(geo, m); x.castShadow = x.receiveShadow = true; return x; }
const label = (w, h, draw, o = {}) => { const t = canvasTex(w, h, draw); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.7, ...o }); };

export function buildSet(scene) {
  const S = {};
  // floors
  const tiles = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#e9e4f2'; c.fillRect(0, 0, w, h); c.strokeStyle = '#cfc6de'; c.lineWidth = 4; for (let i = 0; i <= w; i += 64) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, h); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); } });
  tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(10, 10);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.6 }));
  floor.rotation.x = -Math.PI / 2; floor.position.z = 2; floor.receiveShadow = true; scene.add(floor);

  const wallM = M(0xbcd7f2, { clearcoat: 0, sheen: 0, roughness: 0.9 }), labWallM = M(0xf3e6f7, { clearcoat: 0, sheen: 0, roughness: 0.9 });
  // corridor walls (left full, right ends at z = 5 where a side corridor opens: the "corner")
  scene.add(at(box(0.2, 3.2, 9, wallM), -2.3, 1.6, 4.5));
  scene.add(at(box(0.2, 3.2, 3.6, wallM), 2.3, 1.6, 1.8));
  scene.add(at(box(2.2, 3.2, 0.2, wallM), 3.4, 1.6, 3.7));          // the corner block
  // little indicator lights along the corridor
  S.indicators = [];
  for (let z = 0.8; z < 8.5; z += 1.1) for (const [x, c] of [[-2.19, 0x5ff2ff], [2.19, 0xff6fb0]]) {
    if (x > 0 && z > 3.5) continue;
    const m = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: c, emissiveIntensity: 2 });
    const l = mesh(new THREE.SphereGeometry(0.04, 10, 8), m); l.position.set(x, 0.45, z); scene.add(l); S.indicators.push(m);
  }
  // front wall with the door opening (x -1.1..1.1, h 2.4)
  scene.add(at(box(5.2, 3.2, 0.2, labWallM), -3.7, 1.6, 0)); scene.add(at(box(5.2, 3.2, 0.2, labWallM), 3.7, 1.6, 0));
  scene.add(at(box(2.2, 0.8, 0.2, labWallM), 0, 2.8, 0));
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xcfefff, transparent: true, opacity: 0.25, roughness: 0.05, clearcoat: 1 });
  S.doorL = group(at(box(1.1, 2.4, 0.06, glass), 0, 0, 0), at(box(1.1, 0.08, 0.08, M(0x9aa4b8)), 0, 1.16, 0), at(box(0.06, 2.4, 0.08, M(0x9aa4b8)), -0.52, 0, 0));
  S.doorR = group(at(box(1.1, 2.4, 0.06, glass), 0, 0, 0), at(box(1.1, 0.08, 0.08, M(0x9aa4b8)), 0, 1.16, 0), at(box(0.06, 2.4, 0.08, M(0x9aa4b8)), 0.52, 0, 0));
  S.doorL.position.set(-0.55, 1.2, 0); S.doorR.position.set(0.55, 1.2, 0); scene.add(S.doorL, S.doorR);
  S.doorLamp = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x5fff9a, emissiveIntensity: 0.5 });
  scene.add(at(mesh(new THREE.SphereGeometry(0.06, 12, 8), S.doorLamp), 0, 2.6, 0.12));
  S.labSign = label(256, 64, (c, w, h) => { c.fillStyle = '#5b8cff'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = '700 34px Fredoka, sans-serif'; c.textAlign = 'center'; c.fillText("LUMI'S LAB", w / 2, 44); });
  scene.add(at(new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), S.labSign), 0, 2.85, 0.11));

  // lab walls
  scene.add(at(box(11, 3.4, 0.2, labWallM), 0, 1.7, -6.2));
  scene.add(at(box(0.2, 3.4, 6.2, labWallM), -5.4, 1.7, -3.1)); scene.add(at(box(0.2, 3.4, 6.2, labWallM), 5.4, 1.7, -3.1));
  S.ceilingPanels = [];
  for (const x of [-2.4, 0, 2.4]) { const m = new THREE.MeshStandardMaterial({ color: 0xdddddd, emissive: 0xfff8ee, emissiveIntensity: 0 }); const p = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.6), m); p.rotation.x = Math.PI / 2; p.position.set(x, 3.39, -3); scene.add(p); S.ceilingPanels.push(m); }

  // ---- the fridge (glass door, interior light, the Berry Mochi)
  const fr = new THREE.Group(); fr.position.set(0, 0, -4.6); scene.add(fr); S.fridge = fr;
  fr.add(at(rbox(1.15, 1.45, 0.9, 0.12, M(0xfdfdff)), 0, 0.73, 0));
  fr.add(at(box(0.95, 1.2, 0.05, M(0xffeef6, { emissive: 0xffd6ea, emissiveIntensity: 0.4 })), 0, 0.78, -0.38));
  fr.add(at(box(0.95, 0.03, 0.7, M(0xffffff, { transparent: true, opacity: 0.6 })), 0, 0.72, 0));
  S.plate = group(at(cyl(0.2, 0.17, 0.03, M(0x8fc8ff), 28), 0, 0, 0), at(tor(0.19, 0.012, M(0xff8fb3)), 0, 0.016, 0, Math.PI / 2)); S.plate.position.set(0, 0.76, 0.05); fr.add(S.plate);
  S.mochi = berryMochi(); S.mochi.position.set(0, 0.79, 0.05); fr.add(S.mochi);
  S.fridgeLight = new THREE.PointLight(0xffc4e0, 2.5, 4, 1.6); S.fridgeLight.position.set(0, 1.2, 0.2); fr.add(S.fridgeLight);
  const door = new THREE.Group(); door.position.set(-0.55, 0.78, 0.46); fr.add(door); S.fridgeDoor = door;
  door.add(at(box(1.08, 1.3, 0.05, new THREE.MeshPhysicalMaterial({ color: 0xe8f7ff, transparent: true, opacity: 0.3, roughness: 0.05, clearcoat: 1 })), 0.55, 0, 0));
  door.add(at(box(1.1, 0.08, 0.07, M(0xd8dde8)), 0.55, 0.65, 0)); door.add(at(box(1.1, 0.08, 0.07, M(0xd8dde8)), 0.55, -0.65, 0));
  door.add(at(box(0.08, 1.3, 0.07, M(0xd8dde8)), 1.06, 0, 0)); door.add(at(box(0.08, 1.3, 0.07, M(0xd8dde8)), 0.04, 0, 0));
  // electronic lock on the door's right edge + the tiny OPEN button at the bottom of the fridge
  S.lockLed = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xff3040, emissiveIntensity: 2 });
  door.add(at(rbox(0.16, 0.26, 0.06, 0.02, M(0x2b3a44)), 0.92, 0.0, 0.05)); door.add(at(mesh(new THREE.SphereGeometry(0.025, 8, 6), S.lockLed), 0.92, 0.09, 0.09));
  const openTex = label(128, 64, (c, w, h) => { c.fillStyle = '#3cc46a'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = '700 34px Fredoka, sans-serif'; c.textAlign = 'center'; c.fillText('OPEN', w / 2, 44); });
  S.openBtn = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.04), [M(0x3cc46a), M(0x3cc46a), M(0x3cc46a), M(0x3cc46a), openTex, M(0x3cc46a)]);
  S.openBtn.position.set(0.32, 0.1, 0.47); fr.add(S.openBtn);
  // the (empty) shelf above the fridge
  scene.add(at(rbox(1.6, 0.06, 0.4, 0.02, M(0xc8925a)), 0, 2.15, -5.95));

  // ---- the drawer cabinet with ~30 more Berry Mochi
  const cab = new THREE.Group(); cab.position.set(-1.55, 0, -4.7); scene.add(cab); S.cabinet = cab;
  cab.add(at(rbox(1.3, 1.0, 0.8, 0.06, M(0xc8d6ff)), 0, 0.5, 0));
  const drw = new THREE.Group(); drw.position.set(0, 0.45, 0.02); cab.add(drw); S.drawer = drw;
  drw.add(at(rbox(1.16, 0.4, 0.04, 0.03, M(0xdfe7ff)), 0, 0, 0.4)); drw.add(at(rbox(0.3, 0.05, 0.05, 0.02, M(0x8090c0)), 0, 0.05, 0.44));
  drw.add(at(box(1.1, 0.03, 0.75, M(0xffffff)), 0, -0.17, 0.02));
  const many = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 14, 10), M(0xffb3cf, { clearcoat: 0.6 }), 30);
  const berries = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 10, 8), M(0xe8102f, { clearcoat: 1, roughness: 0.2 }), 30);
  const d = new THREE.Object3D();
  for (let i = 0; i < 30; i++) { const x = -0.45 + (i % 6) * 0.18, z = -0.25 + Math.floor(i / 6) * 0.13; d.position.set(x, -0.1, z); d.scale.set(1, 0.75, 1); d.updateMatrix(); many.setMatrixAt(i, d.matrix); d.position.y = -0.05; d.scale.setScalar(1); d.updateMatrix(); berries.setMatrixAt(i, d.matrix); }
  drw.add(many, berries); S.drawerGlow = new THREE.PointLight(0xffd0e6, 0, 2.5, 1.5); S.drawerGlow.position.set(0, 0.4, 0.4); drw.add(S.drawerGlow);

  // ---- desk with papers + lamp, trash bin, the very nice chair, the far-too-small plant, a pen on the floor
  const desk = new THREE.Group(); desk.position.set(3.0, 0, -3.2); scene.add(desk); S.desk = desk;
  desk.add(at(rbox(2.0, 0.08, 1.0, 0.03, M(0xffffff)), 0, 0.85, 0));
  for (const x of [-0.9, 0.9]) for (const z of [-0.4, 0.4]) desk.add(at(cyl(0.035, 0.035, 0.85, M(0x9aa4b8)), x, 0.42, z));
  for (let i = 0; i < 4; i++) desk.add(at(box(0.42, 0.03, 0.3, M(0xffffff)), -0.5 + i * 0.05, 0.9 + i * 0.03, 0.05, 0, i * 0.2, 0));
  S.lamp = group(at(cyl(0.12, 0.14, 0.04, M(0x5b8cff)), 0, 0, 0), at(cyl(0.02, 0.02, 0.4, M(0x5b8cff)), 0, 0.2, 0), at(cone(0.22, 0.25, M(0xffcf33), 28), 0, 0.45, 0));
  S.lamp.position.set(0.6, 0.89, -0.2); desk.add(S.lamp);
  S.bin = group(at(cyl(0.3, 0.24, 0.6, M(0x7f8cff, { transparent: true, opacity: 0.95 }), 24), 0, 0.3, 0), at(tor(0.3, 0.03, M(0x5561d6)), 0, 0.6, 0, Math.PI / 2));
  S.bin.position.set(4.4, 0, -1.8); scene.add(S.bin);
  const chair = new THREE.Group(); chair.position.set(-1.0, 0, -2.0); chair.rotation.y = 0.3; scene.add(chair); S.chair = chair;
  chair.add(at(rbox(0.6, 0.1, 0.6, 0.05, M(0xff8fb3)), 0, 0.48, 0)); chair.add(at(rbox(0.6, 0.6, 0.1, 0.05, M(0xff8fb3)), 0, 0.82, -0.27));
  for (const x of [-0.25, 0.25]) for (const z of [-0.25, 0.25]) chair.add(at(cyl(0.025, 0.02, 0.45, M(0xd4a017, { metalness: 0.7 })), x, 0.22, z));
  const plant = new THREE.Group(); plant.position.set(-2.9, 0, -1.4); scene.add(plant); S.plant = plant;
  plant.add(at(cyl(0.12, 0.09, 0.18, M(0xd2693c)), 0, 0.09, 0));
  for (let i = 0; i < 5; i++) { const l = sph(0.1, M(0x48b53a)); l.scale.set(1, 0.4, 0.6); l.position.set(Math.cos(i * 1.3) * 0.08, 0.28 + i * 0.03, Math.sin(i * 1.3) * 0.08); l.rotation.z = i; plant.add(l); }
  S.pen = group(at(cyl(0.02, 0.02, 0.32, M(0x3a8cff)), 0, 0, 0), at(cone(0.02, 0.05, M(0x222222)), 0, -0.18, 0, Math.PI));
  S.pen.rotation.set(0, 0.6, Math.PI / 2); S.pen.position.set(-0.2, 0.02, -1.0); scene.add(S.pen);
  // flying papers (slow-mo) & paper cloud (crash)
  const paperTex = canvasTex(64, 80, (c, w, h) => { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.fillStyle = '#b9b2cc'; for (let y = 10; y < h - 6; y += 8) c.fillRect(6, y, 34 + (y * 7) % 18, 2); });
  S.papers = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.22, 0.28), new THREE.MeshStandardMaterial({ map: paperTex, side: THREE.DoubleSide, roughness: 0.8 }), 60);
  S.papers.castShadow = true; scene.add(S.papers);
  return S;
}


// ---- spy gear & gag props

export function laser9000() {
  const g = new THREE.Group(); const body = new THREE.Group(); g.add(body);
  body.add(at(rbox(0.7, 0.5, 0.45, 0.08, M(0x9aa4b8, { metalness: 0.3 })), 0, 0, 0));
  for (const [x, r] of [[-0.18, 0.2], [0.15, -0.3]]) body.add(at(box(0.75, 0.07, 0.47, M(0xc8c0a0, { roughness: 0.9 })), x * 0.2, x, 0, 0, 0, r)); // tape
  const lbl = label(256, 96, (c, w, h) => { c.fillStyle = '#f4f1e8'; c.fillRect(0, 0, w, h); c.fillStyle = '#1c1420'; c.font = '700 44px "Fredoka", sans-serif'; c.save(); c.translate(w / 2, h / 2 + 14); c.rotate(-0.06); c.textAlign = 'center'; c.fillText('LASER 9000', 0, 0); c.restore(); });
  body.add(at(new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.2), lbl), 0, 0.02, 0.23));
  const bulbM = new THREE.MeshStandardMaterial({ color: 0x220000, emissive: 0xff2020, emissiveIntensity: 0.5 });
  body.add(at(mesh(new THREE.SphereGeometry(0.09, 16, 12), bulbM), 0.2, 0.3, 0));
  body.add(at(cyl(0.05, 0.06, 0.1, M(0x666670)), 0.2, 0.24, 0));
  const wires = [[[-0.3, 0.2, 0.2], [-0.5, 0.45, 0.1], [-0.35, 0.6, -0.1], [-0.1, 0.3, -0.2]], [[0.3, -0.1, 0.22], [0.55, 0.1, 0.1], [0.5, 0.35, -0.1]], [[0, 0.25, 0.1], [0.1, 0.5, 0.2], [-0.15, 0.55, 0]]];
  wires.forEach((p, i) => body.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p.map((v) => new THREE.Vector3(...v))), 20, 0.015, 6), M([0xff4040, 0x3a8cff, 0xffd23f][i]))));
  // spring + toy hand (hidden until POP)
  const springG = new THREE.Group(); springG.position.set(0, 0, 0.23); g.add(springG);
  const pts = []; for (let i = 0; i <= 120; i++) { const a = i / 120 * Math.PI * 16; pts.push(new THREE.Vector3(Math.cos(a) * 0.06, Math.sin(a) * 0.06, i / 120)); }
  const spring = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, 0.012, 6), M(0xc8ccd6, { metalness: 0.8, roughness: 0.25 })); springG.add(spring);
  const hand = new THREE.Group(); hand.add(at(rbox(0.22, 0.26, 0.06, 0.05, M(0xff6f8a)), 0, 0, 0));
  for (let i = 0; i < 4; i++) hand.add(at(mesh(new THREE.CapsuleGeometry(0.025, 0.09, 4, 8), M(0xff6f8a)), -0.075 + i * 0.05, 0.18, 0));
  hand.add(at(mesh(new THREE.CapsuleGeometry(0.025, 0.08, 4, 8), M(0xff6f8a)), -0.13, 0.02, 0, 0, 0, 0.9));
  springG.add(hand);
  g.springG = springG; g.spring = spring; g.hand = hand; g.bulb = bulbM; g.body = body;
  g.setSpring = (len) => { springG.visible = len > 0.01; spring.scale.set(1, 1, Math.max(0.01, len)); hand.position.z = len; };
  g.setSpring(0);
  return g;
}

export function sparks(n = 24) {
  const m = new THREE.InstancedMesh(new THREE.SphereGeometry(0.025, 6, 4), new THREE.MeshBasicMaterial({ color: 0xfff2a0, toneMapped: false }), n);
  const d = new THREE.Object3D();
  m.tick = (t, on, origin) => { for (let i = 0; i < n; i++) { const a = ((t * 3 + i / n) % 1); const ang = i * 2.39; d.position.set(origin.x + Math.cos(ang) * a * 0.6, origin.y + a * 0.5 - a * a * 0.6, origin.z + Math.sin(ang) * a * 0.6); d.scale.setScalar(on ? 1 - a : 0.0001); d.updateMatrix(); m.setMatrixAt(i, d.matrix); } m.instanceMatrix.needsUpdate = true; };
  return m;
}

export function handprint() {
  const tex = canvasTex(128, 128, (c) => { c.fillStyle = 'rgba(232,32,60,0.85)'; c.beginPath(); c.ellipse(64, 78, 30, 34, 0, 0, 7); c.fill(); for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(36 + i * 19, 30, 8, 22, (i - 1.5) * 0.15, 0, 7); c.fill(); } c.beginPath(); c.ellipse(24, 70, 8, 18, 0.9, 0, 7); c.fill(); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  return m;
}

export function stolenBag() {
  const g = new THREE.Group();
  const lbl = label(256, 160, (c, w, h) => { c.fillStyle = '#d9b07a'; c.fillRect(0, 0, w, h); c.fillStyle = '#4a2a1a'; c.font = '700 36px "Fredoka", sans-serif'; c.textAlign = 'center'; c.fillText('DEFINITELY', w / 2, 66); c.fillText('NOT STOLEN', w / 2, 112); });
  g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 0.28), [M(0xd9b07a), M(0xd9b07a), M(0xd9b07a), M(0xd9b07a), lbl, M(0xd9b07a)]), 0, 0, 0));
  g.add(at(tor(0.13, 0.02, M(0x8a5a32), {}, Math.PI), 0, 0.21, 0));
  return g;
}

export function lampshade() { return group(at(cone(0.5, 0.45, M(0xffcf33), 32), 0, 0.18, 0), at(tor(0.48, 0.03, M(0xe8a800)), 0, -0.04, 0, Math.PI / 2)); }
export function paperWrap() {
  const t = canvasTex(128, 64, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = '#c9c2da'; for (let y = 6; y < h; y += 9) c.fillRect(8, y, 60 + (y * 13) % 40, 3); });
  t.wrapS = THREE.RepeatWrapping; t.repeat.set(3, 1);
  return mesh(new THREE.CylinderGeometry(0.72, 0.7, 0.75, 32, 1, true), new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 0.8 }));
}
