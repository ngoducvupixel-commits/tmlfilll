// Camera language shared by all episodes: close-ups placed from a character's facing,
// fixed / moving shots, a cue-driven shot list, and the "hide whatever blocks the lens" cheat.
import * as THREE from 'three';
import { W, H, prog, easeInOut } from './kit.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

/**
 * Close-up in front of a character's face. `d` is a framing size (1.0 ≈ tight CU, 1.5 ≈ medium CU,
 * 2.0+ ≈ medium shot); `side` swings the camera off-axis (+ = character's right); `up` raises it.
 */
export function faceCU(k, d = 1.5, side = 0.25, up = 0.12) {
  k.root.updateMatrixWorld(true);
  const f = (k.face || k.head).getWorldPosition(new THREE.Vector3());
  const ry = k.root.rotation.y, fwd = V(Math.sin(ry), 0, Math.cos(ry)), right = V(Math.cos(ry), 0, -Math.sin(ry));
  d *= 1.75;
  return { p: f.clone().add(fwd.multiplyScalar(d)).add(right.multiplyScalar(side * d)).add(V(0, up + 0.08, 0)), l: f, subject: k };
}
export const fixed = (p, l, fov) => () => ({ p: V(...p), l: V(...l), fov });
export const move = (p0, p1, l0, l1, a, b, fov) => (T) => { const k = easeInOut(prog(T, a, b)); return { p: V(...p0).lerp(V(...p1), k), l: V(...l0).lerp(V(...l1), k), fov }; };

/**
 * Builds cam(T) from a shot list [[startTime, (T) => {p, l, fov?, subject?}], ...].
 * @param bounds   (T, shot) => void — clamp shot.p to keep the lens inside the set
 * @param blockers () => [[object3D, centerHeight, radius], ...] — hidden when they block the subject
 * @param shake    (T) => amplitude
 */
export function shotRunner(camera, shots, { bounds, blockers, shake } = {}) {
  const list = [...shots].sort((a, b) => a[0] - b[0]);
  return function cam(T) {
    let s = list[0]; for (const sh of list) if (T >= sh[0]) s = sh;
    const o = s[1](T);
    bounds?.(T, o);
    camera.fov = o.fov || 35; camera.updateProjectionMatrix(); camera.position.copy(o.p); camera.lookAt(o.l);
    if (blockers) {
      const seg = o.l.clone().sub(o.p), L = seg.length(); seg.normalize();
      for (const [obj, cy, r] of blockers()) {
        if (!obj.visible || (o.subject && obj === o.subject.root)) continue;
        if (!o.subject && obj.position.clone().add(V(0, cy, 0)).distanceTo(o.l) < 1.0) continue;
        const q = obj.position.clone().add(V(0, cy, 0)).sub(o.p), along = q.dot(seg), off = q.clone().sub(seg.clone().multiplyScalar(along)).length();
        if (q.length() < 1.2 || (along > 0.05 && along < L - 0.3 && off < r * 1.4)) obj.visible = false;
      }
    }
    const a = shake ? shake(T) : 0;
    camera.position.x += Math.sin(T * 67) * a; camera.position.y += Math.sin(T * 51 + 1) * a;
  };
}

/** standard blocker entries for Mochi characters */
export const characterBlockers = (chars) => Object.values(chars).map((k) => [k.root, 0.62 * k.root.scale.y, 0.75]);

const tmp = new THREE.Vector3();
export function toScreen(camera, obj) { obj.getWorldPosition(tmp); tmp.project(camera); return [(tmp.x + 1) / 2 * W, (1 - tmp.y) / 2 * H, tmp.z]; }
