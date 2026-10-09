// Sunny pastel living room (after the channel key art): window with sky & trees, corkboard with
// heart/star notes, rainbow picture, bookshelf, sofa, rug, plants, bunting, balloons — plus party props.
import * as THREE from 'three';
import { rbox, box, cyl, sph, tor, cone, at, group, canvasTex, rng } from '../../../engine/kit.js';
import { soft } from '../../../engine/characters/mochi.js';

const M = (c, o) => soft(c, o);
const matte = (c, o) => soft(c, { roughness: 0.85, clearcoat: 0, sheen: 0, iridescence: 0, ...o });
function mesh(geo, m, shadow = true) { const x = new THREE.Mesh(geo, m); x.castShadow = shadow; x.receiveShadow = true; return x; }
const label = (w, h, draw) => new THREE.MeshStandardMaterial({ map: canvasTex(w, h, draw), roughness: 0.8 });
const FONT = '700 {S}px "Fredoka", sans-serif';

export const ROOM = { back: -4.5, left: -5.5, right: 5.5 };

export function buildRoom(scene) {
  const S = {};
  // floor: glossy pastel tiles (the key art's shiny floor)
  const tiles = canvasTex(512, 512, (c, w, h) => { c.fillStyle = '#f4e4f7'; c.fillRect(0, 0, w, h); c.strokeStyle = '#e2cdea'; c.lineWidth = 6; for (let i = 0; i <= w; i += 128) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, h); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); } });
  tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(6, 6);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.MeshPhysicalMaterial({ map: tiles, roughness: 0.18, clearcoat: 0.8, clearcoatRoughness: 0.1 }));
  floor.rotation.x = -Math.PI / 2; floor.position.z = 2; floor.receiveShadow = true; scene.add(floor);

  // walls: pink with lighter wainscoting
  const wall = matte(0xf7c6d6), wains = matte(0xfbdbe5), trim = matte(0xffffff);
  const wallMesh = (w, h, x, y, z, ry = 0) => { const m = mesh(new THREE.PlaneGeometry(w, h), wall, false); at(m, x, y, z, 0, ry); scene.add(m); return m; };
  // back wall with a window hole (x -4.4..-2.0, y 1.3..3.3)
  wallMesh(7.0, 4.5, 1.5, 2.25, ROOM.back); wallMesh(1.1, 4.5, -4.95, 2.25, ROOM.back);
  wallMesh(2.4, 1.2, -3.2, 3.9, ROOM.back); wallMesh(2.4, 1.3, -3.2, 0.65, ROOM.back);
  wallMesh(9, 4.5, ROOM.left, 2.25, ROOM.back + 4.5, Math.PI / 2); wallMesh(9, 4.5, ROOM.right, 2.25, ROOM.back + 4.5, -Math.PI / 2);
  for (const [w, x, z, ry] of [[11, 0, ROOM.back + 0.02, 0], [9, ROOM.left + 0.02, ROOM.back + 4.5, Math.PI / 2], [9, ROOM.right - 0.02, ROOM.back + 4.5, -Math.PI / 2]]) {
    const p = mesh(new THREE.PlaneGeometry(w, 1.1), wains, false); at(p, x, 0.55, z, 0, ry); scene.add(p);
    const r = mesh(new THREE.BoxGeometry(w, 0.07, 0.06), trim, false); at(r, x, 1.12, z, 0, ry); scene.add(r);
  }
  for (let x = -5; x <= 5; x += 0.8) scene.add(at(box(0.04, 0.9, 0.03, wains), x, 0.55, ROOM.back + 0.04));

  // window: bright sky, clouds, trees; white frame; sill; curtains
  const sky = canvasTex(512, 384, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#7cc8ff'); g.addColorStop(1, '#dff3ff'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffffff'; for (const [x, y, r] of [[90, 90, 40], [135, 80, 50], [180, 95, 36], [380, 60, 30], [410, 55, 38], [440, 66, 28]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
    for (const [x, r, col] of [[60, 120, '#7ccf6a'], [190, 90, '#93db7a'], [330, 130, '#6cc35d'], [470, 100, '#8fd876']]) { c.fillStyle = col; c.beginPath(); c.arc(x, h + 20, r, 0, 7); c.fill(); }
  });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.0), new THREE.MeshBasicMaterial({ map: sky, toneMapped: false })); at(win, -3.2, 2.3, ROOM.back - 0.15); scene.add(win);
  for (const [w, h, x, y] of [[2.6, 0.12, 0, 1.0], [2.6, 0.12, 0, -1.0], [0.12, 2.1, -1.24, 0], [0.12, 2.1, 1.24, 0], [0.08, 2.0, 0, 0], [2.4, 0.08, 0, 0.2]]) scene.add(at(box(w, h, 0.12, trim), -3.2 + x, 2.3 + y, ROOM.back + 0.02));
  scene.add(at(rbox(2.9, 0.1, 0.4, 0.04, trim), -3.2, 1.28, ROOM.back + 0.18));
  const curtainM = M(0xff9ec0, { roughness: 0.7, clearcoat: 0.1 });
  S.curtains = [-4.7, -1.7].map((x) => { const g = new THREE.Group(); for (let i = 0; i < 4; i++) { const f = mesh(new THREE.CapsuleGeometry(0.11, 2.3, 6, 12), curtainM); f.position.set((i - 1.5) * 0.17, 0, 0); g.add(f); } at(g, x, 2.2, ROOM.back + 0.22); scene.add(g); return g; });
  scene.add(at(cyl(0.025, 0.025, 3.6, trim), -3.2, 3.55, ROOM.back + 0.22, 0, 0, Math.PI / 2));
  scene.add(at(plant(0.6), -2.6, 1.33, ROOM.back + 0.2));

  // corkboard with heart & star notes
  const cork = canvasTex(256, 192, (c, w, h) => { c.fillStyle = '#d8a46b'; c.fillRect(0, 0, w, h); const r = rng(4); c.fillStyle = 'rgba(150,95,50,0.35)'; for (let i = 0; i < 400; i++) c.fillRect(r() * w, r() * h, 2, 2); });
  const board = group(at(rbox(1.9, 1.35, 0.08, 0.04, matte(0xb98252)), 0, 0, 0), at(new THREE.Mesh(new THREE.PlaneGeometry(1.75, 1.2), new THREE.MeshStandardMaterial({ map: cork, roughness: 0.95 })), 0, 0, 0.045));
  const note = (bg, draw, w = 0.42, h = 0.42) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), label(128, 128, (c) => { c.fillStyle = bg; c.fillRect(0, 0, 128, 128); draw(c); }));
  const heart = (c, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(64, 104); c.bezierCurveTo(10, 66, 22, 18, 64, 44); c.bezierCurveTo(106, 18, 118, 66, 64, 104); c.fill(); };
  board.add(at(note('#fff8f0', (c) => heart(c, '#ff7fa8')), -0.45, 0.12, 0.06, 0, 0, 0.06));
  board.add(at(note('#fff4c4', (c) => { c.fillStyle = '#c9a46b'; for (let y = 30; y < 110; y += 18) c.fillRect(20, y, 88, 6); }, 0.32, 0.36), 0.15, -0.3, 0.06, 0, 0, -0.08));
  const star = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.1 : 0.24; star[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, -Math.sin(a) * r); }
  board.add(at(mesh(new THREE.ExtrudeGeometry(star, { depth: 0.04, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 }), M(0xffd23f)), 0.5, 0.2, 0.06));
  for (const [x, y, col] of [[-0.45, 0.33, 0xff5f97], [0.15, -0.12, 0x5b8cff]]) board.add(at(sph(0.035, M(col)), x, y, 0.1));
  at(board, 0.0, 3.1, ROOM.back + 0.06); scene.add(board);

  // rainbow picture
  const rainbow = label(256, 200, (c, w, h) => {
    c.fillStyle = '#cfe9ff'; c.fillRect(0, 0, w, h);
    ['#ff7a8a', '#ffb05a', '#ffe066', '#8be08b', '#7cc4ff', '#b49bff'].forEach((col, i) => { c.strokeStyle = col; c.lineWidth = 14; c.beginPath(); c.arc(150, 190, 110 - i * 14, Math.PI, 2 * Math.PI); c.stroke(); });
    c.fillStyle = '#fff'; for (const [x, y, r] of [[58, 168, 26], [86, 160, 30], [112, 172, 22], [222, 172, 24], [244, 166, 20]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
    c.fillStyle = '#ffd23f'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 10 : 24; c.lineTo(52 + Math.cos(a) * r, 52 + Math.sin(a) * r); } c.fill();
  });
  scene.add(at(group(at(rbox(1.7, 1.4, 0.08, 0.05, M(0xff9ec0)), 0, 0, 0), at(new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.2), rainbow), 0, 0, 0.045)), 2.7, 2.95, ROOM.back + 0.06));

  // bookshelf
  const shelf = new THREE.Group(); at(shelf, 4.5, 0, ROOM.back + 0.3); scene.add(shelf);
  const wood = M(0xe8c39a, { clearcoat: 0.2 });
  shelf.add(at(rbox(1.5, 2.2, 0.5, 0.04, wood), 0, 1.1, 0));
  const r = rng(9), bookCols = [0xb49bff, 0xffb05a, 0x7cc4ff, 0x8be08b, 0xff9ec0, 0xfff1c4];
  for (const y of [0.3, 1.05, 1.8]) {
    shelf.add(at(box(1.4, 0.04, 0.46, M(0xf6dcc0)), 0, y - 0.03, 0.03));
    if (y < 0.5) { for (const x of [-0.35, 0.35]) shelf.add(at(rbox(0.55, 0.5, 0.42, 0.06, M(bookCols[Math.floor(r() * 6)])), x, y + 0.26, 0.05)); continue; }
    for (let x = -0.6; x < 0.55; x += 0.13) { const hh = 0.42 + r() * 0.18; shelf.add(at(rbox(0.11, hh, 0.36, 0.02, M(bookCols[Math.floor(r() * 6)])), x, y + hh / 2, 0.05, 0, 0, (r() - 0.5) * 0.08)); }
  }
  shelf.add(at(plant(0.45), 0.25, 2.2, 0));

  // sofa, rug, floor plant, side table, bunting, balloons
  const sofaM = M(0xb9e4d6), cushM = M(0xfff1c4);
  const sofa = group(at(rbox(2.8, 0.45, 1.0, 0.18, sofaM), 0, 0.4, 0), at(rbox(2.8, 0.75, 0.32, 0.15, sofaM), 0, 0.85, -0.4),
    at(rbox(0.35, 0.65, 1.0, 0.15, sofaM), -1.4, 0.6, 0), at(rbox(0.35, 0.65, 1.0, 0.15, sofaM), 1.4, 0.6, 0),
    at(rbox(0.5, 0.42, 0.18, 0.14, cushM), -0.8, 0.86, -0.18, -0.2, 0, 0.15), at(rbox(0.5, 0.42, 0.18, 0.14, M(0xffc6d9)), 0.85, 0.86, -0.18, -0.2, 0, -0.12));
  for (const x of [-1.2, 1.2]) for (const z of [-0.35, 0.35]) sofa.add(at(cyl(0.06, 0.05, 0.18, M(0xe8c39a)), x, 0.09, z));
  at(sofa, -0.6, 0, ROOM.back + 0.85); scene.add(sofa); S.sofa = sofa;
  const rug = mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.03, 64), matte(0xfff3c9)); rug.position.set(0.2, 0.015, -0.6); scene.add(rug);
  scene.add(at(mesh(new THREE.TorusGeometry(2.25, 0.05, 8, 64), matte(0xffd6e6)), 0.2, 0.03, -0.6, Math.PI / 2));
  scene.add(at(plant(1.25), -4.8, 0, ROOM.back + 0.7));
  scene.add(at(plant(1.0), 5.0, 0, 1.4));
  const tbl = group(at(cyl(0.55, 0.55, 0.06, M(0xffffff), 40), 0, 0.62, 0), at(cyl(0.06, 0.08, 0.6, M(0xe8c39a)), 0, 0.31, 0), at(cyl(0.3, 0.32, 0.04, M(0xe8c39a), 32), 0, 0.02, 0));
  at(tbl, 3.9, 0, 1.0); scene.add(tbl);

  // bunting garland
  const flagCols = [0xff7a8a, 0xffd23f, 0x7cc4ff, 0x8be08b, 0xb49bff, 0xffb05a];
  for (let i = 0; i < 16; i++) {
    const u = i / 15, x = -5.0 + u * 10.0, y = 4.25 - Math.sin(u * Math.PI) * 0.35;
    const tri = mesh(new THREE.ConeGeometry(0.16, 0.34, 3), M(flagCols[i % 6])); tri.rotation.set(Math.PI, 0, 0); tri.scale.z = 0.15; tri.position.set(x, y - 0.16, ROOM.back + 0.15); scene.add(tri);
  }
  scene.add(at(cyl(0.008, 0.008, 10.2, M(0xffffff)), 0, 4.15, ROOM.back + 0.15, 0, 0, Math.PI / 2));
  S.balloons = [[-2.6, 0xff9ec0], [-2.25, 0xb49bff], [-2.45, 0xffd23f], [3.3, 0x7cc4ff], [3.6, 0xff7a8a]].map(([x, col], i) => {
    const g = new THREE.Group(); const b = sph(0.32, M(col, { roughness: 0.15, clearcoat: 1 })); b.scale.set(0.92, 1.1, 0.92); g.add(b);
    g.add(at(cone(0.05, 0.08, M(col)), 0, -0.36, 0, Math.PI));
    g.add(at(cyl(0.006, 0.006, 1.6, M(0xffffff)), 0, -1.2, 0));
    g.base = new THREE.Vector3(x, 2.5 + (i % 2) * 0.35, ROOM.back + 0.7 + (i % 3) * 0.15); g.position.copy(g.base); scene.add(g); return g;
  });

  // door on the right wall (Lumi comes home through it)
  const door = new THREE.Group(); door.position.set(ROOM.right - 0.02, 0, -1.9); scene.add(door); S.door = door;
  door.add(at(box(0.08, 2.5, 1.3, matte(0xffffff)), 0, 1.25, -0.65 - 0.06)); // frame back
  const leaf = new THREE.Group(); leaf.position.set(0, 0, 0); door.add(leaf); S.doorLeaf = leaf;
  leaf.add(at(rbox(0.08, 2.3, 1.15, 0.04, M(0xffd6a5)), -0.06, 1.17, -0.6));
  leaf.add(at(sph(0.06, M(0xd4a017, { metalness: 0.7, roughness: 0.3 })), -0.14, 1.1, -1.05));
  scene.add(at(box(0.1, 2.6, 0.1, trim), ROOM.right - 0.05, 1.3, -1.9)); scene.add(at(box(0.1, 2.6, 0.1, trim), ROOM.right - 0.05, 1.3, -3.25)); scene.add(at(box(0.1, 0.1, 1.45, trim), ROOM.right - 0.05, 2.55, -2.57));

  // sun shafts from the window (additive, very soft)
  const shaftTex = canvasTex(64, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,240,210,0.5)'); g.addColorStop(1, 'rgba(255,240,210,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  S.shafts = [-3.9, -3.2, -2.5].map((x, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 5.5), new THREE.MeshBasicMaterial({ map: shaftTex, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.position.set(x + 0.9, 1.8, ROOM.back + 1.7); m.rotation.set(-0.75, 0.2, -0.35); scene.add(m); return m; });
  return S;
}

export function plant(s = 1) {
  const g = new THREE.Group();
  g.add(at(cyl(0.2, 0.15, 0.3, M(0xffffff)), 0, 0.15, 0));
  g.add(at(tor(0.2, 0.03, M(0xffc6d9)), 0, 0.28, 0, Math.PI / 2));
  const leaf = M(0x7ccf6a);
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; const l = sph(0.16, leaf); l.scale.set(0.55, 0.22, 1.25); l.position.set(Math.cos(a) * 0.17, 0.45 + (i % 3) * 0.09, Math.sin(a) * 0.17); l.rotation.set(0.5 * Math.sin(a), -a, 0.5); g.add(l); }
  g.scale.setScalar(s); return g;
}

