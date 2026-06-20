import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Headphones, Laptop, LayoutGrid, Smartphone, Speaker, Tablet } from 'lucide-react'
import { getCategories } from '../../api/categories'
import { brands } from './mockData'

function categoryIcon(name = '') {
  const n = name.toLowerCase()
  if (n.includes('điện thoại') || n.includes('phone')) return Smartphone
  if (n.includes('laptop') || n.includes('máy tính xách tay')) return Laptop
  if (n.includes('máy tính bảng') || n.includes('tablet')) return Tablet
  if (n.includes('phụ kiện') || n.includes('accessory')) return Headphones
  if (n.includes('âm thanh') || n.includes('loa') || n.includes('audio')) return Speaker
  return LayoutGrid
}

export default function Sidebar() {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-shop-border bg-shop-surface p-5 shadow-sm">
        <h2 className="text-base font-bold text-shop-text">Danh mục</h2>
        <p className="mt-1 text-xs font-medium text-shop-muted">Đi thẳng tới nhóm sản phẩm cần mua</p>

        <nav className="mt-5 space-y-2">
          {categories.map((category) => {
            const Icon = categoryIcon(category.name)
            return (
              <Link
                key={category.id}
                to={`/products?categoryId=${category.id}`}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-shop-text transition hover:bg-shop-softBlue hover:text-shop-red"
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
