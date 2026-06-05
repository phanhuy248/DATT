package com.example.demo.service;

import com.example.demo.domain.PasswordResetOtp;
import com.example.demo.domain.PasswordResetToken;
import com.example.demo.domain.User;
import com.example.demo.repository.PasswordResetOtpRepository;
import com.example.demo.repository.PasswordResetTokenRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class PasswordResetService {
    private static final int MAX_OTP_ATTEMPTS = 5;
    private static final long OTP_EXPIRATION_MINUTES = 10;
    private static final long RESET_TOKEN_EXPIRATION_MINUTES = 15;

    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordResetOtpRepository otpRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final SecureRandom secureRandom = new SecureRandom();

    public PasswordResetService(PasswordResetTokenRepository tokenRepository,
                                PasswordResetOtpRepository otpRepository,
                                UserService userService,
                                PasswordEncoder passwordEncoder,
                                MailService mailService) {
        this.tokenRepository = tokenRepository;
        this.otpRepository = otpRepository;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.mailService = mailService;
    }

    @Transactional
    public void requestOtp(String email) {
        String normalizedEmail = normalizeEmail(email);
        User user = userService.findByEmail(normalizedEmail);
        if (user == null || !user.isActive()) return;

        List<PasswordResetOtp> oldOtps = otpRepository.findByEmailIgnoreCaseAndConsumedFalse(normalizedEmail);
        oldOtps.forEach(o -> o.setConsumed(true));
        otpRepository.saveAll(oldOtps);

        String otp = generateOtp();
        PasswordResetOtp resetOtp = new PasswordResetOtp();
        resetOtp.setEmail(normalizedEmail);
        resetOtp.setOtpHash(passwordEncoder.encode(otp));
        resetOtp.setCreatedAt(LocalDateTime.now());
        resetOtp.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRATION_MINUTES));
        resetOtp.setAttempts(0);
        resetOtp.setConsumed(false);
        otpRepository.save(resetOtp);

        mailService.sendPasswordResetOtp(normalizedEmail, otp, OTP_EXPIRATION_MINUTES);
    }

    @Transactional
    public String verifyOtpAndGetToken(String email, String otp) {
        String normalizedEmail = normalizeEmail(email);
        PasswordResetOtp resetOtp = otpRepository
                .findFirstByEmailIgnoreCaseAndConsumedFalseOrderByCreatedAtDesc(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu đặt lại mật khẩu hoặc OTP đã hết hạn"));

        if (resetOtp.getExpiresAt().isBefore(LocalDateTime.now())) {
            resetOtp.setConsumed(true);
            otpRepository.save(resetOtp);
            throw new IllegalArgumentException("Mã OTP đã hết hạn");
        }

        if (resetOtp.getAttempts() >= MAX_OTP_ATTEMPTS) {
            resetOtp.setConsumed(true);
            otpRepository.save(resetOtp);
            throw new IllegalArgumentException("Mã OTP đã vượt quá số lần thử cho phép");
        }

        if (!passwordEncoder.matches(otp, resetOtp.getOtpHash())) {
            resetOtp.setAttempts(resetOtp.getAttempts() + 1);
            if (resetOtp.getAttempts() >= MAX_OTP_ATTEMPTS) {
                resetOtp.setConsumed(true);
            }
            otpRepository.save(resetOtp);
            throw new IllegalArgumentException("Mã OTP không đúng");
        }

        resetOtp.setConsumed(true);
        otpRepository.save(resetOtp);

        User user = userService.findByEmail(normalizedEmail);
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(user);
        token.setToken(UUID.randomUUID().toString());
        token.setExpiresAt(LocalDateTime.now().plusMinutes(RESET_TOKEN_EXPIRATION_MINUTES));
        tokenRepository.save(token);

        return token.getToken();
    }

    @Transactional
    public void resetPassword(String tokenValue, String newPassword) {
        PasswordResetToken token = tokenRepository.findByTokenAndUsedFalse(tokenValue)
                .orElseThrow(() -> new IllegalArgumentException("Token đặt lại mật khẩu không hợp lệ"));
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Token đặt lại mật khẩu đã hết hạn");
        }
        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userService.save(user);
        token.setUsed(true);
        tokenRepository.save(token);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String generateOtp() {
        int value = secureRandom.nextInt(1_000_000);
        return String.format("%06d", value);
    }
}