// ---------------------------------------------------------------- party props
export function birthdayBanner() {
  const text = 'HAPPY BIRTHDAY LUMI';
  const g = new THREE.Group();
  const letters = [...text];
  const cols = ['#ff7a8a', '#ffb05a', '#ffd23f', '#8be08b', '#7cc4ff', '#b49bff'];
  letters.forEach((ch, i) => {
    if (ch === ' ') return;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.26), label(64, 84, (c, w, h) => { c.fillStyle = cols[i % 6]; c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0); c.lineTo(w, h * 0.75); c.lineTo(w / 2, h); c.lineTo(0, h * 0.75); c.fill(); c.fillStyle = '#fff'; c.font = FONT.replace('{S}', 44); c.textAlign = 'center'; c.fillText(ch, w / 2, 50); }));
    m.material.transparent = true; m.material.side = THREE.DoubleSide; m.castShadow = true;
    m.position.set((i - (letters.length - 1) / 2) * 0.19, -Math.sin((i / (letters.length - 1)) * Math.PI) * 0.12, 0); g.add(m);
  });
  g.add(at(cyl(0.006, 0.006, 3.8, M(0xffffff)), 0, 0.12, -0.01, 0, 0, Math.PI / 2));
  return g;
}
export function drapedBanner() {   // the banner after it fell on Moss
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.75, 1.1, 24, 1, true, -Math.PI * 0.55, Math.PI * 1.1), label(256, 64, (c, w, h) => { c.fillStyle = '#ffd23f'; c.fillRect(0, 0, w, h); ['#ff7a8a', '#7cc4ff', '#8be08b', '#b49bff'].forEach((col, i) => { c.fillStyle = col; c.fillRect(i * 64, 0, 64, h); }); c.fillStyle = '#fff'; c.font = FONT.replace('{S}', 30); c.fillText('HAPPY BIR', 20, 44); }));
  m.material.side = THREE.DoubleSide; m.castShadow = true; return m;
}
export function stepStool() { return group(at(rbox(0.7, 0.08, 0.5, 0.03, M(0xffd23f)), 0, 0.5, 0), ...[-0.27, 0.27].map((x) => at(rbox(0.07, 0.5, 0.45, 0.03, M(0xffd23f)), x, 0.25, 0))); }

