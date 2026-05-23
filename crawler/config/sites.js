export const SITES = [
  {
    key: 'cellphones',
    supplier: 'CellphoneS',
    categories: [
      { category: 'Laptop', url: 'https://cellphones.com.vn/laptop.html' },
      { category: 'Điện thoại', url: 'https://cellphones.com.vn/mobile.html' },
      { category: 'Phụ kiện', url: 'https://cellphones.com.vn/phu-kien.html' },
    ],
    productPatterns: [/\.html(?:$|\?)/],
    excludePatterns: [/\/laptop\.html/, /\/mobile\.html/, /\/phu-kien\.html/, /\/catalogsearch\//],
  },
  {
    key: 'gearvn',
    supplier: 'GearVN',
    categories: [
      { category: 'Laptop', url: 'https://gearvn.com/collections/laptop' },
      { category: 'Điện thoại', url: 'https://gearvn.com/collections/dien-thoai' },
      { category: 'Phụ kiện', url: 'https://gearvn.com/collections/phu-kien' },
    ],
    productPatterns: [/\/products\//],
    excludePatterns: [/\/collections\//, /\/blogs\//],
  },
  {
    key: 'tgdd',
    supplier: 'The Gioi Di Dong',
    categories: [
      { category: 'Laptop', url: 'https://www.thegioididong.com/laptop' },
      { category: 'Điện thoại', url: 'https://www.thegioididong.com/dtdd' },
      { category: 'Phụ kiện', url: 'https://www.thegioididong.com/phu-kien' },
    ],
    productPatterns: [/\/laptop\//, /\/dtdd\//, /\/phu-kien\//],
    excludePatterns: [/\/hoi-dap\//, /\/tin-tuc\//, /\/game-app\//],
  },
  {
    key: 'phongvu',
    supplier: 'Phong Vu',
    categories: [
      { category: 'Laptop', url: 'https://phongvu.vn/c/laptop' },
      { category: 'Điện thoại', url: 'https://phongvu.vn/c/iphone' },
      { category: 'Phụ kiện', url: 'https://phongvu.vn/c/phu-kien-dien-thoai' },
    ],
    productPatterns: [/\/p\//, /-s\d+(?:$|\?)/, /\.html(?:$|\?)/],
    excludePatterns: [/\/c\//, /\/tin-tuc\//],
  },
]
