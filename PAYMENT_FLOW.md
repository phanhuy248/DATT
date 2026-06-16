# SmartShop — Tài liệu Thanh toán & Thay đổi gần đây

> Cập nhật: 11/06/2026

---

## 1. Tóm tắt thay đổi

### 1.1 Luồng thanh toán (Payment Flow Redesign)

#### Backend
| File | Thay đổi |
|------|----------|
| `OrderController.java` | `placeOrder`: chỉ `clearCart` ngay cho COD; VNPAY/BANK_TRANSFER giữ giỏ hàng đến khi thanh toán xác nhận |
| `OrderController.java` | Thêm `PUT /api/orders/my/{id}/payment-method` — đổi phương thức thanh toán |
| `VnpayPaymentService.java` | Code `"24"` (user hủy) → `PaymentStatus.CANCELLED` (trước là PENDING) |
| `VnpayPaymentService.java` | `processIpn` + `updateOrderPayment` success: gọi `cartService.clearCart()` |
| `SepayWebhookService.java` | Sau set PAID: gọi `cartService.clearCart()` |
| `BankTransferPaymentService.java` | Xóa toàn bộ luồng xác nhận thủ công (approve/reject/customer-confirm); chỉ giữ `getPaymentInfo()` |
| `BankTransferPaymentController.java` | Chỉ còn `GET /api/payments/bank-transfer/orders/{orderId}` |
| `OrderService.java` | Thêm `cancelExpiredVnpayOrders()` — tự hủy đơn VNPAY sau N phút không thanh toán (cron mỗi 15 phút) |
| `OrderService.java` | Thêm `changePaymentMethod()` — đổi phương thức; nếu đổi sang COD thì clearCart ngay |
| `OrderRepository.java` | Thêm `findExpiredUnpaidOrders()` dùng cho job tự hủy |

#### Frontend
| File | Thay đổi |
|------|----------|
| `CheckoutPage.jsx` | VNPAY/BANK_TRANSFER sau đặt hàng → navigate `/orders/{id}/payment` (không clearCart, không redirect VNPay ngay) |
| `CheckoutPage.jsx` | COD: vẫn `clearCart()` → `/order-success/{id}` |
| `VnpayReturnPage.jsx` | Viết lại: success → `fetchCart()` + redirect `/order-success/{id}`; cancel/fail → redirect `/orders/{id}/payment` |
| `OrderPaymentPage.jsx` | **Trang mới** `/orders/:id/payment` — hub thanh toán: retry VNPAY, đổi phương thức, hủy đơn, link QR bank transfer |
| `BankTransferPaymentPage.jsx` | Xóa nút "Tôi đã chuyển khoản"; thêm zoom QR; polling 5s tự redirect khi PAID; gọi `fetchCart()` khi PAID |
| `OrderCard.jsx` | Thêm nút "Tiếp tục thanh toán" → `/orders/{id}/payment` khi đơn chưa thanh toán |
| `OrderSuccessPage.jsx` | Gọi `fetchCart()` khi mount — đảm bảo giỏ hàng luôn được refresh sau thanh toán thành công |
| `api/payments.js` | Xóa các hàm thủ công (approveBankTransfer, rejectBankTransfer, v.v.); giữ 2 hàm: `createVnpayPayment`, `getBankTransferPaymentInfo` |
| `api/orders.js` | Thêm `changePaymentMethod(id, method)` |
| `App.jsx` | Thêm route `/orders/:id/payment` → `OrderPaymentPage` (lazy loaded) |

---

### 1.2 Admin — Xóa chức năng duyệt chuyển khoản thủ công

| File | Thay đổi |
|------|----------|
| `OrdersPage.jsx` (admin) | Xóa nút "Xác nhận nhận tiền" và "Từ chối" |
| `OrdersPage.jsx` (admin) | Xóa filter "Chờ xác nhận CK" và state `bankPendingOnly` |
| `OrdersPage.jsx` (admin) | Xóa hàm `handleApproveBankTransfer`, `handleRejectBankTransfer` |

