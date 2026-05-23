import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'
import { useState } from 'react'
import { getImageUrl } from '../../utils/image'

const BADGE_STYLES = {
  HOT:  { bg: '#cc0000', label: '🔥 HOT' },
  NEW:  { bg: '#16a34a', label: '✨ MỚI' },
  SALE: { bg: '#f59e0b', label: '⚡ SALE' },
}

export default function ProductCard({ product, badge }) {
  const { addToCart, loading } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { navigate('/login'); return }
    try {
      await addToCart(product.id, 1)
      toast.success('Đã thêm vào giỏ hàng!')
    } catch {
      toast.error('Không thể thêm vào giỏ hàng')
    }
  }

  const badgeStyle = badge ? BADGE_STYLES[badge] : null
  const originalPrice = Math.round(product.price * 1.22 / 1000) * 1000

  return (
    <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: '#fff',
          border: `1px solid ${hovered ? '#cc0000' : '#e0e0e0'}`,
          borderRadius: 6,
          overflow: 'hidden',
          transition: 'all 0.2s',
          boxShadow: hovered ? '0 6px 20px rgba(204,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.06)',
          transform: hovered ? 'translateY(-2px)' : 'none',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Image area */}
        <div style={{ position: 'relative', paddingTop: '75%', background: '#f8f8f8', overflow: 'hidden', flexShrink: 0 }}>
          {product.image ? (
            <img src={getImageUrl(product.image)} alt={product.name}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 10, transition: 'transform 0.3s', transform: hovered ? 'scale(1.06)' : 'scale(1)' }} />
          ) : (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-image" style={{ fontSize: 36, color: '#ccc' }} />
            </div>
          )}

          {badgeStyle && (
            <div style={{
              position: 'absolute', top: 6, left: 6,
              background: badgeStyle.bg, color: '#fff',
              fontSize: 10, fontWeight: 800, padding: '2px 6px',
              borderRadius: 3, letterSpacing: 0.3,
            }}>
              {badgeStyle.label}
            </div>
          )}

          <button
            onClick={e => e.preventDefault()}
            style={{
              position: 'absolute', top: 6, right: 6,
              width: 28, height: 28, background: '#fff',
              border: '1px solid #ddd', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', opacity: hovered ? 1 : 0,
              transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
          >
            <i className="fa-regular fa-heart" style={{ fontSize: 11, color: '#cc0000' }} />
          </button>

          {product.quantity === 0 && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ background: '#555', color: '#fff', fontSize: 11, padding: '5px 12px', borderRadius: 4, fontWeight: 600 }}>Hết hàng</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '10px 10px 12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h3 style={{
            fontSize: 13, fontWeight: 500, color: '#222', marginBottom: 6,
            lineHeight: 1.45, minHeight: 38, flex: 1,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {product.name}
          </h3>

          {/* Stars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 8 }}>
            {[1,2,3,4,5].map(s => (
              <i key={s} className={`fa-${s <= Math.round(product.averageRating || 4) ? 'solid' : 'regular'} fa-star`}
                style={{ fontSize: 10, color: '#f59e0b' }} />
            ))}
            {product.reviewCount > 0 && (
              <span style={{ fontSize: 10, color: '#999', marginLeft: 2 }}>({product.reviewCount})</span>
            )}
          </div>

          {/* Price */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: '#aaa', textDecoration: 'line-through', lineHeight: 1.2, marginBottom: 2 }}>
              {originalPrice.toLocaleString('vi-VN')}₫
            </div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#cc0000', lineHeight: 1 }}>
              {product.price.toLocaleString('vi-VN')}₫
            </div>
            {product.quantity > 0 && product.quantity <= 5 && (
              <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 3, fontWeight: 600 }}>
                Còn {product.quantity} sản phẩm
              </div>
            )}
          </div>

          {/* Cart button */}
          <button
            onClick={handleAddToCart}
            disabled={loading || product.quantity === 0}
            style={{
              background: hovered ? '#b30000' : '#cc0000',
              color: '#fff', border: 'none', borderRadius: 4,
              padding: '7px 8px', fontSize: 11, cursor: product.quantity === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              opacity: product.quantity === 0 ? 0.4 : 1,
              transition: 'background 0.15s', whiteSpace: 'nowrap',
              fontWeight: 600, width: '100%',
            }}
          >
            <i className="fa-solid fa-cart-plus" style={{ fontSize: 11 }} />
            <span>Thêm vào giỏ</span>
          </button>
        </div>
      </div>
    </Link>
  )
}
