import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

// Run after editing public/favicon.svg; paths are relative to this script.
const publicDir = new URL('../public/', import.meta.url);
const svg = await readFile(new URL('favicon.svg', publicDir));
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map((size) => sharp(svg).resize(size, size).png().toBuffer()));

// ICO directory followed by one PNG image per size.
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
images.forEach((image, index) => {
  const entry = 6 + index * 16;
  header[entry] = sizes[index];
  header[entry + 1] = sizes[index];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(image.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += image.length;
});

await Promise.all([
  writeFile(new URL('favicon.ico', publicDir), Buffer.concat([header, ...images])),
  writeFile(new URL('favicon-32.png', publicDir), images[1]),
  sharp(svg).resize(180, 180).flatten({ background: '#152420' }).png()
    .toFile(new URL('apple-touch-icon.png', publicDir).pathname),
]);
console.log('Generated favicon.ico (16/32/48), favicon-32.png, and apple-touch-icon.png.');
