# Huong dan cau hinh Google OAuth2 cho SmartShop

## 1. Tao Google OAuth Client ID

1. Vao Google Cloud Console: https://console.cloud.google.com/
2. Tao project moi hoac chon project dang dung.
3. Vao **APIs & Services** -> **OAuth consent screen**.
4. Chon loai user phu hop:
   - **External** neu nguoi dung la tai khoan Google bat ky.
   - **Internal** neu chi dung trong Google Workspace.
5. Dien ten ung dung, email ho tro, developer contact email, sau do luu.
6. Vao **APIs & Services** -> **Credentials** -> **Create Credentials** -> **OAuth client ID**.
7. Chon **Application type: Web application**.
8. Them **Authorized JavaScript origins**:
   - Local frontend: `http://localhost:3000`
   - Neu dung port Vite mac dinh khac: `http://localhost:5173`
   - Production frontend domain, vi du: `https://smartshop.example.com`
9. Them **Authorized redirect URIs**:
   - Local backend: `http://localhost:8080/login/oauth2/code/google`
   - Production backend: `https://api.smartshop.example.com/login/oauth2/code/google`
10. Tao client va copy **Client ID** + **Client Secret**.

## 2. Cau hinh backend

Dat bien moi truong truoc khi chay Spring Boot:

```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OAUTH2_FRONTEND_REDIRECT_URI=http://localhost:3000/oauth2/callback
OAUTH2_FRONTEND_PROFILE_COMPLETION_URI=http://localhost:3000/oauth2/complete-profile
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

Backend se tu bat Google OAuth2 khi `GOOGLE_CLIENT_ID` va `GOOGLE_CLIENT_SECRET` co gia tri. Neu thieu 1 trong 2 bien nay, nut Google se bao loi cau hinh thay vi chuyen den Google.

Trong production, thay cac URL local bang domain that va luu secret bang secret manager hoac bien moi truong cua server.

## 3. Cau hinh frontend

Neu frontend goi backend khac origin, dat:

```bash
VITE_BACKEND_URL=http://localhost:8080
VITE_API_BASE_URL=/api
```

Nut **Dang nhap voi Google** se dieu huong den:

```text
{VITE_BACKEND_URL}/oauth2/authorization/google
```

Sau khi Google xac thuc thanh cong:

- Backend luon redirect ve `/oauth2/complete-profile` kem token tam thoi.
- Frontend bat nguoi dung nhap ho ten, so dien thoai va dia chi.
- Backend chi tao/cap nhat user, kich hoat lai tai khoan neu truoc do bi xoa mem, va tra JWT sau khi buoc nay hoan tat.
