package com.example.demo.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CompleteGoogleProfileRequest {
    @NotBlank(message = "Token xac thuc Google khong duoc de trong")
    private String token;

    @NotBlank(message = "Ho ten khong duoc de trong")
    @Size(min = 3, message = "Ho ten phai co it nhat 3 ky tu")
    private String fullName;

    @NotBlank(message = "So dien thoai khong duoc de trong")
    private String phone;

    @NotBlank(message = "Dia chi khong duoc de trong")
    private String address;

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
}