export function cakeCart() {
  const g = new THREE.Group();
  const cart = group(at(rbox(1.1, 0.06, 0.75, 0.03, M(0xffffff)), 0, 0.62, 0), at(rbox(1.1, 0.06, 0.75, 0.03, M(0xffffff)), 0, 0.22, 0));
  const cloth = mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.5, 32, 1, true), M(0xffc6d9, { side: THREE.DoubleSide }));
  cloth.scale.set(1, 1, 0.68); cloth.position.y = 0.4; cart.add(cloth);
  for (const x of [-0.48, 0.48]) for (const z of [-0.3, 0.3]) cart.add(at(sph(0.05, M(0xb49bff)), x, 0.05, z));
  g.add(cart);
  const cake = new THREE.Group(); cake.position.y = 0.65; g.add(cake); g.cake = cake;
  const pink = M(0xffb3cf), cream = M(0xfffaf0, { roughness: 0.25 });
  cake.add(at(cyl(0.38, 0.38, 0.32, pink, 40), 0, 0.16, 0)); cake.add(at(cyl(0.27, 0.27, 0.26, pink, 40), 0, 0.45, 0));
  for (const [y, r] of [[0.32, 0.38], [0.58, 0.27]]) { cake.add(at(tor(r, 0.05, cream), 0, y, 0, Math.PI / 2)); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const d = sph(0.04, cream); d.scale.y = 1.8; d.position.set(Math.cos(a) * r, y - 0.07, Math.sin(a) * r); cake.add(d); } }
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; cake.add(at(sph(0.05, M(0xe8102f, { roughness: 0.15 })), Math.cos(a) * 0.18, 0.62, Math.sin(a) * 0.18)); }
  const candle = group(at(cyl(0.025, 0.025, 0.22, M(0x7cc4ff)), 0, 0.11, 0), at(cone(0.03, 0.08, new THREE.MeshBasicMaterial({ color: 0xffb347, toneMapped: false })), 0, 0.27, 0));
  candle.position.y = 0.6; cake.add(candle); g.candle = candle;
  const flameLight = new THREE.PointLight(0xffb060, 0.8, 2.5, 1.5); flameLight.position.y = 0.95; cake.add(flameLight); g.flameLight = flameLight;
  return g;
}

