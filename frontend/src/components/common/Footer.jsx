import { useState } from 'react'
import { Link } from 'react-router-dom'

const aboutLinks = [
  { label: 'Giới thiệu SmartShop', to: '/info/about' },
  { label: 'Khuyến mãi & Ưu đãi', to: '/info/promotions' },
  { label: 'Tin tức công nghệ', to: '/news' },
  { label: 'Tuyển dụng', to: '/info/careers' },
  { label: 'Liên hệ chúng tôi', to: '/info/contact' },
]

const categoryLinks = [
  { label: 'Laptop Gaming', to: '/products?keyword=gaming' },
  { label: 'Laptop Văn phòng', to: '/products?keyword=văn phòng' },
  { label: 'Điện thoại cao cấp', to: '/products?keyword=điện thoại' },
  { label: 'Phụ kiện gaming', to: '/products?keyword=phụ kiện gaming' },
  { label: 'Màn hình máy tính', to: '/products?keyword=màn hình' },
  { label: 'Bàn phím cơ', to: '/products?keyword=bàn phím' },
]

const policyLinks = [
  { label: 'Chính sách vận chuyển', to: '/info/shipping' },
  { label: 'Chính sách bảo hành', to: '/info/warranty' },
  { label: 'Đổi trả - hoàn tiền', to: '/info/returns' },
  { label: 'Bảo mật thông tin', to: '/info/privacy' },
  { label: 'Hình thức thanh toán', to: '/info/payment' },
  { label: 'Hướng dẫn mua hàng', to: '/info/guide' },
]

const socialLinks = [
  { icon: 'fa-brands fa-facebook', color: '#1877f2', label: 'Facebook', href: 'https://facebook.com' },
  { icon: 'fa-brands fa-youtube', color: '#ff0000', label: 'YouTube', href: 'https://youtube.com' },
  { icon: 'fa-brands fa-tiktok', color: '#fff', label: 'TikTok', href: 'https://tiktok.com', bg: '#010101' },
  { icon: 'fa-brands fa-instagram', color: '#e1306c', label: 'Instagram', href: 'https://instagram.com' },
]

