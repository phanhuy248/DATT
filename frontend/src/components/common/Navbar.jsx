import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { getImageUrl } from '../../utils/image'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const { cart } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [showMenu, setShowMenu] = useState(false)
  const [keyword, setKeyword] = useState('')

  const handleLogout = () => { signOut(); navigate('/login'); setShowMenu(false) }
  const handleSearch = (e) => {
    e.preventDefault()
    if (keyword.trim()) navigate(`/products?keyword=${encodeURIComponent(keyword.trim())}`)
  }

  const NAV_ITEMS = [
    { to: '/', label: 'TRANG CHỦ' },
    { to: '/products', label: 'SẢN PHẨM' },
    { to: '/products?sortBy=bestseller', label: 'BÁN CHẠY' },
    { to: '/products?sortBy=newest', label: 'HÀNG MỚI' },
    { to: '/news', label: 'TIN TỨC' },
    { to: '/orders', label: 'ĐƠN HÀNG' },
  ]

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/'
    return location.pathname.startsWith(to.split('?')[0]) && to !== '/'
  }

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Tier 1: Top info bar */}
      <div style={{ background: '#333', color: '#ccc', fontSize: 12, padding: '5px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link to="/" style={{ color: '#bbb', textDecoration: 'none' }}>Trang chủ</Link>
            <span style={{ color: '#555' }}>›</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>SMARTSHOP</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="fa-solid fa-phone" style={{ color: '#cc0000', fontSize: 11 }} />
            <span>Hotline:</span>
            <span style={{ color: '#fff', fontWeight: 700 }}>0911 430 090</span>
          </div>
        </div>
      </div>

      {/* Tier 2: Logo + Search + Cart/Auth */}
      <div style={{ background: '#fff', padding: '12px 0', borderBottom: '3px solid #cc0000' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 190, textDecoration: 'none' }}>
            <div style={{ width: 38, height: 38, background: '#cc0000', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(204,0,0,0.4)' }}>
              <i className="fa-solid fa-bolt" style={{ color: '#ffe066', fontSize: 18 }} />
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: 20, color: '#111', letterSpacing: 1, display: 'block', lineHeight: 1 }}>SMARTSHOP</span>
              <span style={{ fontSize: 10, color: '#cc0000', fontWeight: 600, letterSpacing: 1 }}>ĐIỆN TỬ CHÍNH HÃNG</span>
            </div>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', maxWidth: 560 }}>
            <input
              type="text" value={keyword} onChange={e => setKeyword(e.target.value)}
              placeholder="Tìm kiếm laptop, điện thoại, phụ kiện..."
              style={{ flex: 1, padding: '10px 18px', border: '2px solid #cc0000', borderRight: 'none', borderRadius: '6px 0 0 6px', fontSize: 14, outline: 'none', color: '#333' }}
            />
            <button type="submit" style={{ padding: '10px 18px', background: '#cc0000', color: '#fff', border: 'none', borderRadius: '0 6px 6px 0', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              <i className="fa-solid fa-magnifying-glass" style={{ marginRight: 6 }} />
              TÌM KIẾM
            </button>
          </form>

          {/* Hotline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 8 }}>
            <div style={{ width: 36, height: 36, background: '#cc0000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-phone" style={{ color: '#fff', fontSize: 14 }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#999', lineHeight: 1 }}>Hotline tư vấn</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#cc0000', lineHeight: 1.4 }}>0911 430 000</div>
            </div>
          </div>

          {/* Cart + Auth */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/cart" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#333', textDecoration: 'none' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 40, height: 40, background: '#fff5f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fecaca' }}>
                  <i className="fa-solid fa-cart-shopping" style={{ fontSize: 18, color: '#cc0000' }} />
                </div>
                {cart.totalItems > 0 && (
                  <span style={{ position: 'absolute', top: -4, right: -4, background: '#cc0000', color: '#fff', fontSize: 10, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {cart.totalItems}
                  </span>
                )}
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#999', lineHeight: 1 }}>GIỎ HÀNG</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#cc0000', lineHeight: 1.4 }}>
                  {(cart.totalPrice || 0).toLocaleString('vi-VN')}₫
                </div>
              </div>
            </Link>

            {user ? (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowMenu(!showMenu)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#333' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid #cc0000' }}>
                    {user.avatar
                      ? <img src={getImageUrl(user.avatar)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <i className="fa-solid fa-user" style={{ color: '#2563eb', fontSize: 13 }} />}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 11, color: '#999', lineHeight: 1 }}>Xin chào</div>
                    <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.fullName?.split(' ').pop()}
                    </div>
                  </div>
                  <i className="fa-solid fa-angle-down" style={{ fontSize: 10, color: '#888' }} />
                </button>
                {showMenu && (
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#fff', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', minWidth: 220, padding: 8, zIndex: 300, border: '1px solid #f0f0f0' }}>
                    <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid #e2e8f0', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {user.avatar
                            ? <img src={getImageUrl(user.avatar)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <i className="fa-solid fa-user" style={{ color: '#2563eb', fontSize: 18 }} />}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.fullName}</p>
                          <p style={{ margin: 0, fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                        </div>
                      </div>
                    </div>
                    {user.role === 'ADMIN' && <MenuItem to="/admin/dashboard" icon="fa-gauge" label="Admin Panel" onClick={() => setShowMenu(false)} />}
                    <MenuItem to="/account" icon="fa-user" label="Tài khoản" onClick={() => setShowMenu(false)} />
                    <MenuItem to="/orders" icon="fa-receipt" label="Đơn hàng" onClick={() => setShowMenu(false)} />
                    <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '4px 0' }} />
                    <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, borderRadius: 6 }}>
                      <i className="fa-solid fa-arrow-right-from-bracket" />Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to="/login" style={{ padding: '8px 16px', border: '2px solid #cc0000', borderRadius: 6, fontSize: 13, color: '#cc0000', textDecoration: 'none', fontWeight: 600 }}>Đăng nhập</Link>
                <Link to="/register" style={{ padding: '8px 16px', background: '#cc0000', color: '#fff', borderRadius: 6, fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>Đăng ký</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tier 3: Nav menu */}
      <div style={{ background: '#2d2d2d' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <nav style={{ display: 'flex' }}>
            {NAV_ITEMS.map(item => {
              const active = isActive(item.to)
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  style={{
                    color: active ? '#fff' : '#ccc',
                    fontSize: 13, fontWeight: active ? 700 : 600,
                    padding: '10px 16px', display: 'block',
                    letterSpacing: 0.5, textDecoration: 'none',
                    borderBottom: active ? '3px solid #cc0000' : '3px solid transparent',
                    transition: 'all 0.15s',
                    background: active ? 'rgba(204,0,0,0.15)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#ccc'; e.currentTarget.style.background = 'transparent' } }}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 12, color: '#bbb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fa-solid fa-shield-halved" style={{ color: '#4ade80' }} />
              <span>Bảo hành chính hãng</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fa-solid fa-rotate-left" style={{ color: '#60a5fa' }} />
              <span>Đổi trả 30 ngày</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fa-solid fa-clock" style={{ color: '#fbbf24' }} />
              <span style={{ color: '#fff', fontWeight: 700 }}>7h-17h T2-T7</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function MenuItem({ to, icon, label, onClick }) {
  return (
    <Link to={to} onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', color: '#374151', fontSize: 14, borderRadius: 6, textDecoration: 'none' }}>
      <i className={`fa-solid ${icon}`} style={{ color: '#6b7280', width: 16 }} />
      {label}
    </Link>
  )
}
