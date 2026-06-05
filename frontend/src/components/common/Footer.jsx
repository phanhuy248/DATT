import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Globe, Mail, MapPin, Send } from 'lucide-react'
import Button from '../ui/Button'

const supportLinks = [
  { label: 'Chính sách bảo hành', to: '/info/warranty' },
  { label: 'Chính sách đổi trả', to: '/info/returns' },
  { label: 'Phương thức thanh toán', to: '/info/payment' },
  { label: 'Giao hàng & Lắp đặt', to: '/info/shipping' },
]

const shopLinks = [
  { label: 'Giới thiệu SMARTSHOP', to: '/info/about' },
  { label: 'Hệ thống cửa hàng', to: '/info/stores' },
  { label: 'Tuyển dụng', to: '/info/careers' },
  { label: 'Liên hệ', to: '/info/contact' },
]

const categoryLinks = [
  { label: 'Điện thoại', to: '/products?keyword=điện%20thoại' },
  { label: 'Laptop', to: '/products?keyword=laptop' },
  { label: 'Máy tính bảng', to: '/products?keyword=máy%20tính%20bảng' },
  { label: 'Phụ kiện', to: '/products?keyword=phụ%20kiện' },
]

export default function Footer() {
  const [email, setEmail] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    setEmail('')
  }

  return (
    <footer className="bg-shop-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-5 md:grid-cols-2 lg:grid-cols-4 lg:px-6">
        <section>
          <Link to="/" className="mb-5 inline-flex text-xl font-black text-white">
            SMARTSHOP
          </Link>
          <p className="max-w-[300px] text-sm font-medium leading-7 text-white/75">
            Chuỗi bán lẻ công nghệ tập trung vào sản phẩm chính hãng, giá rõ ràng và trải nghiệm mua sắm dễ theo dõi.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <FooterIcon to="/info/about" icon={Globe} label="Website" />
            <FooterIcon to="/info/contact" icon={Mail} label="Email" />
            <FooterIcon to="/info/stores" icon={MapPin} label="Cửa hàng" />
          </div>
        </section>

        <FooterColumn title="Danh mục" links={categoryLinks} />
        <FooterColumn title="Hỗ trợ" links={supportLinks} />

        <section>
          <h3 className="mb-5 text-base font-bold text-white">Về SMARTSHOP</h3>
          <ul className="mb-6 space-y-3">
            {shopLinks.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-sm font-medium text-white/75 transition hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <form onSubmit={handleSubmit} className="flex max-w-[320px] items-center gap-2">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email của bạn"
              className="h-10 min-w-0 flex-1 rounded-xl border border-white/15 bg-white/10 px-3 text-sm font-medium text-white outline-none transition placeholder:text-white/45 focus:border-shop-red"
            />
            <Button type="submit" variant="primary" aria-label="Gửi email">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </section>
      </div>

      <div className="border-t border-white/10 py-6 text-center text-sm font-medium text-white/70">
        © 2026 SMARTSHOP. Premium Tech Retail.
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }) {
  return (
    <section>
      <h3 className="mb-5 text-base font-bold text-white">{title}</h3>
      <ul className="space-y-3">
        {links.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="text-sm font-medium text-white/75 transition hover:text-white">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function FooterIcon({ to, icon: Icon, label }) {
  return (
    <Link to={to} aria-label={label} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-shop-red">
      <Icon className="h-4 w-4" />
    </Link>
  )
}
