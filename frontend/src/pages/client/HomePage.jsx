import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import HeroSection from '../../components/home/HeroSection'
import BenefitCards from '../../components/home/BenefitCards'
import Sidebar from '../../components/home/Sidebar'
import FlashSaleSection from '../../components/home/FlashSaleSection'
import CategorySection from '../../components/home/CategorySection'
import BestSellerSection from '../../components/home/BestSellerSection'
import Button from '../../components/ui/Button'
import { getProducts } from '../../api/products'

export default function HomePage() {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [newProducts, setNewProducts] = useState([])
  const [bestSellerProducts, setBestSellerProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    Promise.all([
      getProducts({ sortBy: 'newest', page: 0, size: 10 }),
      getProducts({ sortBy: 'bestseller', page: 0, size: 5 }),
    ])
      .then(([newestResult, bestsellerResult]) => {
        if (!active) return
        const newest = newestResult?.content || []
        const bestsellers = bestsellerResult?.content || []
        setNewProducts(newest)
        setBestSellerProducts(bestsellers.length ? bestsellers : newest.slice(3, 7))
        setError('')
      })
      .catch(() => {
        if (!active) return
        setNewProducts([])
        setBestSellerProducts([])
        setError('Không thể tải sản phẩm trang chủ. Vui lòng thử lại sau.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const heroProduct = useMemo(() => newProducts.find((product) => product.image || product.images?.length) || newProducts[0], [newProducts])
  const featuredProducts = useMemo(() => newProducts.filter((product) => product.id !== heroProduct?.id).slice(0, 4), [heroProduct, newProducts])

  return (
    <div className="min-h-screen bg-shop-bg text-shop-text">
      <div className="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-5 lg:px-6">
        <HeroSection product={heroProduct} />
        <BenefitCards />

        <div className="mt-10 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
          <aside className="hidden md:block lg:sticky lg:top-[88px]">
            <Sidebar />
          </aside>

          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              className="flex w-full items-center justify-between rounded-2xl border border-shop-border bg-shop-surface px-4 py-3 text-sm font-bold text-shop-text shadow-sm transition hover:shadow-md"
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-shop-red" />
                Danh mục sản phẩm
              </span>
              <ChevronDown className={`h-4 w-4 transition ${filtersOpen ? 'rotate-180' : ''}`} />
            </button>
            {filtersOpen && (
              <div className="mt-3">
                <Sidebar />
              </div>
            )}
          </div>

          <main className="min-w-0 space-y-10">
            {loading && <HomeProductSkeleton />}
            {error && (
              <div className="rounded-2xl border border-shop-error/20 bg-shop-surface p-5 text-sm font-bold text-shop-error shadow-sm">
                {error}
              </div>
            )}
            {!loading && !error && newProducts.length === 0 && (
              <div className="rounded-2xl border border-shop-border bg-shop-surface p-8 text-center shadow-sm">
                <h2 className="text-lg font-bold text-shop-text">Chưa có sản phẩm hiển thị</h2>
                <p className="mt-2 text-sm font-medium text-shop-muted">Hãy thêm sản phẩm thật trong trang quản trị để trang chủ tự động cập nhật.</p>
                <Button to="/products" className="mt-5">Xem trang sản phẩm</Button>
              </div>
            )}
            <FlashSaleSection fallbackProducts={featuredProducts} />
            <CategorySection />
            {!loading && !error && <BestSellerSection products={bestSellerProducts} />}
          </main>
        </div>
      </div>
    </div>
  )
}

function HomeProductSkeleton() {
  return (
    <div className="rounded-3xl bg-shop-navy p-5 shadow-sm sm:p-6 lg:p-7">
      <div className="animate-pulse">
        <div className="h-6 w-44 rounded bg-white/20" />
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="rounded-2xl bg-shop-surface p-5">
              <div className="aspect-square rounded-2xl bg-shop-softBlue" />
              <div className="mt-5 h-4 w-3/4 rounded bg-shop-bg" />
              <div className="mt-3 h-4 w-1/2 rounded bg-shop-bg" />
              <div className="mt-5 h-10 rounded-xl bg-shop-bg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
