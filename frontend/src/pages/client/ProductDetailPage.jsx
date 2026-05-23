import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getPriceHistory, getProduct, getRelatedProducts } from '../../api/products'
import { addReview, getReviews } from '../../api/reviews'
import ProductCard from '../../components/product/ProductCard'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { getImageUrl } from '../../utils/image'

const formatPrice = (value) => Number(value || 0).toLocaleString('vi-VN') + '₫'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { user } = useAuth()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [priceHistory, setPriceHistory] = useState([])
  const [reviews, setReviews] = useState([])
  const [qty, setQty] = useState(1)
  const [selectedImage, setSelectedImage] = useState(null)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getProduct(id),
      getReviews(id),
      getRelatedProducts(id, 8).catch(() => []),
      getPriceHistory(id).catch(() => []),
    ]).then(([p, r, rel, history]) => {
      setProduct(p)
      setReviews(r || [])
      setRelated(rel || [])
      setPriceHistory(history || [])
      setSelectedImage(getImageUrl(p?.images?.[0] || p?.image))
    }).finally(() => setLoading(false))
  }, [id])

  const highlights = useMemo(() => buildHighlights(product), [product])
  const specPreview = useMemo(() => buildSpecPreview(product), [product])
  const priceMessage = useMemo(() => buildPriceMessage(product, priceHistory), [product, priceHistory])

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return }
    try {
      await addToCart(product.id, qty)
      toast.success('Đã thêm vào giỏ hàng!')
    } catch {
      toast.error('Không thể thêm vào giỏ hàng')
    }
  }

  const handleBuyNow = async () => {
    if (!user) { navigate('/login'); return }
    await addToCart(product.id, qty)
    navigate('/cart')
  }

  const handleReview = async (e) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    setSubmitting(true)
    try {
      const r = await addReview({ productId: product.id, ...reviewForm })
      setReviews([r, ...reviews])
      setReviewForm({ rating: 5, comment: '' })
      toast.success('Đánh giá thành công!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi đánh giá')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="spinner" />
  if (!product) {
    return <div className="container empty-state"><i className="fa-solid fa-box-open" /><p>Sản phẩm không tồn tại</p></div>
  }

  const gallery = product.images?.length ? product.images : product.image ? [product.image] : []
  const specs = Object.entries(product.specifications || {})

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 40 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24, fontSize: 13, color: '#6b7280' }}>
        <Link to="/" style={{ color: '#2563eb' }}>Trang chủ</Link> /
        <Link to="/products" style={{ color: '#2563eb' }}>Sản phẩm</Link> /
        <span>{product.name}</span>
      </div>

      <div className="product-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 32 }}>
        <div>
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 360, border: '1px solid #e2e8f0' }}>
            {selectedImage
              ? <img src={selectedImage} alt={product.name} style={{ maxHeight: 320, objectFit: 'contain' }} />
              : <i className="fa-solid fa-image" style={{ fontSize: 80, color: '#cbd5e1' }} />
            }
          </div>
          {gallery.length > 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 12 }}>
              {gallery.slice(0, 10).map(image => {
                const url = getImageUrl(image)
                return (
                  <button key={image} onClick={() => setSelectedImage(url)}
                    style={{ border: selectedImage === url ? '2px solid #cc0000' : '1px solid #e2e8f0', background: '#fff', borderRadius: 6, padding: 6, height: 72 }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {product.categoryName && <span className="badge badge-info">{product.categoryName}</span>}
            {product.sold >= 500 && <span className="badge badge-danger">Bán chạy</span>}
            {product.quantity > 0 && <span className="badge badge-success">Còn hàng</span>}
            {product.sourceSite && <span className="badge badge-secondary">{product.sourceSite}</span>}
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, lineHeight: 1.35 }}>{product.name}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {[1,2,3,4,5].map(s => (
              <i key={s} className={`fa-${s <= Math.round(product.averageRating || 0) ? 'solid' : 'regular'} fa-star`}
                style={{ color: '#f59e0b' }} />
            ))}
            <span style={{ fontSize: 14, color: '#6b7280' }}>({product.reviewCount} đánh giá)</span>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Đã bán: {product.sold}</span>
          </div>

          <div style={{ padding: 16, borderRadius: 8, background: '#fff5f5', border: '1px solid #fecaca', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 13, color: '#991b1b', fontWeight: 700, marginBottom: 4 }}>{priceMessage}</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: '#cc0000', lineHeight: 1 }}>
                  {formatPrice(product.price)}
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#7f1d1d', textAlign: 'right' }}>
                <div>Trả góp 0%</div>
                <div>Thanh toán khi nhận hàng</div>
              </div>
            </div>
          </div>

          <p style={{ color: '#475569', marginBottom: 16, lineHeight: 1.6 }}>{product.shortDesc}</p>

          {specPreview.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
              {specPreview.map(item => (
                <span key={item.key} style={{ border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: 6, padding: '7px 10px', fontSize: 12, color: '#334155' }}>
                  <strong>{item.key}:</strong> {item.value}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20, fontSize: 13 }}>
            {product.factory && <div><span style={{ color: '#6b7280' }}>Thương hiệu:</span> <strong>{product.factory}</strong></div>}
            {product.supplierName && <div><span style={{ color: '#6b7280' }}>Nhà cung cấp:</span> <strong>{product.supplierName}</strong></div>}
            <div><span style={{ color: '#6b7280' }}>Kho:</span> <strong style={{ color: product.quantity > 0 ? '#16a34a' : '#dc2626' }}>
              {product.quantity > 0 ? `Còn ${product.quantity} sản phẩm` : 'Hết hàng'}
            </strong></div>
            {product.sourceUrl && <a href={product.sourceUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>Xem nguồn</a>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 500 }}>Số lượng:</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={stepperBtn}>-</button>
              <span style={{ width: 48, textAlign: 'center', fontSize: 15, fontWeight: 600 }}>{qty}</span>
              <button onClick={() => setQty(q => Math.min(product.quantity || 1, q + 1))} style={stepperBtn}>+</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <button onClick={handleAddToCart} disabled={product.quantity === 0} className="btn btn-outline btn-lg" style={{ flex: 1 }}>
              <i className="fa-solid fa-cart-plus" /> Thêm vào giỏ
            </button>
            <button onClick={handleBuyNow} disabled={product.quantity === 0} className="btn btn-primary btn-lg" style={{ flex: 1, background: '#cc0000' }}>
              <i className="fa-solid fa-bolt" /> Mua ngay
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {trustItems.map(item => (
              <div key={item.title} style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 10, background: '#fff', textAlign: 'center' }}>
                <i className={`fa-solid ${item.icon}`} style={{ color: item.color, marginBottom: 6 }} />
                <div style={{ fontSize: 12, fontWeight: 700 }}>{item.title}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Section title="Điểm nổi bật sản phẩm">
        <div className="product-highlight-layout" style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {highlights.map(item => (
              <div key={item.title} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ width: 34, height: 34, borderRadius: 6, background: '#fef2f2', color: '#cc0000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`fa-solid ${item.icon}`} />
                  </span>
                  <strong>{item.title}</strong>
                </div>
                <p style={{ color: '#475569', fontSize: 13, lineHeight: 1.55 }}>{item.text}</p>
              </div>
            ))}
          </div>

          <div style={{ border: '1px solid #fecaca', borderRadius: 8, background: '#fff5f5', padding: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, color: '#991b1b' }}>Ưu đãi khi mua tại SmartShop</h3>
            <Benefit icon="fa-credit-card" title="Trả góp linh hoạt" text="Hỗ trợ trả góp 0% qua thẻ hoặc đối tác tài chính." />
            <Benefit icon="fa-screwdriver-wrench" title="Hỗ trợ kỹ thuật" text="Kiểm tra máy, cài đặt cơ bản và tư vấn sử dụng sau mua." />
            <Benefit icon="fa-shield-halved" title="Bảo hành rõ ràng" text="Sản phẩm có hóa đơn, nguồn nhập và chính sách bảo hành minh bạch." />
          </div>
        </div>
      </Section>

      {specs.length > 0 && (
        <Section title="Thông số kỹ thuật">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            {specs.map(([key, value]) => (
              <div key={key} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10, padding: 12, borderBottom: '1px solid #eef2f7', fontSize: 13 }}>
                <strong style={{ color: '#475569' }}>{key}</strong>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Mô tả chi tiết">
        <div style={{ lineHeight: 1.8, color: '#374151', whiteSpace: 'pre-wrap' }}>{product.detailDesc}</div>
      </Section>

      {priceHistory.length > 0 && (
        <Section title="Lịch sử giá">
          <div style={{ display: 'grid', gap: 8 }}>
            {priceHistory.slice(0, 6).map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: 12, background: '#f8fafc', borderRadius: 6, fontSize: 13 }}>
                <span>{new Date(item.recordedAt).toLocaleString('vi-VN')}</span>
                <strong>{formatPrice(item.newPrice)}</strong>
              </div>
            ))}
          </div>
        </Section>
      )}

      {related.length > 0 && (
        <Section title="Sản phẩm liên quan">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16 }}>
            {related.map(item => <ProductCard key={item.id} product={item} />)}
          </div>
        </Section>
      )}

      <Section title={`Đánh giá (${reviews.length})`}>
        {user && (
          <form onSubmit={handleReview} style={{ marginBottom: 28, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Viết đánh giá</h3>
            <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
              {[1,2,3,4,5].map(s => (
                <i key={s} className={`fa-${s <= reviewForm.rating ? 'solid' : 'regular'} fa-star`}
                  onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                  style={{ fontSize: 24, color: '#f59e0b', cursor: 'pointer' }} />
              ))}
            </div>
            <textarea className="form-control" rows={3} placeholder="Chia sẻ trải nghiệm của bạn..."
              value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
              style={{ marginBottom: 10 }} />
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
          </form>
        )}

        {reviews.length === 0 ? (
          <p className="text-muted">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {reviews.map(r => (
              <div key={r.id} style={{ padding: 16, background: '#f8fafc', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fa-solid fa-user" style={{ color: '#2563eb', fontSize: 14 }} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{r.userFullName}</p>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1,2,3,4,5].map(s => <i key={s} className={`fa-${s <= r.rating ? 'solid' : 'regular'} fa-star`} style={{ fontSize: 11, color: '#f59e0b' }} />)}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>{new Date(r.createdDate).toLocaleDateString('vi-VN')}</span>
                </div>
                <p style={{ fontSize: 14, color: '#374151' }}>{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="card-body">
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{title}</h2>
        {children}
      </div>
    </div>
  )
}

function Benefit({ icon, title, text }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 0', borderTop: '1px solid #fecaca' }}>
      <i className={`fa-solid ${icon}`} style={{ color: '#cc0000', marginTop: 3 }} />
      <div>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{title}</div>
        <div style={{ color: '#64748b', fontSize: 12, lineHeight: 1.45 }}>{text}</div>
      </div>
    </div>
  )
}

function buildHighlights(product) {
  if (!product) return []
  const specs = product.specifications || {}
  const category = normalize(product.categoryName)

  if (category.includes('laptop')) {
    return compact([
      highlight('Hiệu năng xử lý', specs.CPU || specs['Loại CPU'], 'fa-microchip', 'CPU đủ mạnh cho học tập, văn phòng, lập trình và đa nhiệm hằng ngày.'),
      highlight('Bộ nhớ và lưu trữ', joinSpecs(specs.RAM, specs['Dung lượng RAM'], specs['Ổ cứng'], specs.SSD), 'fa-memory', 'RAM và SSD giúp mở ứng dụng nhanh, thao tác mượt hơn khi làm việc nhiều tác vụ.'),
      highlight('Màn hình làm việc', specs['Màn hình'] || specs['Kích thước màn hình'], 'fa-display', 'Không gian hiển thị phù hợp làm việc, học online và giải trí.'),
      highlight('Bảo hành và nguồn hàng', specs['Bảo hành'] || product.sourceSite, 'fa-shield-halved', 'Thông tin nguồn nhập rõ ràng, dễ quản lý bảo hành sau mua.'),
    ])
  }

  if (category.includes('dien thoai')) {
    return compact([
      highlight('Màn hình hiển thị', specs['Màn hình'] || specs['Kích thước màn hình'], 'fa-mobile-screen-button', 'Màn hình phù hợp lướt web, xem nội dung và làm việc di động.'),
      highlight('Camera', specs['Camera sau'] || specs.Camera, 'fa-camera', 'Cụm camera phục vụ chụp ảnh hằng ngày, quay video và mạng xã hội.'),
      highlight('Pin và sạc', joinSpecs(specs.Pin, specs['Sạc nhanh']), 'fa-battery-full', 'Dung lượng pin và sạc nhanh đáp ứng nhu cầu sử dụng liên tục trong ngày.'),
      highlight('Cấu hình', specs.Chip || specs['RAM / Bộ nhớ'], 'fa-microchip', 'Cấu hình phù hợp đa nhiệm, ứng dụng phổ biến và giải trí.'),
    ])
  }

  return compact([
    highlight('Tính tương thích', specs['Tương thích'] || specs['Kết nối'], 'fa-plug-circle-check', 'Dễ ghép nối với thiết bị đang dùng trong hệ sinh thái công nghệ cá nhân.'),
    highlight('Thiết kế tiện dụng', specs['Loại sản phẩm'] || product.categoryName, 'fa-toolbox', 'Phù hợp sử dụng hằng ngày tại nhà, văn phòng hoặc khi di chuyển.'),
    highlight('Độ bền', specs['Chất liệu'] || specs['Bảo hành'], 'fa-shield-halved', 'Thông tin bảo hành và vật liệu giúp yên tâm hơn khi sử dụng lâu dài.'),
    highlight('Giá dễ tiếp cận', formatPrice(product.price), 'fa-tags', 'Mức giá phù hợp để mua kèm thiết bị chính hoặc nâng cấp góc làm việc.'),
  ])
}

function buildSpecPreview(product) {
  if (!product?.specifications) return []
  const wanted = ['CPU', 'Chip', 'RAM', 'RAM / Bộ nhớ', 'Ổ cứng', 'SSD', 'Màn hình', 'Camera sau', 'Pin', 'Kết nối', 'Bảo hành']
  return wanted
    .filter(key => product.specifications[key])
    .map(key => ({ key, value: product.specifications[key] }))
    .slice(0, 5)
}

function buildPriceMessage(product, priceHistory) {
  if (!product) return 'Giá tốt hôm nay'
  const previous = priceHistory?.find(item => item.oldPrice)?.oldPrice
  if (previous && Number(previous) > Number(product.price)) {
    return `Đã giảm ${formatPrice(Number(previous) - Number(product.price))}`
  }
  if (product.quantity > 0 && product.quantity <= 5) return `Chỉ còn ${product.quantity} sản phẩm`
  if (product.sold >= 500) return 'Sản phẩm đang bán chạy'
  return 'Giá tốt hôm nay'
}

function highlight(title, value, icon, fallback) {
  return { title, icon, text: value || fallback }
}

function compact(items) {
  return items.filter(item => item.text)
}

function joinSpecs(...values) {
  return values.filter(Boolean).join(' • ')
}

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
}

const trustItems = [
  { icon: 'fa-truck-fast', title: 'Giao nhanh', text: 'Nội thành', color: '#2563eb' },
  { icon: 'fa-rotate-left', title: 'Đổi trả', text: '30 ngày', color: '#16a34a' },
  { icon: 'fa-headset', title: 'Hỗ trợ', text: '7h-17h', color: '#f59e0b' },
]

const stepperBtn = {
  width: 36,
  height: 36,
  border: 'none',
  background: '#f1f5f9',
  cursor: 'pointer',
  fontSize: 16,
}
