# Báo cáo QA — SmartShop

> Ngày kiểm tra: 2026-06-15
> Phạm vi: 32 trang, 52 component, 20 controller (52 agent, 802 tool calls)

---

## THỐNG KÊ TỔNG QUAN

| Chỉ số | Số lượng |
|---|---|
| Tổng phần tử tương tác được quét | **601** |
| ✅ Hoạt động | **433** (72.0%) |
| ⚠️ Lỗi | **148** (24.6%) |
| ❌ Bù nhìn | **20** (3.3%) |
| 🔌 Chưa nối backend | **0** |
| Backend: endpoint bị lỗi | **9** |
| Backend: endpoint thiếu | **1** |

**Tỷ lệ cần sửa: 27.8%** — 168/601 phần tử có vấn đề.

---

## PHẦN 1: TRANG CLIENT

### HomePage (`frontend/src/pages/client/HomePage.jsx`)

| Chức năng | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| hero-prev-button | ~45 | ⚠️ LỖI | Không reset autoplay timer khi click thủ công | MEDIUM |
| hero-next-button | ~48 | ⚠️ LỖI | Không reset autoplay timer khi click thủ công | MEDIUM |
| hero-dot-indicator | ~62 | ⚠️ LỖI | Autoplay ping-pong vs modulo không nhất quán | HIGH |
| hero-banner-link | ~55 | ✅ HOẠT ĐỘNG | — | LOW |
| category-laptop-link | ~22 | ⚠️ LỖI | Dùng `<a>` native gây reload toàn trang thay vì `<Link>` | HIGH |
| category-phone-link | ~24 | ⚠️ LỖI | Dùng `<a>` native gây reload toàn trang | HIGH |
| category-tablet-link | ~26 | ⚠️ LỖI | Dùng `<a>` native gây reload toàn trang | HIGH |
| category-accessory-link | ~28 | ⚠️ LỖI | Dùng `<a>` native gây reload toàn trang | HIGH |
| sidebar-category-laptop | ~42 | ✅ HOẠT ĐỘNG | — | LOW |
| sidebar-category-phone | ~45 | ✅ HOẠT ĐỘNG | — | LOW |
| sidebar-category-tablet | ~48 | ✅ HOẠT ĐỘNG | — | LOW |
| sidebar-category-amthanh | ~51 | ⚠️ LỖI | Dùng `?keyword=` thay vì `?categoryName=`, lọc sai kết quả | HIGH |
| sidebar-category-accessory | ~54 | ✅ HOẠT ĐỘNG | — | LOW |
| sidebar-price-filter | ~68 | ✅ HOẠT ĐỘNG | — | LOW |
| sidebar-apply-filter | ~72 | ✅ HOẠT ĐỘNG | — | LOW |
| sidebar-sort-select | ~80 | ✅ HOẠT ĐỘNG | — | LOW |
| flashsale-view-all-link | ~88 | ⚠️ LỖI | Dùng `<a>` native thay vì Link (reload trang) | MEDIUM |
| flashsale-product-link | ~72 | ✅ HOẠT ĐỘNG | — | LOW |
| fake-sale-percent | ~35 | ⚠️ LỖI | `resolveDefaultSalePercent()` hiển thị % giảm giá giả khi không có flashsale | HIGH |

### ProductsPage (`frontend/src/pages/client/ProductsPage.jsx`)

