/**
 * Generate simple PWA icons using raw PNG data.
 * Creates a warm gold heart-shaped icon.
 *
 * Usage: node scripts/generate-icons.cjs
 */

const fs = require('fs')
const path = require('path')
const { createCanvas } = require('canvas')

// Fallback: if canvas isn't installed, create minimal valid PNGs
function createMinimalPNG(size) {
  // Minimal 1x1 warm color PNG (valid PNG binary)
  // We'll use a simple approach — generate a colored square via pure Node
  const { execSync } = require('child_process')

  // Use sips (macOS built-in) to create a simple colored image
  const tmpSvg = path.join(__dirname, `icon-${size}.svg`)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${size/5}" fill="#B8956A"/>
  <text x="${size/2}" y="${size/2+size/6}" text-anchor="middle" font-size="${size/2.5}" fill="white">🤗</text>
</svg>`
  fs.writeFileSync(tmpSvg, svg)

  const outPath = path.join(__dirname, '..', 'public', `icon-${size}.png`)
  try {
    execSync(`qlmanage -t -s ${size} -o /tmp ${tmpSvg} 2>/dev/null`)
    const generated = `/tmp/icon-${size}.svg.png`
    if (fs.existsSync(generated)) {
      fs.copyFileSync(generated, outPath)
    }
  } catch {}

  try { fs.unlinkSync(tmpSvg) } catch {}
}

// Main
const sizes = [192, 512]
for (const size of sizes) {
  const outPath = path.join(__dirname, '..', 'public', `icon-${size}.png`)
  if (fs.existsSync(outPath)) {
    console.log(`icon-${size}.png already exists`)
    continue
  }

  try {
    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext('2d')

    // Background
    const radius = size / 5
    ctx.beginPath()
    ctx.roundRect(0, 0, size, size, radius)
    ctx.fillStyle = '#B8956A'
    ctx.fill()

    // Inner lighter circle
    const cx = size / 2
    const cy = size / 2
    const r = size / 4
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = '#E8D5B7'
    ctx.fill()

    // Heart shape
    const heartSize = size / 3.5
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `${heartSize}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🤗', cx, cy)

    const buffer = canvas.toBuffer('image/png')
    fs.writeFileSync(outPath, buffer)
    console.log(`Generated icon-${size}.png`)
  } catch (err) {
    console.log(`Canvas not available, using fallback for ${size}...`)
    createMinimalPNG(size)
  }
}

console.log('Icon generation complete')
