import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'
import { SITES } from './config/sites.js'

const args = parseArgs(process.argv.slice(2))
const OUTPUT_FILE = args.output || 'output/products-clean.json'
const PER_CATEGORY = Number(args['per-category'] || 20)
const TOTAL_LIMIT = Number(args.limit || 80)
const SITE_FILTER = args.site ? new Set(args.site.split(',').map(s => s.trim())) : null

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 SmartShopCrawler/1.0'

// Price limits per category (VND) — reject products outside range
const PRICE_LIMITS = {
  'Laptop':     { min: 2_000_000,  max: 200_000_000 },
  'Điện thoại': { min:   500_000,  max:  80_000_000 },
  'Phụ kiện':   { min:    50_000,  max:  50_000_000 },
}
const DEFAULT_PRICE_LIMITS = { min: 50_000, max: 500_000_000 }

// Warrant/policy boilerplate patterns — reject as description
const WARRANTY_PATTERNS = [
  /nguyên hộp/i,
  /đầy đủ phụ kiện/i,
  /bảo hành pin/i,
  /phụ kiện từ nhà sản xuất/i,
  /bảo hành \d+ tháng/i,
  /thu cũ đổi mới/i,
  /trả góp 0%/i,
  /chính hãng vn\/a/i,
  /miễn phí vận chuyển/i,
]

// Advertising suffixes to strip from product names
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

console.log(`Starting SmartShop clean crawler: per-category=${PER_CATEGORY}, limit=${TOTAL_LIMIT}`)
const browser = await chromium.launch({
  headless: !args.headful,
  timeout: 30000,
  args: ['--disable-gpu', '--no-sandbox'],
})
const context = await browser.newContext({
  userAgent: USER_AGENT,
  locale: 'vi-VN',
  viewport: { width: 1440, height: 1100 },
})

const products = []
let skippedCount = 0

try {
  for (const site of SITES.filter(site => !SITE_FILTER || SITE_FILTER.has(site.key))) {
    for (const category of site.categories) {
      if (products.length >= TOTAL_LIMIT) break

      const listPage = await context.newPage()
      let links = []
      try {
        links = await collectProductLinks(listPage, site, category, PER_CATEGORY)
      } catch (error) {
        console.warn(`[list-skip] ${site.key} ${category.category}: ${error.message}`)
      } finally {
        await listPage.close()
      }

      for (const url of links) {
        if (products.length >= TOTAL_LIMIT) break
        const page = await context.newPage()
        try {
          const product = await crawlProduct(page, site, category, url)
          if (product) {
            products.push(product)
            console.log(`[ok] ${product.name} — ${formatPrice(product.price)}`)
          } else {
            skippedCount++
          }
        } catch (error) {
          console.warn(`[skip] ${site.key} ${url}: ${error.message}`)
          skippedCount++
        } finally {
          await page.close()
          await sleep(1200 + Math.random() * 600) // 1.2–1.8s delay, respectful rate limit
        }
      }
    }
  }
} finally {
  await browser.close()
}

console.log(`\nCrawl complete: ${products.length} kept, ${skippedCount} skipped`)
console.log('Sample check (first 3):')
products.slice(0, 3).forEach((p, i) => {
  console.log(`  [${i + 1}] ${p.name}`)
  console.log(`       Price : ${formatPrice(p.price)}`)
  console.log(`       Image : ${p.image}`)
})

await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true })
await fs.writeFile(
  OUTPUT_FILE,
  JSON.stringify({ crawledAt: new Date().toISOString(), total: products.length, products }, null, 2),
  'utf8',
)
console.log(`\nWrote ${products.length} products → ${OUTPUT_FILE}`)

// ─── LINK COLLECTION ────────────────────────────────────────────────────────

