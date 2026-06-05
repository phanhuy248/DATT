import { Zap } from 'lucide-react'

export default function BrandLogo({ className = '', iconClassName = '', textClassName = '', showText = true }) {
  return (
    <span className={`inline-flex items-center gap-2 leading-none ${className}`}>
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-shop-red text-white shadow-sm ${iconClassName}`}>
        <Zap className="h-5 w-5 fill-current" />
      </span>
      {showText && <span className={`text-xl font-black text-shop-red ${textClassName}`}>SMARTSHOP</span>}
    </span>
  )
}
