import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useCart } from '../../context/CartContext'

export default function VnpayReturnPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { fetchCart } = useCart()

  const orderId = searchParams.get('orderId')
  const success = searchParams.get('success') === 'true'
  const responseCode = searchParams.get('responseCode')

  useEffect(() => {
    if (!orderId) {
      navigate('/orders', { replace: true })
      return
    }

    if (success) {
      fetchCart()
      navigate(`/order-success/${orderId}`, { replace: true })
      return
    }

    if (responseCode === '24') {
      toast.info('Bạn đã hủy thanh toán VNPAY. Bạn có thể thử lại hoặc chọn phương thức khác.', { autoClose: 5000 })
    } else {
      toast.error('Thanh toán không thành công. Vui lòng thử lại.', { autoClose: 5000 })
    }
    navigate(`/orders/${orderId}/payment`, { replace: true })
  }, [success, orderId, responseCode, navigate, fetchCart])

  return null
}