async function collectProductLinks(page, site, category, limit) {
  console.log(`[list] ${site.key} ${category.category}: ${category.url}`)
  await goto(page, category.url)
  await autoScroll(page)

  const rawLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href]')).map(anchor => ({
      href: anchor.href,
      text: normalize(anchor.innerText || anchor.title || anchor.getAttribute('aria-label') || ''),
      parentText: normalize(anchor.closest('li, article, div')?.innerText || ''),
    }))

    const nextProducts = readNextProducts()
    for (const product of nextProducts) {
      const pathname = product.link?.as?.pathname || product.url || product.canonical || ''
      const price = product.price?.latestPrice || product.price || ''
      if (pathname) {
        links.push({
          href: new URL(pathname, window.location.origin).href,
          text: normalize(product.name || ''),
          parentText: normalize(`${product.name || ''} ${price} d`),
        })
      }
    }

    return links

    function normalize(value) {
      return value.replace(/\s+/g, ' ').trim()
    }

    function readNextProducts() {
      try {
        const script = document.querySelector('#__NEXT_DATA__')
        if (!script?.textContent) return []
        const data = JSON.parse(script.textContent)
        return data?.props?.pageProps?.serverProducts || data?.props?.pageProps?.products || []
      } catch {
        return []
      }
    }
  })

  const categoryUrl = new URL(category.url)
  const links = []
  const seen = new Set()

  for (const link of rawLinks) {
    if (!link.href || seen.has(link.href)) continue
    const url = new URL(link.href)
    if (url.hostname !== categoryUrl.hostname) continue
    if (!isLikelyProductUrl(site, link.href, category.url)) continue
    const haystack = `${link.text} ${link.parentText}`
    if (!hasProductSignal(haystack) || !hasPriceSignal(haystack)) continue
    seen.add(link.href)
    links.push(link.href)
    if (links.length >= limit) break
  }

  console.log(`[list] ${site.key} ${category.category}: found ${links.length} links`)
  return links
}

// ─── PRODUCT DETAIL CRAWL ────────────────────────────────────────────────────

