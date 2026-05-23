package com.example.demo.controller;

import com.example.demo.domain.User;
import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.auth.AuthResponse;
import com.example.demo.dto.auth.CompleteGoogleProfileRequest;
import com.example.demo.dto.auth.ForgotPasswordRequest;
import com.example.demo.dto.auth.LoginRequest;
import com.example.demo.dto.auth.RegisterRequest;
import com.example.demo.dto.auth.ResetPasswordRequest;
import com.example.demo.dto.auth.VerifyRegistrationOtpRequest;
import com.example.demo.security.JwtUtil;
import com.example.demo.service.PasswordResetService;
import com.example.demo.service.GoogleOAuth2AccountService;
import com.example.demo.service.RegistrationOtpService;
import com.example.demo.service.UserService;
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

    public AuthController(AuthenticationManager authenticationManager,
                          JwtUtil jwtUtil,
                          UserDetailsService userDetailsService,
                          UserService userService,
                          PasswordResetService passwordResetService,
                          RegistrationOtpService registrationOtpService,
                          GoogleOAuth2AccountService googleOAuth2AccountService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.userService = userService;
        this.passwordResetService = passwordResetService;
        this.registrationOtpService = registrationOtpService;
        this.googleOAuth2AccountService = googleOAuth2AccountService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
        User user = userService.findByEmail(req.getEmail());
        return ResponseEntity.ok(ApiResponse.ok(buildAuthResponse(user)));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest req) {
        User user = userService.register(req);
        return ResponseEntity.status(201).body(ApiResponse.ok("Dang ky thanh cong", buildAuthResponse(user)));
    }

    @PostMapping("/register/request-otp")
    public ResponseEntity<ApiResponse<Void>> requestRegistrationOtp(@Valid @RequestBody RegisterRequest req) {
        registrationOtpService.requestOtp(req);
        return ResponseEntity.ok(ApiResponse.ok("Ma OTP da duoc gui den email dang ky", null));
    }

    @PostMapping("/register/verify-otp")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyRegistrationOtp(
            @Valid @RequestBody VerifyRegistrationOtpRequest req) {
        User user = registrationOtpService.verifyOtpAndRegister(req);
        return ResponseEntity.status(201).body(ApiResponse.ok("Dang ky thanh cong", buildAuthResponse(user)));
    }

    @PostMapping("/oauth2/complete-profile")
    public ResponseEntity<ApiResponse<AuthResponse>> completeGoogleProfile(
            @Valid @RequestBody CompleteGoogleProfileRequest req) {
        User user = googleOAuth2AccountService.completeProfile(req);
        return ResponseEntity.ok(ApiResponse.ok("Hoan tat ho so Google thanh cong", buildAuthResponse(user)));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        passwordResetService.requestReset(req.getEmail());
        return ResponseEntity.ok(ApiResponse.ok(
                "Neu email ton tai, he thong da gui lien ket dat lai mat khau", null));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        passwordResetService.resetPassword(req.getToken(), req.getNewPassword());
        return ResponseEntity.ok(ApiResponse.ok("Dat lai mat khau thanh cong", null));
    }

    private AuthResponse buildAuthResponse(User user) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtUtil.generateAccessToken(userDetails);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);
        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                user.getId(), user.getEmail(), user.getFullName(),
                user.getAvatar(), user.getRole().getName(), user.getPhone(), user.getAddress());
        return new AuthResponse(accessToken, refreshToken, userInfo);
    }
}