**Lý do**: SePay webhook tự động xác nhận khi nhận đúng số tiền + đúng nội dung `DH{orderId}`. Không cần duyệt thủ công.

---

### 1.3 Các thay đổi nhỏ khác

| File | Thay đổi |
|------|----------|
| `OrdersPage.jsx`, `OrderCard.jsx`, `OrderHistoryPage.jsx`, `dashboardHelpers.js` | Label `PROCESSING`: "Đang xử lý" → **"Đang chuẩn bị hàng"** |
| `FlashSaleSection.jsx` | Fix layout vỡ (bỏ `width: fit-content` sai); header 1 hàng ngang; grid responsive fill full section |
| `.env` | Fix `BANK_TRANSFER_BANK_ID` khai báo 2 lần → giữ lại `970418` (BIN BIDV cho SePay QR) |

---

## 2. Cấu trúc chức năng thanh toán

### 2.1 Phương thức thanh toán

| Enum `PaymentMethod` | Mô tả | Khi nào clearCart |
|---|---|---|
| `COD` | Thanh toán khi nhận hàng | Ngay sau đặt hàng |
| `VNPAY` | Cổng thanh toán VNPay | Khi IPN/Return xác nhận PAID |
| `BANK_TRANSFER` | Chuyển khoản QR (SePay) | Khi SePay webhook xác nhận PAID |
| `MOMO` | (Chưa triển khai) | — |

### 2.2 Trạng thái thanh toán

| Enum `PaymentStatus` | Ý nghĩa | Hiển thị |
|---|---|---|
| `UNPAID` | Chưa thanh toán (COD mới tạo) | Chưa thanh toán |
| `PENDING` | Đang chờ thanh toán online | Chờ thanh toán |
| `PAID` | Đã thanh toán thành công | Đã thanh toán |
| `FAILED` | Giao dịch lỗi (VNPay trả lỗi) | Thanh toán thất bại |
| `CANCELLED` | Người dùng hủy giao dịch (VNPay code 24) | Đã hủy thanh toán |
| `REFUNDED` | Đã hoàn tiền | Đã hoàn tiền |

---

## 3. Luồng thanh toán chi tiết

### 3.1 COD

```
Checkout → placeOrder() → OrderStatus=PENDING, PaymentStatus=UNPAID
         → clearCart() ngay
         → navigate /order-success/{id}
```

### 3.2 VNPAY

```
Checkout → placeOrder() → OrderStatus=PENDING, PaymentStatus=PENDING
         → navigate /orders/{id}/payment   (KHÔNG clearCart)

/orders/{id}/payment (OrderPaymentPage)
  → Bấm "Thanh toán VNPAY"
  → POST /api/payments/vnpay/orders/{id}  → trả về paymentUrl
  → window.location.href = paymentUrl  (redirect sang VNPay)

VNPay xử lý → redirect về RETURN URL
  Backend GET /api/payments/vnpay/return
    → Xác minh HMAC signature
    → Cập nhật PaymentStatus (PAID / CANCELLED / FAILED)
    → Nếu PAID: clearCart()
    → Redirect về frontend /vnpay-return?orderId=X&success=true/false&responseCode=XX

VnpayReturnPage (frontend):
  success=true  → fetchCart() + navigate /order-success/{id}
  code=24       → toast "Bạn đã hủy" + navigate /orders/{id}/payment
  lỗi khác     → toast "Thất bại" + navigate /orders/{id}/payment

Song song: VNPay gọi IPN URL
  Backend GET /api/payments/vnpay/ipn
    → Xác minh HMAC
    → Nếu PAID: clearCart()
    → Trả {"RspCode":"00"}

Auto-cancel job (cron 0 */15 * * * *):
  Các đơn VNPAY có PaymentStatus IN (PENDING, CANCELLED, FAILED)
  và tạo > 30 phút → tự hủy, hoàn kho
```

### 3.3 BANK_TRANSFER (Chuyển khoản QR — SePay)

