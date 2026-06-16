import { Link } from 'react-router-dom'
import { Headphones, Laptop, Smartphone, Tablet } from 'lucide-react'
import SectionHeader from '../ui/SectionHeader'
import { featuredCategories } from './mockData'

const iconMap = {
  phone: Smartphone,
  laptop: Laptop,
  tablet: Tablet,
  headphones: Headphones,
}

export default function CategorySection() {
  return (
    <section>
      <SectionHeader title="Danh mục nổi bật" linkTo="/products" />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {featuredCategories.map((category) => {
          const Icon = iconMap[category.icon]

          return (
            <Link
              key={category.id}
              to={`/products?categoryName=${encodeURIComponent(category.name)}`}
              className="group flex min-h-[150px] flex-col items-center justify-center rounded-2xl border border-shop-border bg-shop-softBlue p-6 text-center shadow-sm transition hover:border-shop-red hover:shadow-md"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-shop-surface text-shop-red shadow-sm">
                <Icon className="h-7 w-7" />
              </span>
              <span className="mt-4 text-sm font-bold text-shop-text">{category.name}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
