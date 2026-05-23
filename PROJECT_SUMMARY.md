# Tong Quan Du An SmartShop

## 1. Gioi thieu

SmartShop la website thuong mai dien tu ban thiet bi cong nghe, tap trung vao laptop, dien thoai va phu kien. Du an gom backend Spring Boot REST API va frontend React/Vite.

Muc tieu chinh cua he thong:

- Khach hang xem danh sach san pham, tim kiem, loc, xem chi tiet va danh gia san pham.
- Khach hang dang ky, dang nhap, quan ly tai khoan, gio hang va dat hang.
- Quan tri vien quan ly san pham, danh muc, don hang, nguoi dung, ma giam gia, nha cung cap va bai viet tin tuc.
- He thong ho tro ma giam gia, gui email co ban, quen mat khau, chatbot, lich su xem va goi y san pham.

## 2. Cong nghe su dung

### Backend

- Java 17.
- Spring Boot 3.3.5.
- Spring Web: xay dung REST API.
- Spring Data JPA/Hibernate: thao tac co so du lieu.
- Spring Security: xac thuc va phan quyen.
- JWT: dang nhap bang token.
- MySQL 8: co so du lieu chinh.
- Redis: cache.
- Spring Mail: gui email xac nhan don hang va reset mat khau.
- Maven: quan ly dependency va build.

### Frontend

- React 18.
- Vite.
- React Router DOM.
- Axios.
- React Toastify.
- CSS thuan ket hop Bootstrap class co san.

### Ha tang chay thu

- Docker Compose co san MySQL, Redis, backend va frontend.
- Thu muc `uploads/` luu anh san pham va avatar.

## 3. Cau truc thu muc chinh

```text
demo/
├── src/main/java/com/example/demo/
│   ├── config/          # Cau hinh security, CORS, Redis, seed du lieu
│   ├── controller/      # REST controller
│   ├── domain/          # Entity va enum
│   ├── dto/             # Request/response DTO
│   ├── exception/       # Xu ly loi tap trung
│   ├── repository/      # Spring Data JPA repository
│   ├── security/        # JWT filter, JWT util
│   └── service/         # Xu ly nghiep vu
├── src/main/resources/
│   └── application.properties
├── src/test/java/       # Unit test va context test
├── frontend/
│   ├── src/api/         # Ham goi API bang Axios
│   ├── src/components/  # Layout, navbar, footer, chatbot, product card
│   ├── src/context/     # AuthContext, CartContext
│   └── src/pages/       # Trang client, auth va admin
├── uploads/             # File upload khi chay local
├── docker-compose.yml
└── pom.xml
```

## 4. Cac module backend da co

### Xac thuc va nguoi dung

- Dang ky tai khoan.
- Dang nhap bang email/password.
- Dang nhap admin.
- JWT authentication.
- Cap nhat thong tin ca nhan.
- Upload avatar.
- Quen mat khau va reset mat khau bang token.
- Quan ly nguoi dung trong admin.
- Role hien co: `ADMIN`, `USER`, `STAFF`.
- Tai khoan bi khoa/soft delete khong duoc dang nhap.

### San pham

- CRUD san pham cho admin.
- Danh sach san pham cho client.
- Tim kiem theo tu khoa.
- Loc theo danh muc, gia.
- Sap xep san pham.
- Xem chi tiet san pham.
- Upload anh san pham.
- Soft delete san pham de khong pha lich su don hang.
- Gia tien dung `BigDecimal`.
- Co truong `version` de ho tro optimistic locking.
- Co thong tin so luong ton kho, da ban, nha cung cap.

### Danh muc

- CRUD danh muc.
- Client dung danh muc de loc san pham.
- Ho tro soft delete.

### Gio hang

- Them san pham vao gio.
- Cap nhat so luong.
- Xoa san pham khoi gio.
- Kiem tra so luong ton kho o backend khi them/cap nhat.
- Tinh tong tien gio hang.

### Dat hang va thanh toan

