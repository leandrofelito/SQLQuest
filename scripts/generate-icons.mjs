import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

mkdirSync(join(publicDir, 'icons'), { recursive: true })

// SVG base do ícone SQLQuest
const svg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#0f1117"/>
  <rect x="${size*0.06}" y="${size*0.06}" width="${size*0.88}" height="${size*0.88}" rx="${size*0.16}" fill="#0f1117" stroke="#8b5cf6" stroke-width="${size*0.03}"/>
  <text
    x="${size/2}" y="${size*0.62}"
    text-anchor="middle"
    font-family="monospace, sans-serif"
    font-weight="bold"
    font-size="${size*0.42}"
    fill="#a78bfa"
  >SQ</text>
  <text
    x="${size/2}" y="${size*0.88}"
    text-anchor="middle"
    font-family="monospace, sans-serif"
    font-weight="bold"
    font-size="${size*0.16}"
    fill="#6d28d9"
    letter-spacing="${size*0.02}"
  >QUEST</text>
</svg>`

const sizes = [
  { name: 'icon-72.png',   size: 72 },
  { name: 'icon-96.png',   size: 96 },
  { name: 'icon-128.png',  size: 128 },
  { name: 'icon-144.png',  size: 144 },
  { name: 'icon-152.png',  size: 152 },
  { name: 'icon-192.png',  size: 192 },
  { name: 'icon-384.png',  size: 384 },
  { name: 'icon-512.png',  size: 512 },
  // maskable (com padding de 20% para safe zone)
  { name: 'icon-maskable-192.png', size: 192, maskable: true },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
]

const svgMaskable = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0f1117"/>
  <text
    x="${size/2}" y="${size*0.58}"
    text-anchor="middle"
    font-family="monospace, sans-serif"
    font-weight="bold"
    font-size="${size*0.38}"
    fill="#a78bfa"
  >SQ</text>
  <text
    x="${size/2}" y="${size*0.80}"
    text-anchor="middle"
    font-family="monospace, sans-serif"
    font-weight="bold"
    font-size="${size*0.14}"
    fill="#6d28d9"
    letter-spacing="${size*0.02}"
  >QUEST</text>
</svg>`

for (const { name, size, maskable } of sizes) {
  await sharp(Buffer.from(maskable ? svgMaskable(size) : svg(size)))
    .png()
    .toFile(join(publicDir, 'icons', name))
  console.log(`✅ ${name}`)
}

console.log('\n✨ Ícones gerados em public/icons/')
