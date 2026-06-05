import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BatteryCharging, CheckCircle2, Headphones, Minus, Monitor, Package, Plus, RotateCcw, ShieldCheck, ShoppingCart, Star, Zap } from 'lucide-react'
import { toast } from 'react-toastify'
import { getPriceHistory, getProduct, getRelatedProducts } from '../../api/products'
import { addReview, getReviews } from '../../api/reviews'
import ProductCard from '../../components/product/ProductCard'
import Button from '../../components/ui/Button'
import SectionHeader from '../../components/ui/SectionHeader'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { getImageUrl } from '../../utils/image'

const formatPrice = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`

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
    ])
      .then(([nextProduct, nextReviews, nextRelated, history]) => {
        setProduct(nextProduct)
        setReviews(nextReviews || [])
        setRelated(nextRelated || [])
        setPriceHistory(history || [])
        setSelectedImage(getImageUrl(nextProduct?.images?.[0] || nextProduct?.image))
      })
      .finally(() => setLoading(false))
  }, [id])

  const highlights = useMemo(() => buildHighlights(product), [product])
  const specPreview = useMemo(() => buildSpecPreview(product), [product])
  const priceMessage = useMemo(() => buildPriceMessage(product, priceHistory), [product, priceHistory])

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      await addToCart(product.id, qty)
      toast.success('Đã thêm vào giỏ hàng')
    } catch {
      toast.error('Không thể thêm vào giỏ hàng')
    }
  }

  const handleBuyNow = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    await addToCart(product.id, qty)
    navigate('/cart')
  }

  const handleReview = async (event) => {
    event.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }
    setSubmitting(true)
    try {
      const review = await addReview({ productId: product.id, ...reviewForm })
      setReviews([review, ...reviews])
      setReviewForm({ rating: 5, comment: '' })
      toast.success('Đánh giá thành công')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi đánh giá')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="spinner" />

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-5 lg:px-6">
        <div className="empty-state rounded-2xl border border-shop-border bg-shop-surface shadow-sm">
          <p>Sản phẩm không tồn tại</p>
        </div>
      </div>
    )
  }

  const gallery = product.images?.length ? product.images : product.image ? [product.image] : []
  const specs = Object.entries(product.specifications || {})
  const hasStock = Number(product.quantity || 0) > 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-5 lg:px-6">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm font-medium text-shop-muted">
        <Link to="/" className="hover:text-shop-red">Trang chủ</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-shop-red">Sản phẩm</Link>
        <span>/</span>
        <span className="line-clamp-1 text-shop-text">{product.name}</span>
      </div>

      <section className="grid gap-8 rounded-3xl border border-shop-border bg-shop-surface p-5 shadow-sm lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:p-6">
        <div>
          <div className="product-main-image flex min-h-[380px] items-center justify-center rounded-3xl bg-shop-softBlue p-6">
            {selectedImage ? (
              <img src={selectedImage} alt={product.name} className="max-h-[340px] w-full object-contain" />
            ) : (
              <Package className="h-20 w-20 text-shop-muted" />
            )}
          </div>

          {gallery.length > 1 && (
            <div className="product-gallery-grid mt-4 grid grid-cols-5 gap-3">
              {gallery.slice(0, 10).map((image) => {
                const url = getImageUrl(image)
                return (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setSelectedImage(url)}
                    className={[
                      'h-20 rounded-2xl border bg-shop-surface p-2 transition',
                      selectedImage === url ? 'border-shop-red' : 'border-shop-border hover:border-shop-red',
                    ].join(' ')}
                  >
                    <img src={url} alt="" className="h-full w-full object-contain" />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {product.categoryName && <span className="badge badge-info">{product.categoryName}</span>}
            {product.sold >= 500 && <span className="badge badge-danger">Bán chạy</span>}
            <span className={`badge ${hasStock ? 'badge-success' : 'badge-danger'}`}>{hasStock ? 'Còn hàng' : 'Hết hàng'}</span>
          </div>

          <h1 className="text-2xl font-bold leading-tight text-shop-text lg:text-3xl">{product.name}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <RatingStars value={product.averageRating || 0} />
            <span className="text-sm font-medium text-shop-muted">({product.reviewCount || reviews.length} đánh giá)</span>
            <span className="text-sm font-medium text-shop-muted">Đã bán: {product.sold || 0}</span>
          </div>

          <div className="mt-5 rounded-2xl border border-shop-border bg-shop-bg p-5">
            <p className="text-sm font-bold text-shop-red">{priceMessage}</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <p className="text-4xl font-bold leading-none text-shop-red">{formatPrice(product.price)}</p>
              <div className="text-right text-sm font-medium text-shop-muted">
                <p>Trả góp 0%</p>
                <p>Thanh toán khi nhận hàng</p>
              </div>
            </div>
          </div>

          {product.shortDesc && <p className="mt-5 text-sm font-medium leading-7 text-shop-muted">{product.shortDesc}</p>}

          {specPreview.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {specPreview.map((item) => (
                <span key={item.key} className="rounded-xl border border-shop-border bg-shop-surface px-3 py-2 text-xs font-bold text-shop-text">
                  {item.key}: <span className="font-medium text-shop-muted">{item.value}</span>
                </span>
              ))}
            </div>
          )}

          <div className="product-meta-grid mt-5 grid gap-3 rounded-2xl border border-shop-border bg-shop-surface p-4 text-sm sm:grid-cols-2">
            {product.factory && <MetaLine label="Thương hiệu" value={product.factory} />}
            {product.supplierName && <MetaLine label="Nhà cung cấp" value={product.supplierName} />}
            <MetaLine label="Kho" value={hasStock ? `Còn ${product.quantity} sản phẩm` : 'Hết hàng'} tone={hasStock ? 'success' : 'error'} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-shop-text">Số lượng</span>
            <QuantityStepper value={qty} max={product.quantity || 1} onChange={setQty} />
          </div>

          <div className="product-action-row mt-5 flex gap-3">
            <Button onClick={handleAddToCart} disabled={!hasStock} variant="secondary" className="flex-1" size="lg">
              <ShoppingCart className="h-4 w-4" />
              Thêm vào giỏ
            </Button>
            <Button onClick={handleBuyNow} disabled={!hasStock} className="flex-1" size="lg">
              <Zap className="h-4 w-4" />
              Mua ngay
            </Button>
          </div>

          <div className="trust-grid mt-5 grid gap-3 sm:grid-cols-3">
            {trustItems.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="rounded-2xl border border-shop-border bg-shop-surface p-4 text-center">
                  <Icon className="mx-auto h-5 w-5 text-shop-red" />
                  <p className="mt-2 text-sm font-bold text-shop-text">{item.title}</p>
                  <p className="mt-1 text-xs font-medium text-shop-muted">{item.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="mt-10 space-y-10">
        <Section title="Điểm nổi bật sản phẩm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((item) => (
              <div key={item.title} className="rounded-2xl border border-shop-border bg-shop-bg p-4">
                <h3 className="text-sm font-bold text-shop-text">{item.title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-shop-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </Section>

        {specs.length > 0 && (
          <Section title="Thông số kỹ thuật">
            <div className="overflow-hidden rounded-2xl border border-shop-border">
              {specs.map(([key, value]) => (
                <div key={key} className="spec-grid-row grid gap-3 border-b border-shop-border p-4 text-sm last:border-b-0 sm:grid-cols-[180px_1fr]">
                  <strong className="text-shop-text">{key}</strong>
                  <span className="font-medium text-shop-muted">{value}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {product.detailDesc && (
          <Section title="Mô tả chi tiết">
            <div className="whitespace-pre-wrap text-sm font-medium leading-7 text-shop-muted">{product.detailDesc}</div>
          </Section>
        )}

        {priceHistory.length > 0 && (
          <Section title="Lịch sử giá">
            <div className="grid gap-3">
              {priceHistory.slice(0, 6).map((item) => (
                <div key={item.id} className="flex justify-between gap-4 rounded-xl bg-shop-bg px-4 py-3 text-sm">
                  <span className="font-medium text-shop-muted">{new Date(item.recordedAt).toLocaleString('vi-VN')}</span>
                  <strong className="text-shop-text">{formatPrice(item.newPrice)}</strong>
                </div>
              ))}
            </div>
          </Section>
        )}

        {related.length > 0 && (
          <Section title="Sản phẩm liên quan" linkTo="/products">
            <div className="responsive-product-grid grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </Section>
        )}

        <Section title={`Đánh giá (${reviews.length})`}>
          {user && (
            <form onSubmit={handleReview} className="mb-6 rounded-2xl border border-shop-border bg-shop-bg p-4">
              <h3 className="text-sm font-bold text-shop-text">Viết đánh giá</h3>
              <div className="mt-3 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: star })} className="text-shop-warning">
                    <Star className={`h-6 w-6 ${star <= reviewForm.rating ? 'fill-shop-warning' : ''}`} />
                  </button>
                ))}
              </div>
              <textarea
                className="form-control mt-4"
                rows={3}
                placeholder="Chia sẻ trải nghiệm của bạn..."
                value={reviewForm.comment}
                onChange={(event) => setReviewForm({ ...reviewForm, comment: event.target.value })}
              />
              <Button type="submit" className="mt-3" disabled={submitting}>
                {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </Button>
            </form>
          )}

          {reviews.length === 0 ? (
            <p className="text-sm font-medium text-shop-muted">Chưa có đánh giá nào.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border border-shop-border bg-shop-bg p-4">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-shop-text">{review.userFullName}</p>
                      <RatingStars value={review.rating} size="sm" />
                    </div>
                    <span className="text-xs font-medium text-shop-muted">{new Date(review.createdDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <p className="mt-3 text-sm font-medium leading-6 text-shop-muted">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}

function Section({ title, linkTo, children }) {
  return (
    <section className="rounded-2xl border border-shop-border bg-shop-surface p-5 shadow-sm lg:p-6">
      <SectionHeader title={title} linkTo={linkTo} />
      {children}
    </section>
  )
}

function QuantityStepper({ value, max, onChange }) {
  return (
    <div className="flex h-10 items-center overflow-hidden rounded-xl border border-shop-border bg-shop-surface">
      <button type="button" onClick={() => onChange((current) => Math.max(1, current - 1))} className="flex h-10 w-10 items-center justify-center text-shop-muted hover:bg-shop-softBlue hover:text-shop-red">
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-12 text-center text-sm font-bold text-shop-text">{value}</span>
      <button type="button" onClick={() => onChange((current) => Math.min(max, current + 1))} className="flex h-10 w-10 items-center justify-center text-shop-muted hover:bg-shop-softBlue hover:text-shop-red">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

function RatingStars({ value, size = 'md' }) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  return (
    <div className="flex items-center gap-1 text-shop-warning">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`${iconSize} ${star <= Math.round(value || 0) ? 'fill-shop-warning' : ''}`} />
      ))}
    </div>
  )
}

function MetaLine({ label, value, tone }) {
  const color = tone === 'success' ? 'text-shop-success' : tone === 'error' ? 'text-shop-error' : 'text-shop-text'
  return (
    <div>
      <span className="font-medium text-shop-muted">{label}: </span>
      <strong className={color}>{value}</strong>
    </div>
  )
}

function buildHighlights(product) {
  if (!product) return []
  const specs = product.specifications || {}
  const category = normalize(product.categoryName)

  if (category.includes('laptop')) {
    return compact([
      highlight('Hiệu năng xử lý', specs.CPU || specs['Loại CPU'], 'CPU phù hợp học tập, văn phòng, lập trình và đa nhiệm hằng ngày.'),
      highlight('Bộ nhớ và lưu trữ', joinSpecs(specs.RAM, specs['Dung lượng RAM'], specs['Ổ cứng'], specs.SSD), 'RAM và SSD giúp mở ứng dụng nhanh, thao tác mượt khi làm việc nhiều tác vụ.'),
      highlight('Màn hình làm việc', specs['Màn hình'] || specs['Kích thước màn hình'], 'Không gian hiển thị phù hợp làm việc, học online và giải trí.'),
      highlight('Bảo hành rõ ràng', specs['Bảo hành'] || product.sourceSite, 'Thông tin nguồn nhập rõ ràng, dễ quản lý bảo hành sau mua.'),
    ])
  }

  if (category.includes('dien thoai')) {
    return compact([
      highlight('Màn hình hiển thị', specs['Màn hình'] || specs['Kích thước màn hình'], 'Màn hình phù hợp lướt web, xem nội dung và làm việc di động.'),
      highlight('Camera', specs['Camera sau'] || specs.Camera, 'Cụm camera phục vụ chụp ảnh hằng ngày, quay video và mạng xã hội.'),
      highlight('Pin và sạc', joinSpecs(specs.Pin, specs['Sạc nhanh']), 'Dung lượng pin và sạc nhanh đáp ứng nhu cầu sử dụng liên tục.'),
      highlight('Cấu hình', specs.Chip || specs['RAM / Bộ nhớ'], 'Cấu hình phù hợp đa nhiệm, ứng dụng phổ biến và giải trí.'),
    ])
  }

  return compact([
    highlight('Tính tương thích', specs['Tương thích'] || specs['Kết nối'], 'Dễ ghép nối với thiết bị đang dùng trong hệ sinh thái công nghệ cá nhân.'),
    highlight('Thiết kế tiện dụng', specs['Loại sản phẩm'] || product.categoryName, 'Phù hợp sử dụng hằng ngày tại nhà, văn phòng hoặc khi di chuyển.'),
    highlight('Độ bền', specs['Chất liệu'] || specs['Bảo hành'], 'Thông tin bảo hành và vật liệu giúp yên tâm khi sử dụng lâu dài.'),
    highlight('Giá dễ tiếp cận', formatPrice(product.price), 'Mức giá phù hợp để mua kèm thiết bị chính hoặc nâng cấp góc làm việc.'),
  ])
}

function buildSpecPreview(product) {
  if (!product?.specifications) return []
  const wanted = ['CPU', 'Chip', 'RAM', 'RAM / Bộ nhớ', 'Ổ cứng', 'SSD', 'Màn hình', 'Camera sau', 'Pin', 'Kết nối', 'Bảo hành']
  return wanted
    .filter((key) => product.specifications[key])
    .map((key) => ({ key, value: product.specifications[key] }))
    .slice(0, 5)
}

function buildPriceMessage(product, priceHistory) {
  if (!product) return 'Giá tốt hôm nay'
  const previous = priceHistory?.find((item) => item.oldPrice)?.oldPrice
  if (previous && Number(previous) > Number(product.price)) return `Đã giảm ${formatPrice(Number(previous) - Number(product.price))}`
  if (product.quantity > 0 && product.quantity <= 5) return `Chỉ còn ${product.quantity} sản phẩm`
  if (product.sold >= 500) return 'Sản phẩm đang bán chạy'
  return 'Giá tốt hôm nay'
}

function highlight(title, value, fallback) {
  return { title, text: value || fallback }
}

function compact(items) {
  return items.filter((item) => item.text)
}

function joinSpecs(...values) {
  return values.filter(Boolean).join(' / ')
}

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
}

const trustItems = [
  { icon: Package, title: 'Giao nhanh', text: 'Toàn quốc' },
  { icon: RotateCcw, title: 'Đổi trả', text: 'Theo chính sách' },
  { icon: Headphones, title: 'Hỗ trợ', text: '7h-17h' },
]
