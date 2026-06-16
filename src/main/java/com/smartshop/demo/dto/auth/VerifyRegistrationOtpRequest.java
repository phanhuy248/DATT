package com.smartshop.demo.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class VerifyRegistrationOtpRequest {
    @Email(message = "Email khong hop le")
    @NotBlank(message = "Email khong duoc de trong")
    private String email;

    @NotBlank(message = "Ma OTP khong duoc de trong")
    @Pattern(regexp = "^\\d{6}$", message = "Ma OTP phai gom 6 chu so")
    private String otp;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }
}