| Chức năng | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| search-input | ~35 | ✅ HOẠT ĐỘNG | — | LOW |
| search-submit | ~38 | ✅ HOẠT ĐỘNG | — | LOW |
| filter-category | ~55 | ✅ HOẠT ĐỘNG | — | LOW |
| filter-price-range | ~70 | ✅ HOẠT ĐỘNG | — | LOW |
| sort-select | ~85 | ✅ HOẠT ĐỘNG | — | LOW |
| pagination-prev | ~120 | ✅ HOẠT ĐỘNG | — | LOW |
| pagination-next | ~123 | ✅ HOẠT ĐỘNG | — | LOW |
| pagination-page-number | ~126 | ✅ HOẠT ĐỘNG | — | LOW |
| add-to-cart-button | ~84 | ⚠️ LỖI | `canAddToCart=false` điều hướng đến `/products` thay vì `/products/{id}` | HIGH |
| product-card-link | ~60 | ✅ HOẠT ĐỘNG | — | LOW |
| fake-discount-badge | ~123 | ⚠️ LỖI | `resolveDefaultSalePercent()` tạo % giảm giá giả, đánh lừa người dùng | HIGH |
| hardcoded-rating | ~135 | ⚠️ LỖI | Luôn hiển thị "4.8" cứng, không lấy từ backend | MEDIUM |

### CheckoutPage (`frontend/src/pages/client/CheckoutPage.jsx`)

| Chức năng | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| address-form-submit | ~55 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| payment-method-select | ~70 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| coupon-apply-button | ~85 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| place-order-button | ~110 | ⚠️ LỖI | Thiếu idempotency → đặt hàng 2 lần nếu double-submit | HIGH |
| cart-item-quantity-decrease | ~130 | ✅ HOẠT ĐỘNG | — | LOW |
| cart-item-quantity-increase | ~133 | ✅ HOẠT ĐỘNG | — | LOW |
| cart-item-remove | ~138 | ✅ HOẠT ĐỘNG | — | MEDIUM |

### BankTransferPaymentPage (`frontend/src/pages/client/BankTransferPaymentPage.jsx`)

| Chức năng | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| copy-account-number | ~35 | ✅ HOẠT ĐỘNG | — | LOW |
| copy-transfer-content | ~40 | ✅ HOẠT ĐỘNG | — | LOW |
| polling-status-check | ~60 | ⚠️ LỖI | Sau PAID không gọi `fetchCart()` → giỏ hàng vẫn hiện đầy | HIGH |
| cancel-order-button | ~80 | ✅ HOẠT ĐỘNG | — | MEDIUM |

### VnpayReturnPage (`frontend/src/pages/client/VnpayReturnPage.jsx`)

| Chức năng | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| verify-payment-result | ~25 | ⚠️ LỖI | **Bỏ qua `validSignature`** — lỗ hổng bảo mật thanh toán | HIGH |
| back-to-home-button | ~55 | ✅ HOẠT ĐỘNG | — | LOW |
| view-order-button | ~58 | ✅ HOẠT ĐỘNG | — | LOW |

### AccountPage (`frontend/src/pages/client/AccountPage.jsx`)

| Chức năng | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| update-profile-form | ~45 | ⚠️ LỖI | `toast.success()` gọi sau `navigate('/')` → component đã unmount, toast không hiển thị | MEDIUM |
| change-password-form | ~80 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| upload-avatar | ~60 | ✅ HOẠT ĐỘNG | — | LOW |

### OrderHistoryPage (`frontend/src/pages/client/OrderHistoryPage.jsx`)

| Chức năng | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| filter-status-tabs | ~35 | ✅ HOẠT ĐỘNG | — | LOW |
| order-detail-link | ~55 | ✅ HOẠT ĐỘNG | — | LOW |
| cancel-order-button | ~55 | ⚠️ LỖI | Không disabled khi đang hủy → double-submit | HIGH |
| continue-pay-button | ~68 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| review-button | ~82 | ✅ HOẠT ĐỘNG | — | LOW |
| reorder-button | ~90 | ✅ HOẠT ĐỘNG | — | LOW |
| pagination | ~110 | ✅ HOẠT ĐỘNG | — | LOW |

### InfoPage (`frontend/src/pages/client/InfoPage.jsx`)

| Chức năng | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| contact-form-submit | ~45 | ✅ HOẠT ĐỘNG | — | LOW |
| contact-name-input | ~30 | ✅ HOẠT ĐỘNG | — | LOW |
| contact-email-input | ~33 | ✅ HOẠT ĐỘNG | — | LOW |
| contact-message-input | ~36 | ✅ HOẠT ĐỘNG | — | LOW |

