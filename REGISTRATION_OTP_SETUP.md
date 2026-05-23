# Dang ky bang Gmail va OTP

Flow dang ky moi:

1. Nguoi dung nhap thong tin dang ky bang dia chi Gmail.
2. Frontend goi `POST /api/auth/register/request-otp`.
3. Backend tao OTP 6 so, luu OTP dang hash trong bang `registration_otps`.
4. Backend gui OTP den Gmail cua nguoi dung.
5. Nguoi dung nhap OTP tren frontend.
6. Frontend goi `POST /api/auth/register/verify-otp`.
7. Neu OTP dung va chua het han, backend moi tao user role `USER`, sinh JWT va tra ve frontend.

## API

Gui OTP:

```http
POST /api/auth/register/request-otp
Content-Type: application/json

{
  "email": "user@gmail.com",
  "password": "123456",
  "fullName": "Nguyen Van A",
  "address": "123 Duong ABC",
  "phone": "0912345678"
}
```

Xac nhan OTP:

```http
POST /api/auth/register/verify-otp
Content-Type: application/json

{
  "email": "user@gmail.com",
  "otp": "123456"
}
```

## Cau hinh OTP

Trong `application.properties` da co:

```properties
app.registration.otp.expiration-minutes=${REGISTRATION_OTP_EXPIRATION_MINUTES:10}
app.registration.otp.max-attempts=${REGISTRATION_OTP_MAX_ATTEMPTS:5}
app.registration.otp.allowed-email-domain=${REGISTRATION_EMAIL_DOMAIN:gmail.com}
```

Neu muon cho phep moi domain email, dat:

```powershell
$env:REGISTRATION_EMAIL_DOMAIN=""
```

## Gui email that bang Gmail SMTP

Can bat 2-Step Verification tren tai khoan Gmail gui mail, sau do tao App Password.

Chay backend voi cac bien moi truong:

```powershell
$env:MAIL_ENABLED="true"
$env:MAIL_HOST="smtp.gmail.com"
$env:MAIL_PORT="587"
$env:MAIL_USERNAME="gmail-gui-mail-cua-ban@gmail.com"
$env:MAIL_PASSWORD="app-password-16-ky-tu"
.\mvnw.cmd spring-boot:run
```

Neu `MAIL_ENABLED=false`, backend khong gui email that ma ghi OTP vao log backend de test local.
