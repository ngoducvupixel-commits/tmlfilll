// Surprise!: choreography + camera. Everything is a pure function of T, timed from cue ids.
import * as THREE from 'three';
import { lerp, prog, clamp, easeOut, easeIn, easeInOut, easeBack, bounce, at, sph } from '../../../engine/kit.js';
import { FAMILY, useLook } from '../../../engine/characters/mochi.js';
import { cupAndTablet } from '../../../engine/characters/accessories.js';
import { clock, mouth } from '../../../engine/timeline.js';
import { faceCU, fixed, move, shotRunner, characterBlockers, toScreen } from '../../../engine/camera.js';
import { captions, star } from '../../../engine/overlay.js';
import { buildRoom, ROOM, birthdayBanner, drapedBanner, stepStool, cakeCart, partyHat, popper, groceryBag, confetti } from './set.js';

const face = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
const P = prog, EIO = easeInOut;

export const LINES = {
  mimi_left: ['Mimi', 'A little left.'], mimi_more: ['Mimi', 'More left…'], moss_fine: ['Moss', '…I’m fine.'],
  pip_behold: ['Pip', 'Behold! The cake!'], mimi_beautiful: ['Mimi', 'It’s beautiful!'],
  moss_coming: ['Moss', 'She’s coming.'], milo_hide: ['Milo', 'Everybody hide!'],
  pip_oops: ['Pip', '…oops.'], all_surprise: ['Everyone', 'SURPRISE!'], mimi_happy: ['Mimi', 'Happy birthday, Lumi!'],
  lumi_birthday: ['Lumi', '…Is it my birthday?'], milo_yes: ['Milo', 'Yes!'], lumi_next: ['Lumi', 'It’s next week.'],
  milo_early: ['Milo', '…Early surprise.'], pip_eat: ['Pip', 'So… can we eat the cake now?'], lumi_best: ['Lumi', '…Best birthday ever.'],
};

