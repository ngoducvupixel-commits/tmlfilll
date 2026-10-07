// Offline, frame-exact render: drives index.html in headless Chromium, seeks every frame,
// and pipes PNGs into ffmpeg.  Usage: node tools/render.mjs [out.mp4] [--fps 30] [--from 0] [--to 52] [--frames dir]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const outFile = args[0] && !args[0].startsWith('--') ? args[0] : 'pip-dual-mode.mp4';
const fps = +opt('fps', 30), from = +opt('from', 0), framesDir = opt('frames', null);

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const body = await readFile(join(root, p === '/' ? 'index.html' : p));
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(body);
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch({ args: ['--no-proxy-server', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
page.on('pageerror', (e) => console.error('page error:', e.message));
page.on('console', (m) => m.type() === 'error' && console.error('console:', m.text(), m.location().url));
page.on('requestfailed', (r) => console.error('request failed:', r.url(), r.failure()?.errorText));
// serve three.js from node_modules when present (works offline / behind restrictive proxies)
await page.route(/unpkg\.com\/three@[^/]+\/(.*)$/, async (route) => {
  const rel = route.request().url().replace(/^.*unpkg\.com\/three@[^/]+\//, '');
  try { await route.fulfill({ body: await readFile(join(root, 'node_modules/three', rel)), contentType: 'text/javascript' }); }
  catch { await route.continue(); }
});
// fetch Google Fonts with curl (honours HTTPS_PROXY / system CAs in locked-down environments)
const curl = (url) => new Promise((ok, no) => {
  const p = spawn('curl', ['-sSfL', '-A', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36', url]);
  const chunks = []; p.stdout.on('data', (d) => chunks.push(d)); p.on('close', (c) => (c ? no(new Error(`curl ${c}`)) : ok(Buffer.concat(chunks))));
});
await page.route(/fonts\.(googleapis|gstatic)\.com/, async (route) => {
  const url = route.request().url();
  try { await route.fulfill({ body: await curl(url), contentType: url.includes('googleapis') ? 'text/css' : 'font/woff2', headers: { 'access-control-allow-origin': '*' } }); }
  catch { await route.abort(); }
});
await page.goto(`http://127.0.0.1:${port}/index.html?paused`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
const duration = await page.evaluate(() => window.__duration);
const to = Math.min(+opt('to', duration), duration);
const n = Math.round((to - from) * fps);
console.log(`rendering ${n} frames (${from}s → ${to.toFixed(2)}s @ ${fps}fps)`);

let ff = null;
if (framesDir) await mkdir(framesDir, { recursive: true });
else ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });

const t0 = Date.now();
for (let f = 0; f < n; f++) {
  const t = from + f / fps;
  const b64 = await page.evaluate((t) => { window.__seek(t); return document.getElementById('out').toDataURL('image/png').split(',')[1]; }, t);
  const buf = Buffer.from(b64, 'base64');
  if (framesDir) await writeFile(join(framesDir, `f_${String(f).padStart(5, '0')}.png`), buf);
  else if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (f % 30 === 0) process.stdout.write(`\r${f}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
if (ff) { ff.stdin.end(); await new Promise((r) => ff.on('close', r)); }
console.log(`\ndone → ${framesDir || outFile}`);
await browser.close(); server.close();
