// The set for this episode. Keep geometry simple and chunky; reuse engine/kit.js helpers.
import * as THREE from 'three';
import { rbox, box, cyl, at, canvasTex } from '../../../engine/kit.js';
import { soft } from '../../../engine/characters/mochi.js';

export function buildSet(scene) {
  const tiles = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#f6eadb'; c.fillRect(0, 0, w, h); c.strokeStyle = '#e6d3bd'; c.lineWidth = 4; for (let i = 0; i <= w; i += 64) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, h); c.moveTo(0, i); c.lineTo(w, i); c.stroke(); } });
  tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(8, 8);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.7 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  scene.add(at(box(20, 4, 0.2, soft(0xcfe8f2, { clearcoat: 0, sheen: 0 })), 0, 2, -4));
  const table = new THREE.Group(); table.position.set(0, 0, -1.6); scene.add(table);
  table.add(at(rbox(2.2, 0.1, 1.0, 0.04, soft(0xc8925a)), 0, 0.8, 0));
  for (const x of [-0.95, 0.95]) for (const z of [-0.4, 0.4]) table.add(at(cyl(0.05, 0.05, 0.8, soft(0xa87442)), x, 0.4, z));
  return { table };
}
