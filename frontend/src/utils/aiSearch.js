const BRANDS = [
  'Apple',
  'Samsung',
  'ASUS',
  'Sony',
  'Lenovo',
  'HP',
  'Dell',
  'Acer',
  'MSI',
  'Realme',
  'Vivo',
  'Xiaomi',
  'Oppo',
  'Huawei',
]

const CATEGORY_RULES = [
  { name: 'Điện thoại', tags: ['Điện thoại'], terms: ['dien thoai', 'smartphone', 'phone', 'iphone'] },
  { name: 'Laptop', tags: ['Laptop'], terms: ['laptop', 'macbook', 'notebook'] },
  { name: 'Máy tính bảng', tags: ['Máy tính bảng'], terms: ['may tinh bang', 'tablet', 'ipad'] },
  { name: 'Phụ kiện', tags: ['Phụ kiện'], terms: ['phu kien', 'tai nghe', 'chuot', 'ban phim', 'sac', 'cap sac', 'adapter'] },
  { name: 'Âm thanh', tags: ['Âm thanh'], terms: ['am thanh', 'loa', 'speaker', 'headphone'] },
]

const NEED_RULES = [
  { value: 'gaming', tag: 'Gaming', terms: ['gaming', 'choi game', 'game'] },
  { value: 'lap trinh java', tag: 'Lập trình Java', terms: ['lap trinh java', 'java'] },
  { value: 'lap trinh', tag: 'Lập trình', terms: ['lap trinh', 'code', 'coding', 'developer'] },
  { value: 'sinh vien', tag: 'Sinh viên', terms: ['sinh vien', 'hoc tap', 'di hoc'] },
  { value: 'chup anh', tag: 'Chụp ảnh đẹp', terms: ['chup anh', 'camera', 'selfie'] },
  { value: 'pin trau', tag: 'Pin trâu', terms: ['pin trau', 'pin lau', 'pin khoe'] },
  { value: 'van phong', tag: 'Văn phòng', terms: ['van phong', 'office', 'lam viec'] },
]

const AI_HINT_TERMS = [
  'duoi',
  'tren',
  'tu',
  'den',
  'trieu',
  'ram',
  'gb',
  'gaming',
  'choi game',
  'lap trinh',
  'java',
  'sinh vien',
  'chup anh',
  'pin trau',
  'pin lau',
  'phu kien',
  'cho ',
]

function stripVietnamese(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term))
}

function formatMoneyTag(amount, prefix) {
  if (!amount) return ''
  if (amount % 1000000 === 0) return `${prefix} ${amount / 1000000} triệu`
  return `${prefix} ${amount.toLocaleString('vi-VN')}đ`
}

function parseMoney(value, unit = '') {
  const normalized = value.replace(',', '.')
  const amount = Number(normalized)
  if (!Number.isFinite(amount)) return null

  if (unit.includes('trieu') || amount < 1000) return Math.round(amount * 1000000)
  return Math.round(amount)
}

function parsePrice(text) {
  const result = {}
  const rangeMatch = text.match(/(?:tu|khoang)\s+(\d+(?:[.,]\d+)?)\s*(trieu|tr|k|nghin|)?\s+(?:den|-)\s+(\d+(?:[.,]\d+)?)\s*(trieu|tr|k|nghin|)?/)
  if (rangeMatch) {
    result.minPrice = parseMoney(rangeMatch[1], rangeMatch[2] || rangeMatch[4] || '')
    result.maxPrice = parseMoney(rangeMatch[3], rangeMatch[4] || rangeMatch[2] || '')
    return result
  }

  const maxMatch = text.match(/(?:duoi|nho hon|toi da|<=?)\s+(\d+(?:[.,]\d+)?)\s*(trieu|tr|k|nghin|)?/)
  if (maxMatch) {
    result.maxPrice = parseMoney(maxMatch[1], maxMatch[2] || '')
    return result
  }

  const minMatch = text.match(/(?:tren|hon|tu)\s+(\d+(?:[.,]\d+)?)\s*(trieu|tr|k|nghin|)?/)
  if (minMatch) {
    result.minPrice = parseMoney(minMatch[1], minMatch[2] || '')
  }

  return result
}

function parseCategory(text) {
  if (text.includes('may tinh') && !text.includes('may tinh bang')) {
    if (includesAny(text, ['gaming', 'game', 'lap trinh', 'java', 'ram', 'van phong'])) return CATEGORY_RULES[1]
  }

  return CATEGORY_RULES.find((rule) => includesAny(text, rule.terms)) || null
}

function parseBrand(originalText) {
  const text = stripVietnamese(originalText)
  return BRANDS.find((brand) => text.includes(stripVietnamese(brand))) || ''
}

function parseNeeds(text) {
  const matched = NEED_RULES.filter((rule) => includesAny(text, rule.terms))
  if (matched.some((rule) => rule.value === 'lap trinh java')) {
    return matched.filter((rule) => rule.value !== 'lap trinh')
  }
  return matched
}

export function parseAISearchQuery(query) {
  const original = query.trim()
  if (!original) {
    return { isAI: false, filters: {}, tags: [] }
  }

  const text = stripVietnamese(original)
  const category = parseCategory(text)
  const brand = parseBrand(original)
  const needs = parseNeeds(text)
  const price = parsePrice(text)
  const hasStructuredHints = Boolean(needs.length || price.minPrice || price.maxPrice)
  const hasAIHints =
    hasStructuredHints ||
    text.split(/\s+/).length >= 4

  if (!hasAIHints) {
    return {
      isAI: false,
      filters: { keyword: original },
      tags: [],
    }
  }

  const filters = {
    keyword: '',
    categoryName: category?.name || '',
    minPrice: price.minPrice ? String(price.minPrice) : '',
    maxPrice: price.maxPrice ? String(price.maxPrice) : '',
    brand,
    target: needs.map((need) => need.value).join(' '),
  }

  if (!filters.categoryName && !filters.brand && !filters.target && !filters.minPrice && !filters.maxPrice) {
    filters.keyword = original
  }

  const tags = [
    ...(category?.tags || []),
    brand,
    ...needs.map((need) => need.tag),
    price.minPrice && price.maxPrice ? `${formatMoneyTag(price.minPrice, 'Từ')} - ${formatMoneyTag(price.maxPrice, 'đến')}` : '',
    price.maxPrice && !price.minPrice ? formatMoneyTag(price.maxPrice, 'Dưới') : '',
    price.minPrice && !price.maxPrice ? formatMoneyTag(price.minPrice, 'Trên') : '',
  ].filter(Boolean)

  return {
    isAI: true,
    filters,
    tags: Array.from(new Set(tags)),
  }
}

export function buildAISearchParams(query) {
  const parsed = parseAISearchQuery(query)
  const params = new URLSearchParams()

  if (!parsed.isAI) {
    params.set('keyword', parsed.filters.keyword || query.trim())
    return params
  }

  Object.entries(parsed.filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params.set(key, String(value).trim())
    }
  })

  params.set('ai', '1')
  if (parsed.tags.length) params.set('aiTags', parsed.tags.join('|'))
  return params
}
