import SectionHeader from '../ui/SectionHeader'
import ProductCard from './ProductCard'

export default function BestSellerSection({ products = [] }) {
  if (!products.length) return null
  const gridColumns =
    products.length >= 5
      ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
      : products.length === 4
        ? 'sm:grid-cols-2 lg:grid-cols-4'
        : products.length === 3
          ? 'sm:grid-cols-2 lg:grid-cols-3'
          : products.length === 2
            ? 'sm:grid-cols-2'
            : ''

  return (
    <section>
      <SectionHeader title="Sản phẩm bán chạy" linkTo="/products?sortBy=bestseller" />

      <div className={`grid gap-4 ${gridColumns}`}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} badge={Number(product.sold || 0) > 0 ? 'Hot' : undefined} />
        ))}
      </div>
    </section>
  )
}
