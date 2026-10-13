/**
 * Pashmore — local image asset generator.
 *
 * The brief forbids fake external image URLs, so every image the site renders is
 * a real raster file committed under /public/images. This script writes true
 * 8-bit RGB PNGs from scratch (zlib + CRC32, no native dependencies) using a
 * small procedural renderer tuned to the Pashmore palette: warm ivory, sand,
 * taupe, charcoal and antique gold, with woven-cloth micro texture, soft drape
 * folds and a gentle vignette.
 *
 * These are production-shaped placeholders: correct aspect ratios, correct
 * filenames, correct colour story. Replace the files in place with real
 * photography and nothing in the application needs to change.
 *
 *   node scripts/generate-images.mjs
 */

import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, 'public', 'images')

/* ------------------------------------------------------------------ *
 * PNG encoding
 * ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

/** Adaptive row filtering (None / Sub / Up) keeps smooth gradients tiny. */
function filterScanlines(pixels, width, height) {
  const stride = width * 3
  const out = Buffer.alloc((stride + 1) * height)
  const sub = Buffer.alloc(stride)
  const up = Buffer.alloc(stride)

  for (let y = 0; y < height; y++) {
    const row = y * stride
    const prev = row - stride
    let sumNone = 0
    let sumSub = 0
    let sumUp = 0

    for (let i = 0; i < stride; i++) {
      const raw = pixels[row + i]
      const left = i >= 3 ? pixels[row + i - 3] : 0
      const above = y > 0 ? pixels[prev + i] : 0
      const s = (raw - left) & 0xff
      const u = (raw - above) & 0xff
      sub[i] = s
      up[i] = u
      sumNone += raw < 128 ? raw : 256 - raw
      sumSub += s < 128 ? s : 256 - s
      sumUp += u < 128 ? u : 256 - u
    }

    const dest = y * (stride + 1)
    if (sumUp <= sumSub && sumUp <= sumNone) {
      out[dest] = 2
      up.copy(out, dest + 1)
    } else if (sumSub <= sumNone) {
      out[dest] = 1
      sub.copy(out, dest + 1)
    } else {
      out[dest] = 0
      pixels.copy(out, dest + 1, row, row + stride)
    }
  }
  return out
}

function encodePng(pixels, width, height) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // colour type: truecolour
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const idat = deflateSync(filterScanlines(pixels, width, height), { level: 9 })

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ------------------------------------------------------------------ *
 * Palette + maths
 * ------------------------------------------------------------------ */

const PALETTE = {
  ivory: [247, 243, 236],
  cream: [239, 231, 218],
  sand: [227, 214, 195],
  beige: [217, 201, 178],
  taupe: [185, 168, 143],
  mocha: [138, 118, 96],
  brown: [74, 59, 46],
  charcoal: [34, 32, 29],
  ink: [24, 27, 36],
  slate: [96, 102, 108],
  gold: [176, 141, 79],
  brass: [201, 169, 97],
  burgundy: [92, 34, 51],
  crimson: [131, 40, 46],
  saffron: [198, 143, 63],
  emerald: [46, 82, 68],
  olive: [110, 111, 78],
  rose: [201, 167, 160],
  dusty: [176, 138, 133],
  camel: [178, 143, 100],
  mist: [206, 209, 206],
}

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const mix = (a, b, t) => a + (b - a) * t

/**
 * Ordered-dither amplitude in code values. The woven micro-texture already
 * breaks up banding on its own, so this stays at zero by default — every extra
 * LSB of dither costs real bytes in the committed PNGs.
 */
const DITHER_AMPLITUDE = Number(process.env.PASHMORE_DITHER ?? 0)

/** 4×4 Bayer matrix. */
const BAYER = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
].map((v) => (v / 15 - 0.5) * DITHER_AMPLITUDE)

/* ------------------------------------------------------------------ *
 * Renderer
 * ------------------------------------------------------------------ */

/**
 * @param {object} spec
 * @param {number} spec.w
 * @param {number} spec.h
 * @param {number} spec.seed
 * @param {string} spec.base   palette key — the dominant cloth colour
 * @param {string} spec.deep   palette key — the shadow colour
 * @param {string} [spec.accent] palette key — embroidery / motif colour
 * @param {'drape'|'weave'|'scene'|'flat'} [spec.style]
 * @param {boolean} [spec.motif] draw an ornamental border band
 */
