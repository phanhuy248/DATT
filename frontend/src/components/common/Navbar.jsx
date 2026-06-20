import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Heart, LogOut, Menu, Receipt, Search, ShoppingCart, User, X } from 'lucide-react'
import Button from '../ui/Button'
import BrandLogo from './BrandLogo'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { getImageUrl } from '../../utils/image'
import { buildAISearchParams } from '../../utils/aiSearch'

const navItems = [
  { to: '/products', label: 'Sản phẩm', active: (pathname, search) => pathname.startsWith('/products') && search !== '?sortBy=newest' && search !== '?sortBy=bestseller' },
  { to: '/products?sortBy=newest', label: 'Hàng mới', active: (pathname, search) => pathname.startsWith('/products') && search === '?sortBy=newest' },
  { to: '/products?sortBy=bestseller', label: 'Bán chạy', active: (pathname, search) => pathname.startsWith('/products') && search === '?sortBy=bestseller' },
  { to: '/news', label: 'Tin tức', active: (pathname) => pathname.startsWith('/news') },
  { to: '/info/stores', label: 'Cửa hàng', active: (pathname) => pathname === '/info/stores' },
]

export default function Navbar() {
  const { user, signOut } = useAuth()
  const { cart } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [keyword, setKeyword] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef(null)

  useEffect(() => {
    if (!accountOpen) return
    function handleClickOutside(event) {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [accountOpen])

  const cartCount = cart?.totalItems || 0

  const handleSearch = (event) => {
    event.preventDefault()
    const value = keyword.trim()
    if (!value) return
    const params = buildAISearchParams(value)
    navigate(`/products?${params.toString()}`)
    setKeyword('')
    setMenuOpen(false)
  }

  const handleLogout = () => {
    signOut()
    setAccountOpen(false)
    setMenuOpen(false)
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-shop-border bg-shop-surface shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-5 lg:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2 leading-none" aria-label="SMARTSHOP">
          <BrandLogo />
        </Link>

        <nav className="hidden flex-1 items-center gap-6 lg:flex xl:gap-8">
          {navItems.map((item) => {
            const active = item.active(location.pathname, location.search)

            return (
              <Link
                key={item.label}
                to={item.to}
                className={[
                  'relative whitespace-nowrap text-sm font-bold transition hover:text-shop-red',
                  active ? 'text-shop-red' : 'text-shop-text',
                ].join(' ')}
              >
                {item.label}
                {active && <span className="absolute -bottom-2 left-0 h-0.5 w-full rounded-full bg-shop-red" />}
              </Link>
            )
          })}
        </nav>

        <form
          onSubmit={handleSearch}
          className="ml-auto hidden h-10 min-w-[240px] max-w-[380px] flex-1 items-center rounded-xl border border-shop-border bg-shop-bg px-4 transition focus-within:border-shop-red focus-within:bg-shop-surface focus-within:ring-4 focus-within:ring-shop-red/10 md:flex"
        >
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm kiếm sản phẩm..."
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-shop-text outline-none placeholder:text-shop-muted"
          />
          <button type="submit" className="ml-2 text-shop-text transition hover:text-shop-red" aria-label="Tìm kiếm">
            <Search className="h-4 w-4" />
          </button>
        </form>

        <div className="flex items-center gap-2">
          {user && (
            <Button to="/wishlist" variant="icon" aria-label="Yêu thích">
              <Heart className="h-5 w-5" />
            </Button>
          )}

          <Button to="/cart" variant="icon" aria-label="Giỏ hàng" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-shop-red px-1 text-[10px] font-black leading-none text-white">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Button>

          {user ? (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                className="flex h-10 items-center gap-1 rounded-xl border border-shop-border bg-shop-surface pl-1 pr-2 transition hover:border-shop-red"
                aria-label="Tài khoản"
              >
                <span className="h-8 w-8 overflow-hidden rounded-lg bg-shop-softBlue">
                  {user.avatar ? (
                    <img src={getImageUrl(user.avatar)} alt={user.fullName || 'Avatar'} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-shop-navy text-white">
                      <User className="h-4 w-4" />
                    </span>
                  )}
                </span>
                <ChevronDown className="hidden h-4 w-4 text-shop-muted sm:block" />
              </button>

              {accountOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-shop-border bg-shop-surface p-2 shadow-md">
                  <div className="border-b border-shop-border px-3 py-3">
                    <p className="truncate text-sm font-bold text-shop-text">{user.fullName || 'Khách hàng'}</p>
                    <p className="truncate text-xs font-medium text-shop-muted">{user.email}</p>
                  </div>
                  {user.role === 'ADMIN' && <MenuItem to="/admin/dashboard" icon={Receipt} label="Admin Panel" onClick={() => setAccountOpen(false)} />}
                  <MenuItem to="/account" icon={User} label="Tài khoản" onClick={() => setAccountOpen(false)} />
                  <MenuItem to="/orders" icon={Receipt} label="Đơn hàng" onClick={() => setAccountOpen(false)} />
                  <MenuItem to="/wishlist" icon={Heart} label="Yêu thích" onClick={() => setAccountOpen(false)} />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-shop-red transition hover:bg-shop-softBlue"
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button to="/login" variant="primary" size="sm" aria-label="Đăng nhập"
              className="hidden sm:inline-flex">
              Đăng nhập
            </Button>
          )}

          <Button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="lg:hidden"
            variant="icon"
            aria-label="Menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-shop-border bg-shop-surface px-4 py-4 shadow-sm lg:hidden">
          <form onSubmit={handleSearch} className="mb-4 flex h-11 items-center rounded-xl border border-shop-border bg-shop-bg px-4">
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-shop-text outline-none placeholder:text-shop-muted"
            />
            <button type="submit" className="ml-2 text-shop-text" aria-label="Tìm kiếm">
              <Search className="h-4 w-4" />
            </button>
          </form>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-bold text-shop-text transition hover:bg-shop-softBlue hover:text-shop-red"
              >
                {item.label}
              </Link>
            ))}
            {!user && (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="mt-2 rounded-xl bg-shop-red px-3 py-2.5 text-center text-sm font-bold text-white transition hover:bg-shop-dark"
              >
                Đăng nhập
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

function MenuItem({ to, icon: Icon, label, onClick }) {
  return (
    <Link to={to} onClick={onClick} className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-shop-text transition hover:bg-shop-bg">
      <Icon className="h-4 w-4 text-shop-muted" />
      {label}
    </Link>
  )
}
