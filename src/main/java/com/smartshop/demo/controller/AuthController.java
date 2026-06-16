package com.smartshop.demo.controller;

import com.smartshop.demo.domain.RefreshToken;
import com.smartshop.demo.domain.User;
import com.smartshop.demo.dto.ApiResponse;
import com.smartshop.demo.dto.auth.AuthResponse;
import com.smartshop.demo.dto.auth.CompleteGoogleProfileRequest;
import com.smartshop.demo.dto.auth.ForgotPasswordRequest;
import com.smartshop.demo.dto.auth.LoginRequest;
import com.smartshop.demo.dto.auth.LogoutRequest;
import com.smartshop.demo.dto.auth.RegisterRequest;
import com.smartshop.demo.dto.auth.RefreshTokenRequest;
import com.smartshop.demo.dto.auth.ResetPasswordRequest;
import com.smartshop.demo.dto.auth.VerifyPasswordResetOtpRequest;
import com.smartshop.demo.dto.auth.VerifyRegistrationOtpRequest;
import com.smartshop.demo.security.JwtUtil;
import com.smartshop.demo.service.PasswordResetService;
import com.smartshop.demo.service.GoogleOAuth2AccountService;
import com.smartshop.demo.service.RefreshTokenService;
import com.smartshop.demo.service.RegistrationOtpService;
import com.smartshop.demo.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final UserService userService;
    private final PasswordResetService passwordResetService;
    private final RegistrationOtpService registrationOtpService;
    private final GoogleOAuth2AccountService googleOAuth2AccountService;
    private final RefreshTokenService refreshTokenService;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtUtil jwtUtil,
                          UserDetailsService userDetailsService,
                          UserService userService,
                          PasswordResetService passwordResetService,
                          RegistrationOtpService registrationOtpService,
                          GoogleOAuth2AccountService googleOAuth2AccountService,
                          RefreshTokenService refreshTokenService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.userService = userService;
        this.passwordResetService = passwordResetService;
        this.registrationOtpService = registrationOtpService;
        this.googleOAuth2AccountService = googleOAuth2AccountService;
        this.refreshTokenService = refreshTokenService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest req,
                                                           HttpServletRequest request) {
        String email = req.getEmail().trim();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, req.getPassword()));
        User user = userService.findByEmail(email);
        return ResponseEntity.ok(ApiResponse.ok(buildAuthResponse(user, request)));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest req,
                                                              HttpServletRequest request) {
        User user = userService.register(req);
        return ResponseEntity.status(201).body(ApiResponse.ok("Dang ky thanh cong", buildAuthResponse(user, request)));
    }

    @PostMapping("/register/request-otp")
    public ResponseEntity<ApiResponse<Void>> requestRegistrationOtp(@Valid @RequestBody RegisterRequest req) {
        registrationOtpService.requestOtp(req);
        return ResponseEntity.ok(ApiResponse.ok("Ma OTP da duoc gui den email dang ky", null));
    }

    @PostMapping("/register/verify-otp")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyRegistrationOtp(
            @Valid @RequestBody VerifyRegistrationOtpRequest req,
            HttpServletRequest request) {
        User user = registrationOtpService.verifyOtpAndRegister(req);
        return ResponseEntity.status(201).body(ApiResponse.ok("Dang ky thanh cong", buildAuthResponse(user, request)));
    }

    @PostMapping("/oauth2/complete-profile")
    public ResponseEntity<ApiResponse<AuthResponse>> completeGoogleProfile(
            @Valid @RequestBody CompleteGoogleProfileRequest req,
            HttpServletRequest request) {
        User user = googleOAuth2AccountService.completeProfile(req);
        return ResponseEntity.ok(ApiResponse.ok("Hoan tat ho so Google thanh cong", buildAuthResponse(user, request)));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest req,
                                                                  HttpServletRequest request) {
        RefreshToken rotated = refreshTokenService.rotateToken(req.getRefreshToken(), deviceInfo(request));
        User user = userService.findByEmail(jwtUtil.extractUsername(rotated.getToken()));
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtUtil.generateAccessToken(userDetails);
        return ResponseEntity.ok(ApiResponse.ok(buildAuthResponse(user, accessToken, rotated.getToken())));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody(required = false) LogoutRequest req) {
        if (req != null) {
            refreshTokenService.revokeToken(req.getRefreshToken());
        }
        return ResponseEntity.ok(ApiResponse.ok("Dang xuat thanh cong", null));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        passwordResetService.requestOtp(req.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Nếu email tồn tại, mã OTP đã được gửi đến email của bạn", null));
    }

    @PostMapping("/forgot-password/verify-otp")
    public ResponseEntity<ApiResponse<Map<String, String>>> verifyPasswordResetOtp(
            @Valid @RequestBody VerifyPasswordResetOtpRequest req) {
        String resetToken = passwordResetService.verifyOtpAndGetToken(req.getEmail(), req.getOtp());
        return ResponseEntity.ok(ApiResponse.ok("Xác thực OTP thành công", Map.of("resetToken", resetToken)));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        passwordResetService.resetPassword(req.getToken(), req.getNewPassword());
        return ResponseEntity.ok(ApiResponse.ok("Đặt lại mật khẩu thành công", null));
    }

    private AuthResponse buildAuthResponse(User user, HttpServletRequest request) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtUtil.generateAccessToken(userDetails);
        String refreshToken = refreshTokenService.createToken(user, deviceInfo(request)).getToken();
        return buildAuthResponse(user, accessToken, refreshToken);
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                user.getId(), user.getEmail(), user.getFullName(),
                user.getAvatar(), user.getRole().getName(), user.getPhone(), user.getAddress());
        return new AuthResponse(accessToken, refreshToken, userInfo);
    }

    private String deviceInfo(HttpServletRequest request) {
        return request.getHeader("User-Agent");
    }
}