function render(spec) {
  const { w, h, seed } = spec
  const style = spec.style ?? 'drape'
  const rnd = mulberry32(seed)

  const base = PALETTE[spec.base]
  const deep = PALETTE[spec.deep]
  const accent = spec.accent ? PALETTE[spec.accent] : null

  const gradAngle = rnd() * Math.PI
  const gcos = Math.cos(gradAngle)
  const gsin = Math.sin(gradAngle)

  // Drape folds: three low-frequency sine bands at slightly different angles.
  const folds = Array.from({ length: 3 }, () => ({
    angle: (rnd() - 0.5) * 0.9 + Math.PI / 2,
    freq: 1.6 + rnd() * 4.2,
    phase: rnd() * Math.PI * 2,
    amp: 0.05 + rnd() * 0.09,
  }))

  const lightX = 0.2 + rnd() * 0.6
  const lightY = 0.15 + rnd() * 0.4
  // Integer-period weave (2 px or 4 px). An exactly periodic texture is almost
  // free in the deflate stream; an irrational period never repeats and roughly
  // triples the file size for no visible gain.
  const weaveScale = style === 'weave' ? Math.PI : Math.PI / 2
  // Weave amplitude is deliberately small. Pixel-frequency detail is
  // incompressible, and these files ship in the repository.
  const weaveAmp = style === 'scene' ? 0.0015 : style === 'weave' ? 0.008 : 0.005
  const pixels = Buffer.alloc(w * h * 3)

  for (let y = 0; y < h; y++) {
    const ny = y / h
    for (let x = 0; x < w; x++) {
      const nx = x / w

      // Base gradient along a random axis.
      let t = clamp01((nx * gcos + ny * gsin + 0.5) * 0.7)

      // Cloth folds.
      let shade = 0
      if (style !== 'flat') {
        for (const f of folds) {
          const u = nx * Math.cos(f.angle) + ny * Math.sin(f.angle)
          shade += Math.sin(u * Math.PI * 2 * f.freq + f.phase) * f.amp
        }
      }

      // Directional key light.
      const d = Math.hypot(nx - lightX, ny - lightY)
      const key = Math.exp(-(d * d) / 0.36) * 0.16

      // Vignette — keeps the frame editorial rather than flat.
      const vx = (nx - 0.5) * 2
      const vy = (ny - 0.5) * 2
      const vignette = 1 - clamp01(Math.hypot(vx, vy) / 1.9) ** 2.2 * 0.34

      // Woven micro texture: warp and weft threads.
      const warp = Math.sin(x * weaveScale) * 0.5 + Math.sin(x * weaveScale * 0.5 + 1.1) * 0.5
      const weft = Math.sin(y * weaveScale) * 0.5 + Math.sin(y * weaveScale * 0.5 + 0.4) * 0.5
      const weave = warp * weft * weaveAmp

      let lum = clamp01(0.5 + shade + key + weave) * vignette
      let tone = clamp01(t + shade * 1.5 + 0.12)

      let r = mix(deep[0], base[0], tone)
      let g = mix(deep[1], base[1], tone)
      let b = mix(deep[2], base[2], tone)

      // Apply the light/shadow modelling multiplicatively so hues stay true.
      const shading = 0.72 + lum * 0.62
      r *= shading
      g *= shading
      b *= shading

      // Ornamental band — a suggestion of sozni embroidery along the borders.
      if (accent && spec.motif) {
        const edge = Math.min(nx, 1 - nx, ny, 1 - ny)
        if (edge < 0.11 && edge > 0.035) {
          const band = Math.sin((edge - 0.035) / 0.075 * Math.PI)
          const lattice =
            Math.sin(nx * Math.PI * 46) * Math.cos(ny * Math.PI * 46) * 0.5 +
            Math.sin((nx + ny) * Math.PI * 30) * 0.5
          const a = clamp01(band * (0.5 + lattice * 0.5)) * 0.38
          r = mix(r, accent[0], a)
          g = mix(g, accent[1], a)
          b = mix(b, accent[2], a)
        }
      }

      // Ordered (Bayer) dither instead of random grain: it removes the banding
      // you would otherwise get across these long gradients, but because the
      // pattern is periodic it costs almost nothing in the deflate stream.
      const n = BAYER[(y & 3) * 4 + (x & 3)]
      const i = (y * w + x) * 3
      pixels[i] = Math.max(0, Math.min(255, Math.round(r + n)))
      pixels[i + 1] = Math.max(0, Math.min(255, Math.round(g + n)))
      pixels[i + 2] = Math.max(0, Math.min(255, Math.round(b + n)))
    }
  }

  // A soft horizon line for "scene" frames reads as an architectural setting.
  if (style === 'scene') {
    const horizon = Math.floor(h * (0.55 + (seed % 7) / 60))
    for (let y = 0; y < h; y++) {
      const f = 1 - Math.min(1, Math.abs(y - horizon) / (h * 0.28))
      if (f <= 0) continue
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 3
        const a = f * f * 0.18
        pixels[i] = Math.round(mix(pixels[i], 255, a * 0.6))
        pixels[i + 1] = Math.round(mix(pixels[i + 1], 250, a * 0.55))
        pixels[i + 2] = Math.round(mix(pixels[i + 2], 238, a * 0.45))
      }
    }
  }

  return encodePng(pixels, w, h)
}

