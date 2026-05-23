import fs from 'node:fs/promises'
import path from 'node:path'

const args = parseArgs(process.argv.slice(2))
const OUTPUT_FILE = args.output || 'output/fake-products.json'
const PRICE_MULTIPLIER = Number(args['price-multiplier'] || 25000)
const SOURCE_SITE = 'SmartShop Fake Seed'

const CATEGORY_CONFIGS = [
  { dummyCategory: 'laptops', smartshopCategory: 'Laptop', target: 'Sinh vien, van phong, giai tri' },
  { dummyCategory: 'smartphones', smartshopCategory: '\u0110i\u1ec7n tho\u1ea1i', target: 'Ca nhan, cong viec, giai tri' },
  { dummyCategory: 'mobile-accessories', smartshopCategory: 'Ph\u1ee5 ki\u1ec7n', target: 'Nguoi dung cong nghe' },
]

const products = []

for (const config of CATEGORY_CONFIGS) {
  const fetched = await fetchDummyProducts(config.dummyCategory)
  for (const item of fetched) {
    products.push(mapProduct(item, config))
  }
}

await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true })
await fs.writeFile(
  OUTPUT_FILE,
  JSON.stringify({
    generatedAt: new Date().toISOString(),
    source: 'dummyjson-matched-images',
    total: products.length,
    products,
  }, null, 2),
  'utf8',
)

console.log(`Generated ${products.length} matched products to ${OUTPUT_FILE}`)
console.log(products.reduce((counts, product) => {
  counts[product.category] = (counts[product.category] || 0) + 1
  return counts
}, {}))

async function fetchDummyProducts(category) {
  const response = await fetch(`https://dummyjson.com/products/category/${category}?limit=100`)
  if (!response.ok) throw new Error(`DummyJSON ${category} failed: HTTP ${response.status}`)
  const data = await response.json()
  return data.products || []
}

function mapProduct(item, config) {
  const images = normalizeImages(item)
  const brand = item.brand || inferBrand(item.title) || 'OEM'
  const price = Math.max(100000, roundTo(Number(item.price || 1) * PRICE_MULTIPLIER, 10000))
  const title = cleanTitle(item.title)

  return {
    source: 'dummyjson-matched-images',
    sourceSite: SOURCE_SITE,
    sourceUrl: `https://smartshop.local/seed/${config.dummyCategory}/${slugify(title)}`,
    externalId: `${config.dummyCategory}-${item.id}`,
    name: title,
    price,
    image: images[0],
    images,
    shortDesc: item.description || `${title} chinh hang tai SmartShop.`,
    description: buildDescription(item, config),
    specifications: buildSpecifications(item, config, brand),
    stock: Number.isFinite(item.stock) ? Math.max(0, item.stock) : 20,
    soldCount: estimateSold(item),
    category: config.smartshopCategory,
    supplier: pickSupplier(brand),
    brand,
    factory: brand,
    target: config.target,
  }
}

function normalizeImages(item) {
  const images = [item.thumbnail, ...(item.images || [])]
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
  if (images.length === 0) {
    throw new Error(`Product has no image: ${item.title}`)
  }
  return images
}

function buildDescription(item, config) {
  const parts = [
    item.description,
    `Danh muc: ${config.smartshopCategory}.`,
    item.warrantyInformation ? `Bao hanh: ${item.warrantyInformation}.` : null,
    item.shippingInformation ? `Giao hang: ${item.shippingInformation}.` : null,
    item.availabilityStatus ? `Trang thai: ${item.availabilityStatus}.` : null,
  ].filter(Boolean)
  return parts.join(' ')
}

function buildSpecifications(item, config, brand) {
  const specs = {
    'Thuong hieu': brand,
    'Danh muc': config.smartshopCategory,
    'Bao hanh': item.warrantyInformation || '12 thang',
    'Tinh trang': item.availabilityStatus || 'Con hang',
  }

  if (config.dummyCategory === 'laptops') {
    specs.CPU = inferLaptopCpu(item.title)
    specs.RAM = inferLaptopRam(item.title)
    specs['O cung'] = inferLaptopStorage(item.title)
    specs['Man hinh'] = inferLaptopScreen(item.title)
    specs['He dieu hanh'] = brand.toLowerCase() === 'apple' ? 'macOS' : 'Windows 11'
  } else if (config.dummyCategory === 'smartphones') {
    specs.Chip = inferPhoneChip(brand)
    specs['RAM / Bo nho'] = inferPhoneMemory(item.title)
    specs['Man hinh'] = inferPhoneScreen(item.title)
    specs['Camera sau'] = inferPhoneCamera(brand)
    specs.Pin = inferPhoneBattery(brand)
  } else {
    specs['Loai san pham'] = inferAccessoryType(item.title)
    specs['Ket noi'] = inferAccessoryConnection(item.title)
    specs['Tuong thich'] = inferAccessoryCompatibility(item.title)
    specs['Mau sac'] = inferColor(item.title)
  }

  if (item.dimensions) {
    specs['Kich thuoc'] = `${item.dimensions.width} x ${item.dimensions.height} x ${item.dimensions.depth} cm`
  }
  if (item.weight) specs['Trong luong'] = `${item.weight} kg`
  if (item.rating) specs['Danh gia'] = `${item.rating}/5`
  return specs
}

function cleanTitle(title) {
  return String(title || '').replace(/\s+/g, ' ').trim()
}