### OrderSuccessPage (`frontend/src/pages/client/OrderSuccessPage.jsx`)

| Chức năng | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| view-order-detail-link | ~25 | ✅ HOẠT ĐỘNG | — | LOW |
| continue-shopping-link | ~28 | ✅ HOẠT ĐỘNG | — | LOW |

---

## PHẦN 2: TRANG ADMIN

### DashboardPage (`frontend/src/pages/admin/DashboardPage.jsx`)

| Chức năng | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| date-range-filter | ~40 | ✅ HOẠT ĐỘNG | — | LOW |
| export-report-button | ~55 | ❌ BÙ NHÌN | onClick rỗng, không có logic export | HIGH |
| chart-period-toggle | ~70 | ✅ HOẠT ĐỘNG | — | LOW |
| recent-orders-link | ~90 | ✅ HOẠT ĐỘNG | — | LOW |

### ProductsPage Admin (`frontend/src/pages/admin/ProductsPage.jsx`)

| Chức năng | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| add-product-button | ~35 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| edit-product-button | ~60 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| delete-product-button | ~65 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| search-product-input | ~80 | ✅ HOẠT ĐỘNG | — | LOW |
| filter-category-select | ~85 | ✅ HOẠT ĐỘNG | — | LOW |
| import-excel-button | ~100 | ⚠️ LỖI | Vòng lặp tuần tự (`for...of await`), đếm sai, không reload bảng sau import | HIGH |
| export-excel-button | ~105 | ❌ BÙ NHÌN | Không có handler, không gọi API | HIGH |
| pagination | ~130 | ✅ HOẠT ĐỘNG | — | LOW |
| bulk-delete-checkbox | ~45 | ❌ BÙ NHÌN | Checkbox hiển thị nhưng không có logic xử lý | MEDIUM |

### OrdersPage (`frontend/src/pages/admin/OrdersPage.jsx`)

| Chức năng | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| filter-status-select | ~35 | ✅ HOẠT ĐỘNG | — | LOW |
| filter-date-range | ~40 | ✅ HOẠT ĐỘNG | — | LOW |
| update-order-status | ~60 | ✅ HOẠT ĐỘNG | — | HIGH |
| view-order-detail | ~65 | ✅ HOẠT ĐỘNG | — | LOW |
| search-order-input | ~80 | ✅ HOẠT ĐỘNG | — | LOW |
| pagination | ~110 | ✅ HOẠT ĐỘNG | — | LOW |
| export-orders-button | ~45 | ❌ BÙ NHÌN | Không có handler | MEDIUM |

### UsersPage (`frontend/src/pages/admin/UsersPage.jsx`)

| Chức năng | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| search-user-input | ~35 | ✅ HOẠT ĐỘNG | — | LOW |
| add-user-button | ~45 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| edit-user-button | ~60 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| delete-user-button | ~65 | ⚠️ LỖI | Soft-delete nhưng `getAllUsers` backend vẫn trả về user inactive | HIGH |
| toggle-user-active | ~70 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| pagination | ~100 | ✅ HOẠT ĐỘNG | — | LOW |

### CategoriesPage (`frontend/src/pages/admin/CategoriesPage.jsx`)

| Chức năng | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| add-category-button | ~35 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| edit-category-button | ~55 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| delete-category-button | ~60 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| category-image-upload | ~40 | ✅ HOẠT ĐỘNG | — | LOW |
| search-category-input | ~70 | ✅ HOẠT ĐỘNG | — | LOW |

### CouponsPage (`frontend/src/pages/admin/CouponsPage.jsx`)

| Chức năng | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| add-coupon-button | ~35 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| edit-coupon-button | ~55 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| delete-coupon-button | ~60 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| toggle-coupon-active | ~65 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| search-coupon-input | ~75 | ✅ HOẠT ĐỘNG | — | LOW |
| pagination | ~100 | ✅ HOẠT ĐỘNG | — | LOW |

