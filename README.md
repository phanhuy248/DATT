# SmartShop

SmartShop là website bán thiết bị công nghệ theo kiến trúc **React SPA + Spring Boot RESTful API**. Backend không render view MVC; frontend React gọi các endpoint JSON dưới `/api`.

## Kiến trúc

```text
frontend/                         React + Vite SPA
src/main/java/com/example/demo/
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

```bash
./mvnw spring-boot:run
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Kiểm tra

```bash
./mvnw test
cd frontend
npm run build
```

## Ghi chú thực tế

- Thanh toán COD hoạt động theo luồng đơn hàng. Chuyển khoản/MoMo đang ở mức mô phỏng cơ bản, chưa có callback từ cổng thanh toán thật.
- `spring.jpa.hibernate.ddl-auto=update` phù hợp demo; môi trường production nên chuyển sang Flyway hoặc Liquibase.
- Các biến môi trường mẫu nằm trong `.env.example`.
