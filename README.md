# SmartShop

SmartShop là website bán thiết bị công nghệ theo kiến trúc **React SPA + Spring Boot RESTful API**. Backend không render view MVC; frontend React gọi các endpoint JSON dưới `/api`.

## Kiến trúc

```text
frontend/                         React + Vite SPA
src/main/java/com/smartshop/demo/
  config/                         Cấu hình security, CORS, Redis, seed data
  controller/                     REST controllers, expose /api/**
  domain/                         JPA entities và enum nghiệp vụ
  dto/                            Request/response DTO
  exception/                      Global REST exception handling
  repository/                     Spring Data JPA repositories
  security/                       JWT, OAuth2, rate limit filter
  service/                        Business logic
crawler/                          Công cụ lấy/import dữ liệu sản phẩm
uploads/                          File upload khi chạy local
```

## Module chính

- Client: trang chủ, sản phẩm, chi tiết sản phẩm, giỏ hàng, checkout, lịch sử đơn hàng, tài khoản, tin tức, liên hệ.
- Admin: dashboard, sản phẩm, danh mục, nhà cung cấp, đơn hàng, mã giảm giá, banner, tin tức, liên hệ, người dùng.
- Backend: xác thực JWT/OAuth2, refresh token, OTP đăng ký, quản lý sản phẩm, tồn kho, đơn hàng, mã giảm giá, review, bài viết, banner, liên hệ, audit log.

## Công nghệ

- Backend: Java 17, Spring Boot 3.3.5, Spring Web, Spring Data JPA, Spring Security, JWT, MySQL, Redis, Spring Mail.
- Frontend: React 18, Vite, React Router, Axios, React Toastify.
- Runtime local: Docker Compose hỗ trợ MySQL, Redis, backend và frontend.

## Chạy bằng Docker

```bash
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8080`
- MySQL: `localhost:3306`
- Redis: `localhost:6379`

## Chạy thủ công

Backend:

```powershell
.\mvnw.cmd spring-boot:run
```

Frontend:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

## Kiểm tra

```powershell
.\mvnw.cmd test
cd frontend
npm.cmd run build
```

## Ghi chú thực tế

- Thanh toán COD hoạt động theo luồng đơn hàng. Chuyển khoản/MoMo đang ở mức mô phỏng cơ bản, chưa có callback từ cổng thanh toán thật.
- Database schema đang dùng Flyway và `spring.jpa.hibernate.ddl-auto=validate`, nên cần chạy migration thay vì để Hibernate tự sửa bảng.
- Các biến môi trường mẫu nằm trong `.env.example`.
