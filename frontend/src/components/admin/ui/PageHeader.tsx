import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  breadcrumb?: BreadcrumbItem[]
}

export function PageHeader({ title, description, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-1.5 flex items-center gap-1 text-xs text-gray-400">
            {breadcrumb.map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight size={11} />}
                {item.href ? (
                  <Link to={item.href} className="hover:text-gray-600">
                    {item.label}
                  </Link>
                ) : (
                  <span className={i === breadcrumb.length - 1 ? 'font-medium text-gray-500' : ''}>
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
