// "Don't Press the Red Button": one set, 18 shots. Everything is a pure function of song time T.
import * as THREE from 'three';
import { W, H, clamp, lerp, prog, easeOut, easeIn, easeInOut, easeBack, bounce, sph, at } from '../../../engine/kit.js';
import { FAMILY } from '../../../engine/characters/mochi.js';
import { room, machine, sideTable, crate, screwdriver } from './set.js';

export const DURATION = 35;
const P = prog, EIO = easeInOut;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const mixV = (a, b, k) => a.clone().lerp(b, k);
const shot = (T, a, b) => T >= a && T < b;

// ------------------------------------------------------------------ dialogue captions
export const LINES = {
  pip_ooh: ['Pip', 'Ooooh… button.'], milo_no: ['Milo', 'No.'], milo_NO: ['Milo', 'NO.'], pip_wasnt: ['Pip', '…I wasn’t gonna.'],
  lumi_stat: ['Lumi', 'Statistically… pressing that is extremely stupid.'], pip_how: ['Pip', 'How stupid?'],
  lumi_pip: ['Lumi', '…Pip stupid.'], pip_wow: ['Pip', 'WOW.'], milo_bobo: ['Milo', '…Bobo.'],
  pip_worth: ['Pip', '…worth it.'], milo_family: ['Milo', 'I need a new family!'],
};
export const NAME_COL = { Pip: '#e8a800', Milo: '#ff7a1a', Lumi: '#4a7cff', Mimi: '#ff5f97' };