/* ------------------------------------------------------------------ *
 * Catalogue of assets to produce
 * ------------------------------------------------------------------ */

/**
 * Product photography lives in Cloudflare R2 and arrives with the catalogue.
 * This neutral frame is only shown when a product has no usable image.
 */
const PRODUCT_W = 800
const PRODUCT_H = 1000

const EDITORIAL = [
  ['hero-heritage', 2000, 1150, 'ivory', 'taupe', 'gold', 'scene'],
  ['hero-craft', 2000, 1150, 'sand', 'brown', 'gold', 'scene'],
  ['editorial-art-of-craft', 1200, 1500, 'cream', 'mocha', 'gold', 'drape'],
  ['editorial-loom', 1400, 1000, 'sand', 'brown', 'brass', 'weave'],
  ['editorial-artisan', 1400, 1000, 'taupe', 'charcoal', 'gold', 'drape'],
  ['editorial-kashmir', 1400, 1000, 'mist', 'slate', 'ivory', 'scene'],
  ['editorial-atelier', 1400, 1000, 'ivory', 'sand', 'gold', 'scene'],
  ['featured-pure-pashmina', 2200, 1000, 'ivory', 'taupe', 'gold', 'drape'],
  ['gifting-box', 1600, 1000, 'cream', 'brown', 'gold', 'drape'],
  ['about-hero', 2000, 1000, 'sand', 'brown', 'gold', 'scene'],
  ['contact-hero', 2000, 900, 'ivory', 'taupe', 'gold', 'scene'],
  ['og-default', 1200, 630, 'ivory', 'taupe', 'gold', 'drape'],
]

const CATEGORY_CARDS = [
  ['category-men', 'charcoal', 'ink', 'slate'],
  ['category-women', 'ivory', 'taupe', 'gold'],
  ['category-pashmina', 'cream', 'mocha', 'gold'],
  ['category-gifting', 'burgundy', 'charcoal', 'gold'],
]

const MENU_CARDS = [
  ['menu-men', 'slate', 'charcoal', 'mist'],
  ['menu-women', 'cream', 'taupe', 'gold'],
  ['menu-collections', 'sand', 'brown', 'brass'],
  ['menu-gifting', 'burgundy', 'charcoal', 'gold'],
]

const BANNERS = [
  ['womens-shawls', 'ivory', 'taupe'],
  ['womens-pashmina', 'cream', 'mocha'],
  ['womens-stoles', 'sand', 'brown'],
  ['womens-scarves', 'rose', 'mocha'],
  ['womens-dupattas', 'saffron', 'brown'],
  ['womens-dresses', 'beige', 'mocha'],
  ['womens-suits', 'emerald', 'charcoal'],
  ['mens-shawls', 'charcoal', 'ink'],
  ['mens-stoles', 'slate', 'charcoal'],
  ['mens-scarves', 'ink', 'charcoal'],
  ['mens-jackets', 'camel', 'brown'],
  ['mens-accessories', 'brown', 'charcoal'],
  ['pashmina', 'ivory', 'beige'],
  ['pure-pashmina', 'cream', 'taupe'],
  ['fine-wool', 'olive', 'brown'],
  ['kashmiri-collection', 'brass', 'brown'],
  ['heritage-collection', 'taupe', 'charcoal'],
  ['wedding-collection', 'crimson', 'burgundy'],
  ['luxury-collection', 'ink', 'charcoal'],
  ['new-arrivals', 'mist', 'slate'],
  ['best-sellers', 'sand', 'mocha'],
  ['gifts-for-her', 'rose', 'mocha'],
  ['gifts-for-him', 'slate', 'ink'],
  ['wedding-gifts', 'burgundy', 'charcoal'],
  ['corporate-gifts', 'mist', 'slate'],
  ['luxury-gift-boxes', 'cream', 'brown'],
  ['gifting', 'brass', 'brown'],
  ['shawls', 'beige', 'mocha'],
  ['stoles', 'sand', 'taupe'],
  ['scarves', 'dusty', 'mocha'],
  ['accessories', 'taupe', 'brown'],
]

