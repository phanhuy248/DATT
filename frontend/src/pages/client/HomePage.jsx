import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProducts } from '../../api/products'
import { getCategories } from '../../api/categories'
import ProductCard from '../../components/product/ProductCard'

const BANNER_SLIDES = [
  {
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    tag: 'LAPTOP GAMING',
    title: 'HIỆU NĂNG VƯỢT TRỘI.',
    subtitle: 'Chip thế hệ mới, màn hình 144Hz – Giảm đến 20%.',
    btn: 'Khám Phá Ngay',
    icon: 'fa-laptop',
  },
  {
    bg: 'linear-gradient(135deg, #0d0d0d 0%, #1a0a0a 50%, #2d0000 100%)',
    tag: 'ĐIỆN THOẠI CAO CẤP',
    title: 'TRẢI NGHIỆM ĐỈNH CAO.',
    subtitle: 'Camera 200MP, sạc siêu nhanh 100W – Ưu đãi hôm nay.',
    btn: 'Mua Ngay',
    icon: 'fa-mobile-screen',
  },
  {
    bg: 'linear-gradient(135deg, #0a0a0a 0%, #0f1f0a 50%, #1a3d0a 100%)',
    tag: 'PHỤ KIỆN CHÍNH HÃNG',
    title: 'NÂNG CẤP TRẢI NGHIỆM.',
    subtitle: 'Tai nghe, bàn phím, chuột gaming cao cấp chính hãng.',
    btn: 'Xem Ngay',
    icon: 'fa-headphones',
  },
]

const BENEFITS = [
  { icon: 'fa-truck-fast',    color: '#cc0000', title: 'MIỄN PHÍ VẬN CHUYỂN', sub: 'Cho đơn hàng trên 500K' },
  { icon: 'fa-shield-halved', color: '#16a34a', title: 'BẢO HÀNH CHÍNH HÃNG', sub: 'Bảo hành 12-24 tháng' },
  { icon: 'fa-rotate-left',   color: '#2563eb', title: 'ĐỔI TRẢ 04 NGÀY',      sub: 'Đổi trả dễ dàng' },
  { icon: 'fa-headset',       color: '#9333ea', title: 'HỖ TRỢ 24/7',           sub: 'Hotline: 0911 430 000' },
]

