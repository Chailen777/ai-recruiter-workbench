/**
 * 生成各种尺寸的 PWA 图标
 * 运行方式：node scripts/generate-pwa-icons.mjs
 * 需要安装 sharp：npm install sharp --save-dev
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 如果没有 sharp，创建一个简单的占位提示
let sharp

try {
  sharp = (await import('sharp')).default
} catch {
  console.error('请安装 sharp：npm install sharp --save-dev')
  console.log('或者手动将 chailen-logo.png 复制到以下尺寸：')
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
  sizes.forEach(s => console.log(`  - public/icons/icon-${s}x${s}.png`))
  console.log('  - public/icons/apple-touch-icon.png (180x180)')
  process.exit(1)
}

const sourceLogo = path.join(__dirname, '..', 'public', 'chailen-logo.png')
const outputDir = path.join(__dirname, '..', 'public', 'icons')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

async function generateIcons() {
  if (!fs.existsSync(sourceLogo)) {
    console.error('源文件不存在:', sourceLogo)
    process.exit(1)
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  console.log('正在生成 PWA 图标...')

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`)
    await sharp(sourceLogo)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(outputPath)
    console.log(`  已生成: icon-${size}x${size}.png`)
  }

  // Apple touch icon
  await sharp(sourceLogo)
    .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(outputDir, 'apple-touch-icon.png'))
  console.log('  已生成: apple-touch-icon.png')

  // Favicon
  await sharp(sourceLogo)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(outputDir, 'favicon-32x32.png'))
  console.log('  已生成: favicon-32x32.png')

  console.log('\n所有图标生成完成！')
}

generateIcons().catch(console.error)
