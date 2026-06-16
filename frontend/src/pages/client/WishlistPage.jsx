import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Package } from 'lucide-react'
import { toast } from 'react-toastify'
import { getWishlist } from '../../api/wishlist'
import ProductCard from '../../components/product/ProductCard'
import SectionHeader from '../../components/ui/SectionHeader'

export default function WishlistPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    getWishlist()
      .then(setProducts)
      .catch(() => toast.error('Không thể tải danh sách yêu thích'))
      .finally(() => setLoading(false))
  }, [])

  const handleUnfavorited = (productId) => {
    setProducts(prev => prev.filter(p => p.id !== productId))
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-5 lg:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <SectionHeader
          title="Sản phẩm yêu thích"
          subtitle={!loading && products.length > 0 ? `${products.length} sản phẩm` : undefined}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <Heart className="h-10 w-10 text-red-200" />
          </div>
          <p className="mb-1 text-base font-bold text-gray-700">Chưa có sản phẩm yêu thích</p>
          <p className="mb-6 text-sm text-gray-400">Nhấn vào biểu tượng ❤️ trên sản phẩm để lưu vào đây</p>
          <Link
            to="/products"
            className="rounded-xl bg-[#D70018] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#b5001a]"
          >
            Khám phá sản phẩm
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={{ ...product, isFavorite: true }}
              onUnfavorited={handleUnfavorited}
            />
          ))}
        </div>
      )}
    </div>
  )
}
