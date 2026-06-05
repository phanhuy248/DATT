import { Zap } from 'lucide-react'
import ProductCard from './ProductCard'

export default function FlashSaleSection({ products = [] }) {
  if (!products.length) return null
  const gridColumns =
    products.length >= 4
      ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      : products.length === 3
        ? 'sm:grid-cols-2 lg:grid-cols-3'
        : products.length === 2
          ? 'sm:grid-cols-2'
          : ''

  return (
    <section className="rounded-3xl border-2 border-shop-red bg-shop-red p-5 shadow-sm sm:p-6 lg:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-shop-red">
            <Zap className="h-6 w-6 fill-current" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-white">Flash Sale</h2>
            <p className="mt-1 text-sm font-medium text-white/85">Sản phẩm mới đang có trong hệ thống SMARTSHOP</p>
          </div>
        </div>
        <a href="/products?sortBy=newest" className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-bold text-shop-red transition hover:bg-shop-softBlue">
          Xem tất cả
        </a>
      </div>

      <div className={`mt-6 grid gap-4 ${gridColumns}`}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} badge="Sale" />
        ))}
      </div>
    </section>
  )
}
