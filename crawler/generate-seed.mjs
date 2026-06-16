/**
 * generate-seed.mjs
 *
 * Reads crawler/output/products-clean.json and emits crawler/output/seed_products.sql.
 *
 * Safety rules:
 *   - Chỉ INSERT, không bao giờ UPDATE / DELETE sản phẩm cũ.
 *   - Guard kép: bỏ qua nếu external_id đã tồn tại trong source_site='crawl-clean'
 *                HOẶC nếu tên sản phẩm đã tồn tại (bảo vệ đơn hàng cũ).
 *   - source_site = 'crawl-clean' để nhận dạng dễ dàng.
 *   - Idempotent: chạy lại không tạo bản ghi trùng.
 *
 * Usage:
 *   node generate-seed.mjs [--input=output/products-clean.json] [--output=output/seed_products.sql]
 *
 * Then run the SQL:
 *   mysql -u root -p smartshop < output/seed_products.sql
 */

import fs from 'node:fs/promises'
import path from 'node:path'

// Same suffix patterns as in crawl-products.mjs — applied again as safety net
const NAME_SUFFIX_RE = new RegExp(
  '[-|,\\s]+(' +
  'chính hãng|chinh hang|giá rẻ|gia re|giá tốt|gia tot|' +
  'giảm ngay|giam ngay|giảm \\d|tặng \\d|tang \\d|' +
  '1 đổi 1|1doi1|' +
  'bh \\d+ tháng|bảo hành \\d+ tháng|bảo hành chính hãng|' +
  'trả góp 0%|tra gop|góp 0%|gop 0%|' +
  'thu cũ|đổi mới|doi moi|sale off|hot deal|new arrival|' +
  'chính thức|ủy quyền|tặng quà' +
  ').*$',
  'gi',
)

const cliArgs = parseArgs(process.argv.slice(2))
const INPUT_FILE  = cliArgs.input  || 'output/products-clean.json'
const OUTPUT_FILE = cliArgs.output || 'output/seed_products.sql'
const SOURCE_SITE = 'crawl-clean'

// ─── Load products-clean.json ─────────────────────────────────────────────────

let rawData
try {
  rawData = JSON.parse(await fs.readFile(INPUT_FILE, 'utf8'))
} catch (err) {
  console.error(`Cannot read ${INPUT_FILE}: ${err.message}`)
  console.error('Run the crawler first:  npm run crawl')
  process.exit(1)
}

const allProducts = rawData.products ?? rawData
if (!Array.isArray(allProducts) || allProducts.length === 0) {
  console.error('No products found in input file.')
  process.exit(1)
}

// ─── Pre-validate & filter ───────────────────────────────────────────────────

const valid = []
const rejections = []

for (const p of allProducts) {
  const reason = validateProduct(p)
  if (reason) {
    rejections.push({ name: p.name || '<unnamed>', reason })
  } else {
    valid.push(p)
  }
}

console.log(`Input  : ${allProducts.length} products`)
console.log(`Valid  : ${valid.length}`)
console.log(`Skipped: ${rejections.length}`)
rejections.forEach(r => console.warn(`  [skip] ${r.name} — ${r.reason}`))

// ─── Collect unique categories & suppliers ───────────────────────────────────

const categories = [...new Set(valid.map(p => normalizeCategory(p.category)))]
const suppliers  = [...new Set(valid.map(p => (p.supplier || p.sourceSite || 'Nhà cung cấp khác').trim()))]

// ─── Build SQL ───────────────────────────────────────────────────────────────

const lines = []

lines.push(`-- ============================================================`)
lines.push(`-- SmartShop seed_products.sql`)
lines.push(`-- Generated: ${new Date().toISOString()}`)
lines.push(`-- Source   : ${INPUT_FILE}  (crawledAt: ${rawData.crawledAt ?? 'unknown'})`)
lines.push(`-- Products : ${valid.length} (${rejections.length} skipped)`)
lines.push(`-- source_site = '${SOURCE_SITE}'`)
lines.push(`--`)
lines.push(`-- HOW TO RUN:`)
lines.push(`--   mysql -u root -p smartshop < output/seed_products.sql`)
lines.push(`--`)
lines.push(`-- SAFETY:`)
lines.push(`--   - Chỉ INSERT mới; không UPDATE / DELETE sản phẩm cũ.`)
lines.push(`--   - Guard theo external_id + name → idempotent, chạy lại an toàn.`)
lines.push(`-- ============================================================`)
lines.push(``)
lines.push(`SET NAMES utf8mb4;`)
lines.push(`SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;`)
lines.push(``)

