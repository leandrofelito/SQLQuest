import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const iconsDir = join(publicDir, 'icons')
const logoPath = join(__dirname, '..', 'brand', 'logooficialSQLQUESTpng.png')

mkdirSync(iconsDir, { recursive: true })

// A logo já tem fundo preto (#080a0f) e escudo centralizado — apenas redimensionar.
// Não usar trim() pois o fundo preto faz parte do design.

// ── 1. Master 512×512 ────────────────────────────────────────────────────────
await sharp(logoPath)
  .resize(512, 512, { fit: 'contain', background: { r: 8, g: 10, b: 15, alpha: 1 } })
  .png()
  .toFile(join(iconsDir, 'favicon-mark-512.png'))

console.log('✅ favicon-mark-512.png')

// ── 2. Favicon da aba do browser ─────────────────────────────────────────────
await sharp(logoPath)
  .resize(64, 64, { fit: 'contain', background: { r: 8, g: 10, b: 15, alpha: 1 } })
  .png()
  .toFile(join(iconsDir, 'favicon.png'))

console.log('✅ favicon.png (64x64)')

// ── 3. Ícones PWA ────────────────────────────────────────────────────────────
const appSizes = [72, 96, 128, 144, 152, 192, 384, 512]

for (const size of appSizes) {
  await sharp(logoPath)
    .resize(size, size, { fit: 'contain', background: { r: 8, g: 10, b: 15, alpha: 1 } })
    .png()
    .toFile(join(iconsDir, `icon-${size}.png`))
  console.log(`✅ icon-${size}.png`)
}

// ── 4. Maskable (escudo em 75% para respeitar a safe zone de 80%) ────────────
for (const size of [192, 512]) {
  const innerSize = Math.round(size * 0.75)

  const shieldBuf = await sharp(logoPath)
    .resize(innerSize, innerSize, { fit: 'contain', background: { r: 8, g: 10, b: 15, alpha: 1 } })
    .toBuffer()

  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 8, g: 10, b: 15, alpha: 1 } },
  })
    .composite([{ input: shieldBuf, gravity: 'centre' }])
    .png()
    .toFile(join(iconsDir, `icon-maskable-${size}.png`))

  console.log(`✅ icon-maskable-${size}.png`)
}

console.log('\n✨ Todos os ícones gerados em public/icons/')
