// Shared building blocks: materials, primitive helpers, canvas textures, easing.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const W = 1280, H = 720;

// ---------- math / easing ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const prog = (t, a, b) => clamp((t - a) / (b - a)); // 0..1 progress of t inside [a,b]
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeIn = (t) => t * t * t;
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeBack = (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
export const bounce = (t) => {
  const n = 7.5625, d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
};

export function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- materials & meshes ----------
export const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...o });
export const glow = (color, intensity = 2) => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: intensity, roughness: 1 });

function finish(m) { m.castShadow = true; m.receiveShadow = true; return m; }
const asMat = (c, o) => (c && c.isMaterial ? c : mat(c, o));

// geometries are cached by their arguments so repeated props/characters share GPU buffers
const geoCache = new Map();
const geo = (key, make) => { if (!geoCache.has(key)) geoCache.set(key, make()); return geoCache.get(key); };

export const rbox = (w, h, d, r, c, o) => finish(new THREE.Mesh(geo(`rb${w},${h},${d},${r}`, () => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2))), asMat(c, o)));
export const box = (w, h, d, c, o) => finish(new THREE.Mesh(geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), asMat(c, o)));
export const cyl = (rt, rb, h, c, o, seg = 24) => finish(new THREE.Mesh(geo(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)), asMat(c, o)));
export const sph = (r, c, o, seg = 24) => finish(new THREE.Mesh(geo(`s${r},${seg}`, () => new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75))), asMat(c, o)));
export const tor = (r, t, c, o, arc = Math.PI * 2) => finish(new THREE.Mesh(geo(`t${r},${t},${arc}`, () => new THREE.TorusGeometry(r, t, 12, 40, arc)), asMat(c, o)));
export const cone = (r, h, c, o, seg = 20) => finish(new THREE.Mesh(geo(`k${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg)), asMat(c, o)));
export const plane = (w, h, c, o) => finish(new THREE.Mesh(new THREE.PlaneGeometry(w, h), asMat(c, o)));

export function at(obj, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  obj.position.set(x, y, z); obj.rotation.set(rx, ry, rz); return obj;
}
export function group(...kids) { const g = new THREE.Group(); kids.forEach((k) => g.add(k)); return g; }

// ---------- canvas textures ----------
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.redraw = (...a) => { ctx.clearRect(0, 0, w, h); draw(ctx, w, h, ...a); tex.needsUpdate = true; };
  tex.redraw();
  return tex;
}
export const texMat = (tex, o = {}) => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, ...o });
export const texGlow = (tex, o = {}) => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, ...o });

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

export const FONT = {
  display: '"Anton", "Bebas Neue", Impact, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
  sans: '"DM Sans", system-ui, sans-serif',
  hand: '"Caveat", cursive',
};

export function hex(c) { return '#' + new THREE.Color(c).getHexString(); }
