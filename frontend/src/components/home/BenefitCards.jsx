import { Headphones, RotateCcw, ShieldCheck, Truck } from 'lucide-react'

const benefits = [
  { title: 'Miễn phí vận chuyển', subtitle: 'Cho đơn hàng trên 500K', icon: Truck },
  { title: 'Bảo hành chính hãng', subtitle: 'Bảo hành 12-24 tháng', icon: ShieldCheck },
  { title: 'Đổi trả 04 ngày', subtitle: 'Đổi trả dễ dàng', icon: RotateCcw },
  { title: 'Hỗ trợ 24/7', subtitle: 'Hotline: 0911 430 000', icon: Headphones },
]

export default function BenefitCards() {
  return (
    <section className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {benefits.map(({ title, subtitle, icon: Icon }) => (
        <article
          key={title}
          className="flex items-center gap-4 rounded-2xl border border-shop-border bg-shop-surface px-5 py-5 shadow-sm transition hover:shadow-md"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-shop-softBlue text-shop-red">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-shop-text">{title}</h3>
            <p className="mt-1 text-xs font-medium text-shop-muted">{subtitle}</p>
          </div>
        </article>
      ))}
    </section>
  )
}