export function build({ lipsync, cues }) {
  const { t, e, between } = clock(cues);
  useLook('jelly');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf7c6d6);
  scene.environmentIntensity = 0.45;
  const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.05, 100);
  scene.add(new THREE.HemisphereLight(0xfff6fa, 0xd8a8c0, 0.62));
  const sun = new THREE.DirectionalLight(0xffe2bc, 2.3); sun.position.set(-7.5, 7.5, -9); sun.target.position.set(0.5, 0, 0); scene.add(sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 40 }); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.03;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffeef5, 0.55); fill.position.set(2, 4, 8); scene.add(fill);

  const S = buildRoom(scene);
  const banner = birthdayBanner(); scene.add(banner);
  const draped = drapedBanner(); scene.add(draped);
  const stool = stepStool(); stool.position.set(-1.9, 0, -3.9); scene.add(stool);
  const cart = cakeCart(); scene.add(cart);
  const conf = confetti(); scene.add(conf);
  const cream = confetti(70); cream.material.color.set(0xfffaf0); scene.add(cream);

  const c = Object.fromEntries(['milo', 'pip', 'lumi', 'mimi', 'moss', 'bobo'].map((n) => [n, FAMILY[n]()]));
  Object.values(c).forEach((k) => scene.add(k.root));
  c.bobo.root.scale.setScalar(0.8);
  const hats = Object.fromEntries([['milo', 0x7cc4ff], ['pip', 0xff7a8a], ['mimi', 0xb49bff], ['moss', 0xffd23f]].map(([n, col]) => { const h = partyHat(col); h.position.y = -0.02; c[n].top.add(h); return [n, h]; }));
  const shade = new THREE.Group(); shade.add(at(new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.55, 32, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xfff1c4, side: THREE.DoubleSide, roughness: 0.6 })), 0, 0.12, 0)); c.moss.top.add(shade);
  const pop = popper(); pop.position.set(0, 0.05, 0.08); c.pip.armR.hand.add(pop);
  const bag = groceryBag(); bag.position.set(-0.05, -0.15, 0.12); c.lumi.armL.hand.add(bag);
  const { tab } = cupAndTablet(); tab.position.set(0.1, 0.1, 0.12); c.lumi.armR.hand.add(tab);
  // cream dots that land on everyone's face after the WOOF
  const dots = Object.fromEntries(['milo', 'pip', 'lumi', 'mimi', 'moss'].map((n, i) => { const g = new THREE.Group(); for (let k = 0; k < 3; k++) { const d = sph(0.05 + 0.02 * ((i + k) % 3), new THREE.MeshPhysicalMaterial({ color: 0xfffaf0, roughness: 0.2, clearcoat: 1 })); d.scale.z = 0.5; d.position.set(Math.sin(i * 3 + k * 2) * 0.3, Math.cos(i * 2 + k * 3) * 0.2 + 0.05, 0.06); g.add(d); } c[n].face.add(g); return [n, g]; }));
  const bowlHead = new THREE.Group(); scene.add(bowlHead);

  const DOOR = [5.2, -2.6], LUMI_SPOT = [3.0, -0.6], CART = [0.9, -1.6];
  const groupSpots = { milo: [1.25, 0.25], pip: [0.35, 0.55], mimi: [-0.5, 0.25], moss: [-1.25, -0.25] };
  const hideSpots = { milo: [-0.4, -4.12, -0.42], pip: [0.9, -2.35, -0.55], mimi: [-1.3, -4.0, 0], moss: [-2.3, -3.75, 0] };

  function pose(T) {
    const { milo, pip, lumi, mimi, moss, bobo } = c;
    for (const k of Object.values(c)) { k.root.visible = true; k.root.rotation.set(0, 0, 0); k.root.position.y = 0; k.bodyG.rotation.set(0, 0, 0); }
    const frozen = between(T, t('hide_hold'), t('popper')) || between(T, t('next_week_pause'), t('milo_early'));
    for (const n of ['milo', 'pip', 'lumi', 'mimi', 'moss']) c[n].setSing(frozen ? 0 : mouth(lipsync, n, T));
    const put = (k, x, z, ry, y = 0) => { k.root.position.set(x, y, z); k.root.rotation.y = ry; };
    const go = (k, opt = {}) => k.update(T, { bounce: frozen ? 0 : 0.35, blink: !frozen, ...opt });
    Object.values(hats).forEach((h) => (h.visible = T >= t('all_surprise', -0.05)));
    shade.visible = between(T, t('hidden', -0.4), t('all_surprise'));
    pop.visible = between(T, t('keys'), t('all_surprise'));
    bag.visible = T >= t('door') && T < t('lumi_checks'); tab.visible = T >= t('lumi_checks');
    Object.values(dots).forEach((d) => (d.visible = T >= t('cream', 0.15)));
    lumi.root.visible = T >= t('door', 0.2);

    // --- banner: crooked → falls on Moss → re-hung (cut) --------------------------------
    const tilt = T < t('milo_shuffle') ? 0.2 : T < t('milo_lean') ? lerp(0.2, 0.09, EIO(P(T, t('milo_shuffle'), e('milo_shuffle')))) : lerp(0.09, -0.12, EIO(P(T, t('milo_lean'), e('milo_lean'))));
    if (T < t('banner_fall')) { at(banner, -0.5, 2.25, ROOM.back + 0.14, 0, 0, tilt); banner.visible = true; draped.visible = false; }
    else if (T < t('banner_thud', 0.05)) { const f = easeIn(P(T, t('banner_fall'), t('banner_thud', 0.05))); at(banner, lerp(-0.5, 0.25, f), lerp(2.25, 1.3, f), ROOM.back + 0.14 + f * 1.0, f * 1.2, 0, -0.12 + f * 0.6); banner.visible = true; draped.visible = false; }
    else if (T < t('roll')) { banner.visible = false; draped.visible = true; draped.position.set(0.25, 0.75, -3.4); draped.rotation.set(0, 0, 0.06); }
    else { banner.visible = true; draped.visible = false; at(banner, -0.5, 2.25, ROOM.back + 0.14, 0, 0, 0.1); }   // re-hung (still crooked)
    stool.visible = T < t('roll');

    // --- cart & cake -----------------------------------------------------------------
    const rk = T < t('roll') ? 0 : easeOut(P(T, t('roll'), e('roll')));
    cart.position.set(lerp(6.8, CART[0], rk), 0, CART[1]); cart.rotation.y = 0;
    const smash = T >= t('reveal_bobo') ? 1 : 0;
    cart.cake.scale.set(1 + smash * 0.08, 1 - smash * 0.4, 1 + smash * 0.08);
    cart.candle.visible = !smash; cart.flameLight.intensity = smash ? 0 : 0.8 + Math.sin(T * 23) * 0.15;

    if (T < t('roll')) {
      // ===== SCENE 1: hanging the banner
      const lean = T >= t('milo_lean') ? EIO(P(T, t('milo_lean'), e('milo_lean'))) : 0;
      const wob = T >= t('banner_fall') ? Math.sin((T - t('banner_fall')) * 18) * Math.exp(-(T - t('banner_fall')) * 2.5) : 0;
      put(milo, -1.9 - (T >= t('milo_shuffle') ? EIO(P(T, t('milo_shuffle'), e('milo_shuffle'))) * 0.12 : 0), -3.85, Math.PI - 0.5, 0.54);
      go(milo, { bounce: 0.1 }); milo.armL.rotation.z = -2.4; milo.armR.rotation.z = 2.4 - lean * 0.6; milo.bodyG.rotation.z = lean * 0.45 + wob * 0.3;
      milo.setFace(T >= t('banner_fall') ? 'wide' : 'flat');
      put(mimi, 1.9, -0.9, face(1.9, -0.9, -0.6, -4)); go(mimi); mimi.setFace(T >= t('banner_fall') ? 'wide' : 'happy');
      if (between(T, t('mimi_left'), e('mimi_more'))) mimi.armL.rotation.z = -1.9;
      put(moss, 0.25, -3.35, 0.15); go(moss); moss.setFace(T >= t('banner_thud') ? 'flat' : 'open');
      if (T >= t('banner_thud')) { moss.bodyG.scale.y *= 0.97; }
      put(pip, 9, 9, 0); pip.root.visible = false; put(bobo, 9, 9, 0); bobo.root.visible = false; bobo.update(T);
    } else if (T < t('keys')) {
      // ===== SCENE 2: the cake rolls in
      put(pip, cart.position.x + 0.85, CART[1] - 0.05, -Math.PI / 2 + 0.5); go(pip, { bounce: T < e('roll') ? 1.2 : 0.4 });
      pip.armL.rotation.set(-1.2, 0, -0.1); pip.armR.rotation.set(-1.2, 0, 0.1);
      if (T >= t('pip_behold')) { pip.armL.rotation.set(0, 0, -2.5); pip.armR.rotation.set(0, 0, 2.5); pip.root.rotation.y = face(CART[0] + 0.85, CART[1], 1, 4); }
      pip.setFace(T >= t('pip_behold') ? 'happy' : 'open');
      put(mimi, -0.2, -0.5, face(-0.2, -0.5, CART[0], CART[1])); go(mimi); mimi.setFace(T >= t('mimi_beautiful') ? 'happy' : 'wide');
      if (T >= t('mimi_beautiful')) { mimi.armL.rotation.z = -2.2; mimi.armR.rotation.z = 2.2; }
      put(milo, -1.3, -2.4, face(-1.3, -2.4, CART[0], CART[1])); go(milo); milo.setFace('wide');
      put(moss, -0.6, -3.2, face(-0.6, -3.2, CART[0], CART[1])); go(moss); moss.setFace('open');
      const bk = EIO(P(T, t('sniff', -0.8), t('sniff', 0.3)));
      put(bobo, lerp(-3.5, 0.0, bk), -0.8, Math.PI / 2 - 0.2); bobo.update(T, { bounce: bk < 1 ? 1.4 : 0.2 });
      bobo.root.visible = T >= t('sniff', -0.8);
      if (T >= t('bobo_drool')) { bobo.root.rotation.y = face(0, -0.8, CART[0], CART[1]); bobo.head.rotation.x = -0.45; }
    } else if (T < t('popper')) {
      // ===== SCENE 3–4: keys, hide, Lumi enters, frozen silence
      const look = EIO(P(T, t('keys'), t('keys', 0.4)));
      const hideK = (n, i) => EIO(P(T, t('scramble1') + i * 0.12, t('hidden') + i * 0.1));
      const start = { milo: [-1.3, -2.4], pip: [CART[0] + 0.85, CART[1] - 0.05], mimi: [-0.2, -0.5], moss: [-0.6, -3.2] };
      ['milo', 'pip', 'mimi', 'moss'].forEach((n, i) => {
        const k = c[n], h = hideK(n, i), [sx, sz] = start[n], [hx, hz, hy] = hideSpots[n];
        const x = lerp(sx, hx, h), z = lerp(sz, hz, h);
        const ry = h > 0.02 && h < 0.98 ? face(sx, sz, hx, hz) : h >= 0.98 ? (n === 'pip' ? face(hx, hz, 4, 0) : 0.15) : lerp(face(sx, sz, CART[0], CART[1]), face(sx, sz, DOOR[0], DOOR[1]), look);
        put(k, x, z, ry, hy * h); go(k, { bounce: h > 0.02 && h < 0.98 ? 1.6 : frozen ? 0 : 0.2 });
        k.setFace(T < t('milo_hide') ? 'wide' : h >= 0.98 ? (n === 'moss' ? 'closed' : 'wide') : 'angry');
      });
      if (T >= t('hidden')) { c.moss.armL.rotation.z = -0.05; c.moss.armR.rotation.z = 0.05; c.moss.update(T, { bounce: 0, blink: false }); c.moss.setFace('closed'); }  // "I'm a lamp."
      if (T >= t('milo_hide') && T < t('scramble1')) { milo.armR.rotation.z = 2.4; }
      put(bobo, 0.0, -0.8, lerp(face(0, -0.8, CART[0], CART[1]), face(0, -0.8, DOOR[0], DOOR[1]), look)); bobo.update(T * 2, { bounce: frozen ? 0.05 : 0.2 });
      // Lumi comes home
      if (T >= t('door')) {
        const w = EIO(P(T, t('door', 0.2), e('lumi_enters')));
        put(lumi, lerp(DOOR[0], LUMI_SPOT[0], w), lerp(DOOR[1], LUMI_SPOT[1], w), face(DOOR[0], DOOR[1], LUMI_SPOT[0], LUMI_SPOT[1]));
        go(lumi, { bounce: w < 1 ? 1.0 : 0 }); lumi.setFace('open');
        if (T >= t('hide_hold')) { lumi.root.rotation.y = -Math.PI / 2 + Math.sin(P(T, t('hide_hold'), e('hide_hold')) * Math.PI * 2) * 0.7; lumi.setFace('flat'); }
        lumi.armL.rotation.set(-0.7, 0, -0.2);
      }
    } else {
      // ===== SCENE 4–6: popper, SURPRISE!, wrong day, Bobo & the cake
      put(lumi, LUMI_SPOT[0], LUMI_SPOT[1], -Math.PI / 2 + 0.25); go(lumi, { bounce: 0 }); lumi.setFace(T >= t('lumi_smile') ? 'happy' : 'flat');
      lumi.armL.rotation.set(-0.7, 0, -0.2);
      if (T >= t('lumi_checks')) lumi.armR.rotation.set(-1.35, 0, 0.3);
      const out = EIO(P(T, t('all_surprise', -0.15), t('all_surprise', 0.35)));
      ['milo', 'pip', 'mimi', 'moss'].forEach((n, i) => {
        const k = c[n], [hx, hz, hy] = hideSpots[n], [gx, gz] = groupSpots[n];
        const x = lerp(hx, gx, out), z = lerp(hz, gz, out);
        const jump = between(T, t('all_surprise', -0.15), e('all_surprise', 0.4)) ? Math.abs(Math.sin((T - t('all_surprise')) * 7 + i)) * 0.35 : 0;
        put(k, x, z, out < 1 ? face(hx, hz, gx, gz) : face(gx, gz, LUMI_SPOT[0], LUMI_SPOT[1]), out < 1 ? hy * (1 - out) : jump);
        go(k, { bounce: frozen ? 0 : 0.35 });
        if (between(T, t('all_surprise', -0.1), e('all_surprise', 0.3))) { k.armL.rotation.z = -2.5; k.armR.rotation.z = 2.5; k.setFace('happy'); }
        else k.setFace(T >= t('next_week_pause') ? 'wide' : T >= t('cream', 0.15) ? 'closed' : 'happy');
      });
      // Pip pops up early with the popper
      if (T < t('all_surprise', -0.15)) { const up = easeBack(P(T, t('popper', -0.1), t('popper', 0.15))); put(pip, hideSpots.pip[0], hideSpots.pip[1], face(hideSpots.pip[0], hideSpots.pip[1], LUMI_SPOT[0], LUMI_SPOT[1]), lerp(hideSpots.pip[2], 0, up)); pip.armR.rotation.z = 2.3; pip.setFace(T >= t('pip_oops') ? 'flat' : 'wide'); }
      if (T >= t('milo_yes') && T < t('lumi_checks')) { milo.setFace('happy'); milo.armR.rotation.z = 2.4; }
      if (T >= t('milo_early')) { milo.setFace('flat'); }
      if (T >= t('pip_eat')) { pip.setFace('open'); pip.root.rotation.y = face(groupSpots.pip[0], groupSpots.pip[1], CART[0], CART[1]); }
      if (T >= t('reveal_bobo')) for (const n of ['milo', 'pip', 'mimi', 'moss']) { const k = c[n], p = k.root.position; k.root.rotation.y = face(p.x, p.z, CART[0], CART[1]); k.setFace(T >= t('cream', 0.15) ? 'closed' : 'wide'); }
      if (T >= t('lumi_smile')) lumi.root.rotation.y = face(LUMI_SPOT[0], LUMI_SPOT[1], CART[0], CART[1]);
      // Bobo: beside the cart → (cut) face-first in the cake → WOOF
      if (T < t('reveal_bobo')) { put(bobo, 0.0, -0.8, face(0, -0.8, LUMI_SPOT[0], LUMI_SPOT[1])); bobo.update(T * 2, { bounce: frozen ? 0 : 0.3 }); }
      else {
        put(bobo, CART[0], CART[1] - 0.55, 0, 0.62); bobo.update(T, { bounce: 0 });
        const woofK = T >= t('woof') ? Math.sin(P(T, t('woof'), t('woof', 0.3)) * Math.PI) : 0;
        bobo.head.rotation.x = T < t('woof') ? 0.55 + Math.abs(Math.sin(T * 12)) * 0.12 * (T < t('lumi_smile') ? 1 : 0) : 0.1 - woofK * 0.4;
        bobo.root.position.y += woofK * 0.15;
        bobo.root.rotation.y = 0;
      }
    }
    if (!between(T, t('roll'), 1e9) || T >= t('keys')) {} // (no-op: keeps scene blocks readable)
    // candle stuck on Bobo's head after the dive
    cart.candle.parent !== cart.cake && cart.cake.add(cart.candle);
    bowlHead.visible = T >= t('reveal_bobo');
    if (bowlHead.visible && !bowlHead.children.length) bowlHead.add(at(new THREE.Group(), 0, 0, 0));
    if (bowlHead.visible) { c.bobo.head.updateMatrixWorld(true); c.bobo.head.getWorldPosition(bowlHead.position); bowlHead.position.y += 0.42; }
    // balloons bob, shafts shimmer
    S.balloons.forEach((b, i) => { b.position.set(b.base.x + Math.sin(T * 0.8 + i) * 0.05, b.base.y + Math.sin(T * 1.1 + i * 2) * 0.08, b.base.z); b.rotation.z = Math.sin(T * 0.9 + i) * 0.06; });
    S.shafts.forEach((s, i) => (s.material.opacity = 0.28 + Math.sin(T * 0.7 + i) * 0.06));
    S.doorLeaf.rotation.y = 1.3 * EIO(P(T, t('door'), t('door', 0.5)));
    // confetti & cream bursts
    c.pip.armR.hand.updateMatrixWorld(true);
    conf.tick(T, t('popper'), pop.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.2, 0)));
    cream.tick(T, t('cream'), new THREE.Vector3(CART[0], 1.2, CART[1] + 0.3));
  }
  // candle on Bobo's head (a second candle so the cake's own candle can vanish)
  const headCandle = cart.candle.clone(); scene.add(headCandle);

  const cam = shotRunner(camera, [
    // SCENE 1
    [0, move([-1.0, 2.6, 7.2], [-0.3, 2.2, 6.0], [-0.6, 1.9, -3], [-0.4, 1.8, -3], 0, e('s1'), 38)],
    [t('mimi_left'), () => faceCU(c.mimi, 1.3, 0.25)],
    [t('milo_shuffle'), fixed([-0.6, 2.1, 1.2], [-0.9, 2.6, -4.2], 42)],
    [t('mimi_more'), () => faceCU(c.mimi, 1.2, 0.25)],
    [t('milo_lean'), fixed([0.2, 2.0, 2.6], [-0.3, 2.0, -4.0], 40)],
    [t('moss_fine'), fixed([0.9, 1.1, -0.9], [0.25, 0.9, -3.4], 36)],
    // SCENE 2
    [t('roll'), move([2.6, 1.6, 3.8], [1.8, 1.5, 3.0], [2.0, 0.8, -1.6], [0.9, 0.9, -1.6], t('roll'), e('roll'), 40)],
    [t('pip_behold'), () => faceCU(c.pip, 1.6, -0.25)],
    [t('shimmer', 0.6), fixed([1.9, 1.5, -0.1], [0.9, 1.0, -1.6], 36)],
    [t('mimi_beautiful'), () => faceCU(c.mimi, 1.3, 0.2)],
    [t('sniff'), fixed([-0.6, 0.55, 1.4], [0.1, 0.45, -0.8], 40)],
    // SCENE 3
    [t('keys'), fixed([0.0, 2.2, 6.4], [0.8, 0.9, -1.6], 44)],
    [t('moss_coming'), () => faceCU(c.moss, 1.3, -0.2)],
    [t('milo_hide'), () => faceCU(c.milo, 1.1, 0.2)],
    [t('scramble1'), fixed([0.0, 2.4, 6.8], [-0.2, 0.8, -2.2], 46)],
    // SCENE 4
    [t('door'), fixed([-1.6, 1.6, 2.4], [4.6, 1.0, -2.2], 40)],
    [t('hide_hold'), move([0.4, 2.1, 6.4], [0.3, 2.0, 6.0], [0.3, 0.8, -2.0], [0.3, 0.8, -2.0], t('hide_hold'), e('hide_hold'), 48)],
    [t('popper', -0.05), fixed([2.2, 1.3, 0.8], [0.9, 0.8, -2.3], 40)],
    [t('pip_oops'), () => faceCU(c.pip, 1.2, -0.2)],
    [t('all_surprise', -0.2), fixed([-0.4, 1.8, 5.6], [0.8, 0.9, -0.4], 46)],
    [t('mimi_happy'), () => faceCU(c.mimi, 1.3, 0.25)],
    // SCENE 5
    [t('lumi_stare'), () => faceCU(c.lumi, 1.4, -0.2)],
    [t('milo_yes'), () => faceCU(c.milo, 1.3, 0.2)],
    [t('lumi_checks'), () => faceCU(c.lumi, 1.6, -0.3)],
    [t('next_week_pause'), fixed([0.8, 1.7, 5.6], [0.9, 0.85, -0.4], 42)],
    [t('milo_early'), () => faceCU(c.milo, 1.2, 0.2)],
    [t('pip_eat'), () => faceCU(c.pip, 1.3, -0.25)],
    // SCENE 6
    [t('reveal_bobo'), move([0.9, 1.5, 1.0], [0.9, 1.35, 0.4], [0.9, 1.05, -1.8], [0.9, 1.05, -1.8], t('reveal_bobo'), e('nom2'), 36)],
    [t('lumi_smile'), () => faceCU(c.lumi, 1.2, -0.15)],
    [t('woof', -0.1), fixed([2.0, 1.8, 3.4], [0.8, 0.95, -1.4], 40)],
    [t('splat_hold'), fixed([0.6, 1.7, 5.4], [0.8, 0.85, -0.6], 44)],
  ], {
    bounds: (T, o) => { o.p.x = clamp(o.p.x, ROOM.left + 0.4, ROOM.right - 0.4); o.p.z = Math.max(o.p.z, ROOM.back + 0.5); },
    blockers: () => [...characterBlockers(c), [cart, 0.6, 0.7]],
    shake: (T) => between(T, t('banner_thud'), t('banner_thud', 0.2)) ? 0.03 : between(T, t('popper'), t('popper', 0.15)) ? 0.03 : between(T, t('woof'), t('woof', 0.2)) ? 0.04 : 0,
  });

  return {
    scene, camera,
    update(T) {
      pose(T); cam(T);
      headCandle.visible = T >= t('reveal_bobo');
      if (headCandle.visible) { headCandle.position.copy(bowlHead.position); headCandle.rotation.set(0, 0, 0.25); }
    },
    overlay(ctx, T, F) {
      if (between(T, t('shimmer'), t('mimi_beautiful', 0.5))) { const [x, y] = toScreen(camera, cart.cake); for (let i = 0; i < 7; i++) star(ctx, x + Math.cos(i * 1.7 + T) * 140, y - 60 + Math.sin(i * 2.3 + T * 1.3) * 80, 16 * Math.max(0, Math.sin(T * 4 + i * 1.3))); }
      if (between(T, t('lumi_smile'), t('woof'))) { const [x, y] = toScreen(camera, c.lumi.face); for (let i = 0; i < 4; i++) star(ctx, x + Math.cos(i * 1.6 + T * 2) * 160, y - 50 + Math.sin(i * 2.1 + T * 2) * 60, 13 * Math.max(0, Math.sin(T * 5 + i))); }
      captions(ctx, T, cues, F, LINES);
      if (T >= t('black')) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1280, 720); }
    },
  };
}
