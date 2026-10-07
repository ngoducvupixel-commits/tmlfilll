// "The Last Berry Mochi": choreography + camera, all driven by cue times from assets/cues.json.
import * as THREE from 'three';
import { W, H, clamp, lerp, prog, easeOut, easeIn, easeInOut, easeBack, bounce, at, sph, group } from './kit.js';
import { FAMILY } from './mochi.js';
import { buildSet, sunglasses, laser9000, sparks, handprint, stolenBag, lampshade, paperWrap, cupAndTablet, berryMochi } from './set.js';

const P = prog, EIO = easeInOut, V = (x, y, z) => new THREE.Vector3(x, y, z);
const face = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);

export const LINES = {
  milo_target: ['Milo', 'Target is twelve meters ahead.'], pip_twelve: ['Pip', 'Twelve?'], milo_never: ['Milo', 'Never question the mission.'],
  milo_last: ['Milo', 'The last Berry Mochi.'], pip_beautiful: ['Pip', 'So beautiful…'], milo_focus: ['Milo', 'Focus.'],
  milo_3: ['Milo', 'Three…'], pip_2: ['Pip', 'Two…'], mimi_1: ['Mimi', 'One!'], pip_stealthy: ['Pip', 'Very stealthy.'], milo_thanks: ['Milo', '…thank you.'],
  milo_pip: ['Milo', 'Pip.'], pip_waiting: ['Pip', 'I’ve been waiting my entire life for this.'], moss_why: ['Moss', 'Why nine thousand?'],
  pip_8000: ['Pip', 'Eight thousand wasn’t enough.'], pip_watch: ['Pip', 'Watch this.'], mimi_liked: ['Mimi', 'I liked it.'], pip_thankyou: ['Pip', 'Thank you.'],
  laser_1: ['Laser 9000', 'PIP’S SUPER SECRET LASER! Pip is smart! Pip is handsome! Pip—'], pip_nonono: ['Pip', 'NO NO NO NO—'],
  laser_2: ['Laser 9000', 'PIP IS VERY HANDSOME!'], moss_about: ['Moss', '…I was about to suggest that.'], milo_nope: ['Milo', 'No you weren’t.'],
  pip_rich: ['Pip', 'We’re rich.'], mimi_one: ['Mimi', 'It’s one mochi.'], pip_emo: ['Pip', 'Emotionally rich.'],
  laser_3: ['Laser 9000', 'Pip is handsome…'], milo_lumi: ['Milo', 'Lumi.'], lumi_milo: ['Lumi', 'Milo.'], milo_funny: ['Milo', 'Funny story.'],
  lumi_doubt: ['Lumi', 'I doubt that.'], milo_security: ['Milo', 'We’re performing a security inspection.'], moss_plant: ['Moss', 'I’m… a plant.'],
  lumi_five: ['Lumi', 'I’ll give you five seconds.'], milo_run: ['Milo', 'RUN!'], pip_uhoh: ['Pip', 'Uh-oh.'],
  lumi_so: ['Lumi', 'So…'], lumi_who: ['Lumi', '…who exactly were you stealing it for?'], both_him: ['Milo + Pip', 'Him.'],
  pip_said: ['Pip', '…you said it was the last one.'], milo_was: ['Milo', 'It was the last one…'], milo_shelf: ['Milo', '…on that shelf.'],
  lumi_out: ['Lumi', 'Get out.'], pip_road: ['Pip', 'Can I take one for the road?'], pip_ow: ['Pip', 'Ow.'],
};
export const NAME_COL = { Pip: '#e8a800', Milo: '#ff7a1a', Lumi: '#4a7cff', Mimi: '#ff5f97', Moss: '#4caf3a', 'Laser 9000': '#e8202f', 'Milo + Pip': '#ff7a1a' };