async function crawlProduct(page, site, category, url) {
  await goto(page, url)
  await autoScroll(page, 2)

  const extracted = await page.evaluate(() => {
    const jsonLdProducts = readJsonLdProducts()
    const jsonLd = jsonLdProducts[0] || {}
    const offer = Array.isArray(jsonLd.offers) ? jsonLd.offers[0] : jsonLd.offers || {}
    const brand = typeof jsonLd.brand === 'object' ? jsonLd.brand?.name : jsonLd.brand
    const jsonImages = imageValues(jsonLd.image)

    const name = firstText([
      'h1',
      '[class*="product-name"]',
      '[class*="productName"]',
      '[class*="product-title"]',
      '[class*="productTitle"]',
    ]) || meta('og:title') || jsonLd.name || ''

    const description = firstText([
      '[class*="product-description"]',
      '[class*="description"]',
      '[id*="description"]',
      '.short-description',
    ]) || meta('description') || jsonLd.description || ''

    const priceText = String(
      offer.price ||
      meta('product:price:amount') ||
      firstText([
        '[itemprop="price"]',
        '[class*="price-special"]',
        '[class*="special-price"]',
        '[class*="sale-price"]',
        '[class*="product-price"]',
        '[class*="price"]',
      ]) ||
      ''
    )

    // og:image is the canonical, full-resolution product image — put it first
    const ogImage = meta('og:image')

    const images = unique([
      ogImage,               // priority 1: social card = full-size canonical image
      ...jsonImages,         // priority 2: JSON-LD structured data
      attr('img[itemprop="image"]', 'src'),
      attr('[class*="gallery"] img', 'src'),
      attr('[class*="product"] img', 'src'),
    ].filter(Boolean).map(toAbsolute))

    const specifications = readSpecs()
    const bodyText = document.body.innerText.toLowerCase()
    const stock = bodyText.includes('het hang') || bodyText.includes('hết hàng') || bodyText.includes('tam het hang')
      ? 0
      : undefined
    const availability = offer.availability || ''

    return {
      name: normalize(name),
      description: normalize(description),
      priceText: normalize(priceText),
      ogImage: normalize(ogImage),
      image: images[0] || '',
      images,
      specifications,
      brand: normalize(brand || ''),
      stock,
      availability,
    }

    function readJsonLdProducts() {
      const nodes = []
      for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
        try {
          const parsed = JSON.parse(script.textContent)
          flattenLd(parsed, nodes)
        } catch {
          // Ignore invalid JSON-LD blocks.
        }
      }
      return nodes.filter(node => {
        const type = node['@type']
        return Array.isArray(type) ? type.includes('Product') : type === 'Product'
      })
    }

    function flattenLd(value, nodes) {
      if (!value) return
      if (Array.isArray(value)) {
        value.forEach(item => flattenLd(item, nodes))
        return
      }
      if (typeof value !== 'object') return
      nodes.push(value)
      if (Array.isArray(value['@graph'])) value['@graph'].forEach(item => flattenLd(item, nodes))
    }

    function readSpecs() {
      const specs = {}

      for (const row of document.querySelectorAll('table tr')) {
        const cells = Array.from(row.querySelectorAll('th,td')).map(cell => normalize(cell.innerText))
        if (cells.length >= 2) addSpec(cells[0], cells.slice(1).join(' '))
      }

      const liSelectors = [
        '.parameter li',
        '.parameter__list li',
        '.technical-content li',
        '.product-specs li',
        '[class*="spec"] li',
        '[class*="attribute"] li',
        '[class*="configuration"] li',
      ]

      for (const item of document.querySelectorAll(liSelectors.join(','))) {
        const text = normalize(item.innerText)
        const parts = text.split(/:|\n/)
        if (parts.length >= 2) addSpec(parts[0], parts.slice(1).join(' '))
      }

      return specs

      function addSpec(key, value) {
        const cleanedKey = normalize(key).replace(/:$/, '')
        const cleanedValue = normalize(value)
        if (!cleanedKey || !cleanedValue || cleanedKey.length > 80 || cleanedValue.length > 500) return
        if (!Object.keys(specs).some(existing => existing.toLowerCase() === cleanedKey.toLowerCase())) {
          specs[cleanedKey] = cleanedValue
        }
      }
    }

    function firstText(selectors) {
      for (const selector of selectors) {
        const node = document.querySelector(selector)
        const text = normalize(node?.innerText || node?.textContent || '')
        if (text) return text
      }
      return ''
    }

    function attr(selector, name) {
      return document.querySelector(selector)?.getAttribute(name) || ''
    }

    function meta(name) {
      return document.querySelector(`meta[property="${name}"], meta[name="${name}"]`)?.content || ''
    }

    function imageValues(value) {
      const values = []
      visit(value)
      return values

      function visit(item) {
        if (!item) return
        if (Array.isArray(item)) {
          item.forEach(visit)
          return
        }
        if (typeof item === 'string') {
          values.push(item)
          return
        }
        if (typeof item === 'object') {
          visit(item.url || item.contentUrl || item.thumbnailUrl || item.image)
        }
      }
    }

    function toAbsolute(value) {
      if (typeof value !== 'string') return ''
      const cleaned = value.trim()
      if (!cleaned || cleaned.includes('[object Object]')) return ''
      try {
        return new URL(cleaned, window.location.href).href
      } catch {
        return cleaned
      }
    }

    function unique(values) {
      return Array.from(new Set(values.filter(value => {
        if (!value) return false
        const lower = String(value).toLowerCase()
        return !lower.includes('[object') && !lower.includes('%5bobject') && !lower.includes('object%20object')
      })))
    }

    function normalize(value) {
      return String(value || '').replace(/\s+/g, ' ').trim()
    }
  })

  // ── Post-process: clean and validate ────────────────────────────────────────

  const cleanedName = cleanName(extracted.name)
  if (!cleanedName) return null

  const price = parsePrice(extracted.priceText)
  if (!price) return null
  if (!isValidPriceForCategory(price, category.category)) {
    console.warn(`[price-skip] ${cleanedName}: ${formatPrice(price)} outside range for ${category.category}`)
    return null
  }

  // Fix CDN thumbnail URLs (e.g. CellphoneS /200x/ resize proxy)
  const fixedImages = extracted.images
    .map(fixCdnUrl)
    .filter(isUsableImageUrl)
    .filter((v, i, arr) => arr.indexOf(v) === i) // deduplicate after fixing

  const primaryImage = fixedImages[0] || null
  if (!primaryImage) return null  // reject: no usable image

  // Reject warranty/boilerplate text as description; build fallback
  const desc = isWarrantyText(extracted.description) ? '' : extracted.description
  const shortDesc = desc || `${cleanedName} - ${site.supplier}`

  return {
    source: site.key,
    sourceSite: site.supplier,
    sourceUrl: url,
    externalId: externalIdFromUrl(url),
    name: cleanedName,
    price,
    image: primaryImage,
    images: fixedImages,
    shortDesc,
    description: desc,
    specifications: cleanSpecs(extracted.specifications),
    stock: typeof extracted.stock === 'number' ? extracted.stock : 10,
    soldCount: 0,
    category: category.category,
    supplier: site.supplier,
    brand: extracted.brand || inferBrand(cleanedName),
    factory: extracted.brand || inferBrand(cleanedName),
  }
}

