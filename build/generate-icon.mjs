import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, "app-icon.ico");
const sizes = [16, 24, 32, 48, 64, 128, 256];

mkdirSync(__dirname, { recursive: true });

const images = sizes.map((size) => createDibImage(size, drawIcon(size)));
const headerSize = 6 + images.length * 16;
let offset = headerSize;
const entries = [];

for (let index = 0; index < images.length; index += 1) {
  const size = sizes[index];
  const image = images[index];
  const entry = Buffer.alloc(16);
  entry[0] = size === 256 ? 0 : size;
  entry[1] = size === 256 ? 0 : size;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(image.length, 8);
  entry.writeUInt32LE(offset, 12);
  entries.push(entry);
  offset += image.length;
}

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);

writeFileSync(outputPath, Buffer.concat([header, ...entries, ...images]));

function drawIcon(size) {
  const pixels = new Uint8ClampedArray(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = (x + 0.5) / size;
      const ny = (y + 0.5) / size;
      const index = (y * size + x) * 4;

      if (Math.hypot(nx - 0.5, ny - 0.5) > 0.48) {
        continue;
      }

      setPixel(pixels, index, 18, 20, 23, 255);

      const outer = inPolygon(nx, ny, [
        [0.18, 0.22],
        [0.40, 0.19],
        [0.43, 0.15],
        [0.50, 0.18],
        [0.77, 0.19],
        [0.83, 0.25],
        [0.80, 0.78],
        [0.59, 0.82],
        [0.50, 0.87],
        [0.43, 0.82],
        [0.18, 0.78],
        [0.22, 0.55],
        [0.16, 0.48]
      ]);
      const slash = inPolygon(nx, ny, [
        [0.26, 0.26],
        [0.36, 0.22],
        [0.75, 0.65],
        [0.67, 0.76],
        [0.24, 0.34]
      ]);
      const topHole = inPolygon(nx, ny, [
        [0.60, 0.30],
        [0.73, 0.34],
        [0.67, 0.49]
      ]);
      const bottomHole = inPolygon(nx, ny, [
        [0.27, 0.62],
        [0.40, 0.74],
        [0.22, 0.75]
      ]);

      if (outer && !slash && !topHole && !bottomHole) {
        const shade = 1 - Math.max(0, ny - 0.25) * 0.24;
        setPixel(pixels, index, 224 * shade, 47 * shade, 44 * shade, 255);
      }
    }
  }

  return pixels;
}

function createDibImage(size, rgbaPixels) {
  const header = Buffer.alloc(40);
  const xor = Buffer.alloc(size * size * 4);
  const andStride = Math.ceil(size / 32) * 4;
  const andMask = Buffer.alloc(andStride * size);

  header.writeUInt32LE(40, 0);
  header.writeInt32LE(size, 4);
  header.writeInt32LE(size * 2, 8);
  header.writeUInt16LE(1, 12);
  header.writeUInt16LE(32, 14);
  header.writeUInt32LE(0, 16);
  header.writeUInt32LE(xor.length, 20);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const source = (y * size + x) * 4;
      const target = ((size - 1 - y) * size + x) * 4;
      xor[target] = rgbaPixels[source + 2];
      xor[target + 1] = rgbaPixels[source + 1];
      xor[target + 2] = rgbaPixels[source];
      xor[target + 3] = rgbaPixels[source + 3];
    }
  }

  return Buffer.concat([header, xor, andMask]);
}

function inPolygon(x, y, points) {
  let inside = false;

  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const xi = points[i][0];
    const yi = points[i][1];
    const xj = points[j][0];
    const yj = points[j][1];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function setPixel(pixels, index, red, green, blue, alpha) {
  pixels[index] = Math.round(red);
  pixels[index + 1] = Math.round(green);
  pixels[index + 2] = Math.round(blue);
  pixels[index + 3] = alpha;
}