export function build({ lipsync, cues }) {
  const Q = Object.fromEntries(cues.map((c) => [c.id, c]));
  const t = (id, off = 0) => Q[id].t + off;            // start time of a cue
  const e = (id, off = 0) => Q[id].t + Q[id].dur + off; // end time of a cue
  const DURATION = cues.reduce((m, c) => Math.max(m, c.t + c.dur), 0);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c1030);
  const camera = new THREE.PerspectiveCamera(35, W / H, 0.05, 100);
  const hemi = new THREE.HemisphereLight(0x8fa8ff, 0x403050, 0.35); scene.add(hemi);
  const key = new THREE.DirectionalLight(0x8fb0ff, 0.6); key.position.set(3, 8, 4); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 30 });
  key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02; scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.15); fill.position.set(-4, 3, 6); scene.add(fill);
  const corridorGlow = new THREE.PointLight(0x5ff2ff, 3, 7, 1.5); corridorGlow.position.set(0, 2.4, 3.5); scene.add(corridorGlow);

  const S = buildSet(scene);
  const c = Object.fromEntries(['milo', 'pip', 'lumi', 'mimi', 'moss', 'bobo'].map((n) => [n, FAMILY[n]()]));
  Object.values(c).forEach((k) => scene.add(k.root));
  c.bobo.root.scale.setScalar(0.8);

  // gear
  const miloShades = sunglasses(); c.milo.face.add(miloShades); miloShades.position.set(0, 0.0, 0.04);
  const looseShades = sunglasses(); scene.add(looseShades); looseShades.visible = false;
  const pipShades = sunglasses(); c.pip.bodyG.add(pipShades); pipShades.position.set(0, 0.72, -0.53); pipShades.rotation.y = Math.PI;   // worn backwards!
  const pipPack = group(at(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.62, 0.3), new THREE.MeshStandardMaterial({ color: 0x3a8cff, roughness: 0.6 })), 0, 0, 0));
  pipPack.position.set(0, 0.62, -0.62); c.pip.bodyG.add(pipPack);
  const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 8), new THREE.MeshStandardMaterial({ color: 0x2a5ac0 })); scene.add(strap);
  const laser = laser9000(); scene.add(laser);
  const spark = sparks(); scene.add(spark);
  const print = handprint(); print.position.set(0.17, -0.05, 0.03); c.pip.face.add(print);
  const bag = stolenBag(); scene.add(bag);
  const shade = lampshade(); c.mimi.top.add(shade); shade.position.y = -0.1;
  const wrap = paperWrap(); wrap.position.y = 0.6; c.moss.bodyG.add(wrap);
  const { cup, tab } = cupAndTablet(); c.lumi.armL.hand.add(cup); c.lumi.armR.hand.add(tab); cup.position.set(-0.05, 0.08, 0.1); tab.position.set(0.1, 0.1, 0.12);
  const bowlMochi = berryMochi(1.4); scene.add(bowlMochi);
  const fallingLeaf = sph(0.1, new THREE.MeshStandardMaterial({ color: 0x4caf3a })); fallingLeaf.scale.set(1.4, 0.25, 0.8); scene.add(fallingLeaf);
  const cloudM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true });
  const cloud = Array.from({ length: 16 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 10), cloudM.clone()); scene.add(m); return { m, a: i * 2.4, r: 0.2 + (i % 4) * 0.18, y: 0.3 + (i % 3) * 0.35 }; });
  const dropM = new THREE.MeshStandardMaterial({ color: 0x8fd8ff, transparent: true, opacity: 0.85, roughness: 0.05 });
  const drops = Array.from({ length: 14 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), dropM); scene.add(m); return { m, a: i * 0.45, v: 1.2 + (i % 5) * 0.4 }; });

  const mouth = (who, T) => { for (const tr of lipsync.tracks[who] || []) { const i = Math.floor((T - tr.t) * lipsync.fps); if (i >= 0 && i < tr.v.length) return tr.v[i]; } return 0; };
  const put = (k, x, z, ry, y = 0, rx = 0, rz = 0) => { k.root.position.set(x, y, z); k.root.rotation.set(rx, ry, rz); };
  const between = (T, a, b) => T >= a && T < b;
  const dummy = new THREE.Object3D();

  // ------------------------------------------------------------------ choreography
  function pose(T) {
    const { milo, pip, lumi, mimi, moss, bobo } = c;
    // reset per-frame state
    for (const k of Object.values(c)) { k.root.visible = true; k.bodyG.rotation.set(0, 0, 0); }
    for (const n of ['milo', 'pip', 'lumi', 'mimi', 'moss']) c[n].setSing(mouth(n, T));
    const silent = between(T, t('s6'), t('laser_3')) || between(T, t('cut_lumi'), t('lumi_so'));
    miloShades.visible = true; looseShades.visible = false; pipShades.visible = T < t('s3'); pipPack.visible = T < t('s10'); strap.visible = false;
    print.visible = T >= t('slap'); bag.visible = false; shade.visible = false; wrap.visible = false; bowlMochi.visible = false; fallingLeaf.visible = false;
    laser.visible = between(T, t('device_out'), t('lumi_five')); spark.visible = false;
    lumi.root.visible = T >= t('s6');
    const upd = (k, o = {}) => k.update(T, { bounce: silent ? 0 : 0.35, blink: !silent, ...o });

    if (T < t('s3')) {
      // ---------------- SCENES 1–2: corridor
      const creep = EIO(P(T, 0, t('milo_target') + 0.3));
      put(milo, -1.55, lerp(6.6, 2.4, creep), Math.PI - 0.3);
      put(pip, -1.45, lerp(7.6, 3.4, creep), Math.PI - 0.2);
      upd(milo, { bounce: 0.6 }); upd(pip, { bounce: 0.6 });
      milo.bodyG.rotation.x = -0.12; pip.bodyG.rotation.x = -0.12;          // sneaking crouch
      if (between(T, t('milo_target'), t('pip_twelve'))) milo.armR.rotation.z = 2.3;  // "stop" hand
      if (between(T, t('pip_looks'), e('pip_twelve') + 0.2)) pip.root.rotation.y = between(T, t('pip_looks'), t('pip_looks') + 0.35) ? Math.PI : Math.PI - 0.9;
      if (between(T, t('milo_points'), e('milo_last'))) { milo.armR.rotation.z = 1.7; milo.root.rotation.y = Math.PI + 0.25; }
      milo.setFace(T < t('s2') ? 'flat' : 'angry'); pip.setFace(between(T, t('gulp'), e('pip_beautiful')) ? 'wide' : T < t('s2') ? 'open' : 'open');
      // peekers at the corner
      put(mimi, 2.75, 4.35, -Math.PI / 2 + 0.3, 0, 0, 0.35); put(moss, 2.85, 5.25, -Math.PI / 2 + 0.2, 0, 0, 0.25); put(bobo, 2.65, 4.8, -Math.PI / 2 - 0.2);
      upd(mimi); upd(moss); bobo.setSing(0); bobo.update(T, { bounce: 0.3 });
      mimi.setFace(T >= t('mimi_1') ? 'happy' : 'open'); moss.setFace('flat');
      // SCENE 2: Milo backs up, counts, flying kick through the auto-door
      if (T >= t('s2')) {
        const back = EIO(P(T, t('s2'), e('s2')));
        put(milo, lerp(-1.55, -0.6, back), lerp(2.4, 4.4, back), Math.PI); put(pip, lerp(-1.45, -1.75, back), lerp(3.4, 3.0, back), Math.PI - 0.8);
        milo.bodyG.rotation.x = -0.2 * back; milo.bodyG.position.y = -0.05 * back;
        if (T >= t('milo_3')) milo.setFace('angry');
        const k0 = t('whoosh'), k1 = t('thud');
        if (T >= k0) {
          const fly = P(T, k0, k1), z = T < k1 ? lerp(4.4, -0.5, fly) : lerp(-0.5, -1.6, easeOut(P(T, k1, e('skid'))));
          const y = T < k1 ? 0.5 + Math.sin(fly * Math.PI) * 0.6 : 0.5;
          put(milo, -0.4 + (T < k1 ? 0 : 0), z, Math.PI, y, -Math.PI / 2 * clamp(fly * 1.6));
          milo.armL.rotation.z = -2.6; milo.armR.rotation.z = 2.6;
          if (T >= k1) { milo.armL.rotation.z = -0.6; milo.armR.rotation.z = 0.6; milo.setFace('closed'); miloShades.visible = false; looseShades.visible = true;
            const g = easeOut(P(T, k1, k1 + 1.1)); looseShades.position.set(-0.4, 0.03, lerp(-1.4, -3.6, g)); looseShades.rotation.set(-Math.PI / 2, 0, g * 4); }
        }
        if (T >= e('silence2') - 0.6) { const w = EIO(P(T, e('silence2') - 0.6, e('pip_stealthy'))); put(pip, lerp(-1.75, 0.6, w), lerp(3.0, -1.2, w), Math.PI - 0.4); pip.update(T, { bounce: 1 }); }
        if (T >= e('milo_thanks') - 0.1) milo.setFace('flat');
      }
    } else if (T < t('s6')) {
      // ---------------- SCENES 3–5: at the fridge
      const fz = -4.6;
      const spots = { milo: [-0.95, -3.15], pip: [0.35, -3.0], mimi: [-1.9, -2.7], moss: [1.45, -2.85], bobo: [0.95, -2.45] };
      for (const [n, [x, z]] of Object.entries(spots)) put(c[n], x, z, face(x, z, 0, fz));
      const backoff = T >= t('brrr') && T < t('s4') ? easeOut(P(T, t('brrr'), t('brrr', 0.5))) * 0.35 : 0;
      for (const n of ['milo', 'mimi', 'moss']) c[n].root.position.z += backoff;
      for (const n of ['milo', 'pip', 'mimi', 'moss']) upd(c[n]);
      milo.setFace('flat'); pip.setFace('happy'); mimi.setFace('open'); moss.setFace('open');
      // Pip & the LASER 9000
      if (between(T, t('pip_watch'), t('pop'))) { pip.armL.rotation.z = -0.9; pip.armR.rotation.z = 0.9; pip.root.position.z += 0.1; }
      const spin = T >= t('slap') ? easeOut(P(T, t('slap'), t('slap', 0.3))) * (1 - EIO(P(T, e('silence3') - 0.2, e('pip_thankyou')))) : 0;
      pip.root.rotation.y += spin * Math.PI; pip.bodyG.rotation.z = spin * 0.2;
      if (T >= t('slap')) pip.setFace(T < e('silence3') ? 'closed' : 'happy');
      if (between(T, t('laser_1', 1.0), e('laser_2'))) { pip.setFace('wide'); pip.armL.rotation.z = -2.4 + Math.sin(T * 20) * 0.3; pip.armR.rotation.z = 2.4 + Math.sin(T * 20 + 1) * 0.3; }
      for (const b of ['bonk1', 'bonk2']) if (between(T, t(b, -0.15), t(b, 0.1))) { pip.armR.rotation.set(-1.4, 0, 0.4); }
      if (between(T, t('facepalm', -0.3), t('s4', 0.4))) { milo.armL.rotation.set(-1.5, 0, -0.6); milo.armR.rotation.set(-1.5, 0, 0.6); milo.setFace('closed'); const p = milo.root.position; milo.root.rotation.y = face(p.x, p.z, 0.2, -0.6); }
      // the device: in Pip's hands → stuck on the lock (on the fridge door from then on)
      if (laser.visible) {
        if (T < t('attach')) { laser.position.set(0.35, 0.62, -3.42); laser.rotation.set(0, 0, 0); laser.scale.setScalar(0.6); }
        else { laser.position.set(0.37, 0.8, -3.98); laser.rotation.set(0, 0, 0); const grow = 0.6 + (T >= t('bonk1') ? 0.12 : 0) + (T >= t('bonk2') ? 0.14 : 0); laser.scale.setScalar(grow); }
        const vib = between(T, t('brrr'), e('brrr')) || between(T, t('zap'), e('laser_2')) ? 0.02 : 0;
        laser.body.position.set(Math.sin(T * 80) * vib, Math.sin(T * 67) * vib, 0);
        laser.bulb.emissiveIntensity = between(T, t('beep'), e('laser_2')) ? (Math.sin(T * 20) > 0 ? 3 : 0.4) : 0.5;
        const sp = T < t('pop') ? 0 : T < t('slap', 0.05) ? easeOut(P(T, t('pop'), t('slap', 0.05))) * 1.25 : 1.25 * (1 - easeIn(P(T, t('slap', 0.3), t('slap', 0.9))));
        laser.setSpring(sp);
        spark.visible = between(T, t('zap'), e('laser_2')); if (spark.visible) spark.tick(T, true, laser.position.clone().add(V(0, 0.2, 0.1)));
      }
      // SCENE 4: Bobo finds the OPEN button
      if (T >= t('s4')) {
        const go = EIO(P(T, t('s4'), t('sniff', 0.3)));
        put(bobo, lerp(0.95, 0.32, go), lerp(-2.45, -3.72, go), Math.PI);
        bobo.update(T, { bounce: T < t('sniff', 0.3) ? 1 : 0.2 });
        bobo.head.rotation.x = between(T, t('bobo_looks'), t('bobo_looks', 0.5)) ? -0.5 : between(T, t('bobo_looks', 0.5), t('click', 0.2)) ? 0.45 : 0;
        if (between(T, t('click', -0.15), t('click', 0.15))) bobo.root.position.z -= 0.08;
        if (T >= t('turn_heads')) { for (const n of ['milo', 'pip', 'mimi', 'moss']) { const k = c[n]; const p = k.root.position; k.root.rotation.y = lerp(k.root.rotation.y, face(p.x, p.z, 0.32, -3.72), EIO(P(T, t('turn_heads'), e('turn_heads')))); k.setFace('wide'); } }
        if (T >= t('bobo_sits')) { bobo.update(T * 3, { bounce: 0.15 }); bobo.root.rotation.y = face(0.32, -3.72, 0, -2.5); }
        if (T >= t('moss_about')) moss.setFace('flat');
      } else { bobo.update(T, { bounce: 0.3 }); }
      // SCENE 5: the treasure, Milo reaches
      if (T >= t('s5')) {
        for (const n of ['milo', 'pip', 'mimi', 'moss']) { const k = c[n]; const p = k.root.position; k.root.rotation.y = face(p.x, p.z, 0, fz); k.setFace('wide'); }
        if (T >= t('pip_rich')) pip.setFace('happy'); if (T >= t('mimi_one')) mimi.setFace('flat');
        if (T >= t('reach')) { const r = EIO(P(T, t('reach'), e('reach'))); put(milo, lerp(-0.95, -0.2, r), lerp(-3.15, -3.55, r), Math.PI); milo.armR.rotation.set(-1.4 * r, 0, 0.2); milo.setFace('flat'); }
      }
      // whoever is talking turns to the team (and to camera) instead of to the fridge
      for (const n of ['milo', 'pip', 'mimi', 'moss']) {
        const line = cues.find((q) => q.kind === 'vo' && q.who === n && T >= q.t - 0.25 && T < q.t + q.dur + 0.3);
        if (line && !(n === 'milo' && T >= t('reach'))) { const k = c[n], p = k.root.position; k.root.rotation.y = lerp(k.root.rotation.y, face(p.x, p.z, 0.2, -0.6), EIO(P(T, line.t - 0.25, line.t))); }
      }
    } else if (T < t('lumi_five')) {
      // ---------------- SCENES 6–7: Lumi; the worst lie (lights on)
      put(lumi, 0, -0.35, Math.PI); upd(lumi, { bounce: 0 }); lumi.setFace('flat');
      lumi.armL.rotation.set(-0.9, 0, -0.2); lumi.armR.rotation.set(-0.9, 0, 0.2);
      put(milo, -0.2, -3.55, Math.PI); upd(milo); milo.armR.rotation.set(-1.4, 0, 0.2);
      put(pip, 0.85, -2.9, face(0.85, -2.9, 0, -0.35)); upd(pip); pip.setFace('wide');
      put(mimi, -1.6, -2.6, face(-1.6, -2.6, 0, -0.35)); upd(mimi); mimi.setFace('open'); bag.visible = true; bag.position.set(-1.6 + 0.45, 0.42, -2.35); bag.rotation.y = face(-1.6, -2.6, 0, -0.35);
      put(moss, -2.65, -1.9, face(-2.65, -1.9, 0, -0.35)); upd(moss); moss.armL.rotation.set(-1.2, 0, -0.3); moss.armR.rotation.set(-1.2, 0, 0.3); moss.setFace('open');
      S.plant.position.set(-2.65 + Math.sin(moss.root.rotation.y) * 0.62, 0.62, -1.9 + Math.cos(moss.root.rotation.y) * 0.62);   // held over his face only
      put(bobo, 0.75, -0.2, face(0.75, -0.2, 0, -2)); bobo.update(T * 2, { bounce: 0.15 });
      laser.visible = true; laser.position.set(0.37, 0.8, -3.98); laser.scale.setScalar(0.86); laser.setSpring(0);
      laser.bulb.emissiveIntensity = T < t('bonk3') ? (Math.sin(T * 9) > 0 ? 1.5 : 0.3) : 0; laser.body.position.set(Math.sin(T * 60) * (T < t('bonk3') ? 0.006 : 0), 0, 0);
      if (between(T, t('bonk3', -0.2), t('bonk3', 0.1))) { pip.root.position.x -= 0.1; pip.bodyG.rotation.z = 0.3; }
      if (T >= t('withdraw')) { const w = EIO(P(T, t('withdraw'), e('withdraw'))); milo.armR.rotation.set(-1.4 * (1 - w), 0, 0.2); milo.root.rotation.y = lerp(Math.PI, face(-0.2, -3.55, 0, -0.35), w); milo.setFace(T < t('milo_security') ? 'happy' : 'open'); }
      if (T >= t('lumi_doubt')) milo.setFace('wide');
      if (T >= t('milo_security')) milo.setFace('happy');
      if (T >= t('moss_plant')) moss.setFace('closed');
      if (T >= t('plop', -0.35)) { const f = EIO(P(T, t('plop', -0.35), t('plop'))); fallingLeaf.visible = true; fallingLeaf.position.set(-2.55, lerp(1.45, 0.02, f), -1.85); fallingLeaf.rotation.set(f * 3, 0, f * 5); }
    } else {
      // ---------------- SCENES 8–11: RUN!, disaster, deadpan, punchline (lights on)
      put(lumi, 0, -0.35, Math.PI); upd(lumi, { bounce: 0 }); lumi.setFace('flat');
      lumi.armL.rotation.set(-0.9, 0, -0.2); lumi.armR.rotation.set(T < t('slowmo') && T >= t('lumi_five') ? -2.2 : -0.9, 0, 0.2);
      S.plant.position.set(-2.9, 0, -1.4);
      if (T < t('s10')) {
        const u = EIO(P(T, t('slowmo'), e('slowmo')));              // slow-motion progress
        const pre = T < t('slowmo');
        // Milo: runs, slips on the pen, floats feet-up
        const slip = clamp((u - 0.22) / 0.3);
        put(milo, lerp(-0.2, 1.6, u), lerp(-3.4, -3.1, u), pre ? face(-0.2, -3.4, 0, -0.35) : Math.PI / 2, slip * 0.7 * Math.sin(Math.min(1, slip) * Math.PI * 0.8), 0, 0);
        milo.root.rotation.x = slip * 1.3; upd(milo, { bounce: pre ? 0.35 : 1.5 }); milo.setFace(pre ? (T >= t('milo_run') ? 'angry' : 'wide') : 'wide');
        if (T >= t('milo_glance') && pre) milo.root.rotation.y += Math.sin(P(T, t('milo_glance'), e('milo_glance')) * Math.PI * 2) * 0.7;
        // Mimi: runs and throws the paper stack (it floats like snow)
        put(mimi, lerp(-1.6, 0.4, u), lerp(-2.6, -2.0, u), pre ? face(-1.6, -2.6, 0, -0.35) : Math.PI / 2 + 0.3); upd(mimi, { bounce: pre ? 0.35 : 1.5 }); mimi.setFace('wide');
        if (u > 0.25 && !pre) mimi.armR.rotation.z = 2.6;
        // Pip: backpack hooked on the drawer handle → stretch → SNAP
        const snapT = t('snap');
        const runK = clamp(u / 0.75), back = T >= snapT ? easeIn(P(T, snapT, snapT + 0.25)) : 0;
        const px = lerp(lerp(-0.9, 1.4, runK), -1.3, back), pz = lerp(lerp(-3.7, -2.4, runK), -4.0, back);
        put(pip, px, pz, pre ? face(0.85, -2.9, 0, -0.35) : face(-1.55, -4.26, px, pz)); upd(pip, { bounce: pre ? 0.35 : 1.5 }); pip.setFace(T >= t('pip_uhoh') ? 'wide' : 'angry');
        if (!pre) pip.root.rotation.x = back * -0.6;
        if (!pre && T < snapT + 0.05) { strap.visible = true; const a = V(-1.55, 0.5, -4.26), b = V(px, 0.62, pz).add(V(-Math.sin(pip.root.rotation.y + Math.PI) * -0.6, 0, -Math.cos(pip.root.rotation.y + Math.PI) * -0.6)); strap.position.copy(a).lerp(b, 0.5); strap.scale.set(1, a.distanceTo(b), 1); strap.lookAt(b); strap.rotateX(Math.PI / 2); }
        // Moss leaps over the chair; Bobo zooms underneath; Moss spins
        const jump = clamp((u - 0.3) / 0.5);
        put(moss, lerp(-2.4, 0.2, u), lerp(-1.9, -1.7, u), pre ? face(-2.65, -1.9, 0, -0.35) : Math.PI / 2, Math.sin(jump * Math.PI) * 1.0, jump > 0.4 ? (jump - 0.4) / 0.6 * Math.PI * 2 : 0);
        upd(moss, { bounce: pre ? 0.35 : 1.5 }); moss.setFace(T >= t('milo_run') ? 'wide' : 'open');
        put(bobo, pre ? 0.75 : lerp(-3.6, 3.0, clamp((u - 0.35) / 0.4)), pre ? -0.2 : -1.75, pre ? face(0.75, -0.2, 0, -2) : Math.PI / 2); bobo.update(T * 2, { bounce: 1.2 });
        laser.visible = false;
        if (!pre) {
          for (let i = 0; i < 60; i++) { const a = i * 2.39, k = clamp((u - 0.28) * 1.4); dummy.position.set(-0.4 + Math.cos(a) * k * 1.4 + k * 0.6, 0.9 + Math.sin(i * 1.7) * 0.3 + k * 1.2 - k * k * 0.6, -2.0 + Math.sin(a) * k * 1.2); dummy.rotation.set(T * 0.6 + i, i, T * 0.4); dummy.scale.setScalar(k > 0 ? 1 : 0.0001); dummy.updateMatrix(); S.papers.setMatrixAt(i, dummy.matrix); }
          S.papers.instanceMatrix.needsUpdate = true;
        }
        S.papers.visible = !pre;
        // SCENE 9: the crash, real time
        if (T >= t('crash')) {
          const k = P(T, t('crash'), t('chaos_end'));
          put(milo, 2.2, -2.6, -Math.PI / 2, 0.5, -Math.PI / 2); milo.setFace('closed');
          put(pip, lerp(-1.3, 2.0, easeOut(P(T, t('boing2', -0.15), t('boing2')))), lerp(-4.0, -2.4, easeOut(P(T, t('boing2', -0.15), t('boing2')))), 0, 0.3 + Math.sin(k * Math.PI) * 0.5, 0, k * 6);
          put(mimi, -0.4, -1.9, -Math.PI / 2, 0.4, 0, Math.PI / 2); put(moss, -0.9, -1.9, Math.PI / 2, 0.4, 0, -Math.PI / 2);
          S.desk.position.x = 3.0 + Math.sin(T * 60) * 0.03 * (1 - k);
          S.papers.visible = false;
        }
      } else {
        // SCENE 10–11 tableau
        put(milo, 2.0, -2.6, -Math.PI / 2, 0.5, -Math.PI / 2); upd(milo, { bounce: 0 }); milo.setFace('closed');
        put(pip, 4.4, -1.8, face(4.4, -1.8, 0.9, -1.0), 0.05, 0, 0.25); upd(pip, { bounce: 0 }); pip.setFace('closed');
        put(mimi, -1.2, -2.9, face(-1.2, -2.9, 0, 0)); upd(mimi, { bounce: 0 }); shade.visible = true; mimi.setFace('flat');
        put(moss, -2.4, -2.3, face(-2.4, -2.3, 0, 0)); upd(moss, { bounce: 0 }); wrap.visible = true; moss.setFace('open'); moss.armL.rotation.z = 0; moss.armR.rotation.z = 0;
        put(lumi, -0.4, -2.4, face(-0.4, -2.4, 0.9, -1.7));
        put(bobo, 0.9, -1.7, face(0.9, -1.7, 0.6, 1.5)); bobo.update(T, { bounce: 0 });
        const nomK = [t('nom1'), t('nom2'), t('nom3'), t('nom4')].filter((x) => T >= x).length;
        bowlMochi.visible = T < t('s11', 0.3); bowlMochi.scale.setScalar(1.4 * (1 - nomK * 0.22));
        bowlMochi.position.set(0.9 + Math.sin(bobo.root.rotation.y) * 0.42, 0.42, -1.7 + Math.cos(bobo.root.rotation.y) * 0.42);
        bobo.head.rotation.x = between(T, t('bobo_stops'), t('nom4')) ? -0.25 : Math.abs(Math.sin(T * 14)) * 0.12;
        if (T >= t('cut_lumi')) lumi.setFace('flat');
        if (T >= t('both_him')) { // both point at Bobo
          pip.setFace('open'); pip.armR.rotation.z = 2.0; milo.root.rotation.x = -Math.PI / 2 + 0.25; milo.armR.rotation.set(0, 0, 2.2); milo.setFace('open');
        }
        if (T >= t('woof')) { bobo.root.position.y = Math.sin(P(T, t('woof'), t('woof', 0.35)) * Math.PI) * 0.3; }
        if (T >= t('s11')) {
          // everyone back on their feet, staring at the drawer
          const st = [['milo', -0.3, -1.6], ['pip', 0.5, -1.4], ['mimi', -1.1, -1.2], ['moss', 1.3, -1.7]];
          for (const [n, x, z] of st) { put(c[n], x, z, face(x, z, -1.55, -4.2)); upd(c[n], { bounce: 0 }); c[n].setFace('wide'); }
          shade.visible = true; wrap.visible = true;
          put(lumi, -2.5, -3.7, face(-2.5, -3.7, -1.55, -4.0)); lumi.armL.rotation.set(-0.9, 0, -0.2); lumi.armR.rotation.set(-1.0, 0, 0.2);
          put(bobo, 1.4, -0.6, face(1.4, -0.6, -1.55, -4.2)); bobo.update(T * 2, { bounce: 0.2 });
          if (T >= t('pip_said', -0.4)) { pip.root.rotation.y = lerp(pip.root.rotation.y, face(0.5, -1.4, -0.3, -1.6), EIO(P(T, t('pip_said', -0.4), t('pip_said')))); pip.setFace('flat'); }
          if (T >= t('milo_was')) { milo.root.rotation.y = face(-0.3, -1.6, 0.5, -1.4); milo.setFace('flat'); }
          if (T >= t('milo_points_up')) milo.armR.rotation.z = 2.9;
          if (T >= t('lumi_stare')) { lumi.root.rotation.y = face(-2.5, -3.7, -0.3, -1.6); lumi.setFace('flat'); }
        }
      }
    }
    // smoke cloud (paper POOF) + cup splash
    cloud.forEach(({ m, a, r, y }) => { const k = P(T, t('paper_poof'), t('paper_poof', 1.4)); m.visible = k > 0 && k < 1; m.position.set(2.1 + Math.cos(a) * r * (0.6 + k), y + k * 0.4, -2.5 + Math.sin(a) * r * 0.6); m.scale.setScalar(0.6 + k * 1.2); m.material.opacity = 1 - k; });
    drops.forEach(({ m, a, v }) => { const k = T - t('splash'); m.visible = k > 0 && k < 0.7; m.position.set(0.25 + Math.cos(a) * v * k * 0.6, 0.8 + v * k - 4.9 * k * k, -0.5 + Math.sin(a) * v * k * 0.4); });
    // drawer, fridge door, auto-door, lights
    S.drawer.position.z = 0.02 + EIO(P(T, t('drawer'), t('drawer', 0.5))) * 0.62; S.drawerGlow.intensity = T >= t('drawer') ? 2.5 : 0;
    S.fridgeDoor.rotation.y = -1.9 * easeOut(P(T, t('ding2'), t('ding2', 0.6)));
    const dOpen = T >= t('ding') ? easeOut(P(T, t('ding'), t('ding', 0.3))) : 0;
    S.doorL.position.x = -0.55 - dOpen * 1.05; S.doorR.position.x = 0.55 + dOpen * 1.05; S.doorLamp.emissiveIntensity = dOpen ? 2 : 0.5;
    S.mochi.visible = T < t('s10'); S.mochi.glow.intensity = between(T, t('s5'), t('s6')) ? 1.5 + Math.sin(T * 4) * 0.4 : 0.4;
    S.lockLed.emissive.set(T >= t('ding2') ? 0x40ff80 : 0xff3040);
    const on = T >= t('lightswitch') ? 1 : 0;
    scene.environmentIntensity = on ? 0.7 : 0.12;
    hemi.intensity = on ? 1.2 : 0.25; hemi.color.set(on ? 0xffffff : 0x8fa8ff); hemi.groundColor.set(on ? 0xd8c8b8 : 0x403050);
    key.intensity = on ? 2.0 : 0.6; key.color.set(on ? 0xfff0dc : 0x8fb0ff); fill.intensity = on ? 0.6 : 0.15;
    S.ceilingPanels.forEach((m) => (m.emissiveIntensity = on ? 1.5 : 0)); scene.background.set(on ? 0xf3e6f7 : 0x0c1030);
    corridorGlow.intensity = on ? 0 : 3; S.fridgeLight.intensity = on ? 0.8 : 2.5;
  }

  // ------------------------------------------------------------------ camera
  const tmp = new THREE.Vector3();
  /** a camera position in front of a character's face */
  function cu(k, d = 1.5, side = 0.25, up = 0.12) {
    k.root.updateMatrixWorld(true); const f = k.face ? k.face.getWorldPosition(new THREE.Vector3()) : k.head.getWorldPosition(new THREE.Vector3());
    const ry = k.root.rotation.y, fwd = V(Math.sin(ry), 0, Math.cos(ry)), right = V(Math.cos(ry), 0, -Math.sin(ry));
    d *= 1.75;
    return { p: f.clone().add(fwd.multiplyScalar(d)).add(right.multiplyScalar(side * d)).add(V(0, up + 0.08, 0)), l: f, subject: k };
  }
  const fixed = (p, l, fov) => () => ({ p: V(...p), l: V(...l), fov });
  const move = (p0, p1, l0, l1, a, b, fov) => (T) => { const k = EIO(P(T, a, b)); return { p: V(...p0).lerp(V(...p1), k), l: V(...l0).lerp(V(...l1), k), fov }; };
  const SHOTS = [
    // SCENE 1
    [0, move([0.7, 0.28, 0.4], [0.6, 0.3, 0.35], [-1.6, 1.1, 5.5], [-1.5, 0.9, 3.0], 0, t('pip_looks'), 33)],
    [t('pip_looks'), () => cu(c.pip, 1.6, -0.35)],
    [t('milo_never'), () => cu(c.milo, 1.3, 0.3)],
    [t('milo_points'), move([-2.0, 1.35, 4.2], [-0.3, 0.95, 0.9], [-0.2, 0.9, -4.6], [0, 0.82, -4.6], t('milo_points'), e('milo_last'), 30)],
    [t('gulp'), () => cu(c.pip, 1.2, -0.3)],
    [t('milo_focus'), () => cu(c.milo, 1.1, 0.3)],
    // SCENE 2
    [t('s2'), fixed([-0.9, 1.4, 8.2], [0.9, 0.8, 3.4], 36)],
    [t('milo_3'), () => cu(c.milo, 1.2, 0.0, 0.05)],
    [t('pip_2'), () => cu(c.pip, 1.3, 0.2)],
    [t('mimi_1'), () => cu(c.mimi, 1.4, 0.3)],
    [t('whoosh', -0.05), fixed([0.1, 1.25, 7.6], [-0.2, 0.7, -1.8], 38)],                      // locked: kick → door → faceplant
    [t('pip_stealthy', -0.3), fixed([-1.9, 1.15, -3.3], [0.2, 0.5, -1.0], 42)],
    [t('milo_thanks', -0.2), fixed([-0.15, 0.3, -3.95], [-0.4, 0.35, -2.6], 40)],                // floor level on Milo's face
    // SCENE 3
    [t('s3'), fixed([2.2, 1.5, -0.6], [0, 0.8, -3.6], 38)],
    [t('pip_waiting'), () => cu(c.pip, 1.4, 0.3)],
    [t('device_out'), fixed([1.4, 1.1, -1.7], [0.35, 0.7, -3.3], 36)],
    [t('moss_why'), () => cu(c.moss, 1.3, -0.3)],
    [t('pip_8000'), () => cu(c.pip, 1.3, 0.3)],
    [t('attach'), fixed([1.8, 1.3, -1.6], [0.2, 0.75, -3.6], 38)],
    [t('silence3'), () => cu(c.pip, 1.4, 0)],
    [t('mimi_liked'), () => cu(c.mimi, 1.3, 0.3)],
    [t('pip_thankyou'), () => cu(c.pip, 1.3, 0.2)],
    [t('zap'), fixed([1.5, 1.2, -1.9], [0.3, 0.8, -3.7], 36)],
    [t('facepalm', -0.3), () => cu(c.milo, 1.4, 0.2)],
    // SCENE 4
    [t('s4'), fixed([1.4, 0.35, -2.6], [0.3, 0.25, -3.9], 38)],
    [t('click', -0.1), fixed([0.95, 0.22, -3.35], [0.3, 0.12, -4.12], 32)],
    [t('ding2'), fixed([2.2, 1.3, -0.8], [0.2, 0.8, -3.5], 40)],
    [t('moss_about'), () => cu(c.moss, 1.3, -0.3)],
    [t('milo_nope'), () => cu(c.milo, 1.3, 0.3)],
    // SCENE 5
    [t('s5'), move([0, 1.15, -2.9], [0, 0.95, -3.7], [0, 0.85, -4.55], [0, 0.86, -4.55], t('s5'), e('push_mochi'), 28)],
    [t('pip_rich'), fixed([0.2, 1.0, -4.0], [0, 0.85, -2.6], 44)],
    [t('mimi_one'), () => cu(c.mimi, 1.3, 0.3)],
    [t('pip_emo'), () => cu(c.pip, 1.2, -0.2)],
    [t('reach'), fixed([1.2, 1.1, -2.9], [-0.1, 0.85, -4.2], 34)],
    // SCENE 6
    [t('lightswitch'), fixed([1.9, 1.9, -5.5], [-0.2, 0.75, -1.2], 46)],
    [t('withdraw'), () => cu(c.milo, 1.6, 0.25)],
    [t('lumi_milo'), () => cu(c.lumi, 1.6, -0.2)],
    [t('milo_funny'), () => cu(c.milo, 1.4, 0.25)],
    [t('lumi_scan'), () => cu(c.lumi, 1.5, -0.2)],
    // SCENE 7
    [t('milo_security'), () => cu(c.milo, 1.4, 0.2)],
    ...[c.pip, 'laser', c.mimi, 'bag', c.moss].map((s, i) => {
      const a = t('lumi_looks') + (Q.lumi_looks.dur / 5) * i;
      if (s === 'laser') return [a, fixed([0.9, 1.0, -2.9], [0.37, 0.8, -3.98], 34)];
      if (s === 'bag') return [a, fixed([-0.6, 0.75, -1.4], [-1.15, 0.45, -2.35], 30)];
      return [a, () => cu(s, 1.5, 0)];
    }),
    [t('moss_plant'), fixed([-1.6, 1.0, -0.6], [-2.65, 0.65, -1.9], 34)],
    [t('noreact'), () => cu(c.lumi, 1.3, 0)],
    // SCENE 8
    [t('lumi_five'), () => cu(c.lumi, 1.6, -0.25)],
    [t('milo_glance'), () => cu(c.milo, 1.4, 0.2)],
    [t('milo_run'), fixed([0.6, 2.0, 0.4], [0.2, 0.8, -2.8], 52)],
    // SCENE 9
    [t('crash'), fixed([0.4, 2.0, -0.2], [1.4, 0.6, -2.6], 50)],
    // SCENE 10
    [t('s10'), move([0.3, 2.3, -0.5], [0.6, 1.9, -0.3], [0.4, 0.5, -2.5], [0.6, 0.5, -2.2], t('s10'), e('s10'), 52)],
    [t('nom1'), move([1.0, 0.95, -0.25], [0.95, 0.65, -0.55], [0.9, 0.45, -1.7], [0.9, 0.42, -1.7], t('nom1'), e('nom4'), 36)],
    [t('cut_lumi'), () => cu(c.lumi, 1.4, 0)],
    [t('both_him'), fixed([0.8, 2.2, 0.2], [1.6, 0.4, -1.8], 52)],
    [t('woof'), fixed([1.1, 0.8, -0.3], [0.9, 0.5, -1.7], 40)],
    // SCENE 11
    [t('s11'), fixed([0.15, 1.45, -2.7], [0, 0.78, -4.5], 36)],                                 // the empty plate
    [t('drawer', -0.1), fixed([-1.3, 2.3, -2.9], [-1.55, 0.45, -4.05], 40)],
    [t('reveal', 0.25), fixed([-0.4, 1.9, -3.6], [0.1, 0.75, -1.5], 48)],
    [t('pip_said', -0.1), () => cu(c.pip, 1.3, -0.3)],
    [t('milo_was'), () => cu(c.milo, 1.4, 0.3)],
    [t('lumi_stare'), () => cu(c.lumi, 1.3, 0)],
  ].sort((a, b) => a[0] - b[0]);
  function cam(T) {
    let s = SHOTS[0]; for (const sh of SHOTS) if (T >= sh[0]) s = sh;
    const o = s[1](T);
    if (T < t('s3')) { o.p.x = clamp(o.p.x, -2.05, 2.05); o.p.z = clamp(o.p.z, 0.3, 8.6); }
    else { o.p.x = clamp(o.p.x, -5.1, 5.1); o.p.z = clamp(o.p.z, -5.9, -0.15); }
    camera.fov = o.fov || 35; camera.updateProjectionMatrix(); camera.position.copy(o.p); camera.lookAt(o.l);
    // editing cheat: anything between the lens and the subject (or hugging the lens) is hidden for this shot
    const seg = o.l.clone().sub(o.p), L = seg.length(); seg.normalize();
    const blockers = [...Object.values(c).map((k) => [k.root, 0.62 * k.root.scale.y, 0.75]), [laser, 0.3, 0.7], [bag, 0, 0.35], [S.chair, 0.6, 0.6]];
    for (const [obj, cy, r] of blockers) {
      if (!obj.visible || (o.subject && obj === o.subject.root)) continue;
      if (!o.subject && obj.position.clone().add(V(0, cy, 0)).distanceTo(o.l) < 1.0) continue;
      const q = obj.position.clone().add(V(0, cy, 0)).sub(o.p), along = q.dot(seg), off = q.clone().sub(seg.clone().multiplyScalar(along)).length();
      if (q.length() < 1.2 || (along > 0.05 && along < L - 0.3 && off < r * 1.4)) obj.visible = false;
    }
    const shake = between(T, t('crash'), t('chaos_end', 0.2)) ? 0.05 : between(T, t('thud'), t('thud', 0.25)) ? 0.03 : between(T, t('slap'), t('slap', 0.15)) ? 0.03 : 0;
    camera.position.x += Math.sin(T * 67) * shake; camera.position.y += Math.sin(T * 51 + 1) * shake;
  }

  const toScreen = (obj) => { obj.getWorldPosition(tmp); tmp.project(camera); return [(tmp.x + 1) / 2 * W, (1 - tmp.y) / 2 * H, tmp.z]; };

  return {
    scene, camera, DURATION,
    update(T) { pose(T); cam(T); },
    overlay(ctx, T, F) {
      // treasure sparkles
      if (between(T, t('s5'), t('pip_rich')) || between(T, t('reveal', 0.6), t('pip_said'))) { const o = T < t('pip_rich') ? S.mochi : S.drawer; const [x, y] = toScreen(o); for (let i = 0; i < 6; i++) star(ctx, x + Math.cos(i * 1.7 + T) * 120, y - 40 + Math.sin(i * 2.3 + T * 1.3) * 70, 14 * Math.max(0, Math.sin(T * 4 + i * 1.3))); }
      if (between(T, t('gulp'), e('pip_beautiful'))) { const [x, y] = toScreen(c.pip.face); star(ctx, x - 40, y - 20, 16 * Math.abs(Math.sin(T * 6))); star(ctx, x + 40, y - 18, 13 * Math.abs(Math.sin(T * 6 + 1))); }
      // slow-motion tint & letterbox
      if (between(T, t('slowmo'), t('crash'))) { ctx.fillStyle = 'rgba(120,160,255,0.08)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, 50); ctx.fillRect(0, H - 50, W, 50); }
      captions(ctx, T, cues, F);
      if (T >= t('black')) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); captions(ctx, T, cues, F); }
    },
  };
}

