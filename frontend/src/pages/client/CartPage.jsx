import { Link, useNavigate } from 'react-router-dom'
import { CreditCard, Minus, Package, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '../../components/ui/Button'
import SectionHeader from '../../components/ui/SectionHeader'
import { useCart } from '../../context/CartContext'
import { getImageUrl } from '../../utils/image'

export default function CartPage() {
  const { cart, loading, updateItem, removeItem } = useCart()
  const navigate = useNavigate()

  const handleUpdate = async (cartItemId, quantity) => {
    if (quantity < 1) return
    try {
      await updateItem(cartItemId, quantity)
    } catch {
      toast.error('Không thể cập nhật số lượng')
    }
  }

  const handleRemove = async (cartItemId) => {
    try {
      await removeItem(cartItemId)
      toast.success('Đã xóa sản phẩm')
    } catch {
      toast.error('Không thể xóa sản phẩm')
    }
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-5 lg:px-6">
        <div className="rounded-2xl border border-shop-border bg-shop-surface px-6 py-14 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-shop-softBlue text-shop-red">
            <ShoppingCart className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold text-shop-text">Giỏ hàng của bạn đang trống</h1>
          <p className="mt-2 text-sm font-medium text-shop-muted">Hãy chọn sản phẩm trước khi thanh toán.</p>
          <Button to="/products" className="mt-6">
            Tiếp tục mua sắm
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-5 lg:px-6">
      <SectionHeader title={`Giỏ hàng (${cart.totalItems} sản phẩm)`} />

      <div className="cart-layout grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {cart.items.map((item) => (
            <article key={item.cartItemId} className="rounded-2xl border border-shop-border bg-shop-surface p-5 shadow-sm">
              <div className="cart-item-body flex items-center gap-4">
                <Link to={`/products/${item.productId}`} className="shrink-0">
                  <div className="h-24 w-24 overflow-hidden rounded-2xl bg-shop-softBlue">
                    {item.productImage ? (
                      <img src={getImageUrl(item.productImage)} alt={item.productName} className="h-full w-full object-contain p-2" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-shop-muted">
                        <Package className="h-7 w-7" />
                      </div>
                    )}
                  </div>
                </Link>

                <div className="cart-item-info min-w-0 flex-1">
                  <Link to={`/products/${item.productId}`} className="line-clamp-2 text-sm font-bold leading-5 text-shop-text hover:text-shop-red">
                    {item.productName}
                  </Link>
                  {item.salePrice != null ? (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm font-bold text-shop-red">{item.salePrice.toLocaleString('vi-VN')}đ</span>
                      <span className="text-xs text-shop-muted line-through">{item.productPrice.toLocaleString('vi-VN')}đ</span>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm font-bold text-shop-red">{item.productPrice.toLocaleString('vi-VN')}đ</p>
                  )}
                </div>

                <QuantityStepper
                  value={item.quantity}
                  onMinus={() => handleUpdate(item.cartItemId, item.quantity - 1)}
                  onPlus={() => handleUpdate(item.cartItemId, item.quantity + 1)}
                />

                <span className="cart-item-subtotal min-w-[110px] text-right text-sm font-bold text-shop-text">
                  {item.subtotal.toLocaleString('vi-VN')}đ
                </span>

                <Button variant="icon" onClick={() => handleRemove(item.cartItemId)} aria-label="Xóa sản phẩm">
                  <Trash2 className="h-4 w-4 text-shop-error" />
                </Button>
              </div>
            </article>
          ))}
        </div>

        <aside className="cart-summary sticky top-24 rounded-2xl border border-shop-border bg-shop-surface p-5 shadow-sm">
          <h2 className="text-base font-bold text-shop-text">Tóm tắt đơn hàng</h2>
          <div className="mt-5 space-y-3">
            {cart.items.map((item) => (
              <div className="cart-summary-line flex justify-between gap-4 text-sm" key={item.cartItemId}>
                <span className="line-clamp-2 font-medium text-shop-muted">
                  {item.productName} x {item.quantity}
                </span>
                <span className="shrink-0 font-bold text-shop-text">{item.subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
            ))}
          </div>

          <hr className="my-5 border-shop-border" />

          <div className="cart-summary-line flex justify-between gap-4 text-lg font-bold">
            <span>Tổng cộng</span>
            <span className="text-shop-red">{cart.totalPrice.toLocaleString('vi-VN')}đ</span>
          </div>

          <Button className="mt-6 w-full" onClick={() => navigate('/checkout')} disabled={loading} size="lg">
            <CreditCard className="h-4 w-4" />
            Tiến hành thanh toán
          </Button>
          <Button to="/products" variant="ghost" className="mt-3 w-full">
            Tiếp tục mua sắm
          </Button>
        </aside>
      </div>
    </div>
  )
}

function QuantityStepper({ value, onMinus, onPlus }) {
  return (
    <div className="flex h-10 items-center overflow-hidden rounded-xl border border-shop-border bg-shop-surface">
      <button type="button" onClick={onMinus} className="flex h-10 w-10 items-center justify-center text-shop-muted transition hover:bg-shop-softBlue hover:text-shop-red">
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-11 text-center text-sm font-bold text-shop-text">{value}</span>
      <button type="button" onClick={onPlus} className="flex h-10 w-10 items-center justify-center text-shop-muted transition hover:bg-shop-softBlue hover:text-shop-red">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