export function build({ lipsync, cues }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfe4dc);
  scene.environmentIntensity = 0.7;
  const camera = new THREE.PerspectiveCamera(35, W / H, 0.02, 100);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8b890, 1.2));
  const key = new THREE.DirectionalLight(0xfff0dc, 2.3); key.position.set(3, 8, 6); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
  key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02; scene.add(key);
  const fill = new THREE.DirectionalLight(0xdfeaff, 0.6); fill.position.set(-5, 3, 6); scene.add(fill);
  room(scene);

  const mac = machine(); scene.add(mac.group);
  const table = sideTable(); table.position.set(3.6, 0, 0.3); scene.add(table);
  const box = crate(); box.position.set(0.8, 0, 1.3); box.rotation.y = 0.3; scene.add(box);
  const bigDriver = screwdriver(1); bigDriver.visible = false; scene.add(bigDriver);

  const c = Object.fromEntries(['milo', 'pip', 'lumi', 'mimi', 'moss', 'bobo'].map((n) => [n, FAMILY[n]()]));
  Object.values(c).forEach((k) => scene.add(k.root));
  const drv = screwdriver(1); drv.rotation.z = -Math.PI / 2; c.milo.armR.hand.add(drv);
  c.bobo.root.scale.setScalar(0.8);

  // smoke puffs for the POOF
  const puffM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true });
  const puffs = Array.from({ length: 26 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), puffM.clone()); scene.add(m); return { m, a: i * 2.4, r: 0.6 + (i % 5) * 0.35, y: 0.2 + (i % 4) * 0.4 }; });

  // ---- mouth from the lipsync envelopes
  const mouth = (who, T) => {
    for (const tr of lipsync.tracks[who] || []) { const i = Math.floor((T - tr.t) * lipsync.fps); if (i >= 0 && i < tr.v.length) return tr.v[i]; }
    return 0;
  };
  const place = (k, x, z, ry, y = 0) => { k.root.position.set(x, y, z); k.root.rotation.set(0, ry, 0); };
  const tiny = (T) => T >= 29.08;   // the POOF frame

  function choreograph(T) {
    const frozen = T >= 24 && T < 26;                       // nobody moves
    const opts = (extra = {}) => ({ bounce: frozen ? 0 : 0.35, blink: !frozen, ...extra });
    const { milo, pip, lumi, mimi, moss, bobo } = c;
    for (const k of Object.values(c)) { k.root.scale.setScalar(k === bobo ? 0.8 : 1); k.root.visible = true; }
    moss.top.scale.setScalar(1);
    // lips first: update() applies the mouth shape
    for (const n of ['milo', 'pip', 'lumi', 'mimi']) c[n].setSing(frozen ? 0 : mouth(n, T));

    if (!tiny(T)) {
      // MILO: working on the side of the machine, snaps round at 5.0, faces camera at 26
      let ry = Math.PI / 2;
      if (T >= 5.0) ry = lerp(Math.PI / 2, 0.75, easeBack(P(T, 5.0, 5.18)));
      if (T >= 26.0) ry = lerp(0.75, 0.05, easeInOut(P(T, 26.0, 26.4)));
      place(milo, -1.75, 0.05, ry);
      milo.setFace(T < 5 ? 'flat' : T < 6.9 ? 'flat' : T < 8.4 ? 'angry' : T < 24 ? 'flat' : T < 26 ? 'wide' : T < 27 ? 'flat' : 'wide');
      const turning = T < 5 ? Math.sin(T * Math.PI / 0.8) : 0;
      milo.update(T, opts({ bounce: T < 5 ? 0.15 : opts().bounce }));
      milo.armR.rotation.set(-1.2 + turning * 0.15, 0, 0.2); milo.armR.hand.rotation.y = T < 5 ? T * 6 : 0;
      drv.visible = true;

      // PIP: walks in 3.0–4.0, reaches 6.0–7.0, freezes, retracts 8.0, offended 16
      const walkK = easeOut(P(T, 3.0, 4.0));
      place(pip, lerp(-5.2, -0.8, walkK), 1.05, T < 4 ? Math.PI / 2 : 0.85);
      pip.root.visible = T >= 3.0;
      const reach = easeInOut(P(T, 6.0, 7.0)) * (1 - easeOut(P(T, 8.0, 8.4)));
      const freeze = T >= 7.0 && T < 8.0;
      pip.update(T, opts({ bounce: T < 4 ? 1.2 : freeze ? 0 : opts().bounce }));
      pip.root.position.x += reach * 0.25; pip.bodyG.rotation.z = -reach * 0.25 + (freeze ? Math.sin(T * 60) * 0.015 : 0);
      pip.armR.rotation.z = 0.1 + reach * 1.9;
      if (T >= 8.4 && T < 10) { pip.bodyG.rotation.x = -0.15; pip.root.rotation.y = 0.85 + Math.sin(T * 5) * 0.25; }     // innocent sway
      if (T >= 16 && T < 18) { pip.root.position.x -= easeBack(P(T, 16, 16.25)) * 0.25; pip.armL.rotation.z = -1.0; pip.armR.rotation.z = 1.0; }
      pip.setFace(T < 4.2 ? 'open' : T < 6 ? 'wide' : T < 8 ? 'open' : T < 8.5 ? 'wide' : T < 10 ? (T < 9.2 ? 'closed' : 'wink') : T < 16 ? 'open' : T < 18 ? 'angry' : T < 24 ? 'open' : 'wide');

      // LUMI: walks in 10.0–10.6, pushes glasses, reads the sign, turns to Pip
      const lk = easeOut(P(T, 10.0, 10.6));
      place(lumi, lerp(5.6, 1.35, lk), 1.1, T < 10.6 ? -Math.PI / 2 : T < 12.8 ? -2.4 : lerp(-2.4, -1.25, easeInOut(P(T, 12.8, 13.1))));
      lumi.root.visible = T >= 10.0;
      lumi.update(T, opts({ bounce: T < 10.6 ? 1.2 : opts().bounce }));
      if (T > 10.15 && T < 10.6) lumi.armR.rotation.z = 2.6;                         // push glasses
      lumi.bodyG.rotation.x = T > 10.6 && T < 12.8 ? -0.15 : 0;                       // reading up at the sign
      lumi.setFace(T < 14 ? 'open' : T < 16 ? 'flat' : T < 24 ? 'open' : 'wide');

      // MIMI & MOSS: in the background; Mimi giggles, Moss shakes his head
      place(mimi, 2.45, -0.75, -0.55); place(moss, -3.05, -0.85, 0.65);
      mimi.update(T + 0.3, opts()); moss.update(T + 0.7, opts());
      if (T >= 16.6 && T < 18) { mimi.bodyG.position.y += Math.abs(Math.sin(T * 30)) * 0.05; mimi.armL.rotation.z = -2.2; mimi.armR.rotation.z = 2.2; }
      if (T >= 16.4 && T < 17.8) moss.root.rotation.y = 0.65 + Math.sin(P(T, 16.4, 17.8) * Math.PI * 4) * 0.35;
      mimi.setFace(T >= 16.6 && T < 18.5 ? 'happy' : T >= 24 ? 'wide' : 'open');
      moss.setFace(T >= 16.4 && T < 18 ? 'closed' : T >= 24 && T < 29 ? (T >= 25.2 && T < 25.32 ? 'closed' : 'wide') : 'open');

      // BOBO: under the table → sniffs → tilts head → (cuts) → on the crate → BOOP
      let bx = 3.6, bz = 0.3, bry = -Math.PI / 2, by = 0;
      if (T >= 18.3) { const k = easeInOut(P(T, 18.3, 20.0)); bx = lerp(3.6, 0.9, k); bz = lerp(0.3, 2.3, k); }
      if (T >= 20.0) bry = -2.62;
      if (T >= 22.8) { bx = 0.75; bz = 1.35; by = 0.4; bry = -2.45; }
      const boop = T >= 23.25 ? easeOut(P(T, 23.25, 23.5)) * (1 - easeInOut(P(T, 23.7, 24.0))) : 0;
      place(bobo, bx - boop * 0.32, bz - boop * 0.22, bry, by);
      bobo.root.visible = T >= 18.0;
      bobo.setSing(0); bobo.update(T, { bounce: T >= 18.3 && T < 20 ? 2 : frozen ? 0 : 0.4 });
      bobo.head.rotation.z = T >= 20.2 && T < 23 ? 0.35 : bobo.head.rotation.z;
      bobo.head.rotation.x = -boop * 0.4;
      if (T >= 18.6 && T < 20.0) bobo.head.position.y = 0.62 + Math.sin(T * 40) * 0.01;   // sniffing
      if (T >= 26 && T < 29) bobo.update(T * 3, { bounce: 0.3 });                         // happy tail, oblivious

      // everybody leans away from the shaking machine
      if (T >= 27 && T < 29) for (const k of [milo, pip, lumi, mimi, moss]) { k.bodyG.rotation.x = -0.12; k.bodyG.position.x += Math.sin(T * 50) * 0.01; }
    } else {
      // ---- TINY: 12% scale, lined up in front of the giant machine
      const s = 0.12;
      const spots = { moss: [-0.5, 1.5, 0.2], milo: [-0.31, 1.6, 0.05], pip: [-0.12, 1.66, -0.05], lumi: [0.08, 1.62, -0.1], mimi: [0.27, 1.55, -0.3], bobo: [0.02, 1.84, 0] };
      for (const [n, [x, z, ry]] of Object.entries(spots)) { const k = c[n]; place(k, x, z, ry); k.root.scale.setScalar(n === 'bobo' ? s * 0.8 : s); }
      moss.top.scale.setScalar(4.5);                                      // the sprout didn't shrink
      for (const k of [milo, pip, lumi, mimi, moss]) k.update(T, { bounce: 0.3 });
      ['milo', 'lumi', 'mimi', 'moss'].forEach((n) => c[n].setFace(T < 31 ? 'wide' : 'open'));
      // Pip inspects his tiny hands, then is pleased
      const look = easeInOut(P(T, 31.0, 31.4)) * (1 - easeInOut(P(T, 32.6, 32.9)));
      pip.armL.rotation.set(-1.3 * look, 0, -0.1); pip.armR.rotation.set(-1.3 * look, 0, 0.1); pip.bodyG.rotation.x = 0.25 * look;
      pip.setFace(T < 31 ? 'wide' : T < 31.7 ? 'open' : 'happy');
      // Milo turns to Pip, vibrating with rage
      if (T >= 33) { milo.root.rotation.y = lerp(0.05, 0.9, easeOut(P(T, 33.0, 33.3))); milo.root.position.x += Math.sin(T * 70) * 0.004; milo.setFace('angry'); milo.armL.rotation.z = -1.6; milo.armR.rotation.z = 1.6; }
      drv.visible = false; bigDriver.visible = true; bigDriver.position.set(-0.7, 0.03, 1.2); bigDriver.rotation.set(Math.PI / 2, 0, 0.7); bigDriver.scale.setScalar(1);
      const yip = P(T, 34.35, 34.6); bobo.update(T * 2, { bounce: 1 }); bobo.root.position.y = Math.sin(yip * Math.PI) * 0.06;
    }
    if (!tiny(T)) bigDriver.visible = false;

  }

  // ------------------------------------------------------------------ camera: the shot list
  const SHOTS = [
    [0, 3, () => ({ p: [V(0, 2.6, 9.5), V(0.15, 1.5, 4.3)], l: [V(0, 1.0, -0.3), V(0, 1.0, 0.4)] })],              // 1 push-in to the button
    [3, 5, () => ({ p: [V(-2.4, 1.4, 5.0), V(-2.1, 1.3, 4.6)], l: [V(-1.4, 0.9, 0.6), V(-1.1, 0.9, 0.6)] })],        // 2 Pip enters
    [5, 6, () => ({ p: [V(-2.05, 1.05, 2.0)], l: [V(-1.7, 0.8, 0.05)] })],                                               // 3 CU Milo
    [6, 8, () => ({ p: [V(-1.0, 1.1, 4.2), V(-0.85, 1.1, 3.8)], l: [V(-0.9, 0.85, 0.5)] })],                            // 4 two-shot at button height
    [8, 10, () => ({ p: [V(-0.3, 1.1, 3.4)], l: [V(-0.75, 0.75, 1.0)] })],                                               // 5 Pip innocent
    [10, 13, () => ({ p: [V(1.4, 1.5, 5.6), V(1.0, 1.45, 5.0)], l: [V(0.9, 1.0, 0.5)] })],                              // 6 Lumi enters & reads
    [13, 14, () => ({ p: [V(2.9, 1.25, 1.9)], l: [V(-0.7, 0.75, 1.0)] })],                                              // 7 over Lumi's shoulder
    [14, 16, () => ({ p: [V(-0.35, 1.0, 2.5), V(-0.2, 0.98, 2.35)], l: [V(1.35, 0.72, 1.1)] })],                        // 8 CU Lumi, hold
    [16, 18, () => ({ p: [V(0, 2.0, 7.6)], l: [V(0, 0.8, 0)] })],                                                        // 9 wide group
    [18, 21, () => ({ p: [V(5.3, 0.3, 2.4), V(5.0, 0.3, 2.6)], l: [V(2.2, 0.35, 0.8)] })],                              // 10 low, under the table
    [21, 21.75, () => ({ p: [V(0.2, 0.6, 1.1)], l: [V(0.76, 0.5, 2.06)] })],                                           // 11a CU Bobo
    [21.75, 22.4, () => ({ p: [V(0.55, 1.35, 1.75)], l: [V(0, 1.02, 0.73)] })],                                          // 11b CU button
    [22.4, 23, () => ({ p: [V(0.39, 0.54, 1.42)], l: [V(0.76, 0.5, 2.06)] })],                                            // 11c closer Bobo
    [23, 24, () => ({ p: [V(-0.9, 1.5, 3.4)], l: [V(0.35, 0.95, 1.0)] })],                                                // 12 the BOOP
    [24, 26, () => ({ p: [V(0, 1.8, 6.8)], l: [V(0, 0.9, 0.2)] })],                                                      // 13 frozen wide (locked)
    [26, 27, () => ({ p: [V(-1.72, 0.92, 2.05)], l: [V(-1.74, 0.82, 0.05)] })],                                             // 14 Milo looks at us
    [27, 29.08, () => ({ p: [V(0, 2.0, 7.4), V(0, 2.2, 8.2)], l: [V(0, 1.1, -0.2)] })],                                 // 15 machine goes wild
    [29.08, 31, () => ({ p: [V(0, 0.09, 2.6), V(0, 0.1, 2.35)], l: [V(0, 0.22, 1.2)] })],                               // 16 floor level: tiny!
    [31, 33, () => ({ p: [V(-0.1, 0.1, 2.05)], l: [V(-0.12, 0.085, 1.66)] })],                                           // 17 Pip & his tiny hands
    [33, 35, () => ({ p: [V(-0.13, 0.1, 2.2), V(-0.12, 0.1, 2.12)], l: [V(-0.18, 0.08, 1.66)] })],                      // 18 Milo vs Pip, Bobo yips
  ];
  function cam(T) {
    const s = SHOTS.find(([a, b]) => T >= a && T < b) || SHOTS[SHOTS.length - 1];
    const [a, b, f] = s, k = EIO(P(T, a, b)), o = f();
    const p = o.p.length > 1 ? mixV(o.p[0], o.p[1], k) : o.p[0], l = o.l.length > 1 ? mixV(o.l[0], o.l[1], k) : o.l[0];
    camera.fov = T >= 29.08 ? 42 : 35; camera.updateProjectionMatrix();
    camera.position.copy(p); camera.lookAt(l);
    const shake = T >= 27 && T < 29.08 ? 0.02 + 0.06 * P(T, 27, 29) : T >= 23.5 && T < 23.65 ? 0.015 : 0;
    camera.position.x += Math.sin(T * 67) * shake; camera.position.y += Math.sin(T * 51 + 1) * shake;
  }

  const tmp = new THREE.Vector3();
  const toScreen = (obj, dy = 0) => { obj.getWorldPosition(tmp); tmp.y += dy; tmp.project(camera); return [(tmp.x + 1) / 2 * W, (1 - tmp.y) / 2 * H, tmp.z]; };

  return {
    scene, camera,
    update(T) {
      choreograph(T);
      const pressed = T >= 23.45 ? 1 : 0;
      mac.tick(T, { shake: T >= 27 && T < 29.08 ? 0.4 + 0.6 * P(T, 27, 29) : 0, alarm: T >= 27.4 && T < 29.08 ? 1 : 0, pressed: pressed * (T < 29.08 ? 1 : 0.2) });
      puffs.forEach(({ m, a, r, y }) => { const k = P(T, 29.0, 31.2); m.visible = k > 0 && k < 1; m.position.set(Math.cos(a) * r * (0.4 + k), y + k * 0.6, 0.9 + Math.sin(a) * r * 0.5 * (0.4 + k)); m.scale.setScalar(0.6 + k * 1.6); m.material.opacity = (1 - k) * 0.9; });
      cam(T);
    },
    overlay(ctx, T, F) {
      // sparkle in Pip's eyes when he first sees the button
      if (T >= 4.0 && T < 5.0) { const [x, y] = toScreen(c.pip.face); star(ctx, x - 26, y - 14, 18 * Math.sin(P(T, 4.0, 5.0) * Math.PI)); star(ctx, x + 30, y - 12, 14 * Math.sin(P(T, 4.1, 5.0) * Math.PI)); }
      // Lumi's glasses glint during the 1-second stare
      if (T >= 14.3 && T < 14.9) { const [x, y] = toScreen(c.lumi.face); star(ctx, x - 24, y - 10, 28 * Math.sin(P(T, 14.3, 14.9) * Math.PI)); }
      // the POOF flash
      if (T >= 29.0 && T < 29.4) { ctx.fillStyle = `rgba(255,255,255,${1 - P(T, 29.08, 29.4)})`; ctx.fillRect(0, 0, W, H); }
      captions(ctx, T, cues, F);
      if (T >= 34.8) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); }
    },
  };
}

