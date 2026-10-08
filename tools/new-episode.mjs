// Scaffold a new episode from episodes/_template.   node tools/new-episode.mjs <slug> "<Title>"
import { cp, readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [slug, title = slug] = process.argv.slice(2);
if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) { console.error('usage: node tools/new-episode.mjs <slug> "<Title>"   (slug: lowercase-with-dashes)'); process.exit(1); }
const dst = join(root, 'episodes', slug);
if (existsSync(dst)) { console.error(`episodes/${slug} already exists`); process.exit(1); }
await cp(join(root, 'episodes', '_template'), dst, { recursive: true });
async function walk(d) {
  for (const f of await readdir(d)) {
    const p = join(d, f);
    if ((await stat(p)).isDirectory()) { await walk(p); continue; }
    if (!/\.(js|py|json|md)$/.test(f)) continue;
    await writeFile(p, (await readFile(p, 'utf8')).replaceAll('EPISODE_SLUG', slug).replaceAll('EPISODE_TITLE', title));
  }
}
await walk(dst);
console.log(`created episodes/${slug}
next:
  1. write episodes/${slug}/beats.py      (the beat sheet)
  2. python audio/build.py ${slug}         (voices + sfx + cues.json)
  3. write episodes/${slug}/src/set.js + film.js
  4. node tools/check.mjs ${slug}          (contact sheet → out/${slug}-contact.jpg)
  5. node tools/render.mjs ${slug}         (→ out/${slug}.mp4)`);
