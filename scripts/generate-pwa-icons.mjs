/**
 * Pashmore — PWA icon generator.
 *
 * Builds the Android adaptive ("maskable") install icons from the existing
 * brand mark so the home-screen icon always matches the website:
 *
 *   public/icon-maskable-192.png
 *   public/icon-maskable-512.png
 *
 * The goat mark sits inside the 80% "safe zone" on an ivory square, so
 * launchers can crop it to a circle, squircle or teardrop without clipping the
 * horns. The existing icon-192/icon-512 ("any" purpose) and apple-touch-icon
 * files are left untouched. Uses `sharp`, which Next.js already ships for image
 * optimisation, so no new dependency is added.
 *
 *   node scripts/generate-pwa-icons.mjs
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC = join(ROOT, 'public')
const SOURCE = join(PUBLIC, 'icon-512.png')
const IVORY = { r: 250, g: 247, b: 242, alpha: 1 }
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 }

async function maskable(size) {
  // 64% of the canvas keeps the whole mark inside the 80% circle safe zone.
  const inner = Math.round(size * 0.64)
  const mark = await sharp(SOURCE).resize(inner, inner, { fit: 'contain', background: CLEAR }).toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: IVORY } })
    .composite([{ input: mark, gravity: 'centre' }])
    .flatten({ background: IVORY })
    .png({ palette: true, quality: 90, compressionLevel: 9 })
    .toFile(join(PUBLIC, `icon-maskable-${size}.png`))
}

await Promise.all([maskable(192), maskable(512)])
console.log('Maskable PWA icons written to public/')