### BannersPage (`frontend/src/pages/admin/BannersPage.jsx`)

| Chức năng | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| add-banner-button | ~35 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| edit-banner-button | ~55 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| delete-banner-button | ~60 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| banner-image-upload | ~40 | ✅ HOẠT ĐỘNG | — | LOW |
| toggle-banner-active | ~65 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| drag-reorder-banner | ~70 | ❌ BÙ NHÌN | Drag handle hiển thị nhưng không có drag logic | MEDIUM |

### PostsPage (`frontend/src/pages/admin/PostsPage.jsx`)

| Chức năng | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| add-post-button | ~35 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| edit-post-button | ~55 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| delete-post-button | ~60 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| publish-toggle | ~65 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| search-post-input | ~75 | ✅ HOẠT ĐỘNG | — | LOW |
| slug-check | ~85 | ⚠️ LỖI | Backend dùng full table scan thay vì query theo slug trực tiếp | MEDIUM |
| pagination | ~100 | ✅ HOẠT ĐỘNG | — | LOW |

### SuppliersPage (`frontend/src/pages/admin/SuppliersPage.jsx`)

| Chức năng | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| add-supplier-button | ~35 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| edit-supplier-button | ~55 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| delete-supplier-button | ~60 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| search-supplier-input | ~70 | ✅ HOẠT ĐỘNG | — | LOW |
| pagination | ~95 | ✅ HOẠT ĐỘNG | — | LOW |

### ContactsPage (`frontend/src/pages/admin/ContactsPage.jsx`)

| Chức năng | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| view-contact-button | ~45 | ✅ HOẠT ĐỘNG | — | LOW |
| mark-resolved-button | ~55 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| delete-contact-button | ~60 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| filter-status-select | ~35 | ✅ HOẠT ĐỘNG | — | LOW |
| pagination | ~90 | ✅ HOẠT ĐỘNG | — | LOW |
| reply-contact-button | ~65 | ❌ BÙ NHÌN | Button hiển thị nhưng không có modal/form reply | HIGH |

### AdminLoginPage (`frontend/src/pages/auth/AdminLoginPage.jsx`)

| Chức năng | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| login-form-submit | ~35 | ✅ HOẠT ĐỘNG | — | HIGH |
| username-input | ~25 | ✅ HOẠT ĐỘNG | — | HIGH |
| password-input | ~28 | ✅ HOẠT ĐỘNG | — | HIGH |
| show-password-toggle | ~30 | ✅ HOẠT ĐỘNG | — | LOW |
| google-login-button | ~55 | ⚠️ LỖI | OAuth2 callback backend luôn redirect về lỗi | HIGH |

---

## PHẦN 3: COMPONENTS DÙNG CHUNG

### Navbar (`frontend/src/components/common/Navbar.jsx`)

| Chức năng | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| navbar-logo-link | ~32 | ✅ HOẠT ĐỘNG | — | LOW |
| navbar-search-input | ~45 | ✅ HOẠT ĐỘNG | — | LOW |
| navbar-search-button | ~48 | ✅ HOẠT ĐỘNG | — | LOW |
| navbar-cart-icon | ~62 | ✅ HOẠT ĐỘNG | — | LOW |
| navbar-account-dropdown | ~72 | ⚠️ LỖI | Không có click-outside handler, dropdown không tự đóng | HIGH |
| navbar-login-link | ~78 | ✅ HOẠT ĐỘNG | — | LOW |
| navbar-register-link | ~80 | ✅ HOẠT ĐỘNG | — | LOW |
| navbar-logout-button | ~85 | ✅ HOẠT ĐỘNG | — | LOW |
| navbar-profile-link | ~90 | ✅ HOẠT ĐỘNG | — | LOW |
| navbar-orders-link | ~93 | ✅ HOẠT ĐỘNG | — | LOW |
| navbar-mobile-menu | ~105 | ✅ HOẠT ĐỘNG | — | LOW |