```
Checkout → placeOrder() → OrderStatus=PENDING, PaymentStatus=PENDING
         → navigate /orders/{id}/payment   (KHÔNG clearCart)

/orders/{id}/payment → link "Xem mã QR"
  → navigate /payment/bank-transfer/{id}

BankTransferPaymentPage:
  → GET /api/payments/bank-transfer/orders/{id}
  → Hiển thị QR (SePay QR động), số tài khoản, nội dung "DH{orderId}"
  → Polling 5 giây kiểm tra trạng thái
  → Khi PAID: fetchCart() + navigate /order-success/{id}

Người dùng chuyển khoản với nội dung "DH{id}"
  ↓
SePay nhận tiền → gọi POST /api/payments/sepay/webhook
  Header: Authorization: Apikey {SEPAY_API_KEY}
  
Backend SepayPaymentController:
  → Xác thực API key
  → SepayWebhookService.processWebhook():
      1. Parse orderId từ transferContent (regex "DH(\d+)")
      2. Tìm đơn hàng, kiểm tra số tiền đủ không
      3. Cập nhật PaymentStatus=PAID, OrderStatus=CONFIRMED
      4. clearCart()
      5. Lưu SepayTransaction (idempotent — UNIQUE constraint trên sepayId)
  → Trả {"success": true} trong 30 giây
```

---

## 4. Endpoints thanh toán

### Public
| Method | URL | Mô tả |
|--------|-----|-------|
| `POST` | `/api/payments/vnpay/orders/{orderId}` | Tạo link thanh toán VNPay |
| `GET` | `/api/payments/vnpay/return` | Return URL sau thanh toán VNPay |
| `GET` | `/api/payments/vnpay/ipn` | IPN webhook từ VNPay |
| `GET` | `/api/payments/bank-transfer/orders/{orderId}` | Lấy thông tin QR chuyển khoản |
| `POST` | `/api/payments/sepay/webhook` | Webhook tự động từ SePay |

### Authenticated (user)
| Method | URL | Mô tả |
|--------|-----|-------|
| `POST` | `/api/orders` | Đặt hàng mới |
| `GET` | `/api/orders/my` | Danh sách đơn hàng của tôi |
| `GET` | `/api/orders/my/{id}` | Chi tiết đơn hàng |
| `POST` | `/api/orders/my/{id}/cancel` | Hủy đơn (chỉ khi chưa PAID) |
| `PUT` | `/api/orders/my/{id}/payment-method` | Đổi phương thức thanh toán |

---

## 5. Frontend Routes thanh toán

| Route | Component | Mô tả |
|-------|-----------|-------|
| `/checkout` | `CheckoutPage` | Điền thông tin + chọn phương thức |
| `/orders/:id/payment` | `OrderPaymentPage` | Hub thanh toán: retry, đổi phương thức, hủy |
| `/payment/bank-transfer/:orderId` | `BankTransferPaymentPage` | Trang QR chuyển khoản + polling |
| `/vnpay-return` | `VnpayReturnPage` | Redirect sau VNPay (không render UI) |
| `/order-success/:orderId` | `OrderSuccessPage` | Trang thành công |

---

## 6. Biến môi trường liên quan

```env
# VNPay
VNPAY_TMN_CODE=...
VNPAY_HASH_SECRET=...
VNPAY_RETURN_URL=https://domain/api/payments/vnpay/return
VNPAY_IPN_URL=https://domain/api/payments/vnpay/ipn
VNPAY_EXPIRE_MINUTES=30        # Tự hủy đơn sau N phút không thanh toán

# SePay
SEPAY_API_KEY=...              # Lấy từ dashboard SePay > API Access

# Tài khoản ngân hàng (hiển thị QR)
BANK_TRANSFER_BANK_ID=970418   # BIN BIDV (dùng cho cả VietQR và SePay)
BANK_TRANSFER_BANK_NAME=BIDV
BANK_TRANSFER_ACCOUNT_NUMBER=...
BANK_TRANSFER_ACCOUNT_NAME=...
BANK_TRANSFER_QR_IMAGE_BASE_URL=https://img.vietqr.io/image
BANK_TRANSFER_QR_TEMPLATE=compact2
```
