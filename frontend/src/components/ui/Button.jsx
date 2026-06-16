import { Link } from 'react-router-dom'

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

const variantClasses = {
  primary: 'bg-shop-red text-white hover:bg-shop-navy focus-visible:ring-shop-red/20',
  secondary:
    'border border-shop-border bg-shop-surface text-shop-text hover:border-shop-red hover:text-shop-red focus-visible:ring-shop-red/15',
  ghost: 'bg-transparent text-shop-muted hover:bg-shop-softBlue hover:text-shop-red focus-visible:ring-shop-red/15',
  icon:
    'border border-shop-border bg-shop-surface text-shop-text hover:border-shop-red hover:text-shop-red focus-visible:ring-shop-red/15',
}

const sizeClasses = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-sm',
}

export default function Button({
  children,
  className = '',
  disabled = false,
  href,
  size = 'md',
  to,
  type = 'button',
  variant = 'primary',
  ...props
}) {
  const isIcon = variant === 'icon'
  const classes = cn(
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50',
    variantClasses[variant] || variantClasses.primary,
    isIcon ? 'h-10 w-10 p-0' : sizeClasses[size],
    className,
  )

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  if (href) {
    const isExternal = href.startsWith('http://') || href.startsWith('https://')
    return (
      <a
        href={href}
        className={classes}
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...props}
      >
        {children}
      </a>
    )
  }

  return (
    <button type={type} className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  )
}