- Tao don hang tu gio hang.
- Luu thong tin nguoi nhan, dia chi, so dien thoai, ghi chu.
- Luu phuong thuc thanh toan bang enum `PaymentMethod`.
- Luu trang thai thanh toan bang enum `PaymentStatus`.
- Luu trang thai don hang bang enum `OrderStatus`.
- Tru ton kho khi dat hang.
- Cap nhat trang thai don hang trong admin.
- Khi huy don co hoan ton kho va dieu chinh so luong da ban.
- Don COD khi giao thanh cong co the duoc danh dau da thanh toan.
- Gui email xac nhan don hang neu cau hinh mail.

### Ma giam gia

- Entity `Coupon`.
- Ho tro loai giam theo tien co dinh hoac phan tram.
- Co dieu kien gia tri don hang toi thieu.
- Co gioi han so luot su dung.
- Co ngay bat dau, ngay ket thuc va trang thai kich hoat.
- Checkout co the nhap ma giam gia.
- Don hang luu `couponCode` va `discountAmount`.

### Danh gia san pham

- Nguoi dung dang nhap co the danh gia san pham.
- He thong kiem tra nguoi dung da co don hang `DELIVERED` chua san pham do moi cho danh gia.
- Lay danh sach review theo san pham.
- Tinh thong tin danh gia tren giao dien chi tiet san pham.

### Tin tuc/bai viet

- Entity `Post`.
- Client xem danh sach tin tuc va chi tiet bai viet.
- Admin CRUD bai viet.

### Nha cung cap

- Entity `Supplier`.
- Admin quan ly nha cung cap.
- San pham co the gan voi nha cung cap.

### Nhap hang

- Entity `StockImport`.
- Luu lich su nhap kho.
- Admin co chuc nang nhap them so luong cho san pham.

### Lien he va banner

- Co entity va API cho `ContactMessage`.
- Co entity va API cho `Banner`.
- Phan admin frontend cho lien he/banner chua day du.

### Chatbot va goi y

- Co API chatbot.
- Co cau hinh Gemini API key qua bien moi truong.
- Neu khong co key thi can cau hinh them de chatbot hoat dong day du.
- Co lich su xem san pham va service goi y san pham.

## 5. Cac trang frontend da co

### Khu vuc khach hang

- Trang chu.
- Danh sach san pham.
- Chi tiet san pham.
- Gio hang.
- Thanh toan.
- Dat hang thanh cong.
- Lich su don hang.
- Trang tai khoan.
- Dang nhap.
- Dang ky.
- Quen mat khau.
- Reset mat khau.
- Tin tuc.
- Chi tiet tin tuc.
- Trang thong tin tinh `/info/:slug` cho footer: gioi thieu, chinh sach, lien he, huong dan mua hang, sitemap.

### Khu vuc admin

- Dang nhap admin.
- Dashboard thong ke.
- Quan ly san pham.
- Quan ly danh muc.
- Quan ly nguoi dung/nhan vien.
- Quan ly don hang.
- Quan ly ma giam gia.
- Quan ly nha cung cap.
- Quan ly bai viet.

## 6. Co so du lieu chinh

Du an dung Hibernate `ddl-auto=update`, nen bang duoc tao/cap nhat tu entity.

Nhom bang/entity quan trong:

- `users`, `roles`: tai khoan va phan quyen.
- `products`, `categories`, `suppliers`: san pham, danh muc, nha cung cap.
- `cart_items`: gio hang.
- `orders`, `order_detail`: don hang va chi tiet don.
- `reviews`: danh gia san pham.
- `coupons`: ma giam gia.
- `posts`: bai viet/tin tuc.
- `stock_imports`: lich su nhap kho.
- `password_reset_tokens`: token reset mat khau.
- `view_history`: lich su xem san pham.
- `banners`: banner/slider.
- `contact_messages`: lien he khach hang.

## 7. Cau hinh quan trong

File cau hinh: `src/main/resources/application.properties`.

Cac bien moi truong nen biet:

