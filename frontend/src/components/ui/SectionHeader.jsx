import { ArrowRight } from 'lucide-react'
import Button from './Button'

export default function SectionHeader({ title, subtitle, linkLabel = 'Xem tất cả', linkTo }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-1 h-8 w-1.5 shrink-0 rounded-full bg-shop-red" />
        <div className="min-w-0">
          <h2 className="text-lg font-bold leading-tight text-shop-text">{title}</h2>
          {subtitle && <p className="mt-1 text-sm font-medium text-shop-muted">{subtitle}</p>}
        </div>
      </div>
      {linkTo && (
        <Button to={linkTo} variant="ghost" size="sm" className="hidden sm:inline-flex">
          {linkLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
