import { readdir, stat } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import sharp from 'sharp';

const ROOT = 'images/posts';

async function* walk(dir) {
  for (const d of await readdir(dir, { withFileTypes: true })) {
    const res = join(dir, d.name);
    if (d.isDirectory()) yield* walk(res);
    else yield res;
  }
}

const exts = new Set(['.jpg', '.jpeg', '.png']);
let converted = 0;

for await (const file of walk(ROOT)) {
  const ext = extname(file).toLowerCase();
  if (!exts.has(ext)) continue;

  const base = join(ROOT, basename(file, ext));
  const webp = `${base}.webp`;
  const avif = `${base}.avif`;

  const src = await stat(file);
  let doWebp = true, doAvif = true;
  try { const s = await stat(webp); if (s.mtimeMs >= src.mtimeMs) doWebp = false; } catch {}
  try { const s = await stat(avif); if (s.mtimeMs >= src.mtimeMs) doAvif = false; } catch {}

  if (doWebp) await sharp(file).webp({ quality: 82 }).toFile(webp);
  if (doAvif) await sharp(file).avif({ quality: 50 }).toFile(avif);
  converted++;
}

console.log(`Converted/checked images. Updated: ${converted}`);