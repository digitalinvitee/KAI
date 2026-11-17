/**
 * Turns final photography into the exact image slots the site expects.
 *
 * 1. Put originals in images-src/ named after the slot, any common format:
 *      images-src/kai-hero.jpg, images-src/kai-chef.png, …
 * 2. npm run images
 *
 * Each image is cropped to the slot's aspect ratio (smart crop that keeps the
 * most detailed area; pass --center for a plain centre crop), resized and saved
 * as WebP in assets/images/. If there is no kai-hero-mobile original, the
 * phone version is cropped from kai-hero automatically. Slots without an
 * original keep their placeholder.
 */
import sharp from 'sharp';
import { readdir, mkdir, stat } from 'node:fs/promises';
import { extname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { IMAGE_SLOTS } from './image-slots.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const sourceDir = join(root, process.env.IMAGES_SRC ?? 'images-src');
const outputDir = join(root, process.env.IMAGES_OUT ?? 'assets/images');
const center = process.argv.includes('--center');
const FORMATS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.avif']);

const sources = new Map();
try {
  for (const file of await readdir(sourceDir)) {
    if (FORMATS.has(extname(file).toLowerCase())) sources.set(basename(file, extname(file)), join(sourceDir, file));
  }
} catch {
  console.log(`No ${basename(sourceDir)}/ folder yet. Create it, add originals named after the slots, then run this again.`);
  process.exit(0);
}

await mkdir(outputDir, { recursive: true });
const rows = [];

for (const slot of IMAGE_SLOTS) {
  const source = sources.get(slot.id) ?? (slot.fallbackFrom ? sources.get(slot.fallbackFrom) : null);
  if (!source) {
    rows.push([slot.id, 'placeholder kept', '']);
    continue;
  }
  const target = join(outputDir, `${slot.id}.webp`);
  const image = sharp(source, { failOn: 'none' }).rotate();
  const meta = await image.metadata();
  await image
    .resize(slot.width, slot.height, {
      fit: 'cover',
      position: center ? 'centre' : sharp.strategy.attention,
      withoutEnlargement: false,
    })
    .webp({ quality: slot.quality, effort: 6, smartSubsample: true })
    .toFile(target);
  const { size } = await stat(target);
  const small = meta.width < slot.width || meta.height < slot.height;
  rows.push([
    slot.id,
    `${slot.width}×${slot.height} · ${Math.round(size / 1024)} KB`,
    `${basename(source)}${source.includes(slot.fallbackFrom ?? '\0') && !sources.has(slot.id) ? ' (cropped from hero)' : ''}${small ? ' · original smaller than slot, upscaled' : ''}`,
  ]);
}

console.log('KAI ▸ images');
rows.forEach(([id, result, note]) => console.log(`  ${id.padEnd(20)} ${result.padEnd(26)} ${note}`));
