#!/usr/bin/env node
/**
 * Gera ícones PNG mínimos para PWA (apple-touch-icon, icon-192, icon-512).
 * Usa apenas Node built-in: fs, zlib. Sem dependências.
 * Design: fundo #f7f5ef (paper), "L." em #0b1220 (escuro).
 */
import fs from "fs";
import zlib from "zlib";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "icons");

function crc32(buf) {
  let c = 0xffffffff;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let t = n;
    for (let k = 0; k < 8; k++) t = (t & 1) ? 0xedb88320 ^ (t >>> 1) : t >>> 1;
    table[n] = t >>> 0;
  }
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function writeChunk(out, type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const chunk = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(chunk), 0);
  out.push(len, chunk, crc);
}

function makePNG(width, height, pixelAt) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = [];
  for (let y = 0; y < height; y++) {
    raw.push(0); // filter byte (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixelAt(x, y);
      raw.push(r, g, b);
    }
  }
  const rawBuf = Buffer.from(raw);
  const idatData = zlib.deflateSync(rawBuf, { level: 9 });

  const chunks = [];
  writeChunk(chunks, "IHDR", ihdr);
  writeChunk(chunks, "IDAT", idatData);
  writeChunk(chunks, "IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ...chunks]);
}

// Paper #f7f5ef, dark #0b1220. Draw simple "L" + dot (blocky)
function pixelAt192(x, y) {
  const paper = [0xf7, 0xf5, 0xef];
  const dark = [0x0b, 0x12, 0x20];
  const cx = 96;
  const cy = 96;
  const r = 70;
  // Circle background paper
  if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) return dark;
  // "L" shape: vertical bar left, horizontal bar bottom, dot top-right
  const inL = (x >= cx - 28 && x <= cx - 12 && y <= cy + 30) || (x >= cx - 28 && x <= cx + 28 && y >= cy + 14 && y <= cy + 30);
  const inDot = (x - (cx + 22)) ** 2 + (y - (cy - 32)) ** 2 <= 36;
  return inL || inDot ? dark : paper;
}

function pixelAt180(x, y) {
  return pixelAt192(Math.floor((x * 192) / 180), Math.floor((y * 192) / 180));
}

function pixelAt512(x, y) {
  return pixelAt192(Math.floor((x * 192) / 512), Math.floor((y * 192) / 512));
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const apple = makePNG(180, 180, pixelAt180);
fs.writeFileSync(path.join(OUT_DIR, "apple-touch-icon.png"), apple);
console.log("Wrote public/icons/apple-touch-icon.png (180x180)");

const icon192 = makePNG(192, 192, pixelAt192);
fs.writeFileSync(path.join(OUT_DIR, "icon-192.png"), icon192);
console.log("Wrote public/icons/icon-192.png (192x192)");

const icon512 = makePNG(512, 512, pixelAt512);
fs.writeFileSync(path.join(OUT_DIR, "icon-512.png"), icon512);
console.log("Wrote public/icons/icon-512.png (512x512)");