### Footer (`frontend/src/components/common/Footer.jsx`)

| Chức năng | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| newsletter-email-input | ~71 | ✅ HOẠT ĐỘNG | — | LOW |
| newsletter-submit-button | ~74 | ❌ BÙ NHÌN | Không có handler, không gọi API | HIGH |
| footer-facebook-link | ~82 | ✅ HOẠT ĐỘNG | — | LOW |
| footer-youtube-link | ~85 | ✅ HOẠT ĐỘNG | — | LOW |
| footer-tiktok-link | ~88 | ✅ HOẠT ĐỘNG | — | LOW |
| footer-instagram-link | ~91 | ✅ HOẠT ĐỘNG | — | LOW |
| footer-hotline-link | ~97 | ✅ HOẠT ĐỘNG | — | LOW |
| footer-email-link | ~100 | ✅ HOẠT ĐỘNG | — | LOW |
| footer-nav-links (4) | ~109 | ✅ HOẠT ĐỘNG | — | LOW |

### ProductCard (`frontend/src/components/product/ProductCard.jsx`)

| Chức năng | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| product-card-link | ~60 | ✅ HOẠT ĐỘNG | — | LOW |
| add-to-cart-button | ~84 | ⚠️ LỖI | `canAddToCart=false` điều hướng đến `/products` thay vì `/products/{id}` | HIGH |
| fake-discount-badge | ~123 | ⚠️ LỖI | `resolveDefaultSalePercent()` tạo % giảm giá giả | HIGH |
| hardcoded-rating | ~135 | ⚠️ LỖI | Luôn hiển thị "4.8" cứng | MEDIUM |

### OrderCard (`frontend/src/components/order/OrderCard.jsx`)

| Chức năng | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| cancel-order-button | ~55 | ⚠️ LỖI | Không disabled khi đang hủy → double-submit | HIGH |
| continue-pay-button | ~68 | ✅ HOẠT ĐỘNG | — | MEDIUM |
| review-button | ~82 | ✅ HOẠT ĐỘNG | — | LOW |
| reorder-button | ~90 | ✅ HOẠT ĐỘNG | — | LOW |

### AdminLayout (`frontend/src/components/layouts/AdminLayout.jsx`)

| Chức năng | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| admin-layout-auth-guard | ~22 | ⚠️ LỖI | Crash nếu `currentUser` null; đăng xuất khi lỗi mạng | HIGH |
| admin-sidebar-nav-links | ~45 | ✅ HOẠT ĐỘNG | — | LOW |
| admin-logout-button | ~38 | ✅ HOẠT ĐỘNG | — | LOW |

### Shared UI Components

| Chức năng | File | Dòng | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|---|
| modal-close-button | Modal.jsx | ~28 | ⚠️ LỖI | Có thể đóng khi đang lưu (không check `isLoading`) | MEDIUM |
| modal-backdrop-click | Modal.jsx | ~22 | ⚠️ LỖI | Có thể đóng khi đang lưu | MEDIUM |
| confirm-dialog-confirm | ConfirmDialog.jsx | ~35 | ⚠️ LỖI | `loading` prop thường không được truyền từ trang cha | HIGH |
| confirm-dialog-cancel | ConfirmDialog.jsx | ~40 | ✅ HOẠT ĐỘNG | — | LOW |
| protected-route-auth-check | ProtectedRoute.jsx | ~7 | ⚠️ LỖI | Role đọc từ `localStorage`, dễ bị giả mạo | HIGH |
| protected-route-role-check | ProtectedRoute.jsx | ~8 | ⚠️ LỖI | Không có `isInitialized` guard, có thể flash redirect | HIGH |
| chatbot-toggle-button | Chatbot.jsx | ~88 | ✅ HOẠT ĐỘNG | — | LOW |
| chatbot-send-button | Chatbot.jsx | ~103 | ⚠️ LỖI | auto-scroll null ref khi mở lần đầu; bare catch | MEDIUM |
| chatbot-message-input | Chatbot.jsx | ~110 | ✅ HOẠT ĐỘNG | — | LOW |
| chatbot-close-button | Chatbot.jsx | ~92 | ✅ HOẠT ĐỘNG | — | LOW |

