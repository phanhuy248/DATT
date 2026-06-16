/**
 * download-images.mjs
 *
 * Downloads hotlink-protected images from TGDD / GearVN / Phong Vu to local storage,
 * then generates a SQL UPDATE to point the DB records to the local paths.
 *
 * CellphoneS images are already accessible (no hotlink protection) — skipped here.
 *
 * Usage:
 *   node download-images.mjs [--input=output/products-clean.json] [--dest=../uploads/products]
 *
 * After running:
 *   mysql -u root -p smartshop < output/fix-images-local.sql
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const args = parseArgs(process.argv.slice(2))
const INPUT_FILE  = args.input  || 'output/products-clean.json'
const DEST_DIR    = args.dest   || '../uploads/products'
const SQL_OUTPUT  = args.sql    || 'output/fix-images-local.sql'
const SOURCE_SITE = 'crawl-clean'
const BASE_URL    = args['base-url'] || '/uploads/products'

const DELAY_MS = 800

// Fix MSYS path conversion on Windows/Git Bash:
// Git Bash converts --base-url=/uploads/products → C:/Program Files/Git/uploads/products
// We undo that by stripping any Windows absolute path prefix and keeping just the web path.
function toWebPath(rawPath) {
  // Remove Windows drive prefix (e.g. C:/Program Files/Git)
  return rawPath.replace(/^[A-Z]:\/[^/]+\/[^/]+/, '').replace(/^[A-Z]:/, '') || rawPath
}

// Sites whose CDN blocks hotlinking (Referer check)
const HOTLINK_PROTECTED = new Set(['tgdd', 'gearvn', 'phongvu'])

// ─── Load input ──────────────────────────────────────────────────────────────

let rawData
try {
  rawData = JSON.parse(await fs.readFile(INPUT_FILE, 'utf8'))
} catch (err) {
  console.error(`Cannot read ${INPUT_FILE}: ${err.message}`)
  process.exit(1)
}

const allProducts = rawData.products ?? rawData
const affected = allProducts.filter(p =>
  HOTLINK_PROTECTED.has(p.source) && p.image && p.image.startsWith('http')
)

console.log(`Products with potentially hotlink-protected images: ${affected.length}`)
console.log(`Destination: ${DEST_DIR}`)

await fs.mkdir(DEST_DIR, { recursive: true })

const sqlLines = []
sqlLines.push(`-- fix-images-local.sql`)
sqlLines.push(`-- Updates image URLs for hotlink-protected products to local paths.`)
sqlLines.push(`-- Only touches source_site='${SOURCE_SITE}' products.`)
sqlLines.push(`SET NAMES utf8mb4;`)
sqlLines.push(``)

let downloaded = 0
let failed = 0
let skipped = 0

for (const p of affected) {
  const extId = (p.externalId || slugify(p.name || '')).substring(0, 128)
  const localPath = await downloadImage(p.image, p.sourceUrl, DEST_DIR)

  if (localPath) {
    const urlPath = toWebPath(BASE_URL) + '/' + path.basename(localPath)
    sqlLines.push(
      `UPDATE products SET image = ${e(urlPath)}, updated_at = NOW(6)` + '\n' +
      `WHERE external_id = ${e(extId)} AND source_site = ${e(SOURCE_SITE)};`
    )
    sqlLines.push(``)
    downloaded++
    console.log(`[dl] ${p.name.substring(0, 50)} → ${path.basename(localPath)}`)
  } else {
    failed++
    console.warn(`[fail] ${p.name.substring(0, 50)} — could not download ${p.image.substring(0, 60)}`)
  }

  await sleep(DELAY_MS)
}

console.log(`\nDone: ${downloaded} downloaded, ${failed} failed, ${skipped} skipped`)

if (downloaded > 0) {
  await fs.writeFile(SQL_OUTPUT, sqlLines.join('\n'), 'utf8')
  console.log(`\nSQL UPDATE → ${SQL_OUTPUT}`)
  console.log(`Run: mysql -u root -p smartshop < ${SQL_OUTPUT}`)
} else {
  console.log('Nothing to update.')
}

// ─── Download helper ─────────────────────────────────────────────────────────

async function downloadImage(imageUrl, sourceUrl, destDir) {
  // Use the product page URL as Referer — most CDNs check this
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0',
    'Referer': sourceUrl || imageUrl,
    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
  }

  try {
    const res = await fetch(imageUrl, { headers })
    if (!res.ok || !res.body) return null

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) return null

    const ext = extFromContentType(contentType) || extFromUrl(imageUrl) || 'jpg'
    const hash = crypto.createHash('md5').update(imageUrl).digest('hex').substring(0, 12)
    const filename = `crawl_${hash}.${ext}`
    const destPath = path.join(destDir, filename)

    // Skip if already exists
    try {
      await fs.access(destPath)
      return destPath  // already downloaded
    } catch {}

    // Write to disk
    const fileHandle = await fs.open(destPath, 'w')
    try {
      await pipeline(Readable.fromWeb(res.body), fileHandle.createWriteStream())
    } finally {
      await fileHandle.close()
    }

    // Verify file is non-empty
    const stat = await fs.stat(destPath)
    if (stat.size < 1000) {
      await fs.unlink(destPath)
      return null  // tiny file = error response, not an image
    }

    return destPath
  } catch {
    return null
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extFromContentType(ct) {
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg'
  if (ct.includes('png')) return 'png'
  if (ct.includes('webp')) return 'webp'
  if (ct.includes('gif')) return 'gif'
  return null
}

function extFromUrl(url) {
  const m = url.match(/\.(jpe?g|png|webp|gif)(?:[?#]|$)/i)
  return m ? m[1].replace('jpeg', 'jpg') : null
}

function e(value) {
  if (value === null || value === undefined) return 'NULL'
  return "'" + String(value)
    .replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    .replace(/\0/g, '\\0').replace(/\n/g, '\\n').replace(/\r/g, '\\r')
    + "'"
}

function slugify(text) {
  return String(text || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 50)
}

function parseArgs(argv) {
  return argv.reduce((acc, arg) => {
    if (!arg.startsWith('--')) return acc
    const [key, value] = arg.slice(2).split('=')
    acc[key] = value ?? true
    return acc
  }, {})
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