function star(ctx, x, y, r) {
  if (r <= 0.5) return;
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(255,200,230,0.95)'; ctx.shadowBlur = 14;
  ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.28 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.restore();
}

function captions(ctx, T, cues, F) {
  const live = cues.filter((q) => q.kind === 'vo' && T >= q.t - 0.05 && T < q.t + Math.max(q.dur + 0.4, 0.9));
  const cue = live[live.length - 1]; if (!cue) return;
  const [who, text] = LINES[cue.id]; const end = cue.t + Math.max(cue.dur + 0.4, 0.9);
  const a = clamp(prog(T, cue.t - 0.05, cue.t + 0.08)) * (1 - prog(T, end - 0.12, end));
  ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const size = text.length > 36 ? 38 : 46, y = H - 78;
  ctx.font = `700 26px ${F}`; ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.fillStyle = NAME_COL[who] || '#fff';
  ctx.strokeText(who.toUpperCase(), W / 2, y - size); ctx.fillText(who.toUpperCase(), W / 2, y - size);
  ctx.font = `700 ${size}px ${F}`; ctx.strokeStyle = '#1c1420'; ctx.lineWidth = 9; ctx.strokeText(text, W / 2, y); ctx.fillStyle = '#fff'; ctx.fillText(text, W / 2, y);
  ctx.restore();
}
