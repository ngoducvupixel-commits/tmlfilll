// Shared runtime for every episode: renderer setup, fonts, the audio-synced player UI,
// real-time WebM recording, and the window.__seek hook the offline renderer drives.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { W, H, clamp } from './kit.js';

export const FONT = '"Fredoka", system-ui, sans-serif';

/** WebGL renderer + soft-studio environment map used by all episodes */
export function createRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  const env = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  return { renderer, env };
}

export async function loadFonts() {
  await document.fonts.load(`700 40px ${FONT}`);
}

/** fetch JSON relative to an episode module: json(import.meta.url, '../assets/cues.json') */
export const json = (base, rel) => fetch(new URL(rel, base)).then((r) => r.json());
export const text = (base, rel) => fetch(new URL(rel, base)).then((r) => r.text());

/**
 * Wire the page's player UI to an episode.
 * @param {object} o
 * @param {number} o.duration    seconds
 * @param {string|URL} o.audio   soundtrack URL
 * @param {(T:number)=>void} o.render  draws frame T into the #out canvas
 * @param {string} [o.title]     used for the recording's file name
 */
export function startPlayer({ duration, audio: audioUrl, render, title = 'mochi' }) {
  const $ = (id) => document.getElementById(id);
  const audio = $('audio'); audio.src = String(audioUrl);
  const ui = { play: $('play'), scrub: $('scrub'), time: $('time'), rec: $('rec') };
  ui.scrub.max = duration;
  const out = $('out');
  let t = 0;
  const draw = (T) => render(clamp(T, 0, duration - 1e-3));
  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
  const show = () => { draw(t); ui.scrub.value = t; ui.time.textContent = `${fmt(t)} / ${fmt(duration)}`; };
  const loop = () => { if (audio.paused) return; t = audio.currentTime; show(); requestAnimationFrame(loop); };
  audio.onplay = () => { ui.play.textContent = '❚❚'; requestAnimationFrame(loop); };
  audio.onpause = audio.onended = () => { ui.play.textContent = '▶'; stopRec(); };
  ui.play.onclick = () => { if (audio.paused) { if (audio.currentTime >= duration - 0.05) audio.currentTime = 0; audio.play(); } else audio.pause(); };
  ui.scrub.oninput = () => { t = +ui.scrub.value; audio.currentTime = t; show(); };
  addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); ui.play.click(); } });

  let rec = null;
  function stopRec() { if (rec) { rec.stop(); rec = null; ui.rec.textContent = '● Record'; } }
  ui.rec.onclick = () => {
    if (rec) return stopRec();
    const stream = out.captureStream(30);
    try { (audio.captureStream?.() || audio.mozCaptureStream?.()).getAudioTracks().forEach((tr) => stream.addTrack(tr)); } catch {}
    const chunks = []; rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus', videoBitsPerSecond: 12e6 });
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.onstop = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' })); a.download = `${title}.webm`; a.click(); };
    audio.currentTime = 0; rec.start(); ui.rec.textContent = '■ Stop'; audio.play();
  };

  // hooks for tools/render.mjs
  window.__duration = duration;
  window.__seek = (time) => draw(time);
  const q = new URLSearchParams(location.search);
  t = +(q.get('t') || 0); audio.currentTime = t; show();
  window.__ready = true;
}

/**
 * Standard compositor for beat-sheet episodes: 3D frame → 2D overlay (captions etc.).
 * look: 'plain' (default) or 'dreamy' — soft bloom on highlights + warm grade + vignette (cute key-art look).
 */
export function compositor(renderer, film, { look = 'plain' } = {}) {
  const ctx = document.getElementById('out').getContext('2d');
  let draw3d = () => renderer.render(film.scene, film.camera);
  if (look === 'dreamy') {
    const composer = new EffectComposer(renderer);
    const pass = new RenderPass(film.scene, film.camera);
    composer.addPass(pass);
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.16, 0.5, 0.94));
    composer.addPass(new OutputPass());
    draw3d = () => { pass.camera = film.camera; composer.render(); };
  }
  const vignette = look === 'dreamy' ? (() => {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.72);
    g.addColorStop(0, 'rgba(255,220,235,0)'); g.addColorStop(1, 'rgba(90,40,70,0.32)'); return g;
  })() : null;
  return (T) => {
    film.update(T); draw3d(); ctx.drawImage(renderer.domElement, 0, 0, W, H);
    if (vignette) {
      ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(255,190,150,0.08)'; ctx.fillRect(0, 0, W, H); ctx.restore();   // warm grade
      ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);
    }
    film.overlay(ctx, T, FONT);
  };
}
