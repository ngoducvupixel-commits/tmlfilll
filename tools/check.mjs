// One cheap review pass: render N evenly spaced frames (or --at times) and tile them into ONE image.
//   node tools/check.mjs <episode> [--n 24] [--at 3.2,10,15.5] [--cols 6]
// → out/<episode>-contact.jpg  (+ the time of every tile is printed, row by row)
import { spawnSync } from 'node:child_process';
import { readFile, rm, mkdir, readdir, rename } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const ep = args[0];
if (!ep) { console.error('usage: node tools/check.mjs <episode> [--n 24] [--at t1,t2,...] [--cols 6]'); process.exit(1); }
const meta = JSON.parse(await readFile(join(root, 'episodes', ep, 'episode.json'), 'utf8'));
// beat-sheet episodes know their length from cues.json; songs from their audio file
const cues = await readFile(join(root, 'episodes', ep, 'assets', 'cues.json'), 'utf8').then(JSON.parse).catch(() => ({
  duration: +spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', join(root, 'episodes', ep, meta.audio)], { encoding: 'utf8' }).stdout.trim(),
}));
const n = +opt('n', 24), cols = +opt('cols', 6);
const times = opt('at') ? opt('at').split(',').map(Number) : Array.from({ length: n }, (_, i) => +((i + 0.5) * cues.duration / n).toFixed(2));
const tmp = join(root, 'out', `.check-${ep}`); await rm(tmp, { recursive: true, force: true }); await mkdir(tmp, { recursive: true });
for (const [i, t] of times.entries()) {
  const dir = join(tmp, String(i));
  const r = spawnSync('node', [join(root, 'tools/render.mjs'), ep, '--fps', '30', '--from', String(t), '--to', String(t + 0.03), '--frames', dir], { encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stdout, r.stderr); process.exit(1); }
  await rename(join(dir, 'f_00000.png'), join(tmp, `f_${String(i).padStart(3, '0')}.png`));
}
const out = join(root, 'out', `${ep}-contact.jpg`);
const rows = Math.ceil(times.length / cols);
spawnSync('ffmpeg', ['-v', 'error', '-y', '-pattern_type', 'glob', '-i', join(tmp, 'f_*.png'), '-vf', `scale=400:-1,tile=${cols}x${rows}`, '-frames:v', '1', out], { stdio: 'inherit' });
await rm(tmp, { recursive: true, force: true });
for (let r = 0; r < rows; r++) console.log(`row ${r + 1}: ` + times.slice(r * cols, r * cols + cols).map((t) => t.toFixed(2)).join('  '));
console.log(`→ ${out}`);
