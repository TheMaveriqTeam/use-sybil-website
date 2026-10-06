#!/usr/bin/env node
/**
 * Builds the static brand images in public/:
 *   og.png                 1200×630 Open Graph / Twitter card
 *   favicon.svg            the app icon
 *   favicon-32.png         32×32
 *   apple-touch-icon.png   180×180 (square, iOS rounds it)
 *   icon-192.png, icon-512.png, icon-maskable-512.png  (web manifest)
 *
 * Run with `npm run assets` after a brand change and commit the results.
 * Fonts come from @fontsource (WOFF, converted to TTF in memory for resvg),
 * so nothing is fetched from the network. resvg matches fonts by their
 * family name, so the medium cuts are addressed as "Newsreader Medium" and
 * "Geist Medium".
 */
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdtempSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const brand = join(root, 'src/assets/brand');
const fontsrc = join(root, 'node_modules/@fontsource');

/** WOFF 1.0 → TrueType/OpenType (tables are zlib-compressed one by one). */
function woffToSfnt(buf) {
  if (buf.toString('ascii', 0, 4) !== 'wOFF') throw new Error('Not a WOFF file');
  const flavor = buf.readUInt32BE(4);
  const numTables = buf.readUInt16BE(12);
  const tables = [];
  for (let i = 0; i < numTables; i++) {
    const o = 44 + i * 20;
    const tag = buf.readUInt32BE(o);
    const offset = buf.readUInt32BE(o + 4);
    const compLength = buf.readUInt32BE(o + 8);
    const origLength = buf.readUInt32BE(o + 12);
    const checksum = buf.readUInt32BE(o + 16);
    const raw = buf.subarray(offset, offset + compLength);
    const data = compLength < origLength ? inflateSync(raw) : raw;
    tables.push({ tag, checksum, data });
  }
  let entrySelector = 0;
  while (1 << (entrySelector + 1) <= numTables) entrySelector++;
  const searchRange = (1 << entrySelector) * 16;
  const headerSize = 12 + numTables * 16;
  const total = tables.reduce((n, t) => n + ((t.data.length + 3) & ~3), headerSize);
  const out = Buffer.alloc(total);
  out.writeUInt32BE(flavor, 0);
  out.writeUInt16BE(numTables, 4);
  out.writeUInt16BE(searchRange, 6);
  out.writeUInt16BE(entrySelector, 8);
  out.writeUInt16BE(numTables * 16 - searchRange, 10);
  let offset = headerSize;
  tables.forEach((t, i) => {
    const r = 12 + i * 16;
    out.writeUInt32BE(t.tag, r);
    out.writeUInt32BE(t.checksum, r + 4);
    out.writeUInt32BE(offset, r + 8);
    out.writeUInt32BE(t.data.length, r + 12);
    t.data.copy(out, offset);
    offset += (t.data.length + 3) & ~3;
  });
  return out;
}

const tmp = mkdtempSync(join(tmpdir(), 'use-sybil-fonts-'));
const fontFiles = [
  'newsreader/files/newsreader-latin-400-normal.woff',
  'newsreader/files/newsreader-latin-500-italic.woff',
  'geist/files/geist-latin-400-normal.woff',
  'geist/files/geist-latin-500-normal.woff',
].map((f) => {
  const ttf = join(tmp, f.split('/').pop().replace('.woff', '.ttf'));
  writeFileSync(ttf, woffToSfnt(readFileSync(join(fontsrc, f))));
  return ttf;
});

const render = (svg, width) =>
  new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Geist' },
  })
    .render()
    .asPng();

// The S, drawn by one strip of receipt paper (src/assets/brand/use-sybil-mark.svg).
const S =
  'M62.821 25.500 A20 20 0 1 0 60.821 48.356 A14 14 0 1 1 58.375 28.067 L60.816 30.583 L59.857 27.211 L62.298 29.728 L61.339 26.356 L63.780 28.872 Z';
const mark = (front, back, line) => `
  <path d="${S}" fill="${front}"/>
  <path d="${S}" fill="${back}" transform="rotate(180 50 50)"/>
  <path d="M62.434 46.141 A20 20 0 0 1 37.566 53.859 A20 20 0 0 1 62.434 46.141 Z" fill="#D9A23A"/>
  <path d="M53.162 20.217 A17.7 17.7 0 0 0 31.780 28.000" stroke="${line}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
  <path d="M50.841 22.358 A15.92 15.92 0 0 0 38.824 25.577" stroke="${line}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;

/* ---------- Open Graph image ---------- */
const portrait = await sharp(join(brand, 'sybil-portrait.jpg')).resize({ width: 560 }).jpeg({ quality: 82 }).toBuffer();
const pMeta = await sharp(portrait).metadata();
const pW = 520;
const pH = Math.round((pMeta.height / pMeta.width) * pW);

const og = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#FCF5ED"/><!-- the portrait's own paper, so its edges disappear -->
  <image x="${1200 - pW - 40}" y="${630 - pH + 30}" width="${pW}" height="${pH}" xlink:href="data:image/jpeg;base64,${portrait.toString('base64')}"/>
  <svg x="80" y="64" width="48" height="53" viewBox="10 6 80 88">${mark('#9CC5AE', '#1E4D3A', '#FBF8F1')}</svg>
  <text x="140" y="103" font-family="Newsreader" font-size="38"><tspan fill="#3F8A63">Use</tspan><tspan fill="#1E4D3A"> Sybil</tspan></text>
  <text x="76" y="300" font-family="Newsreader" font-size="108" fill="#15211C">Got admin?</text>
  <text x="76" y="416" font-family="Newsreader Medium, Newsreader" font-style="italic" font-weight="500" font-size="108" fill="#1E4D3A">Use Sybil.</text>
  <rect x="80" y="438" width="432" height="7" fill="#D9A23A"/>
  <text x="80" y="510" font-family="Geist" font-size="30" fill="#33433B">Pre-accounting for Belgian business owners</text>
  <text x="80" y="562" font-family="Geist Medium, Geist" font-weight="500" font-size="24" fill="#1E4D3A">usesybil.pro</text>
</svg>`;
writeFileSync(join(pub, 'og.png'), await sharp(render(og, 1200)).png({ compressionLevel: 9, palette: true, quality: 92, effort: 10 }).toBuffer());

/* ---------- Icons ---------- */
const icon = (radius, scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="${radius}" fill="#1E4D3A"/>
  <g transform="translate(50 50) scale(${scale}) translate(-50 -50)">${mark('#FBF8F1', '#9CC5AE', '#1E4D3A')}</g>
</svg>`;

copyFileSync(join(brand, 'use-sybil-app-icon.svg'), join(pub, 'favicon.svg'));
const outputs = [
  ['favicon-32.png', icon(22, 0.8), 32],
  ['apple-touch-icon.png', icon(0, 0.8), 180],
  ['icon-192.png', icon(22, 0.8), 192],
  ['icon-512.png', icon(22, 0.8), 512],
  ['icon-maskable-512.png', icon(0, 0.66), 512],
];
for (const [name, svg, size] of outputs) {
  writeFileSync(join(pub, name), await sharp(render(svg, size)).png({ compressionLevel: 9 }).toBuffer());
}

rmSync(tmp, { recursive: true, force: true });
console.log(`Brand images written to public/: og.png, favicon.svg, ${outputs.map((o) => o[0]).join(', ')}`);