const paymentMethods = [
  { icon: 'fa-solid fa-money-bill-wave', color: '#16a34a', label: 'Tiền mặt' },
  { icon: 'fa-solid fa-credit-card', color: '#2563eb', label: 'Thẻ ngân hàng' },
  { icon: 'fa-brands fa-paypal', color: '#003087', label: 'PayPal' },
  { icon: 'fa-solid fa-qrcode', color: '#7c3aed', label: 'QR Code' },
  { icon: 'fa-solid fa-mobile-screen', color: '#0891b2', label: 'Ví điện tử' },
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleSubscribe = (event) => {
    event.preventDefault()
    const value = email.trim()
    if (!value) {
      setMessage('Vui lòng nhập email.')
      return
    }
    setMessage('Đã ghi nhận email nhận khuyến mãi.')
    setEmail('')
  }

  return (
    <footer style={{ background: '#1a1a1a', color: '#aaa', marginTop: 0 }}>
      <div style={{ background: '#cc0000', padding: '16px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <i className="fa-solid fa-envelope-open-text" style={{ color: '#ffe066', fontSize: 24 }} />
            <div>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: 0 }}>Đăng ký nhận thông tin khuyến mãi</p>
              <p style={{ color: '#ffd4d4', fontSize: 12, margin: 0 }}>Nhận ưu đãi độc quyền, tin tức sản phẩm mới nhất</p>
              {message && <p style={{ color: '#fff', fontSize: 12, margin: '4px 0 0' }}>{message}</p>}
            </div>
          </div>
          <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: 0, flex: '0 1 450px', minWidth: 280 }}>
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="Nhập email của bạn..."
              style={{ flex: 1, padding: '10px 16px', border: 'none', borderRadius: '6px 0 0 6px', fontSize: 13, outline: 'none', color: '#333', minWidth: 0 }}
            />
            <button type="submit" style={{ padding: '10px 20px', background: '#111', color: '#fff', border: 'none', borderRadius: '0 6px 6px 0', cursor: 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
              ĐĂNG KÝ
            </button>
          </form>
        </div>
      </div>

      <div style={{ padding: '36px 0', borderBottom: '1px solid #2d2d2d' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 36 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 34, height: 34, background: '#cc0000', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-solid fa-bolt" style={{ color: '#ffe066', fontSize: 16 }} />
              </div>
              <span style={{ fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: 1 }}>SMARTSHOP</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <p style={{ margin: 0, color: '#aaa' }}>Công Ty TNHH Phần Mềm SmartShop Việt Nam</p>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <i className="fa-solid fa-location-dot" style={{ color: '#cc0000', fontSize: 12, marginTop: 2, flexShrink: 0 }} />
                <p style={{ margin: 0, color: '#aaa' }}>Hà Nội, Việt Nam</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-envelope" style={{ color: '#cc0000', fontSize: 12, flexShrink: 0 }} />
                <a href="mailto:support@smartshop.vn" style={{ color: '#cc0000', textDecoration: 'none' }}>support@smartshop.vn</a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-phone" style={{ color: '#cc0000', fontSize: 12, flexShrink: 0 }} />
                <a href="tel:0911430000" style={{ color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>0911 430 000</a>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: '#555' }}>Hỗ trợ: 7h-17h từ T2 đến T7</p>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              {socialLinks.map(s => (
                <a key={s.label} href={s.href} title={s.label} target="_blank" rel="noreferrer"
                  style={{ width: 36, height: 36, borderRadius: '50%', background: s.bg || s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s, opacity 0.2s', opacity: 0.9 }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.opacity = '1' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.opacity = '0.9' }}>
                  <i className={s.icon} style={{ color: s.bg ? s.color : '#fff', fontSize: 16 }} />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="VỀ CHÚNG TÔI" links={aboutLinks} />
          <FooterColumn title="DANH MỤC SẢN PHẨM" links={categoryLinks} />
          <FooterColumn title="CHÍNH SÁCH QUY ĐỊNH" links={policyLinks} />
        </div>
      </div>

      <div style={{ padding: '14px 0', borderBottom: '1px solid #2d2d2d' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>PHƯƠNG THỨC THANH TOÁN:</span>
          {paymentMethods.map(p => (
            <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#2a2a2a', border: '1px solid #333', borderRadius: 5, padding: '5px 10px' }}>
              <i className={p.icon} style={{ color: p.color, fontSize: 14 }} />
              <span style={{ fontSize: 11, color: '#888' }}>{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 0', background: '#111' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ color: '#555' }}>© 2025 SmartShop. All rights reserved. Designed in Vietnam.</span>
          <div style={{ display: 'flex', gap: 20, color: '#555', flexWrap: 'wrap' }}>
            <BottomLink to="/info/terms">Điều khoản sử dụng</BottomLink>
            <BottomLink to="/info/privacy">Chính sách bảo mật</BottomLink>
            <BottomLink to="/info/sitemap">Sitemap</BottomLink>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h4 style={headingStyle}>{title}</h4>
      <ul style={listStyle}>
        {links.map(item => (
          <li key={item.to}>
            <Link to={item.to} style={linkStyle}
              onMouseEnter={e => { e.currentTarget.style.color = '#cc0000'; e.currentTarget.style.paddingLeft = '4px' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#aaa'; e.currentTarget.style.paddingLeft = '0' }}>
              <i className="fa-solid fa-angle-right" style={{ fontSize: 9, color: '#555' }} />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function BottomLink({ to, children }) {
  return (
    <Link to={to} style={{ color: '#555', textDecoration: 'none' }}
      onMouseEnter={e => e.currentTarget.style.color = '#cc0000'}
      onMouseLeave={e => e.currentTarget.style.color = '#555'}>
      {children}
    </Link>
  )
}

const headingStyle = {
  color: '#fff', fontSize: 13, fontWeight: 700, marginBottom: 16,
  paddingBottom: 8, borderBottom: '2px solid #cc0000',
  display: 'inline-block', letterSpacing: 0.5,
}

const listStyle = {
  listStyle: 'none', padding: 0, margin: 0,
  display: 'flex', flexDirection: 'column', gap: 7,
}

const linkStyle = {
  color: '#aaa', fontSize: 13, textDecoration: 'none',
  display: 'flex', alignItems: 'center', gap: 7,
  transition: 'all 0.15s',
}
