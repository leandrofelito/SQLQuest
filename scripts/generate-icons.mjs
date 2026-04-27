import sharp from 'sharp'
import { mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const iconsDir = join(publicDir, 'icons')
const brandDir = join(__dirname, '..', 'brand')

mkdirSync(iconsDir, { recursive: true })

// ── 1. Gerar favicon-mark-512.png a partir do brand SVG ──────────────────────
const markSvg = join(brandDir, 'sqlquest-mark-sem-escrita.svg')
const markPng = join(brandDir, 'sqlquest-mark-sem-escrita.png')
const markPath = existsSync(markSvg) ? markSvg : markPng

if (!existsSync(markPath)) {
  console.error('❌ brand/sqlquest-mark-sem-escrita.svg ou .png ausente — abortando.')
  process.exit(1)
}

// Extrai só o escudo sem o fundo, redimensiona para 460×460 e centraliza em 512×512 escuro
// trim() é necessário para remover espaço transparente assimétrico do SVG original
const MARK_SIZE = 512
const SHIELD_SIZE = 480  // escudo ocupa 94% do canvas — bem visível e centralizado

const shieldBuf = await sharp(markPath)
  .ensureAlpha()
  .trim({ threshold: 15 })
  .resize({
    width: SHIELD_SIZE,
    height: SHIELD_SIZE,
    fit: 'inside',
    position: 'centre',
  })
  .toBuffer()

await sharp({
  create: {
    width: MARK_SIZE,
    height: MARK_SIZE,
    channels: 4,
    background: { r: 15, g: 17, b: 23, alpha: 1 },
  },
})
  .composite([{ input: shieldBuf, gravity: 'centre' }])
  .png()
  .toFile(join(iconsDir, 'favicon-mark-512.png'))

console.log('✅ favicon-mark-512.png')

// ── 2. Favicon da aba do navegador (64×64 e 32×32) ───────────────────────────
// Usar tamanho maior e escudo proporcional para evitar aparência torta em baixa resolução
await sharp(join(iconsDir, 'favicon-mark-512.png'))
  .resize(64, 64, { fit: 'cover', position: 'centre' })
  .png()
  .toFile(join(iconsDir, 'favicon.png'))

console.log('✅ favicon.png (64x64)')

// ── 3. Ícones do app PWA — todos derivados do escudo ─────────────────────────
const appSizes = [72, 96, 128, 144, 152, 192, 384, 512]

for (const size of appSizes) {
  await sharp(join(iconsDir, 'favicon-mark-512.png'))
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(join(iconsDir, `icon-${size}.png`))
  console.log(`✅ icon-${size}.png`)
}

// ── 4. Ícones maskable (safe zone = 80% do canvas) ───────────────────────────
// Para maskable, o conteúdo deve caber nos 80% centrais (safe area)
for (const size of [192, 512]) {
  const safeSize = Math.round(size * 0.72)  // escudo em 72% para folga na safe zone

  const shieldMaskBuf = await sharp(markPath)
    .ensureAlpha()
    .trim({ threshold: 15 })
    .resize({
      width: safeSize,
      height: safeSize,
      fit: 'inside',
      position: 'centre',
    })
    .toBuffer()

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 15, g: 17, b: 23, alpha: 1 },
    },
  })
    .composite([{ input: shieldMaskBuf, gravity: 'centre' }])
    .png()
    .toFile(join(iconsDir, `icon-maskable-${size}.png`))

  console.log(`✅ icon-maskable-${size}.png`)
}

console.log('\n✨ Todos os ícones gerados em public/icons/')
