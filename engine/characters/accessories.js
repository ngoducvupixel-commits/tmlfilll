// Props any episode can hand to a Mochi: the channel's signature Berry Mochi snack, spy shades, Lumi's cup + tablet.
import * as THREE from 'three';
import { rbox, box, cyl, sph, tor, cone, at, group } from '../kit.js';
import { soft } from './mochi.js';

const M = (c, o) => soft(c, o);
function mesh(geo, m) { const x = new THREE.Mesh(geo, m); x.castShadow = x.receiveShadow = true; return x; }

export function berryMochi(s = 1) {
  const g = new THREE.Group();
  const body = sph(0.13, M(0xffb3cf, { clearcoat: 0.8, clearcoatRoughness: 0.2 })); body.scale.set(1, 0.72, 1); body.position.y = 0.09; g.add(body);
  g.add(at(sph(0.05, M(0xe8102f, { clearcoat: 1, roughness: 0.15 })), 0, 0.2, 0));
  for (const s2 of [-1, 1]) { const l = sph(0.03, M(0x3cb44a)); l.scale.set(1.4, 0.3, 0.7); l.position.set(s2 * 0.03, 0.245, 0); l.rotation.z = s2 * 0.5; g.add(l); }
  const sparkle = new THREE.PointLight(0xffd6ea, 0, 1.2, 1.5); sparkle.position.y = 0.3; g.add(sparkle); g.glow = sparkle;
  g.scale.setScalar(s); return g;
}

export function sunglasses() {
  const g = new THREE.Group(); const blk = new THREE.MeshPhysicalMaterial({ color: 0x111118, roughness: 0.1, clearcoat: 1 });
  for (const s of [-1, 1]) { const l = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 24), blk); l.rotation.x = Math.PI / 2; l.scale.set(1.1, 1, 0.8); l.position.set(s * 0.22, 0, 0.03); g.add(l); }
  g.add(at(box(0.16, 0.03, 0.03, blk), 0, 0.03, 0.03));
  return g;
}

export function cupAndTablet() {
  const cup = group(at(cyl(0.09, 0.075, 0.2, new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, roughness: 0.05 }), 20), 0, 0, 0), at(cyl(0.08, 0.07, 0.14, M(0x8fd8ff, { transparent: true, opacity: 0.8 }), 20), 0, -0.02, 0));
  const tab = group(at(rbox(0.42, 0.3, 0.03, 0.03, M(0x2b3a44)), 0, 0, 0), at(new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.24), new THREE.MeshBasicMaterial({ color: 0x8fd8ff })), 0, 0, 0.017));
  return { cup, tab };
}