function star(ctx, x, y, r) {
  if (r <= 0.5) return;
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(255,240,180,0.9)'; ctx.shadowBlur = 12;
  ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.28 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.restore();
}

function captions(ctx, T, cues, F) {
  const cue = cues.filter((q) => q.kind === 'vo' && T >= q.t - 0.05 && T < q.t + Math.max(q.dur + 0.5, 1.0)).pop();
  if (!cue) return;
  const [who, text] = LINES[cue.id]; const tinyVoice = T > 29;
  const a = clamp(P(T, cue.t - 0.05, cue.t + 0.08)) * (1 - P(T, cue.t + Math.max(cue.dur + 0.5, 1.0) - 0.15, cue.t + Math.max(cue.dur + 0.5, 1.0)));
  ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const size = tinyVoice ? 42 : 48;
  ctx.font = `700 ${size}px ${F}`; const tw = ctx.measureText(text).width;
  ctx.font = `700 22px ${F}`; const nw = ctx.measureText(who).width;
  const y = H - 70;
  ctx.font = `700 28px ${F}`; ctx.fillStyle = NAME_COL[who]; ctx.strokeStyle = '#fff'; ctx.lineWidth = 6;
  ctx.strokeText(who.toUpperCase(), W / 2, y - size * 0.95); ctx.fillText(who.toUpperCase(), W / 2, y - size * 0.95);
  ctx.font = `700 ${size}px ${F}`; ctx.strokeStyle = '#1c1420'; ctx.lineWidth = 9; ctx.strokeText(text, W / 2, y); ctx.fillStyle = '#fff'; ctx.fillText(text, W / 2, y);
  ctx.restore(); void tw; void nw;
}
