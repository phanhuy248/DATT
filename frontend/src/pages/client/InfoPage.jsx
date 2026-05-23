import React, { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

const PAGES = {
  about: {
    title: 'Giới thiệu SmartShop',
    icon: 'fa-store',
    body: [
      'SmartShop là cửa hàng thiết bị công nghệ tập trung vào laptop, điện thoại và phụ kiện phục vụ học tập, làm việc và giải trí.',
      'Website được xây dựng để khách hàng dễ dàng tìm kiếm sản phẩm, xem thông số, đặt hàng trực tuyến và theo dõi trạng thái đơn hàng.',
    ],
  },
  promotions: {
    title: 'Khuyến mãi & Ưu đãi',
    icon: 'fa-tags',
    body: [
      'Các chương trình khuyến mãi được cập nhật theo từng thời điểm. Bạn có thể nhập mã giảm giá tại bước thanh toán nếu mã còn hiệu lực.',
      'Một số mã có điều kiện giá trị đơn hàng tối thiểu hoặc giới hạn lượt sử dụng.',
    ],
    action: { to: '/products', label: 'Xem sản phẩm' },
  },
  careers: {
    title: 'Tuyển dụng',
    icon: 'fa-briefcase',
    body: [
      'SmartShop luôn chào đón các ứng viên yêu thích công nghệ, bán hàng và chăm sóc khách hàng.',
      'Vui lòng gửi thông tin ứng tuyển qua email support@smartshop.vn.',
    ],
  },
  contact: {
    title: 'Liên hệ SmartShop',
    icon: 'fa-headset',
    body: [
      'Địa chỉ: Hà Nội, Việt Nam.',
      'Hotline: 0911 430 000.',
      'Email hỗ trợ: support@smartshop.vn.',
      'Thời gian hỗ trợ: 7h-17h từ thứ 2 đến thứ 7.',
    ],
  },
  shipping: {
    title: 'Chính sách vận chuyển',
    icon: 'fa-truck',
    body: [
      'SmartShop hỗ trợ giao hàng toàn quốc. Thời gian giao hàng phụ thuộc vào khu vực nhận hàng và tình trạng xử lý đơn.',
      'Phí vận chuyển sẽ được thông báo tại bước thanh toán hoặc theo chương trình ưu đãi hiện hành.',
    ],
  },
  warranty: {
    title: 'Chính sách bảo hành',
    icon: 'fa-shield-halved',
    body: [
      'Sản phẩm được bảo hành theo chính sách của nhà sản xuất và điều kiện bảo hành của cửa hàng.',
      'Khách hàng cần giữ hóa đơn hoặc thông tin đơn hàng để được hỗ trợ nhanh nhất.',
    ],
  },
  returns: {
    title: 'Đổi trả - hoàn tiền',
    icon: 'fa-rotate-left',
    body: [
      'SmartShop hỗ trợ đổi trả khi sản phẩm lỗi kỹ thuật, giao sai mẫu hoặc không đúng mô tả.',
      'Sản phẩm cần còn đầy đủ phụ kiện, hộp và không bị hư hỏng do người dùng.',
    ],
  },
  privacy: {
    title: 'Bảo mật thông tin',
    icon: 'fa-lock',
    body: [
      'Thông tin cá nhân của khách hàng được sử dụng cho mục đích xử lý đơn hàng, hỗ trợ sau bán và cải thiện dịch vụ.',
      'SmartShop không chia sẻ dữ liệu cá nhân cho bên thứ ba ngoài phạm vi cần thiết để vận hành đơn hàng.',
    ],
  },
  payment: {
    title: 'Hình thức thanh toán',
    icon: 'fa-credit-card',
    body: [
      'Website hỗ trợ thanh toán khi nhận hàng, chuyển khoản ngân hàng và ví điện tử ở mức mô phỏng cơ bản.',
      'Trạng thái thanh toán được lưu cùng đơn hàng để quản trị viên theo dõi và xử lý.',
    ],
  },
  guide: {
    title: 'Hướng dẫn mua hàng',
    icon: 'fa-cart-shopping',
    body: [
      'Chọn sản phẩm, thêm vào giỏ hàng, đăng nhập tài khoản và nhập thông tin giao hàng tại trang thanh toán.',
      'Sau khi đặt hàng, bạn có thể theo dõi trạng thái đơn trong mục lịch sử đơn hàng.',
    ],
    action: { to: '/products', label: 'Bắt đầu mua hàng' },
  },
  terms: {
    title: 'Điều khoản sử dụng',
    icon: 'fa-file-contract',
    body: [
      'Khi sử dụng website, khách hàng đồng ý cung cấp thông tin chính xác khi đặt hàng và tuân thủ các quy định giao dịch của SmartShop.',
      'SmartShop có quyền cập nhật nội dung, giá bán và chính sách để phù hợp với hoạt động kinh doanh.',
    ],
  },
  sitemap: {
    title: 'Sitemap',
    icon: 'fa-sitemap',
    body: ['Các khu vực chính của website SmartShop.'],
    links: [
      { to: '/', label: 'Trang chủ' },
      { to: '/products', label: 'Sản phẩm' },
      { to: '/news', label: 'Tin tức' },
      { to: '/cart', label: 'Giỏ hàng' },
      { to: '/orders', label: 'Lịch sử đơn hàng' },
    ],
  },
}

export default function InfoPage() {
  const { slug } = useParams()
  const page = useMemo(() => PAGES[slug] || PAGES.about, [slug])

  return (
    <div className="container" style={{ paddingTop: 36, paddingBottom: 56, maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        <div style={{ width: 48, height: 48, borderRadius: 8, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`fa-solid ${page.icon}`} style={{ color: '#cc0000', fontSize: 22 }} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>{page.title}</h1>
      </div>

      <div className="card">
        <div className="card-body" style={{ fontSize: 15, lineHeight: 1.8, color: '#374151' }}>
          {page.body.map((text, index) => <p key={index}>{text}</p>)}
          {page.links && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {page.links.map(link => <Link key={link.to} to={link.to} style={{ color: '#2563eb', fontWeight: 600 }}>{link.label}</Link>)}
            </div>
          )}
          {page.action && <Link className="btn btn-primary" to={page.action.to} style={{ marginTop: 10 }}>{page.action.label}</Link>}
        </div>
      </div>
    </div>
  )
}