---

## PHẦN 4: BACKEND API

### Endpoints bị lỗi

| Endpoint | Controller | Vấn đề | Ưu tiên |
|---|---|---|---|
| `GET /api/posts` slugExists check | PostController.java:~85 | Full table scan thay vì query trực tiếp theo slug | MEDIUM |
| `DELETE /api/users/{id}` | UserController.java:~62 | Soft-delete nhưng `getAllUsers` vẫn trả về user inactive | HIGH |
| `GET /api/oauth2/callback` | OAuth2LoginController.java:~15 | Luôn redirect về lỗi, Google login không hoạt động | HIGH |
| `PUT /api/flash-sales/{id}` | FlashSaleService.java:~88 | Bỏ qua `quantityLimit=null`, không thể reset về unlimited | HIGH |
| `POST /api/orders` | OrderController.java | Thiếu idempotency key → đặt hàng 2 lần nếu double-submit | HIGH |
| `GET /api/vnpay/return` | PaymentController.java | `validSignature` không được kiểm tra ở frontend | HIGH |

### Endpoints thiếu

| Frontend gọi | Path mong đợi | Vấn đề |
|---|---|---|
| `subscribeNewsletter()` | `POST /api/newsletter/subscribe` | API chưa tồn tại (footer newsletter bù nhìn cả frontend lẫn backend) |

---

## TOP 10 VẤN ĐỀ CẦN SỬA NGAY

---

### 🔴 #1 — VnpayReturnPage: Bỏ qua `validSignature` (Lỗ hổng bảo mật thanh toán)

**File:** `frontend/src/pages/client/VnpayReturnPage.jsx`

**Vấn đề:** Kẻ tấn công có thể giả mạo URL callback với `vnp_TransactionStatus=00` mà không cần chữ ký HMAC hợp lệ → xác nhận đơn hàng giả mà không cần thanh toán thật.

**Sửa:**
```jsx
const data = await verifyVnpayReturn(queryString);
if (!data.validSignature) {
  setStatus('error');
  setMessage('Chữ ký thanh toán không hợp lệ. Vui lòng liên hệ hỗ trợ.');
  return;
}
if (data.paymentStatus === 'PAID') setStatus('success');
```

---

### 🔴 #2 — ProtectedRoute: Role đọc từ localStorage, không xác thực token

**File:** `frontend/src/components/common/ProtectedRoute.jsx:7`

**Vấn đề:** Người dùng chỉ cần `localStorage.setItem('role', 'ADMIN')` là vào được trang quản trị mà không cần đăng nhập thật.

**Sửa:**
```jsx
const { currentUser, isInitialized } = useAuth();
if (!isInitialized) return <Spinner />;
if (!currentUser) return <Navigate to="/login" />;
if (requiredRole && currentUser.role !== requiredRole) return <Navigate to="/" />;
```
Đồng thời, AuthContext phải gọi `GET /api/auth/me` khi khởi động để xác nhận token còn hợp lệ từ server.

---

### 🔴 #3 — CategorySection: 4 link danh mục dùng `<a>` native → reload toàn trang

**File:** `frontend/src/components/home/CategorySection.jsx:22-28`

**Sửa:**
```jsx
import { Link } from 'react-router-dom';
// Thay tất cả <a href="..."> bằng:
<Link to="/products?categoryName=Laptop">Laptop</Link>
<Link to="/products?categoryName=Điện thoại">Điện thoại</Link>
<Link to="/products?categoryName=Máy tính bảng">Máy tính bảng</Link>
<Link to="/products?categoryName=Phụ kiện">Phụ kiện</Link>
```

---

### 🔴 #4 — ProductCard: `canAddToCart=false` điều hướng sai URL

