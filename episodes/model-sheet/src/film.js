// Model sheet: line-up turntable of the Mochi Family + every face, labelled. Not an episode, a reference.
import * as THREE from 'three';
import { FAMILY, CHARACTERS } from '../../../engine/characters/mochi.js';
import { toScreen } from '../../../engine/camera.js';

export const FACES = ['open', 'happy', 'wink', 'flat', 'angry', 'wide', 'closed', 'open'];

export function build({ cues }) {
  const duration = cues.reduce((m, c) => Math.max(m, c.t + c.dur), 0);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xfff4ea);
  const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.1, 100); camera.position.set(0, 1.9, 11); camera.lookAt(0, 0.75, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8c8b8, 1.3));
  const key = new THREE.DirectionalLight(0xfff0dc, 2.2); key.position.set(3, 8, 6); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -8, right: 8, top: 6, bottom: -6 }); key.shadow.normalBias = 0.02; scene.add(key);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.15 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const names = Object.keys(CHARACTERS);
  const chars = names.map((n, i) => { const k = FAMILY[n](); k.root.position.set((i - 2.5) * 1.85, 0, 0); if (n === 'bobo') k.root.scale.setScalar(0.85); scene.add(k.root); return k; });
  const anchors = chars.map((k) => { const a = new THREE.Object3D(); a.position.set(0, -0.15, 0.6); k.root.add(a); return a; });
  return {
    scene, camera,
    update(T) {
      const f = FACES[Math.min(FACES.length - 1, Math.floor((T / duration) * FACES.length))];
      chars.forEach((k, i) => { k.setFace(f); k.setSing(f === 'happy' ? 0.7 : 0); k.update(T, { bounce: 0.3, blink: false }); k.root.rotation.y = Math.sin(T * 0.9 + i * 0.3) * 0.9; });
    },
    overlay(ctx, T, F) {
      const f = FACES[Math.min(FACES.length - 1, Math.floor((T / duration) * FACES.length))];
      ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = '#4a2a1a'; ctx.font = `700 40px ${F}`; ctx.fillText('MOCHI FAMILY · MODEL SHEET', 640, 64);
      ctx.font = `700 26px ${F}`; ctx.fillStyle = '#9a7f70'; ctx.fillText(`setFace('${f}')`, 640, 104);
      names.forEach((n, i) => { const [x, y] = toScreen(camera, anchors[i]); ctx.font = `700 28px ${F}`; ctx.fillStyle = CHARACTERS[n].caption; ctx.fillText(CHARACTERS[n].name, x, y + 60); ctx.font = `700 14px ${F}`; ctx.fillStyle = '#9a7f70'; ctx.fillText(CHARACTERS[n].role.split(' / ')[0], x, y + 82); });
      ctx.restore();
    },
  };
}