function useCountdown() {
  const [time, setTime] = useState({ h: '00', m: '00', s: '00' })
  useEffect(() => {
    const update = () => {
      const now = new Date()
      const end = new Date()
      end.setHours(23, 59, 59, 0)
      const diff = Math.max(0, end - now)
      setTime({
        h: Math.floor(diff / 3600000).toString().padStart(2, '0'),
        m: Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0'),
        s: Math.floor((diff % 60000) / 1000).toString().padStart(2, '0'),
      })
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])
  return time
}

const MAX_PRICE = 100000000

function fmt(v) {
  return v >= 1000000 ? `${(v / 1000000).toFixed(0)} triệu` : `${(v / 1000).toFixed(0)}k`
}

function PriceSlider({ value, onChange }) {
  return (
    <div>
      <input
        type="range" min="0" max={MAX_PRICE} step="1000000" value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#cc0000', cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 6 }}>
        <span style={{ color: '#888' }}>0₫</span>
        <span style={{ color: '#cc0000', fontWeight: 700 }}>
          {value >= MAX_PRICE ? 'Tất cả' : `≤ ${fmt(value)}₫`}
        </span>
      </div>
    </div>
  )
}

const BRANDS = ['Apple', 'Samsung', 'ASUS', 'Dell', 'HP', 'Xiaomi']

export default function HomePage() {
  const [newProducts, setNewProducts] = useState([])
  const [hotProducts, setHotProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [slide, setSlide] = useState(0)
  const countdown = useCountdown()

  // Filter state — lives here so sidebar controls affect all product sections
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE)
  const [selectedBrands, setSelectedBrands] = useState([])

  const toggleBrand = (brand) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    )
  }

  const resetFilters = () => { setMaxPrice(MAX_PRICE); setSelectedBrands([]) }

  const isFiltered = maxPrice < MAX_PRICE || selectedBrands.length > 0

  const applyFilters = (list) => list.filter(p => {
    const priceOk = p.price <= maxPrice
    const brandOk = selectedBrands.length === 0 ||
      selectedBrands.some(b => p.name.toLowerCase().includes(b.toLowerCase()))
    return priceOk && brandOk
  })

  useEffect(() => {
    Promise.allSettled([
      getProducts({ sortBy: 'newest', size: 10 }),
      getProducts({ sortBy: 'bestseller', size: 10 }),
      getCategories(),
    ]).then(([newP, hotP, cats]) => {
      setNewProducts(newP.status === 'fulfilled' ? (newP.value?.content || []) : [])
      setHotProducts(hotP.status === 'fulfilled' ? (hotP.value?.content || []) : [])
      setCategories(cats.status === 'fulfilled' ? (cats.value || []) : [])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % BANNER_SLIDES.length), 4500)
    return () => clearInterval(t)
  }, [])

  const flashSaleProducts = applyFilters(hotProducts).slice(0, 4)

  return (
    <div style={{ background: '#f0f0f0', minHeight: '100vh' }}>
      <div className="container" style={{ paddingTop: 14, paddingBottom: 32, display: 'grid', gridTemplateColumns: '190px 1fr', gap: 12, alignItems: 'start' }}>

        {/* ===== LEFT SIDEBAR ===== */}
        <aside>
          {/* Category list */}
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', marginBottom: 10 }}>
            <div style={{ padding: '10px 14px', background: '#f7f7f7', borderBottom: '1px solid #e8e8e8', fontWeight: 700, fontSize: 13, color: '#222', letterSpacing: 0.3 }}>
              Danh mục sản phẩm
            </div>
            <ul style={{ listStyle: 'none', padding: '4px 0', margin: 0 }}>
              {loading && categories.length === 0 ? (
                <li style={{ padding: '12px 14px', textAlign: 'center' }}>
                  <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2, margin: '0 auto' }} />
                </li>
              ) : categories.map(cat => (
                <li key={cat.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <Link
                    to={`/products?categoryId=${cat.id}`}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', color: '#444', fontSize: 13, textDecoration: 'none', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#cc0000'; e.currentTarget.style.background = '#fff5f5' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#444'; e.currentTarget.style.background = 'transparent' }}
                  >
                    <span>{cat.name}</span>
                    <i className="fa-solid fa-angle-right" style={{ fontSize: 10, color: '#ccc' }} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Price + Brand filter — combined, no navigation */}
          <div style={{ background: '#fff', border: '1px solid #e0e0e0' }}>
            {/* Header with reset */}
            <div style={{ padding: '10px 14px', background: '#f7f7f7', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#222' }}>Bộ lọc</span>
              {isFiltered && (
                <button onClick={resetFilters} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cc0000', fontSize: 11, fontWeight: 600, padding: 0 }}>
                  Xóa lọc ✕
                </button>
              )}
            </div>

            {/* Price slider */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontWeight: 600, fontSize: 12, color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Giá</div>
              <PriceSlider value={maxPrice} onChange={setMaxPrice} />
            </div>

            {/* Brand checkboxes */}
            <div style={{ padding: '10px 0 4px' }}>
              <div style={{ padding: '0 14px', fontWeight: 600, fontSize: 12, color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Thương Hiệu</div>
              <ul style={{ listStyle: 'none', padding: '0', margin: 0 }}>
                {BRANDS.map(brand => (
                  <li key={brand} style={{ borderBottom: '1px solid #f8f8f8' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, color: selectedBrands.includes(brand) ? '#cc0000' : '#444', fontWeight: selectedBrands.includes(brand) ? 600 : 400 }}>
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => toggleBrand(brand)}
                        style={{ accentColor: '#cc0000', cursor: 'pointer' }}
                      />
                      {brand}
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            {/* Active filter summary */}
            {isFiltered && (
              <div style={{ padding: '8px 14px 10px', background: '#fff5f5', borderTop: '1px solid #fee2e2' }}>
                <p style={{ fontSize: 11, color: '#cc0000', margin: 0, fontWeight: 600 }}>
                  <i className="fa-solid fa-filter" style={{ marginRight: 4 }} />
                  {maxPrice < MAX_PRICE && `≤ ${fmt(maxPrice)}₫`}
                  {maxPrice < MAX_PRICE && selectedBrands.length > 0 && ' · '}
                  {selectedBrands.length > 0 && selectedBrands.join(', ')}
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* ===== RIGHT MAIN CONTENT ===== */}
        <div>
          {/* Banner Slider */}
          <div style={{ marginBottom: 12, position: 'relative', overflow: 'hidden', borderRadius: 6, boxShadow: '0 2px 12px rgba(0,0,0,0.18)' }}>
            <div style={{ background: BANNER_SLIDES[slide].bg, height: 270, display: 'flex', alignItems: 'center', padding: '0 50px', transition: 'background 0.6s ease', position: 'relative' }}>
              <div style={{ flex: 1, zIndex: 2 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#cc0000', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 3, marginBottom: 16, letterSpacing: 1 }}>
                  <i className="fa-solid fa-bolt" style={{ fontSize: 9, color: '#ffe066' }} />
                  {BANNER_SLIDES[slide].tag}
                </div>
                <h2 style={{ color: '#fff', fontSize: 34, fontWeight: 900, marginBottom: 12, lineHeight: 1.1, textShadow: '0 2px 8px rgba(0,0,0,0.4)', letterSpacing: 0.5 }}>
                  {BANNER_SLIDES[slide].title}
                </h2>
                <p style={{ color: '#b0b8cc', fontSize: 14, marginBottom: 26, lineHeight: 1.6 }}>
                  {BANNER_SLIDES[slide].subtitle}
                </p>
                <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#cc0000', color: '#fff', padding: '12px 28px', borderRadius: 5, fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 14px rgba(204,0,0,0.5)', letterSpacing: 0.3 }}>
                  {BANNER_SLIDES[slide].btn}
                  <i className="fa-solid fa-arrow-right" style={{ fontSize: 12 }} />
                </Link>
              </div>
              <div style={{ flexShrink: 0, width: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                <i className={`fa-solid ${BANNER_SLIDES[slide].icon}`} style={{ fontSize: 120, color: 'rgba(255,255,255,0.1)', position: 'relative', zIndex: 1 }} />
              </div>
            </div>

            {[-1, 1].map((dir, i) => (
              <button key={i} onClick={() => setSlide(s => (s + dir + BANNER_SLIDES.length) % BANNER_SLIDES.length)}
                style={{
                  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                  [i === 0 ? 'left' : 'right']: 12,
                  width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.25)',
                  background: 'rgba(0,0,0,0.3)', color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(204,0,0,0.7)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.3)'}
              >
                <i className={`fa-solid fa-angle-${i === 0 ? 'left' : 'right'}`} style={{ fontSize: 13 }} />
              </button>
            ))}

            <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
              {BANNER_SLIDES.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)}
                  style={{ width: i === slide ? 22 : 8, height: 8, borderRadius: 4, border: 'none', background: i === slide ? '#cc0000' : 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'all 0.3s' }} />
              ))}
            </div>
          </div>

          {/* Benefits bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 4, marginBottom: 12, overflow: 'hidden' }}>
            {BENEFITS.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRight: i < 3 ? '1px solid #efefef' : 'none' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${b.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`fa-solid ${b.icon}`} style={{ fontSize: 17, color: b.color }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 11, color: '#222', letterSpacing: 0.2 }}>{b.title}</div>
                  <div style={{ fontSize: 10, color: '#888', marginTop: 1 }}>{b.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Flash Sale */}
          {(flashSaleProducts.length > 0 || loading) && (
            <div style={{ background: '#fff', border: '1px solid #e0e0e0', marginBottom: 12, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg, #cc0000 0%, #a00000 100%)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fa-solid fa-bolt" style={{ color: '#ffe066', fontSize: 16 }} />
                  <span style={{ color: '#fff', fontSize: 15, fontWeight: 900, letterSpacing: 1.5 }}>FLASH SALE</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 8 }}>
                    <span style={{ color: '#ffd4d4', fontSize: 12 }}>Kết thúc sau:</span>
                    {[countdown.h, countdown.m, countdown.s].map((t, i) => (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ background: '#111', color: '#ffe066', fontSize: 14, fontWeight: 800, padding: '3px 8px', borderRadius: 4, minWidth: 32, textAlign: 'center', fontFamily: 'monospace' }}>{t}</span>
                        {i < 2 && <span style={{ color: '#ffe066', fontWeight: 800, fontSize: 14 }}>:</span>}
                      </span>
                    ))}
                  </div>
                </div>
                <Link to="/products?sortBy=bestseller" style={{ color: '#ffd4d4', fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = '#ffd4d4'}>
                  Xem tất cả <i className="fa-solid fa-angle-right" style={{ fontSize: 10 }} />
                </Link>
              </div>
              <div style={{ padding: 12 }}>
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><div className="spinner" /></div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {flashSaleProducts.map(p => <ProductCard key={p.id} product={p} badge="SALE" />)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Category grid */}
          {categories.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e0e0e0', marginBottom: 12, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ background: '#2d2d2d', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-grip" style={{ color: '#cc0000', fontSize: 13 }} />
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>DANH MỤC SẢN PHẨM</span>
              </div>
              <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: `repeat(${Math.min(categories.length, 6)}, 1fr)`, gap: 10 }}>
                {categories.map(cat => <CategoryCard key={cat.id} category={cat} />)}
              </div>
            </div>
          )}

          {/* Sản phẩm mới nhất */}
          <ProductSection
            title="SẢN PHẨM MỚI NHẤT"
            icon="fa-star"
            linkTo="/products?sortBy=newest"
            products={applyFilters(newProducts).slice(0, 5)}
            loading={loading}
            headerBg="linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)"
            iconColor="#93c5fd"
            badge="NEW"
          />

          {/* Bán chạy nhất */}
          <ProductSection
            title="SẢN PHẨM BÁN CHẠY NHẤT"
            icon="fa-fire"
            linkTo="/products?sortBy=bestseller"
            products={applyFilters(hotProducts).slice(0, 5)}
            loading={loading}
            headerBg="linear-gradient(135deg, #cc0000 0%, #e53e3e 100%)"
            iconColor="#ffe066"
            badge="HOT"
          />

          {/* View all CTA */}
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#cc0000', color: '#fff', padding: '12px 32px', borderRadius: 6, fontSize: 14, fontWeight: 700, textDecoration: 'none', letterSpacing: 0.5, boxShadow: '0 4px 14px rgba(204,0,0,0.35)' }}>
              <i className="fa-solid fa-store" />
              XEM TẤT CẢ SẢN PHẨM
              <i className="fa-solid fa-arrow-right" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ========== Helper Components ========== */

const CATEGORY_ICONS = {
  'điện thoại':     { icon: 'fa-mobile-screen',        color: '#e53e3e', bg: 'linear-gradient(135deg, #fff5f5, #fed7d7)' },
  'laptop':         { icon: 'fa-laptop',               color: '#2563eb', bg: 'linear-gradient(135deg, #eff6ff, #bfdbfe)' },
  'máy tính bảng':  { icon: 'fa-tablet-screen-button', color: '#7c3aed', bg: 'linear-gradient(135deg, #f5f3ff, #ddd6fe)' },
  'phụ kiện':       { icon: 'fa-headphones',           color: '#ea580c', bg: 'linear-gradient(135deg, #fff7ed, #fed7aa)' },
  'màn hình':       { icon: 'fa-desktop',              color: '#0891b2', bg: 'linear-gradient(135deg, #ecfeff, #a5f3fc)' },
  'bàn phím':       { icon: 'fa-keyboard',             color: '#be185d', bg: 'linear-gradient(135deg, #fdf2f8, #fbcfe8)' },
  'chuột':          { icon: 'fa-computer-mouse',       color: '#854d0e', bg: 'linear-gradient(135deg, #fffbeb, #fde68a)' },
}

function getCategoryStyle(name = '') {
  return CATEGORY_ICONS[name.toLowerCase()] || { icon: 'fa-tag', color: '#64748b', bg: 'linear-gradient(135deg, #f8fafc, #e2e8f0)' }
}

function CategoryCard({ category }) {
  const [hovered, setHovered] = useState(false)
  const { icon, color, bg } = getCategoryStyle(category.name)
  return (
    <Link to={`/products?categoryId=${category.id}`} style={{ textDecoration: 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        padding: '18px 12px', borderRadius: 8, background: hovered ? color : bg,
        transition: 'all 0.2s', cursor: 'pointer',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? `0 8px 20px ${color}35` : '0 1px 4px rgba(0,0,0,0.06)',
        border: `1px solid ${hovered ? color : 'transparent'}`,
      }}>
        <div style={{
          width: 54, height: 54, borderRadius: '50%',
          background: hovered ? 'rgba(255,255,255,0.2)' : `${color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
          boxShadow: hovered ? `0 4px 12px rgba(0,0,0,0.2)` : 'none',
        }}>
          <i className={`fa-solid ${icon}`} style={{ fontSize: 24, color: hovered ? '#fff' : color }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: hovered ? '#fff' : '#374151', textAlign: 'center', lineHeight: 1.3 }}>
          {category.name}
        </span>
      </div>
    </Link>
  )
}

function ProductSection({ title, icon, linkTo, products, loading, headerBg, iconColor, badge }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e0e0e0', marginBottom: 12, borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: headerBg, padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className={`fa-solid ${icon}`} style={{ color: iconColor, fontSize: 14 }} />
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>{title}</span>
        </div>
        <Link to={linkTo} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
          Xem tất cả <i className="fa-solid fa-angle-right" style={{ fontSize: 10 }} />
        </Link>
      </div>
      <div style={{ padding: 12 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: 24, fontSize: 13 }}>Chưa có sản phẩm</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {products.map(p => <ProductCard key={p.id} product={p} badge={badge} />)}
          </div>
        )}
      </div>
    </div>
  )
}
