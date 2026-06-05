import { Link, useNavigate } from 'react-router-dom'
import { Package, ShoppingCart, Star } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../ui/Button'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { getImageUrl } from '../../utils/image'

const formatPrice = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`

const badgeStyles = {
  HOT: 'bg-shop-red text-white',
  NEW: 'bg-shop-success text-white',
  SALE: 'bg-shop-warning text-white',
  OUT: 'bg-shop-navy text-white',
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

export default function ProductCard({ product, badge, disableCart = false }) {
  const { addToCart, loading } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const imageUrl = getImageUrl(product?.images?.[0] || product?.image || product?.thumbnail || product?.productImage)
  const rating = Number(product?.averageRating || product?.rating || 0)
  const reviewCount = Number(product?.reviewCount || product?.reviews || 0)
  const oldPrice = resolveOldPrice(product)
  const cardBadge = resolveBadge(product, badge)
  const hasStock = product?.quantity === undefined || Number(product.quantity) > 0
  const canAddToCart = !disableCart && hasStock && product?.id && !Number.isNaN(Number(product.id))

  const handleAddToCart = async (event) => {
    event.preventDefault()
    event.stopPropagation()

    if (!canAddToCart) {
      navigate('/products')
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

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-shop-border bg-shop-surface shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-shop-red hover:shadow-md">
      <Link to={product?.id ? `/products/${product.id}` : '/products'} className="relative block bg-shop-softBlue/80">
        <div className="aspect-[4/3] p-3">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product?.name || 'Sản phẩm SMARTSHOP'}
              className="h-full w-full object-contain transition duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-shop-muted">
              <Package className="h-10 w-10" />
            </div>
          )}
        </div>
        {cardBadge && (
          <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold uppercase ${badgeStyles[cardBadge.tone]}`}>
            {cardBadge.label}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link
          to={product?.id ? `/products/${product.id}` : '/products'}
          className="line-clamp-2 min-h-[40px] text-sm font-bold leading-5 text-shop-text transition hover:text-shop-red"
        >
          {product?.name || 'Sản phẩm SMARTSHOP'}
        </Link>

        <div className="mt-2 flex items-center gap-1.5">
          <Star className="h-4 w-4 fill-shop-warning text-shop-warning" />
          <span className="text-xs font-bold text-shop-text">{rating > 0 ? rating.toFixed(1) : '4.8'}</span>
          <span className="text-xs font-medium text-shop-muted">({reviewCount})</span>
        </div>

        <div className="mt-3 min-h-[54px]">
          {oldPrice > 0 && <p className="text-xs font-medium text-shop-muted line-through">{formatPrice(oldPrice)}</p>}
          <p className="mt-1 text-[17px] font-black leading-none text-shop-red">{formatPrice(product?.price)}</p>
          {product?.quantity > 0 && product.quantity <= 5 && (
            <p className="mt-2 text-xs font-bold text-shop-warning">Còn {product.quantity} sản phẩm</p>
          )}
        </div>

        <Button
          className="product-card-action mt-auto w-full"
          disabled={loading || !hasStock}
          onClick={handleAddToCart}
          size="md"
          variant={canAddToCart ? 'primary' : 'secondary'}
        >
          <ShoppingCart className="h-4 w-4" />
          {canAddToCart ? 'Thêm vào giỏ' : 'Xem sản phẩm'}
        </Button>
      </div>
    </article>
  )
}