// ── Categories ────────────────────────────────────────────────────────────────
lines.push(`-- ─── CATEGORIES ─────────────────────────────────────────────────`)
for (const cat of categories) {
  // categories schema: id, name, description, deleted (no timestamps)
  lines.push(
    `INSERT INTO categories (name, description, deleted)` + '\n' +
    `SELECT ${e(cat)}, ${e('Danh mục sản phẩm')}, 0` + '\n' +
    `WHERE NOT EXISTS (SELECT 1 FROM categories WHERE LOWER(name) = LOWER(${e(cat)}));`
  )
  lines.push(``)
}

// ── Suppliers ─────────────────────────────────────────────────────────────────
lines.push(`-- ─── SUPPLIERS ──────────────────────────────────────────────────`)
for (const sup of suppliers) {
  const email = slugify(sup) + '@smartshop.local'
  // suppliers schema: id, active, address, deleted, email, name, phone, representative_name (no timestamps)
  lines.push(
    `INSERT INTO suppliers (name, representative_name, email, phone, address, deleted, active)` + '\n' +
    `SELECT ${e(sup)}, ${e(sup)}, ${e(email)}, ${e('0000000000')}, ${e('Nhập từ crawler')}, 0, 1` + '\n' +
    `WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE LOWER(name) = LOWER(${e(sup)}) AND deleted = 0);`
  )
  lines.push(``)
}

// ── Products ──────────────────────────────────────────────────────────────────
lines.push(`-- ─── PRODUCTS ───────────────────────────────────────────────────`)
lines.push(`-- Guard kép:`)
lines.push(`--   1. Không insert nếu external_id này đã có trong source_site='crawl-clean'`)
lines.push(`--   2. Không insert nếu name đã tồn tại (bất kể nguồn) → bảo vệ đơn hàng cũ`)
lines.push(``)

let insertCount = 0
for (const p of valid) {
  const catName   = normalizeCategory(p.category)
  const supName   = (p.supplier || p.sourceSite || 'Nhà cung cấp khác').trim()
  const brand     = (p.factory || p.brand || inferBrand(p.name) || supName).substring(0, 120)
  const extId     = (p.externalId || slugify(p.name)).substring(0, 128)
  const sourceUrl = (p.sourceUrl || '').substring(0, 1024)
  // Apply cleanName again as safety net (catches any residual ad text from older crawl runs)
  const name      = cleanName(p.name || '').substring(0, 240) || p.name.substring(0, 240)
  const shortDesc = (p.shortDesc || p.description || name).substring(0, 240)
  const detailDesc = p.description || shortDesc
  const target    = defaultTarget(catName)
  const qty       = typeof p.stock === 'number' ? Math.max(0, p.stock) : 10
  const specs     = JSON.stringify(p.specifications && Object.keys(p.specifications).length > 0
    ? p.specifications : {})
  const rawImages = Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image]
  const cleanedImages = rawImages.map(fixCdnUrl).filter(isUsableImageUrl).filter((v, i, a) => a.indexOf(v) === i)
  // Primary image: use first cleaned image, falling back to fixing p.image directly
  const primaryImage = cleanedImages[0] || fixCdnUrl(p.image) || p.image
  const gallery   = JSON.stringify(cleanedImages.length > 0 ? cleanedImages : [primaryImage])

  lines.push(`-- [${insertCount + 1}] ${name}`)
  lines.push(
    `INSERT INTO products` + '\n' +
    `  (version, name, price, image, detail_desc, short_desc, quantity, sold,` + '\n' +
    `   factory, target, deleted, active, source_site, source_url, external_id,` + '\n' +
    `   specifications, gallery_images, category_id, supplier_id, created_at, updated_at)` + '\n' +
    `SELECT` + '\n' +
    `  0,` + '\n' +
    `  ${e(name)},` + '\n' +
    `  ${p.price},` + '\n' +
    `  ${e(primaryImage)},` + '\n' +
    `  ${e(detailDesc)},` + '\n' +
    `  ${e(shortDesc)},` + '\n' +
    `  ${qty}, 0,` + '\n' +
    `  ${e(brand)},` + '\n' +
    `  ${e(target)},` + '\n' +
    `  0, 1,` + '\n' +
    `  ${e(SOURCE_SITE)},` + '\n' +
    `  ${e(sourceUrl)},` + '\n' +
    `  ${e(extId)},` + '\n' +
    `  ${e(specs)},` + '\n' +
    `  ${e(gallery)},` + '\n' +
    `  (SELECT id FROM categories WHERE LOWER(name) = LOWER(${e(catName)}) LIMIT 1),` + '\n' +
    `  (SELECT id FROM suppliers  WHERE LOWER(name) = LOWER(${e(supName)}) AND deleted = 0 LIMIT 1),` + '\n' +
    `  NOW(6), NOW(6)` + '\n' +
    `FROM DUAL` + '\n' +
    `WHERE NOT EXISTS (` + '\n' +
    `  SELECT 1 FROM products WHERE external_id = ${e(extId)} AND source_site = ${e(SOURCE_SITE)}` + '\n' +
    `) AND NOT EXISTS (` + '\n' +
    `  SELECT 1 FROM products WHERE LOWER(name) = LOWER(${e(name)}) AND deleted = 0` + '\n' +
    `);`
  )
  lines.push(``)
  insertCount++
}

