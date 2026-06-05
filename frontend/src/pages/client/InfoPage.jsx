import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Headphones, Send } from 'lucide-react'
import { toast } from 'react-toastify'
import { createContact } from '../../api/contacts'
import Button from '../../components/ui/Button'
import SectionHeader from '../../components/ui/SectionHeader'

const PAGES = {
  about: {
    title: 'Giới thiệu SMARTSHOP',
    body: [
      'SMARTSHOP là cửa hàng thiết bị công nghệ tập trung vào laptop, điện thoại và phụ kiện phục vụ học tập, làm việc và giải trí.',
      'Website giúp khách hàng tìm sản phẩm, xem thông số, đặt hàng trực tuyến và theo dõi trạng thái đơn hàng trong một hệ thống rõ ràng.',
    ],
  },
  promotions: {
    title: 'Khuyến mãi và ưu đãi',
    body: [
      'Chương trình khuyến mãi được cập nhật theo từng thời điểm. Mã giảm giá có thể nhập tại bước thanh toán nếu còn hiệu lực.',
      'Một số mã có điều kiện giá trị đơn hàng tối thiểu hoặc giới hạn lượt sử dụng.',
    ],
    action: { to: '/products', label: 'Xem sản phẩm' },
  },
  careers: {
    title: 'Tuyển dụng',
    body: [
      'SMARTSHOP chào đón các ứng viên yêu thích công nghệ, bán hàng và chăm sóc khách hàng.',
      'Vui lòng gửi thông tin ứng tuyển qua email support@smartshop.vn.',
    ],
  },
  contact: {
    title: 'Liên hệ SMARTSHOP',
    body: [
      'Địa chỉ: Hà Nội, Việt Nam.',
      'Hotline: 0911 430 000.',
      'Email hỗ trợ: support@smartshop.vn.',
      'Thời gian hỗ trợ: 7h-17h từ thứ 2 đến thứ 7.',
    ],
  },
  shipping: {
    title: 'Chính sách vận chuyển',
    body: [
      'SMARTSHOP hỗ trợ giao hàng toàn quốc. Thời gian giao hàng phụ thuộc vào khu vực nhận hàng và tình trạng xử lý đơn.',
      'Phí vận chuyển sẽ được thông báo tại bước thanh toán hoặc theo chương trình ưu đãi hiện hành.',
    ],
  },
  warranty: {
    title: 'Chính sách bảo hành',
    body: [
      'Sản phẩm được bảo hành theo chính sách của nhà sản xuất và điều kiện bảo hành của cửa hàng.',
      'Khách hàng cần giữ hóa đơn hoặc thông tin đơn hàng để được hỗ trợ nhanh nhất.',
    ],
  },
  returns: {
    title: 'Đổi trả và hoàn tiền',
    body: [
      'SMARTSHOP hỗ trợ đổi trả khi sản phẩm lỗi kỹ thuật, giao sai mẫu hoặc không đúng mô tả.',
      'Sản phẩm cần còn đầy đủ phụ kiện, hộp và không bị hư hỏng do người dùng.',
    ],
  },
  privacy: {
    title: 'Bảo mật thông tin',
    body: [
      'Thông tin cá nhân của khách hàng được sử dụng cho mục đích xử lý đơn hàng, hỗ trợ sau bán và cải thiện dịch vụ.',
      'SMARTSHOP không chia sẻ dữ liệu cá nhân cho bên thứ ba ngoài phạm vi cần thiết để vận hành đơn hàng.',
    ],
  },
  payment: {
    title: 'Hình thức thanh toán',
    body: [
      'Website hỗ trợ thanh toán khi nhận hàng, chuyển khoản ngân hàng bằng QR và thanh toán online qua VNPAY.',
      'Trạng thái thanh toán được lưu cùng đơn hàng để khách hàng và quản trị viên theo dõi.',
    ],
  },
  guide: {
    title: 'Hướng dẫn mua hàng',
    body: [
      'Chọn sản phẩm, thêm vào giỏ hàng, đăng nhập tài khoản và nhập thông tin giao hàng tại trang thanh toán.',
      'Sau khi đặt hàng, bạn có thể theo dõi trạng thái đơn trong mục lịch sử đơn hàng.',
    ],
    action: { to: '/products', label: 'Bắt đầu mua hàng' },
  },
  terms: {
    title: 'Điều khoản sử dụng',
    body: [
      'Khi sử dụng website, khách hàng đồng ý cung cấp thông tin chính xác khi đặt hàng và tuân thủ các quy định giao dịch của SMARTSHOP.',
      'SMARTSHOP có quyền cập nhật nội dung, giá bán và chính sách để phù hợp với hoạt động kinh doanh.',
    ],
  },
  sitemap: {
    title: 'Sitemap',
    body: ['Các khu vực chính của website SMARTSHOP.'],
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
  const [contactForm, setContactForm] = useState({ fullName: '', email: '', phone: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)

  const submitContact = async (event) => {
    event.preventDefault()
    if (!contactForm.fullName.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      toast.error('Vui lòng nhập họ tên, email và nội dung liên hệ')
      return
    }
    setSending(true)
    try {
      await createContact({ ...contactForm, subject: contactForm.subject || 'Liên hệ SMARTSHOP' })
      toast.success('Đã gửi liên hệ. SMARTSHOP sẽ phản hồi sớm.')
      setContactForm({ fullName: '', email: '', phone: '', subject: '', message: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi liên hệ')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-5 lg:px-6">
      <SectionHeader title={page.title} />

      <section className="rounded-2xl border border-shop-border bg-shop-surface p-5 shadow-sm lg:p-6">
        <div className="prose max-w-none text-sm font-medium leading-7 text-shop-text">
          {page.body.map((text, index) => (
            <p key={index}>{text}</p>
          ))}
          {page.links && (
            <div className="mt-4 flex flex-col gap-2">
              {page.links.map((link) => (
                <Link key={link.to} to={link.to} className="font-bold text-shop-red">
                  {link.label}
                </Link>
              ))}
            </div>
          )}
          {page.action && (
            <Button to={page.action.to} className="mt-4">
              {page.action.label}
            </Button>
          )}
        </div>
      </section>

      {slug === 'contact' && (
        <section className="mt-5 rounded-2xl border border-shop-border bg-shop-surface p-5 shadow-sm lg:p-6">
          <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-shop-text">
            <Headphones className="h-5 w-5 text-shop-red" />
            Gửi yêu cầu hỗ trợ
          </h2>
          <form onSubmit={submitContact} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <ContactField label="Họ tên" value={contactForm.fullName} onChange={(value) => setContactForm({ ...contactForm, fullName: value })} required />
              <ContactField label="Email" type="email" value={contactForm.email} onChange={(value) => setContactForm({ ...contactForm, email: value })} required />
              <ContactField label="Số điện thoại" value={contactForm.phone} onChange={(value) => setContactForm({ ...contactForm, phone: value })} />
              <ContactField label="Chủ đề" value={contactForm.subject} onChange={(value) => setContactForm({ ...contactForm, subject: value })} />
            </div>
            <ContactField label="Nội dung" textarea value={contactForm.message} onChange={(value) => setContactForm({ ...contactForm, message: value })} required />
            <Button type="submit" disabled={sending}>
              <Send className="h-4 w-4" />
              {sending ? 'Đang gửi...' : 'Gửi liên hệ'}
            </Button>
          </form>
        </section>
      )}
    </div>
  )
}

function ContactField({ label, value, onChange, type = 'text', textarea = false, required = false }) {
  return (
    <label className="block">
      <span className="form-label">
        {label}
        {required && ' *'}
      </span>
      {textarea ? (
        <textarea className="form-control" rows={5} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className="form-control" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  )
}