**File:** `frontend/src/components/product/ProductCard.jsx:84`

**Sửa:**
```jsx
// TRƯỚC: navigate('/products')
// SAU:
navigate(`/products/${product.id}`);
// Hoặc tốt hơn: giữ nguyên trang, hiện toast yêu cầu đăng nhập
```

---

### 🔴 #5 — Footer: Nút "Đăng ký nhận tin" là bù nhìn hoàn toàn

**File:** `frontend/src/components/common/Footer.jsx:74`

**Sửa:**
```jsx
const [email, setEmail] = useState('');
const handleSubscribe = async (e) => {
  e.preventDefault();
  if (!email) return;
  try {
    await subscribeNewsletter(email); // POST /api/newsletter/subscribe
    toast.success('Đăng ký nhận tin thành công!');
    setEmail('');
  } catch {
    toast.error('Đăng ký thất bại, vui lòng thử lại.');
  }
};
<form onSubmit={handleSubscribe}>
  <input value={email} onChange={e => setEmail(e.target.value)} type="email" />
  <button type="submit">Đăng ký</button>
</form>
```

---

### 🔴 #6 — BankTransferPaymentPage: Giỏ hàng không được làm mới sau PAID

**File:** `frontend/src/pages/client/BankTransferPaymentPage.jsx:~60`

**Sửa:**
```jsx
if (data.status === 'PAID') {
  clearInterval(interval);
  await fetchCart(); // thêm dòng này
  navigate(`/order-success/${orderId}`);
}
```

---

### 🟡 #7 — AccountPage: Toast hiển thị sau `navigate()`, component đã unmount

**File:** `frontend/src/pages/client/AccountPage.jsx`

**Sửa:**
```jsx
// Toast trước, navigate sau
await updateUser(userId, payload);
toast.success('Cập nhật thông tin thành công!');
setTimeout(() => navigate('/'), 1500);
```

---

### 🟡 #8 — Sidebar: Danh mục "Âm thanh" dùng sai query param

**File:** `frontend/src/components/home/Sidebar.jsx:51`

**Sửa:**
```jsx
// TRƯỚC: <Link to="/products?keyword=Âm thanh">
// SAU:
<Link to="/products?categoryName=Âm thanh">Âm thanh</Link>
```

---

### 🟡 #9 — AdminLayout: Auth guard crash khi `currentUser` là null

**File:** `frontend/src/components/layouts/AdminLayout.jsx:22`

**Sửa:**
```jsx
useEffect(() => {
  if (!currentUser) { navigate('/admin/login'); return; }
  if (currentUser.role !== 'ADMIN') navigate('/admin/login');
}, [currentUser]);

// Trong AuthContext: chỉ logout khi 401, không phải lỗi mạng
catch (err) {
  if (err.response?.status === 401) logout();
  // Các lỗi mạng khác: giữ nguyên session
}
```

---

### 🟡 #10 — ProductsPage Admin: Import Excel tuần tự + đếm sai + không reload

**File:** `frontend/src/pages/admin/ProductsPage.jsx`

**Sửa:**
```jsx
const results = await Promise.allSettled(rows.map(row => createProduct(row)));
const successCount = results.filter(r => r.status === 'fulfilled').length;
const failCount = results.filter(r => r.status === 'rejected').length;

if (failCount > 0) {
  toast.warning(`Import xong: ${successCount} thành công, ${failCount} thất bại`);
} else {
  toast.success(`Đã import ${successCount} sản phẩm thành công`);
}
await loadProducts();
await loadStats();
```

---

## BẢNG TỔNG HỢP NHANH (Tất cả vấn đề HIGH)