lines.push(`SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;`)
lines.push(``)
lines.push(`-- ─── IMAGE URL FIX (safe to run multiple times) ─────────────────`)
lines.push(`-- Fixes CellphoneS CDN thumbnail URLs for already-inserted crawl-clean products.`)
lines.push(`-- Only touches products WHERE source_site='${SOURCE_SITE}' — old products untouched.`)
lines.push(``)

for (const p of valid) {
  const rawImages = Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image]
  const cleanedImgs = rawImages.map(fixCdnUrl).filter(isUsableImageUrl).filter((v, i, a) => a.indexOf(v) === i)
  const fixedPrimary = cleanedImgs[0] || fixCdnUrl(p.image)
  if (!fixedPrimary) continue
  const fixedGallery = JSON.stringify(cleanedImgs.length > 0 ? cleanedImgs : [fixedPrimary])
  const extId = (p.externalId || slugify(p.name || '')).substring(0, 128)
  lines.push(
    `UPDATE products SET image = ${e(fixedPrimary)}, gallery_images = ${e(fixedGallery)}, updated_at = NOW(6)` + '\n' +
    `WHERE external_id = ${e(extId)} AND source_site = ${e(SOURCE_SITE)};`
  )
}
lines.push(``)
lines.push(`-- ─── VERIFICATION QUERY ──────────────────────────────────────────`)
lines.push(`SELECT`)
lines.push(`  COUNT(*)                            AS total_crawl_clean,`)
lines.push(`  SUM(CASE WHEN image IS NOT NULL AND image != '' THEN 1 ELSE 0 END) AS with_image,`)
lines.push(`  MIN(price)                          AS min_price,`)
lines.push(`  MAX(price)                          AS max_price,`)
lines.push(`  AVG(price)                          AS avg_price`)
lines.push(`FROM products`)
lines.push(`WHERE source_site = '${SOURCE_SITE}' AND deleted = 0;`)
lines.push(``)
lines.push(`-- Sample: first 5 new products`)
lines.push(`SELECT id, name, price, image, factory, source_site`)
lines.push(`FROM products`)
lines.push(`WHERE source_site = '${SOURCE_SITE}' AND deleted = 0`)
lines.push(`ORDER BY created_at DESC LIMIT 5;`)

// ─── Write output ────────────────────────────────────────────────────────────

const sql = lines.join('\n')
await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true })
await fs.writeFile(OUTPUT_FILE, sql, 'utf8')

