// EPISODE_TITLE: choreography + camera. Everything is a pure function of T, timed from cue ids.
import * as THREE from 'three';
import { lerp, prog, easeInOut } from '../../../engine/kit.js';
import { FAMILY } from '../../../engine/characters/mochi.js';
import { clock, mouth } from '../../../engine/timeline.js';
import { faceCU, fixed, move, shotRunner, characterBlockers } from '../../../engine/camera.js';
import { captions } from '../../../engine/overlay.js';
import { buildSet } from './set.js';

const face = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);

// caption text for every voice cue (cues without an entry are not captioned)
export const LINES = {
  pip_idea: ['Pip', 'I have an amazing idea!'], milo_no: ['Milo', 'No.'],
  pip_hear: ['Pip', 'You didn’t even hear it!'], lumi_dont: ['Lumi', 'We don’t need to.'],
};

export function build({ lipsync, cues }) {
  const { t, e } = clock(cues);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfdf3e7);
  const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.05, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8c8b8, 1.2));
  const key = new THREE.DirectionalLight(0xfff0dc, 2.0); key.position.set(3, 8, 5); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 }); key.shadow.normalBias = 0.02;
  scene.add(key);
  buildSet(scene);

  const c = Object.fromEntries(['milo', 'pip', 'lumi', 'bobo'].map((n) => [n, FAMILY[n]()]));
  Object.values(c).forEach((k) => scene.add(k.root));
  c.bobo.root.scale.setScalar(0.8);

  function pose(T) {
    const { milo, pip, lumi, bobo } = c;
    for (const k of Object.values(c)) k.root.visible = true;
    for (const n of ['milo', 'pip', 'lumi']) c[n].setSing(mouth(lipsync, n, T));
    const still = T >= t('beat_pause') && T < e('beat_pause');            // freeze for the comic pause
    // stand in a loose half-circle, facing each other
    const spots = { milo: [-1.2, 0.2], pip: [0, 0.6], lumi: [1.2, 0.2] };
    for (const [n, [x, z]] of Object.entries(spots)) { const k = c[n]; k.root.position.set(x, 0, z); k.root.rotation.y = face(x, z, 0, 2.5); k.update(T, { bounce: still ? 0 : 0.35, blink: !still }); }
    pip.setFace(T < t('milo_no') ? 'happy' : T < t('pip_hear') ? 'wide' : 'angry');
    milo.setFace('flat'); lumi.setFace('flat');
    if (T >= t('pip_idea') && T < e('pip_idea')) pip.armR.rotation.z = 2.4;  // hand up: idea!
    bobo.root.position.set(lerp(3.5, 0.6, easeInOut(prog(T, t('lumi_dont'), t('woof')))), 0, 1.5); bobo.root.rotation.y = -Math.PI / 2;
    bobo.update(T, { bounce: 0.6 });
  }

  const cam = shotRunner(camera, [
    [0, move([0, 1.8, 7], [0, 1.6, 5.5], [0, 0.8, 0], [0, 0.8, 0.2], 0, e('s1'), 35)],
    [t('pip_idea'), () => faceCU(c.pip, 1.3, 0.2)],
    [t('milo_no'), () => faceCU(c.milo, 1.3, 0.25)],
    [t('beat_pause'), fixed([0, 1.6, 5.5], [0, 0.8, 0.2], 35)],
    [t('pip_hear'), () => faceCU(c.pip, 1.3, 0.2)],
    [t('lumi_dont'), () => faceCU(c.lumi, 1.3, -0.25)],
    [t('woof'), fixed([1.6, 0.8, 4.0], [0.6, 0.4, 1.5], 38)],
  ], {
    bounds: (T, o) => { o.p.z = Math.max(o.p.z, -3.5); },
    blockers: () => characterBlockers(c),
  });

  return {
    scene, camera,
    update(T) { pose(T); cam(T); },
    overlay(ctx, T, F) { captions(ctx, T, cues, F, LINES); },
  };
}