const BLOG_COVERS = [
  ['what-is-pashmina', 'ivory', 'taupe'],
  ['how-to-identify-quality-pashmina', 'cream', 'mocha'],
  ['how-to-care-for-pashmina', 'mist', 'slate'],
  ['pashmina-vs-wool', 'sand', 'brown'],
  ['history-of-kashmiri-shawls', 'brass', 'brown'],
  ['best-shawls-for-wedding-gifting', 'crimson', 'burgundy'],
  ['styling-a-pashmina-shawl', 'rose', 'mocha'],
  ['the-kani-weave-explained', 'olive', 'brown'],
]

const INSTAGRAM_TONES = [
  ['ivory', 'taupe'],
  ['charcoal', 'ink'],
  ['sand', 'brown'],
  ['burgundy', 'charcoal'],
  ['cream', 'mocha'],
  ['mist', 'slate'],
  ['brass', 'brown'],
  ['rose', 'mocha'],
]

/* ------------------------------------------------------------------ *
 * Write everything
 * ------------------------------------------------------------------ */

let written = 0
let skipped = 0

function emit(relPath, buffer) {
  const full = join(OUT, relPath)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, buffer)
  written++
  if (written % 25 === 0) process.stdout.write(`  …${written} images\n`)
}

function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const force = process.argv.includes('--force')

function make(relPath, spec) {
  if (!force && existsSync(join(OUT, relPath))) {
    skipped++
    return
  }
  emit(relPath, render(spec))
}

console.log('Generating Pashmore image assets…')

make('placeholders/product.png', {
  w: PRODUCT_W,
  h: PRODUCT_H,
  seed: hash('placeholder-product'),
  base: 'ivory',
  deep: 'beige',
  style: 'flat',
  motif: false,
})

for (const [name, w, h, base, deep, accent, style] of EDITORIAL) {
  make(`editorial/${name}.png`, {
    w,
    h,
    seed: hash(name),
    base,
    deep,
    accent,
    style,
    motif: false,
  })
}

for (const [name, base, deep, accent] of CATEGORY_CARDS) {
  make(`categories/${name}.png`, {
    w: 1000,
    h: 1250,
    seed: hash(name),
    base,
    deep,
    accent,
    style: 'drape',
    motif: true,
  })
}

for (const [name, base, deep, accent] of MENU_CARDS) {
  make(`menu/${name}.png`, {
    w: 600,
    h: 760,
    seed: hash(name),
    base,
    deep,
    accent,
    style: 'drape',
    motif: false,
  })
}

for (const [slug, base, deep] of BANNERS) {
  make(`banners/${slug}.png`, {
    w: 1800,
    h: 620,
    seed: hash(`banner-${slug}`),
    base,
    deep,
    accent: 'gold',
    style: 'drape',
    motif: false,
  })
}

for (const [slug, base, deep] of BLOG_COVERS) {
  make(`blog/${slug}.png`, {
    w: 1200,
    h: 750,
    seed: hash(`blog-${slug}`),
    base,
    deep,
    accent: 'gold',
    style: 'scene',
    motif: false,
  })
}

INSTAGRAM_TONES.forEach(([base, deep], index) => {
  make(`social/instagram-${index + 1}.png`, {
    w: 700,
    h: 700,
    seed: hash(`instagram-${index}`),
    base,
    deep,
    accent: 'gold',
    style: index % 2 === 0 ? 'drape' : 'weave',
    motif: index % 3 === 0,
  })
})

console.log(`\nDone. ${written} written, ${skipped} already present.`)
console.log(`Output: ${OUT}`)
if (skipped && !force) console.log('Re-run with --force to regenerate existing files.')
