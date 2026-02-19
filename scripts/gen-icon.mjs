import { Buffer } from 'buffer';
import fs from 'fs';
import zlib from 'zlib';

function createIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const s = size;

  // Pure black background
  for (let i = 0; i < s * s; i++) {
    pixels[i * 4 + 3] = 255;
  }

  function setPixel(px, py, alpha) {
    if (px < 0 || px >= s || py < 0 || py >= s) return;
    const idx = (py * s + px) * 4;
    const a = Math.min(1, Math.max(0, alpha));
    const existing = pixels[idx] / 255;
    const blended = Math.min(1, Math.max(existing, a));
    pixels[idx] = Math.round(255 * blended);
    pixels[idx + 1] = Math.round(255 * blended);
    pixels[idx + 2] = Math.round(255 * blended);
    pixels[idx + 3] = 255;
  }

  function fillCircle(cx, cy, r) {
    for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++) {
      for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
        const dist = Math.hypot(x - cx, y - cy);
        if (dist <= r + 0.5) {
          setPixel(x, y, Math.max(0, Math.min(1, r - dist + 0.5)));
        }
      }
    }
  }

  function strokeCircle(cx, cy, r, w) {
    const outer = r + w / 2;
    const inner = r - w / 2;
    for (let y = Math.floor(cy - outer - 1); y <= Math.ceil(cy + outer + 1); y++) {
      for (let x = Math.floor(cx - outer - 1); x <= Math.ceil(cx + outer + 1); x++) {
        const dist = Math.hypot(x - cx, y - cy);
        if (dist >= inner - 0.5 && dist <= outer + 0.5) {
          const outerAA = Math.max(0, Math.min(1, outer - dist + 0.5));
          const innerAA = Math.max(0, Math.min(1, dist - inner + 0.5));
          setPixel(x, y, Math.min(outerAA, innerAA));
        }
      }
    }
  }

  function fillRect(x0, y0, x1, y1) {
    for (let y = Math.round(y0); y <= Math.round(y1); y++) {
      for (let x = Math.round(x0); x <= Math.round(x1); x++) {
        setPixel(x, y, 1);
      }
    }
  }

  const cx = s / 2;
  const cy = s / 2;
  const stroke = Math.round(s * 0.045);

  // --- Smiley face ---
  // Face circle outline
  const faceR = s * 0.30;
  strokeCircle(cx, cy, faceR, stroke);

  // Eyes — filled dots
  const eyeR = s * 0.032;
  const eyeY = cy - faceR * 0.28;
  const eyeSpacing = faceR * 0.42;
  fillCircle(cx - eyeSpacing, eyeY, eyeR);
  fillCircle(cx + eyeSpacing, eyeY, eyeR);

  // Smile — bottom arc of a circle
  const smileCy = cy - faceR * 0.08;
  const smileR = faceR * 0.52;
  const smileStroke = stroke * 0.9;
  const smileOuter = smileR + smileStroke / 2;
  const smileInner = smileR - smileStroke / 2;

  for (let y = Math.floor(smileCy); y <= Math.ceil(smileCy + smileOuter + 1); y++) {
    for (let x = Math.floor(cx - smileOuter - 1); x <= Math.ceil(cx + smileOuter + 1); x++) {
      if (y < smileCy) continue;
      const dist = Math.hypot(x - cx, y - smileCy);
      if (dist >= smileInner - 0.5 && dist <= smileOuter + 0.5) {
        const outerAA = Math.max(0, Math.min(1, smileOuter - dist + 0.5));
        const innerAA = Math.max(0, Math.min(1, dist - smileInner + 0.5));
        setPixel(x, y, Math.min(outerAA, innerAA));
      }
    }
  }

  // --- Camera viewfinder brackets ---
  const margin = s * 0.13;
  const bracketLen = s * 0.11;
  const bw = stroke;

  // Top-left
  fillRect(margin, margin, margin + bracketLen, margin + bw);
  fillRect(margin, margin, margin + bw, margin + bracketLen);
  // Top-right
  fillRect(s - margin - bracketLen, margin, s - margin, margin + bw);
  fillRect(s - margin - bw, margin, s - margin, margin + bracketLen);
  // Bottom-left
  fillRect(margin, s - margin - bw, margin + bracketLen, s - margin);
  fillRect(margin, s - margin - bracketLen, margin + bw, s - margin);
  // Bottom-right
  fillRect(s - margin - bracketLen, s - margin - bw, s - margin, s - margin);
  fillRect(s - margin - bw, s - margin - bracketLen, s - margin, s - margin);

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
