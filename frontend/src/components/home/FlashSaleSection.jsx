import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'
import ProductCard from './ProductCard'
import { getActiveFlashSales } from '../../api/flashSales'

const SALE_PERCENTS = [25, 30, 35, 20]

function useCountdown(targetIso) {
  const [, setTick] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    if (!targetIso) return
    ref.current = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(ref.current)
  }, [targetIso])

  if (!targetIso) return null
  const ms = Math.max(0, new Date(targetIso) - Date.now())
  const h  = Math.floor(ms / 3_600_000)
  const m  = Math.floor((ms % 3_600_000) / 60_000)
  const s  = Math.floor((ms % 60_000) / 1_000)
  return ms === 0 ? null : { h, m, s }
}

function pad(n) { return String(n).padStart(2, '0') }

/** fallbackProducts: sản phẩm mới nhất hiển thị khi chưa có flash sale thật. */
export default function FlashSaleSection({ fallbackProducts = [] }) {
  const [items, setItems] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    getActiveFlashSales()
      .then(data => { if (active) setItems(data || []) })
      .catch(() => { if (active) setItems([]) })
      .finally(() => { if (active) setLoaded(true) })
    return () => { active = false }
  }, [])

  const useRealSale = loaded && items.length > 0
  const earliestEnd = useRealSale
    ? items.reduce((min, it) => (it.endAt < min ? it.endAt : min), items[0].endAt)
    : null
  const countdown = useCountdown(earliestEnd)

  const displayItems = useRealSale ? [] : fallbackProducts

  if (!loaded && fallbackProducts.length === 0) return null
  if (!useRealSale && displayItems.length === 0) return null

  const activeList = useRealSale ? items : displayItems
  const count = activeList.length

  const gridColumns =
    count >= 4 ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4'
    : count === 3 ? 'grid-cols-2 sm:grid-cols-3'
    : count === 2 ? 'grid-cols-2'
    : 'grid-cols-1'

  return (
    <section className="w-full rounded-3xl border-2 border-shop-red bg-shop-red p-5 shadow-sm sm:p-6 lg:p-7">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        {/* Trái: icon + tiêu đề + đếm ngược */}
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-shop-red">
            <Zap className="h-6 w-6 fill-current" />
          </span>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <h2 className="whitespace-nowrap text-xl font-black text-white">Flash Sale</h2>
            {countdown ? (
              <p className="whitespace-nowrap text-sm font-medium text-white/90">
                Kết thúc sau:&nbsp;
                <span className="font-black">{pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}</span>
              </p>
            ) : (
              <p className="text-sm font-medium text-white/85">Ưu đãi hấp dẫn tại SMARTSHOP</p>
            )}
          </div>
        </div>

        {/* Phải: nút Xem tất cả — shrink-0 + whitespace-nowrap để không bị cắt chữ */}
        <Link
          to="/products?sortBy=newest"
          className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-xl bg-white px-5 text-sm font-bold text-shop-red transition hover:bg-shop-softBlue"
        >
          Xem tất cả
        </Link>
      </div>

      {/* ── Danh sách sản phẩm ── */}
      <div className={`mt-5 grid gap-4 ${gridColumns}`}>
        {useRealSale
          ? activeList.map(item => (
              <ProductCard
                key={item.id}
                product={{
                  id: item.productId,
                  name: item.productName,
                  image: item.productImage,
                  price: item.salePrice,
                  originalPrice: item.originalPrice,
                  discountPercent: item.discountPercent,
                  quantity: item.remaining === null ? 999 : item.remaining,
                }}
                badge="Sale"
              />
            ))
          : activeList.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                badge="Sale"
                salePercent={SALE_PERCENTS[index % SALE_PERCENTS.length]}
              />
            ))
        }
      </div>
    </section>
  )
}
