package com.smartshop.demo.dto.auth;

public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private UserInfo user;

    public AuthResponse(String accessToken, String refreshToken, UserInfo user) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.user = user;
    }

    public String getAccessToken() { return accessToken; }
    public String getRefreshToken() { return refreshToken; }
    public String getTokenType() { return tokenType; }
    public UserInfo getUser() { return user; }

    public static class UserInfo {
        private long id;
        private String email;
        private String fullName;
        private String avatar;
        private String role;
        private String phone;
        private String address;

        public UserInfo(long id, String email, String fullName, String avatar, String role, String phone, String address) {
            this.id = id;
            this.email = email;
            this.fullName = fullName;
            this.avatar = avatar;
            this.role = role;
            this.phone = phone;
            this.address = address;
        }

        public long getId() { return id; }
        public String getEmail() { return email; }
        public String getFullName() { return fullName; }
        public String getAvatar() { return avatar; }
        public String getRole() { return role; }
        public String getPhone() { return phone; }
        public String getAddress() { return address; }
    }
}