| Chức năng | Vị trí | Trạng thái | Vấn đề | Ưu tiên |
|---|---|---|---|---|
| verify-payment-result | VnpayReturnPage.jsx:~25 | ⚠️ LỖI | Bỏ qua `validSignature` — lỗ hổng thanh toán | HIGH |
| protected-route-auth-check | ProtectedRoute.jsx:7 | ⚠️ LỖI | Role từ localStorage, không xác thực token | HIGH |
| protected-route-role-check | ProtectedRoute.jsx:8 | ⚠️ LỖI | Không có `isInitialized` guard | HIGH |
| category-laptop-link | CategorySection.jsx:22 | ⚠️ LỖI | `<a>` native gây full reload | HIGH |
| category-phone-link | CategorySection.jsx:24 | ⚠️ LỖI | `<a>` native gây full reload | HIGH |
| category-tablet-link | CategorySection.jsx:26 | ⚠️ LỖI | `<a>` native gây full reload | HIGH |
| category-accessory-link | CategorySection.jsx:28 | ⚠️ LỖI | `<a>` native gây full reload | HIGH |
| add-to-cart-button | ProductCard.jsx:84 | ⚠️ LỖI | Điều hướng sai URL khi chưa login | HIGH |
| fake-discount-badge | ProductCard.jsx:123 | ⚠️ LỖI | % giảm giá giả, đánh lừa người dùng | HIGH |
| hero-dot-indicator | HeroSection.jsx:62 | ⚠️ LỖI | Autoplay ping-pong vs modulo không nhất quán | HIGH |
| fake-sale-percent | FlashSaleSection.jsx:35 | ⚠️ LỖI | % giảm giá giả khi không có flashsale | HIGH |
| sidebar-category-amthanh | Sidebar.jsx:51 | ⚠️ LỖI | Sai query param `?keyword=` → lọc sai | HIGH |
| polling-status-check (PAID) | BankTransferPaymentPage.jsx:~60 | ⚠️ LỖI | Không gọi `fetchCart()` sau PAID | HIGH |
| place-order-button | CheckoutPage.jsx:~110 | ⚠️ LỖI | Thiếu idempotency → đặt hàng 2 lần | HIGH |
| newsletter-submit-button | Footer.jsx:74 | ❌ BÙ NHÌN | Không có handler, không gọi API | HIGH |
| export-report-button | DashboardPage.jsx:~55 | ❌ BÙ NHÌN | onClick rỗng | HIGH |
| export-excel-button | ProductsPage.jsx:~105 | ❌ BÙ NHÌN | Không có handler | HIGH |
| import-excel-button | ProductsPage.jsx:~100 | ⚠️ LỖI | Tuần tự, đếm sai, không reload | HIGH |
| bulk-delete-checkbox | ProductsPage.jsx:~45 | ❌ BÙ NHÌN | Không có logic xử lý | MEDIUM |
| cancel-order-button | OrderCard.jsx:55 | ⚠️ LỖI | Double-submit khi hủy nhanh | HIGH |
| admin-layout-auth-guard | AdminLayout.jsx:22 | ⚠️ LỖI | Crash khi `currentUser` null | HIGH |
| confirm-dialog-confirm | ConfirmDialog.jsx:35 | ⚠️ LỖI | `loading` prop không được truyền | HIGH |
| navbar-account-dropdown | Navbar.jsx:72 | ⚠️ LỖI | Không có click-outside, dropdown không tự đóng | HIGH |
| reply-contact-button | ContactsPage.jsx:~65 | ❌ BÙ NHÌN | Không có modal/form reply | HIGH |
| google-login-button | AdminLoginPage.jsx:~55 | ⚠️ LỖI | OAuth2 callback luôn redirect về lỗi | HIGH |
| delete-user-button | UsersPage.jsx:~65 | ⚠️ LỖI | Soft-delete nhưng backend leak user inactive | HIGH |
| PUT /api/flash-sales/{id} | FlashSaleService.java:~88 | ⚠️ LỖI | Bỏ qua `quantityLimit=null` | HIGH |
| POST /api/orders idempotency | OrderController.java | ⚠️ LỖI | Thiếu idempotency key | HIGH |
| GET /api/oauth2/callback | OAuth2LoginController.java:~15 | ⚠️ LỖI | Luôn trả lỗi | HIGH |
