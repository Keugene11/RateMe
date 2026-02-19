import { Buffer } from 'buffer';
import fs from 'fs';
import zlib from 'zlib';

function createIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);

  // Cal AI style: solid dark background, bold white R
  const bgR = 24, bgG = 24, bgB = 27;

  // Fill entire background (full-bleed — Android/Play Store applies its own mask)
  for (let i = 0; i < size * size; i++) {
    pixels[i * 4] = bgR;
    pixels[i * 4 + 1] = bgG;
    pixels[i * 4 + 2] = bgB;
    pixels[i * 4 + 3] = 255;
  }

  // Draw bold white "R" lettermark
  const s = size;
  const strokeW = Math.round(s * 0.10);

  // Letter bounds — centered
  const lx = Math.round(s * 0.28);
  const ty = Math.round(s * 0.22);
  const by = Math.round(s * 0.78);
  const midY = Math.round(s * 0.51);

  // Bowl params
  const bowlRight = Math.round(s * 0.64);
  const bowlCy = Math.round((ty + midY) / 2);
  const bowlOuterR = Math.round((midY - ty) / 2);
  const bowlInnerR = bowlOuterR - strokeW;

  function setPixel(px, py, alpha) {
    if (px < 0 || px >= size || py < 0 || py >= size) return;
    const idx = (py * size + px) * 4;
    const a = Math.min(1, Math.max(0, alpha));
    pixels[idx] = Math.round(bgR * (1 - a) + 255 * a);
    pixels[idx + 1] = Math.round(bgG * (1 - a) + 255 * a);
    pixels[idx + 2] = Math.round(bgB * (1 - a) + 255 * a);
    pixels[idx + 3] = 255;
  }

  // 1. Left vertical stem
  for (let y = ty; y <= by; y++) {
    for (let x = lx; x < lx + strokeW; x++) {
      setPixel(x, y, 1);
    }
  }

  // 2. Top horizontal bar (connects to bowl)
  for (let y = ty; y < ty + strokeW; y++) {
    for (let x = lx; x <= bowlRight; x++) {
      setPixel(x, y, 1);
    }
  }

  // 3. Middle horizontal bar
  for (let y = midY - Math.floor(strokeW / 2); y <= midY + Math.floor(strokeW / 2); y++) {
    for (let x = lx; x <= bowlRight; x++) {
      setPixel(x, y, 1);
    }
  }

  // 4. Bowl — right semicircle from top bar to middle bar
  for (let y = ty; y <= midY; y++) {
    for (let x = bowlRight - bowlOuterR; x <= bowlRight + bowlOuterR; x++) {
      const dist = Math.hypot(x - bowlRight, y - bowlCy);
      if (x >= bowlRight) {
        // Right half: draw the semicircle arc
        if (dist <= bowlOuterR + 0.5 && dist >= bowlInnerR - 0.5) {
          const outerEdge = Math.max(0, Math.min(1, bowlOuterR - dist + 0.5));
          const innerEdge = Math.max(0, Math.min(1, dist - bowlInnerR + 0.5));
          setPixel(x, y, Math.min(outerEdge, innerEdge));
        }
      }
    }
  }

  // 5. Diagonal leg — from middle junction down-right to bottom
  const legSx = lx + strokeW + strokeW * 0.3;
  const legSy = midY + Math.floor(strokeW / 2);
  const legEx = Math.round(s * 0.72);
  const legEy = by;

  const ldx = legEx - legSx;
  const ldy = legEy - legSy;
  const len = Math.hypot(ldx, ldy);
  const halfW = strokeW / 2;

  for (let y = Math.floor(legSy - strokeW); y <= Math.ceil(legEy + strokeW); y++) {
    for (let x = Math.floor(legSx - strokeW); x <= Math.ceil(legEx + strokeW); x++) {
      const nx = -ldy / len;
      const ny = ldx / len;
      const dotN = (x - legSx) * nx + (y - legSy) * ny;
      const dotT = (x - legSx) * (ldx / len) + (y - legSy) * (ldy / len);

      if (dotT >= -0.5 && dotT <= len + 0.5) {
        const distFromCenter = Math.abs(dotN);
        if (distFromCenter <= halfW + 0.5) {
          const edgeAlpha = Math.max(0, Math.min(1, halfW - distFromCenter + 0.5));
          const startAlpha = Math.max(0, Math.min(1, dotT + 0.5));
          const endAlpha = Math.max(0, Math.min(1, len - dotT + 0.5));
          const a = Math.min(edgeAlpha, startAlpha, endAlpha);
          if (a > 0) setPixel(x, y, a);
        }
      }
    }
  }

  return pixels;
}

function toPNG(pixels, size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });

  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c;
  }

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const t = Buffer.from(type);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, crc]);
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

for (const size of [192, 512]) {
  const pixels = createIcon(size);
  const png = toPNG(pixels, size);
  fs.writeFileSync(`public/icons/icon-${size}.png`, png);
  console.log(`Generated icon-${size}.png (${png.length} bytes)`);
}