console.log(`\nWrote ${insertCount} product INSERT statements → ${OUTPUT_FILE}`)
console.log(`\nNext steps:`)
console.log(`  1. Review the SQL:  cat ${OUTPUT_FILE}`)
console.log(`  2. Run against DB:  mysql -u root -p smartshop < ${OUTPUT_FILE}`)
console.log(`  3. Verify in DB:    SELECT COUNT(*) FROM products WHERE source_site='crawl-clean';`)

// Print sample products for visual inspection
console.log(`\nSample products (first 5):`)
valid.slice(0, 5).forEach((p, i) => {
  const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)
  console.log(`  [${i + 1}] ${p.name}`)
  console.log(`       Price : ${price}`)
  console.log(`       Image : ${p.image}`)
  console.log(`       Cat   : ${p.category}  |  Brand: ${p.brand || p.factory || '—'}`)
})

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fixCdnUrl(url) {
  if (!url || typeof url !== 'string') return ''
  const proxyMatch = url.match(/\/insecure\/(?:[^/]+\/)+plain\/(.+)$/)
  if (proxyMatch) { try { url = decodeURIComponent(proxyMatch[1]) } catch {} }
  // CellphoneS CDN (cdn2.cellphones.com.vn) requires a resize prefix to serve images.
  // Strip the CDN subdomain (+ optional resize segment) → use origin cellphones.com.vn directly.
  url = url.replace(/^(https?:)\/\/cdn\d*\.(cellphones\.com\.vn)\/(?:\d+x\d*\/)?/, '$1//$2/')
  if (url.startsWith('//')) url = 'https:' + url
  return url
}

function isUsableImageUrl(url) {
  if (!url || typeof url !== 'string') return false
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false
  if (/placeholder|no.?image|blank|sprite|loading|icon|logo\.(png|svg)/i.test(url)) return false
  if (/youtube\.com|ytimg\.com/i.test(url)) return false
  return true
}

function cleanName(text) {
  if (!text) return ''
  return text
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
    .replace(/[✔✓★☆♦♣♥◆⚡🔥]/g, '')
    .replace(NAME_SUFFIX_RE, '')
    .replace(/^[-|,\s]+/, '').replace(/[-|,\s]+$/, '')
    .replace(/\s+/g, ' ').trim()
}

/** MySQL string escape — single-quote escaping */
function e(value) {
  if (value === null || value === undefined) return 'NULL'
  return "'" + String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z')
    + "'"
}

function validateProduct(p) {
  if (!p.name || !p.name.trim()) return 'missing name'
  if (!p.price || Number(p.price) <= 0) return 'invalid price'
  if (!p.image || !p.image.startsWith('http')) return 'missing image URL'
  return null  // valid
}

function normalizeCategory(raw) {
  if (!raw) return 'Khác'
  const lower = raw.toLowerCase().trim()
  if (lower.includes('laptop') || lower.includes('máy tính')) return 'Laptop'
  if (lower.includes('điện thoại') || lower.includes('dien thoai') || lower.includes('mobile')) return 'Điện thoại'
  if (lower.includes('phụ kiện') || lower.includes('phu kien') || lower.includes('accessory')) return 'Phụ kiện'
  // Title-case the raw value
  return raw.trim()
}

function defaultTarget(category) {
  if (category === 'Laptop') return 'Sinh viên, văn phòng, đồ họa'
  if (category === 'Điện thoại') return 'Học sinh, sinh viên, người đi làm'
  return 'Người dùng phổ thông'
}

function inferBrand(name) {
  const brands = [
    'Apple', 'Samsung', 'Dell', 'HP', 'Asus', 'Lenovo', 'Acer', 'MSI',
    'LG', 'Xiaomi', 'OPPO', 'Vivo', 'Logitech', 'Razer', 'Sony', 'Anker',
    'Baseus', 'Realme', 'OnePlus', 'Huawei',
  ]
  const lower = String(name || '').toLowerCase()
  return brands.find(brand => lower.includes(brand.toLowerCase())) || ''
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50)
}

function parseArgs(argv) {
  return argv.reduce((acc, arg) => {
    if (!arg.startsWith('--')) return acc
    const [key, value] = arg.slice(2).split('=')
    acc[key] = value ?? true
    return acc
  }, {})
}
