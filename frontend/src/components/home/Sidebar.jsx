import { Link } from 'react-router-dom'
import { Headphones, Laptop, Smartphone, Speaker, Tablet } from 'lucide-react'
import { brands, sidebarCategories } from './mockData'

const iconMap = {
  phone: Smartphone,
  laptop: Laptop,
  tablet: Tablet,
  headphones: Headphones,
  speaker: Speaker,
}

function categoryHref(category) {
  return `/products?categoryName=${encodeURIComponent(category.name)}`
}

export default function Sidebar() {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-shop-border bg-shop-surface p-5 shadow-sm">
        <h2 className="text-base font-bold text-shop-text">Danh mục</h2>
        <p className="mt-1 text-xs font-medium text-shop-muted">Đi thẳng tới nhóm sản phẩm cần mua</p>

        <nav className="mt-5 space-y-2">
          {sidebarCategories.map((category) => {
            const Icon = iconMap[category.icon]

            return (
              <Link
                key={category.id}
                to={categoryHref(category)}
                className={[
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition',
                  category.active ? 'bg-shop-red text-white' : 'text-shop-text hover:bg-shop-softBlue hover:text-shop-red',
                ].join(' ')}
              >
                <Icon className="h-4 w-4" />
                {category.name}
              </Link>
            )
          })}
        </nav>
      </section>

      <section className="rounded-2xl border border-shop-border bg-shop-surface p-5 shadow-sm">
        <h2 className="text-base font-bold text-shop-text">Thương hiệu nổi bật</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {brands.map((brand) => (
            <Link
              key={brand}
              to={`/products?brand=${encodeURIComponent(brand)}`}
              className="rounded-xl border border-shop-border bg-shop-bg px-3 py-2 text-xs font-bold text-shop-text transition hover:border-shop-red hover:text-shop-red"
            >
              {brand}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
