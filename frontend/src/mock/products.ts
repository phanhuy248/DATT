import macbookImage from '../assets/home/macbook-air.svg'
import phoneImage from '../assets/home/hero-phone-dark.svg'
import headphoneImage from '../assets/home/sony-headphones.svg'

export type ProductCategory = 'Laptop' | 'Điện thoại' | 'Phụ kiện' | string
export type ProductStatus = 'Còn hàng' | 'Sắp hết hàng' | 'Hết hàng' | 'Tạm dừng'

export type AdminProduct = {
  id: string | number
  name: string
  sku: string
  category: ProductCategory
  price: string
  stock: number
  capacity: number
  sold: number
  status: ProductStatus
  active: boolean
  image: string
  raw?: any
}

export const products: AdminProduct[] = [
  {
    id: 'prod-001',
    name: 'MacBook Pro M3 14-inch',
    sku: 'MBPM3-14-SG-256',
    category: 'Laptop',
    price: '39.990.000đ',
    stock: 45,
    capacity: 100,
    sold: 124,
    status: 'Còn hàng',
    active: true,
    image: macbookImage,
  },
  {
    id: 'prod-002',
    name: 'iPhone 15 Pro 128GB',
    sku: 'IP15P-128-TI-NAT',
    category: 'Điện thoại',
    price: '27.500.000đ',
    stock: 8,
    capacity: 50,
    sold: 52,
    status: 'Sắp hết hàng',
    active: true,
    image: phoneImage,
  },
  {
    id: 'prod-003',
    name: 'Sony WH-1000XM5',
    sku: 'SONY-XM5-BLK',
    category: 'Phụ kiện',
    price: '8.490.000đ',
    stock: 0,
    capacity: 30,
    sold: 210,
    status: 'Hết hàng',
    active: true,
    image: headphoneImage,
  },
]

export const productStats = [
  {
    id: 'total',
    label: 'Tổng sản phẩm',
    value: '1,248',
    tone: 'rose',
  },
  {
    id: 'active',
    label: 'Đang kinh doanh',
    value: '1,102',
    tone: 'green',
  },
  {
    id: 'low',
    label: 'Sắp hết hàng',
    value: '42',
    tone: 'amber',
  },
  {
    id: 'out',
    label: 'Đã hết hàng',
    value: '14',
    tone: 'red',
  },
] as const