- `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`: cau hinh MySQL.
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`: cau hinh Redis.
- `JWT_SECRET`: khoa ky JWT.
- `UPLOAD_DIR`: thu muc upload file.
- `CORS_ORIGINS`: domain frontend duoc phep goi API.
- `GEMINI_API_KEY`: API key chatbot.
- `MAIL_ENABLED`: bat/tat gui email that.
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`: cau hinh SMTP.
- `FRONTEND_URL`: URL frontend de tao link reset mat khau.
- `SEED_ENABLED`: bat/tat seed san pham tu DummyJSON.
- `DEMO_USERS_ENABLED`: bat/tat tao tai khoan demo.

## 8. Cach chay du an

### Chay bang Docker Compose

Tu thu muc goc du an:

```bash
docker compose up --build
```

Sau khi chay:

- Backend: `http://localhost:8080`
- Frontend: `http://localhost:3000`
- MySQL: `localhost:3306`
- Redis: `localhost:6379`

### Chay thu cong backend

Can MySQL va Redis dang chay truoc.

```bash
mvn spring-boot:run
```

Neu cong `8080` bi trung, co the chay cong khac:

```bash
mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8081"
```

### Chay thu cong frontend

```bash
cd frontend
npm install
npm run dev -- --port 3000
```

## 9. Tai khoan demo

Neu `DEMO_USERS_ENABLED=true`, he thong seed tai khoan demo.

- Admin: `admin@gmail.com` / `123456`
- User: `user@gmail.com` / `123456`

Luu y: day la tai khoan demo phuc vu chay thu va bao ve do an, khong nen dung trong moi truong that.

## 10. Test va build

### Backend

```bash
mvn test
```

Hien co test:

- `DemoApplicationTests`: test context Spring Boot.
- `CartServiceTest`: test nghiep vu gio hang.
- `CouponServiceTest`: test nghiep vu ma giam gia.

### Frontend

```bash
cd frontend
npm run build
```

Lenh nay build React bang Vite va xuat file vao `frontend/dist`.

## 11. Cac diem manh hien tai

- Kien truc tach backend REST API va frontend React ro rang.
- Da co phan quyen admin/user/staff.
- Da bo sung nhieu module phu hop bao cao/de cuong: coupon, news/post, supplier, reset password, email, stock import, footer info page.
- Nghiep vu don hang tot hon: enum trang thai, hoan kho khi huy, luu trang thai thanh toan.
- Review san pham da co kiem tra da mua hang.
- Gio hang da kiem tra ton kho o backend.
- Gia tien dung `BigDecimal`, phu hop bai toan thuong mai dien tu.
- Co Docker Compose de dung moi truong MySQL/Redis nhanh.

## 12. Cac diem con nen hoan thien

- Thanh toan online hien moi o muc mo phong, chua tich hop cong thanh toan that.
- Admin frontend cho banner/slider va lien he chua day du.
- Email chi gui that khi cau hinh SMTP; mac dinh dang tat va log noi dung.
- Chatbot can `GEMINI_API_KEY` that de hoat dong dung.
- Can bo sung test integration cho auth, order, review, admin permission.
- Can them migration ro rang bang Flyway/Liquibase neu muon CSDL on dinh khi nop/chay tren may khac.
- Nen them phan export/bao cao thong ke doanh thu neu muon tang diem cho module admin.
- Nen them validate chi tiet hon cho du lieu dau vao o cac form admin.
- Nen them trang quan ly banner va lien he trong admin de khop hoan toan voi bao cao.

## 13. Ket luan

Du an SmartShop hien da co day du nen tang cua mot website ban hang truc tuyen: xac thuc, san pham, danh muc, gio hang, dat hang, quan tri, ma giam gia, tin tuc, nha cung cap, nhap hang, reset mat khau va email co ban. Huong phat trien hien tai phu hop voi de tai do an. Nhung phan nen uu tien hoan thien tiep la thanh toan online that, admin banner/lien he, test integration va migration CSDL.
