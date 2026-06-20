import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, ShoppingCart, Star, Heart, Eye } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../ui/Button'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { getImageUrl } from '../../utils/image'
import { toggleWishlist } from '../../api/wishlist'

const formatPrice = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`

const badgeStyles = {
  HOT: 'bg-red-500 text-white shadow-sm shadow-red-500/20',
  NEW: 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20',
  SALE: 'bg-amber-500 text-white shadow-sm shadow-amber-500/20',
  OUT: 'bg-slate-600 text-white shadow-sm',
}

function resolveBadge(product, badge) {
  if (product?.quantity === 0) return { label: 'Hết hàng', tone: 'OUT' }
  const label = badge || product?.badge
  if (!label) return null
  const upper = String(label).toUpperCase()
  if (upper.includes('SALE')) return { label, tone: 'SALE' }
  if (upper.includes('NEW') || upper.includes('MỚI')) return { label, tone: 'NEW' }
  return { label, tone: 'HOT' }
}

function resolveOldPrice(product) {
  const oldPrice = Number(product?.oldPrice || product?.originalPrice || 0)
  const price = Number(product?.price || 0)
  if (oldPrice > price) return oldPrice
  if (product?.discountPercent && price > 0) return Math.round((price / (1 - Number(product.discountPercent) / 100)) / 1000) * 1000
  return 0
}

function resolveSalePercent(product, oldPrice, fallbackPercent) {
  const explicitPercent = Number(product?.discountPercent || fallbackPercent || 0)
  if (explicitPercent > 0) return Math.min(90, Math.round(explicitPercent))

  const price = Number(product?.price || 0)
  if (oldPrice > price && price > 0) {
    return Math.min(90, Math.max(1, Math.round(((oldPrice - price) / oldPrice) * 100)))
  }

  return 0
}

function resolveSaleOldPrice(product, oldPrice, salePercent) {
  const price = Number(product?.price || 0)
  if (oldPrice > price) return oldPrice
  if (salePercent > 0 && price > 0) {
    return Math.round((price / (1 - salePercent / 100)) / 1000) * 1000
  }
  return 0
}

export default function ProductCard({ product, badge, disableCart = false, salePercent, onUnfavorited }) {
  const { addToCart, loading } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isFavorite, setIsFavorite] = useState(product?.isFavorite ?? false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  useEffect(() => {
    setIsFavorite(product?.isFavorite ?? false)
  }, [product?.isFavorite])

  const imageUrl = getImageUrl(product?.images?.[0] || product?.image || product?.thumbnail || product?.productImage)
  const rating = Number(product?.averageRating || product?.rating || 0)
  const reviewCount = Number(product?.reviewCount || product?.reviews || 0)
  const requestedSalePercent = resolveSalePercent(product, 0, salePercent || 0)
  const oldPrice = resolveSaleOldPrice(product, resolveOldPrice(product), requestedSalePercent)
  const discountPercent = resolveSalePercent(product, oldPrice, requestedSalePercent)
  const finalOldPrice = oldPrice > 0 ? oldPrice : (discountPercent > 0 ? Math.round((product?.price / (1 - discountPercent / 100)) / 1000) * 1000 : 0)
  const cardBadge = resolveBadge(product, badge)
  const hasStock = product?.quantity === undefined || Number(product.quantity) > 0
  const canAddToCart = !disableCart && hasStock && product?.id && !Number.isNaN(Number(product.id))

  const handleAddToCart = async (event) => {
    event.preventDefault()
    event.stopPropagation()

    if (!canAddToCart) {
      navigate(product?.id ? `/products/${product.id}` : '/products')
      return
    }

    if (!user) {
      navigate('/login')
      return
    }

    try {
      await addToCart(product.id, 1)
      toast.success('Đã thêm vào giỏ hàng')
    } catch {
      toast.error('Không thể thêm vào giỏ hàng')
    }
  }

  const handleToggleFavorite = async (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (!user) { navigate('/login'); return }
    if (!product?.id || favoriteLoading) return
    const next = !isFavorite
    setIsFavorite(next)
    setFavoriteLoading(true)
    try {
      await toggleWishlist(product.id)
      if (next) {
        toast.success('Đã thêm vào yêu thích', { autoClose: 2000 })
      } else {
        toast.info('Đã xóa khỏi yêu thích', { autoClose: 2000 })
        onUnfavorited?.(product.id)
      }
    } catch {
      setIsFavorite(!next)
      toast.error('Không thể cập nhật danh sách yêu thích')
    } finally {
      setFavoriteLoading(false)
    }
  }

  // Dynamic tags for e-commerce appeal
  const getDynamicTags = () => {
    const price = Number(product?.price || 0)
    const name = String(product?.name || '').toLowerCase()
    const tags = []
    
    if (price >= 15000000) {
      tags.push('Trả góp 0%')
    }
    if (name.includes('iphone') || name.includes('macbook') || name.includes('matebook') || name.includes('vivo') || name.includes('echo') || name.includes('airpods') || name.includes('watch') || name.includes('pro')) {
      tags.push('Chính hãng')
    }
    if (product?.quantity > 0) {
      tags.push('Bảo hành 12T')
    } else {
      tags.push('Đặt trước')
    }
    
    return tags.slice(0, 2)
  }
  const tags = getDynamicTags()

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:border-shop-red hover:shadow-[0_12px_24px_-4px_rgba(215,0,24,0.08)]">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50/50 p-4 transition-colors duration-300 group-hover:bg-slate-50/20">
        <Link to={product?.id ? `/products/${product.id}` : '/products'} className="block h-full w-full">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product?.name || 'Sản phẩm SMARTSHOP'}
              className="h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-shop-muted">
              <Package className="h-10 w-10 stroke-[1.5]" />
            </div>
          )}
        </Link>
        
        {/* Floating Badges */}
        {cardBadge && (
          <span className={`absolute left-3 top-3 z-10 rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-sm ${badgeStyles[cardBadge.tone] || 'bg-slate-500 text-white'}`}>
            {cardBadge.label}
          </span>
        )}

        {/* Discount Badge over Image Frame */}
        {discountPercent > 0 && (
          <span className="absolute left-3 bottom-3 z-10 rounded-lg bg-red-600 px-2 py-0.5 text-[10px] font-black text-white shadow-sm shadow-red-600/25">
            -{discountPercent}%
          </span>
        )}

        {/* Floating Actions on Hover */}
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5 opacity-0 translate-x-3 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
          <button
            onClick={handleToggleFavorite}
            disabled={favoriteLoading}
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-60 ${
              isFavorite ? 'text-shop-red' : 'text-slate-400 hover:text-shop-red'
            }`}
            title={isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          <Link
            to={product?.id ? `/products/${product.id}` : '/products'}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow-md transition-all duration-200 hover:scale-110 hover:text-shop-navy"
            title="Xem nhanh"
          >
            <Eye className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* Brand / Category Line — chiều cao cố định, không wrap */}
        <div className="mb-1.5 h-[18px] flex items-center justify-between gap-1 overflow-hidden">
          <span className="min-w-0 truncate text-[10px] font-extrabold tracking-wider text-shop-red/80 uppercase">
            {product?.factory ? product.factory.split(/[,;|/]/)[0].trim() || 'Chính hãng' : 'Chính hãng'}
          </span>
          {product?.categoryName && (
            <span className="shrink-0 whitespace-nowrap rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-tight">
              {product.categoryName}
            </span>
          )}
        </div>

        {/* Title — 2 dòng cố định */}
        <Link
          to={product?.id ? `/products/${product.id}` : '/products'}
          className="line-clamp-2 h-[32px] text-xs font-bold leading-4 text-slate-800 transition hover:text-shop-red"
          title={product?.name}
        >
          {product?.name || 'Sản phẩm SMARTSHOP'}
        </Link>

        {/* Ratings — 1 dòng cố định */}
        <div className="mt-1.5 h-[16px] flex items-center gap-0.5 overflow-hidden">
          {[...Array(5)].map((_, i) => {
            const starVal = i + 1
            const isFilled = rating >= starVal
            const isHalf = !isFilled && rating >= starVal - 0.5
            return (
              <Star
                key={i}
                className={`h-3 w-3 shrink-0 ${
                  isFilled
                    ? 'fill-shop-warning text-shop-warning'
                    : isHalf
                    ? 'fill-shop-warning/50 text-shop-warning'
                    : 'text-slate-200'
                }`}
              />
            )
          })}
          {rating > 0 && <span className="ml-0.5 text-[10px] font-extrabold text-slate-800">{rating.toFixed(1)}</span>}
          {reviewCount > 0 && <span className="text-[9px] font-medium text-slate-400">({reviewCount})</span>}
        </div>

        {/* Sold count — 1 dòng cố định */}
        <div className="mt-0.5 h-[16px] flex items-center">
          <span className="text-[10px] font-semibold text-slate-500">
            Đã bán {Number(product?.sold || 0)}
          </span>
        </div>

        {/* Custom Tags — 1 dòng cố định, không wrap */}
        <div className="mt-2 h-[22px] flex gap-1 overflow-hidden">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="shrink-0 rounded border border-[#EAF2FF] bg-[#EAF2FF]/40 px-1.5 py-0.5 text-[9px] font-bold text-[#071A2D]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Stock status — 1 dòng cố định */}
        <div className="mt-2 h-[18px] flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${hasStock ? 'bg-shop-success animate-pulse' : 'bg-shop-error'}`}></span>
          <span className="text-[10px] font-bold text-slate-500 truncate">
            {hasStock ? (product.quantity <= 5 ? `Chỉ còn ${product.quantity} sản phẩm` : 'Còn hàng') : 'Hết hàng'}
          </span>
        </div>

        {/* Pricing + Action — luôn ở đáy card */}
        <div className="mt-auto pt-2.5">
          <div className="mb-3 flex flex-col min-h-[46px] justify-end">
            {finalOldPrice > 0 ? (
              <span className="text-xs text-slate-400 line-through font-medium">
                {formatPrice(finalOldPrice)}
              </span>
            ) : null}
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black text-shop-red tracking-tight">
                {formatPrice(product?.price)}
              </span>
            </div>
          </div>

          <Button
            className="product-card-action w-full transition-all duration-300 hover:shadow-lg hover:shadow-shop-red/10 active:scale-[0.98] group/btn"
            disabled={loading || !hasStock}
            onClick={handleAddToCart}
            size="sm"
            variant={canAddToCart ? 'primary' : 'secondary'}
          >
            <ShoppingCart className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:-translate-y-0.5" />
            <span className="text-xs">{canAddToCart ? 'Thêm vào giỏ' : 'Xem chi tiết'}</span>
          </Button>
        </div>
      </div>
    </article>
  )
}