function roundTo(value, step) {
  return Math.round(value / step) * step
}

function estimateSold(item) {
  const rating = Number(item.rating || 4)
  const stock = Number(item.stock || 20)
  return Math.max(0, Math.round(rating * 70 + stock * 3))
}

function pickSupplier(brand) {
  const suppliers = {
    Apple: 'Apple Authorized Distributor',
    Asus: 'Synnex FPT',
    Dell: 'Digiworld',
    Lenovo: 'FPT Trading',
    Samsung: 'Samsung Vina',
    Oppo: 'OPPO Vietnam',
    Vivo: 'Vivo Vietnam',
    Realme: 'Realme Vietnam',
  }
  return suppliers[brand] || 'SmartShop Warehouse'
}

function inferBrand(title) {
  const lower = String(title || '').toLowerCase()
  for (const brand of ['Apple', 'Asus', 'Huawei', 'Lenovo', 'Dell', 'Oppo', 'Realme', 'Samsung', 'Vivo', 'Amazon', 'Beats']) {
    if (lower.includes(brand.toLowerCase())) return brand
  }
  if (lower.includes('iphone') || lower.includes('airpods') || lower.includes('magsafe')) return 'Apple'
  return null
}

function inferLaptopCpu(title) {
  const lower = title.toLowerCase()
  if (lower.includes('macbook')) return 'Apple Silicon'
  if (lower.includes('xps')) return 'Intel Core i7'
  if (lower.includes('zenbook')) return 'Intel Core Ultra 7'
  if (lower.includes('yoga')) return 'Intel Core i5'
  return 'Intel Core i5'
}

function inferLaptopRam(title) {
  const lower = title.toLowerCase()
  if (lower.includes('pro')) return '16GB'
  if (lower.includes('xps')) return '16GB'
  return '8GB'
}

function inferLaptopStorage(title) {
  const lower = title.toLowerCase()
  if (lower.includes('pro') || lower.includes('xps')) return '512GB SSD'
  return '256GB SSD'
}

function inferLaptopScreen(title) {
  const lower = title.toLowerCase()
  if (lower.includes('14')) return '14 inch'
  if (lower.includes('13')) return '13.3 inch'
  return '15.6 inch'
}

function inferPhoneChip(brand) {
  const lower = String(brand || '').toLowerCase()
  if (lower === 'apple') return 'Apple A-series'
  if (lower === 'samsung') return 'Exynos / Snapdragon'
  if (lower === 'oppo' || lower === 'vivo' || lower === 'realme') return 'MediaTek / Snapdragon'
  return 'Mobile chipset'
}

function inferPhoneMemory(title) {
  const lower = title.toLowerCase()
  if (lower.includes('pro') || lower.includes('x')) return '8GB/256GB'
  if (lower.includes('s10') || lower.includes('s8')) return '8GB/128GB'
  return '4GB/64GB'
}

function inferPhoneScreen(title) {
  const lower = title.toLowerCase()
  if (lower.includes('pro') || lower.includes('x')) return '6.1 inch OLED'
  if (lower.includes('galaxy')) return '6.4 inch AMOLED'
  return '6.1 inch'
}

function inferPhoneCamera(brand) {
  const lower = String(brand || '').toLowerCase()
  if (lower === 'apple') return '12MP'
  if (lower === 'samsung') return '50MP'
  return '48MP'
}

function inferPhoneBattery(brand) {
  return String(brand || '').toLowerCase() === 'apple' ? 'All-day battery' : '4500mAh'
}

function inferAccessoryType(title) {
  const lower = title.toLowerCase()
  if (lower.includes('airpods') || lower.includes('earphones')) return 'Tai nghe'
  if (lower.includes('charger') || lower.includes('airpower')) return 'Sac'
  if (lower.includes('case')) return 'Op lung'
  if (lower.includes('watch')) return 'Dong ho thong minh'
  if (lower.includes('monopod') || lower.includes('selfie')) return 'Gay chup anh'
  if (lower.includes('camera')) return 'Phu kien quay phim'
  return 'Phu kien thong minh'
}

function inferAccessoryConnection(title) {
  const lower = title.toLowerCase()
  if (lower.includes('airpods') || lower.includes('earphones') || lower.includes('echo') || lower.includes('homepod')) return 'Bluetooth'
  if (lower.includes('charger') || lower.includes('airpower') || lower.includes('magsafe')) return 'Wireless / Lightning'
  return 'Universal'
}

function inferAccessoryCompatibility(title) {
  const lower = title.toLowerCase()
  if (lower.includes('iphone') || lower.includes('airpods') || lower.includes('magsafe')) return 'iPhone, iPad, MacBook'
  if (lower.includes('camera')) return 'Studio, livestream'
  return 'Dien thoai, laptop, tablet'
}

function inferColor(title) {
  const lower = title.toLowerCase()
  if (lower.includes('silver')) return 'Silver'
  if (lower.includes('grey') || lower.includes('gray')) return 'Grey'
  if (lower.includes('gold')) return 'Gold'
  if (lower.includes('plum')) return 'Plum'
  return 'Default'
}

function slugify(value) {
  return value.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseArgs(argv) {
  return argv.reduce((acc, arg) => {
    if (!arg.startsWith('--')) return acc
    const [key, value] = arg.slice(2).split('=')
    acc[key] = value ?? true
    return acc
  }, {})
}