// ─── CLEANING HELPERS ────────────────────────────────────────────────────────

function cleanName(text) {
  if (!text) return ''
  return text
    // Decode common HTML entities
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    // Strip emoji and special icons
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
    .replace(/[✔✓★☆♦♣♥◆⚡🔥]/g, '')
    // Strip trailing ad/warranty suffixes
    .replace(NAME_SUFFIX_RE, '')
    // Strip leading/trailing punctuation used as separators
    .replace(/^[-|,\s]+/, '').replace(/[-|,\s]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isWarrantyText(text) {
  if (!text || text.length > 500) return false
  // Short text that matches boilerplate patterns = warranty/policy text, not a real description
  return WARRANTY_PATTERNS.some(re => re.test(text))
}

/** Normalize image URLs to directly-accessible full-resolution versions */
function fixCdnUrl(url) {
  if (!url || typeof url !== 'string') return ''
  // Step 1 — imgproxy "plain" wrapper: extract the inner original URL first
  // e.g. cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/...
  const proxyMatch = url.match(/\/insecure\/(?:[^/]+\/)+plain\/(.+)$/)
  if (proxyMatch) {
    try { url = decodeURIComponent(proxyMatch[1]) } catch { /* keep current url */ }
  }
  // Step 2 — CellphoneS CDN host (cdn2.cellphones.com.vn) requires a resize prefix;
  // strip the CDN subdomain (and optional resize segment) → use origin cellphones.com.vn directly.
  // Handles: cdn2.cellphones.com.vn/200x/media/... AND cdn2.cellphones.com.vn/media/... (already stripped)
  url = url.replace(
    /^(https?:)\/\/cdn\d*\.(cellphones\.com\.vn)\/(?:\d+x\d*\/)?/,
    '$1//$2/',
  )
  // Step 3 — protocol-relative → https
  if (url.startsWith('//')) url = 'https:' + url
  return url
}

function isUsableImageUrl(url) {
  if (!url || typeof url !== 'string') return false
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false
  const lower = url.toLowerCase()
  // Reject obvious non-product images
  if (/placeholder|no.?image|blank|sprite|loading|icon|logo\.(png|svg)/i.test(lower)) return false
  // Reject youtube thumbnails (not product photos)
  if (lower.includes('youtube.com') || lower.includes('ytimg.com')) return false
  return true
}

function cleanSpecs(specs) {
  if (!specs || typeof specs !== 'object') return {}
  const cleaned = {}
  for (const [key, value] of Object.entries(specs)) {
    const k = key.trim()
    const v = value.trim()
    // Skip comparison table header rows
    if (/^(tên sản phẩm|tên sp|so sánh|tiêu chí|model|phiên bản so sánh)/i.test(k)) continue
    // Skip rows whose key looks like a product model name (starts with a brand)
    if (/^(samsung|apple|iphone|xiaomi|oppo|vivo|realme|asus|acer|lenovo|dell|hp|msi|lg)\s+/i.test(k)) continue
    // Skip rows whose value contains price/trade-in language
    if (/\d{3}\.000\s*đ|\d+\.\d{3}\.\d{3}\s*đ|giá bán|thu cũ|lên đời|giá niêm yết/i.test(v)) continue
    // Skip rows where the value looks like two of the same spec side-by-side (comparison artifact)
    // Pattern: same unit/word appears 2+ times with a gap (e.g. "8.2mm 8.6mm" or "218g 232g")
    if (/(\b\d+\.?\d*\s*mm\b.*\b\d+\.?\d*\s*mm\b|\b\d+\s*g\b.*\b\d+\s*g\b)/.test(v) && v.includes(' ')) {
      // Only skip if it looks like a two-column comparison (two distinct numeric values)
      const nums = v.match(/\d+\.?\d*/g) || []
      if (nums.length >= 4) continue  // too many numbers = comparison table row
    }
    // Skip unreasonably long values (usually comparison paragraphs, not spec values)
    if (v.length > 250) continue
    cleaned[k] = v
  }
  return cleaned
}

function isValidPriceForCategory(price, categoryName) {
  const limits = PRICE_LIMITS[categoryName] || DEFAULT_PRICE_LIMITS
  return price >= limits.min && price <= limits.max
}

// ─── NAVIGATION & SCROLL ────────────────────────────────────────────────────

async function goto(page, url) {
  page.setDefaultTimeout(20000)
  page.setDefaultNavigationTimeout(20000)
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
  await page.waitForTimeout(1500)
}

async function autoScroll(page, rounds = 3) {
  for (let i = 0; i < rounds; i++) {
    await page.mouse.wheel(0, 1800)
    await page.waitForTimeout(600)
  }
  await page.evaluate(() => window.scrollTo(0, 0))
}

// ─── URL & PRODUCT SIGNAL HELPERS ────────────────────────────────────────────

function isLikelyProductUrl(site, href, categoryUrl) {
  if (href === categoryUrl) return false
  if (site.excludePatterns.some(pattern => pattern.test(href))) return false
  return site.productPatterns.some(pattern => pattern.test(href))
}

function hasProductSignal(text) {
  return /\b(laptop|macbook|iphone|samsung|xiaomi|oppo|asus|acer|lenovo|dell|hp|msi|logitech|tai nghe|chuot|ban phim)\b/i.test(stripVietnamese(text))
}

function hasPriceSignal(text) {
  return /(\d[\d.,\s]{4,})\s*(d|đ|₫|vnd)/i.test(text) || /\d+%\s*off/i.test(text)
}

// ─── PRICE PARSING ───────────────────────────────────────────────────────────

function parsePrice(value) {
  if (typeof value === 'number') return Math.round(value)
  const text = String(value || '').toLowerCase()
  if (!text) return null
  const compact = text.replace(/\s+/g, '')
  const millionMatch = compact.match(/([\d,.]+)(trieu|triệu)/)
  if (millionMatch) {
    const n = Number(millionMatch[1].replace(',', '.'))
    return Number.isFinite(n) ? Math.round(n * 1_000_000) : null
  }
  const candidates = text.match(/\d[\d.,\s]{3,}/g) || []
  const prices = candidates
    .map(candidate => Number(candidate.replace(/[^\d]/g, '')))
    .filter(number => Number.isFinite(number) && number >= 1000)
  return prices.length ? prices[0] : null
}

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

// ─── BRAND & ID HELPERS ──────────────────────────────────────────────────────

function inferBrand(name) {
  const brands = [
    'Apple', 'Samsung', 'Dell', 'HP', 'Asus', 'Lenovo', 'Acer', 'MSI',
    'LG', 'Xiaomi', 'OPPO', 'Vivo', 'Logitech', 'Razer', 'Sony', 'Anker',
    'Baseus', 'Realme', 'OnePlus', 'Huawei', 'Nokia',
  ]
  const lower = String(name || '').toLowerCase()
  return brands.find(brand => lower.includes(brand.toLowerCase())) || ''
}

function externalIdFromUrl(url) {
  const parsed = new URL(url)
  return parsed.pathname.split('/').filter(Boolean).pop()?.replace(/\.html$/, '') || url
}

// ─── MISC ────────────────────────────────────────────────────────────────────

function stripVietnamese(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, match => (match === 'đ' ? 'd' : 'D'))
    .toLowerCase()
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
