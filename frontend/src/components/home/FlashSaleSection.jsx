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

function FlashSaleItemCard({ item }) {
  const countdown = useCountdown(item.endAt)
  return (
    <div className="relative">
      {countdown && (
        <div className="absolute top-2 right-2 z-10 pointer-events-none flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 shadow-md">
          <span className="text-[10px] font-bold text-amber-900 leading-none">⏱</span>
          <span className="text-[11px] font-black text-amber-900 leading-none tabular-nums">
            {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
          </span>
        </div>
      )}
      <ProductCard
        product={{
          id: item.productId,
          name: item.productName,
          image: item.productImage,
          price: item.salePrice,
          originalPrice: item.originalPrice,
          discountPercent: item.discountPercent,
          quantity: item.remaining === null ? 999 : item.remaining,
          sold: item.soldCount,
        }}
        badge="Sale"
      />
    </div>
  )
}

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
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-shop-red">
            <Zap className="h-6 w-6 fill-current" />
          </span>
          <h2 className="whitespace-nowrap text-xl font-black text-white">Flash Sale</h2>
        </div>

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
              <FlashSaleItemCard key={item.id} item={item} />
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