export function partyHat(col = 0xff7a8a) {
  const tex = canvasTex(64, 64, (c, w, h) => { c.fillStyle = '#' + new THREE.Color(col).getHexString(); c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; for (let i = 0; i < w; i += 16) c.fillRect(i, 0, 6, h); });
  return group(at(mesh(new THREE.ConeGeometry(0.22, 0.5, 24), new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.3, clearcoat: 1 })), 0, 0.25, 0), at(sph(0.06, M(0xffffff)), 0, 0.52, 0));
}
export function popper() { return group(at(cone(0.08, 0.3, M(0xffd23f)), 0, 0.15, 0, Math.PI), at(tor(0.08, 0.02, M(0xff7a8a)), 0, 0.3, 0, Math.PI / 2)); }
export function groceryBag() {
  return group(at(rbox(0.36, 0.42, 0.24, 0.03, matte(0xd9b07a)), 0, 0, 0), at(cyl(0.03, 0.03, 0.4, M(0x8be08b)), 0.08, 0.32, 0, 0, 0, 0.3), at(sph(0.07, M(0xff7a8a)), -0.08, 0.24, 0));
}

/** confetti burst: tick(T, t0, origin) — deterministic */
export function confetti(n = 120) {
  const cols = [0xff7a8a, 0xffd23f, 0x7cc4ff, 0x8be08b, 0xb49bff, 0xffffff];
  const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.05, 0.08), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), n);
  const r = rng(77), P = Array.from({ length: n }, (_, i) => { m.setColorAt(i, new THREE.Color(cols[i % cols.length])); return { vx: (r() - 0.5) * 3, vy: 2 + r() * 3, vz: (r() - 0.2) * 2.5, s: r() * 6 }; });
  const d = new THREE.Object3D();
  m.tick = (T, t0, o) => {
    const k = T - t0; m.visible = k > 0 && k < 6;
    P.forEach((p, i) => { const tt = Math.max(0, k); const y = Math.max(0.01, o.y + p.vy * tt - 2.2 * tt * tt * 0.6); d.position.set(o.x + p.vx * tt * 0.8, y, o.z + p.vz * tt * 0.8); d.rotation.set(tt * p.s, tt * p.s * 0.7, i); d.scale.setScalar(1); d.updateMatrix(); m.setMatrixAt(i, d.matrix); });
    m.instanceMatrix.needsUpdate = true;
  };
  return m;
}
