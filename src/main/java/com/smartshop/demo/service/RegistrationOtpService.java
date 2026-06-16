package com.smartshop.demo.service;

import com.smartshop.demo.domain.RegistrationOtp;
import com.smartshop.demo.domain.User;
import com.smartshop.demo.dto.auth.RegisterRequest;
import com.smartshop.demo.dto.auth.VerifyRegistrationOtpRequest;
import com.smartshop.demo.repository.RegistrationOtpRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class RegistrationOtpService {

    private final RegistrationOtpRepository otpRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.registration.otp.expiration-minutes:10}")
    private long expirationMinutes;

    @Value("${app.registration.otp.max-attempts:5}")
    private int maxAttempts;

    @Value("${app.registration.otp.allowed-email-domain:gmail.com}")
    private String allowedEmailDomain;

    public RegistrationOtpService(RegistrationOtpRepository otpRepository,
                                  UserService userService,
                                  PasswordEncoder passwordEncoder,
                                  MailService mailService) {
        this.otpRepository = otpRepository;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.mailService = mailService;
    }

    @Transactional
    public void requestOtp(RegisterRequest req) {
        String email = normalizeEmail(req.getEmail());
        validateAllowedEmailDomain(email);

        if (userService.checkEmailExist(email)) {
            throw new IllegalArgumentException("Email da duoc su dung");
        }

        List<RegistrationOtp> pendingOtps = otpRepository.findByEmailIgnoreCaseAndConsumedFalse(email);
        pendingOtps.forEach(otp -> otp.setConsumed(true));
        otpRepository.saveAll(pendingOtps);

        String otp = generateOtp();
        RegistrationOtp registrationOtp = new RegistrationOtp();
        registrationOtp.setEmail(email);
        registrationOtp.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        registrationOtp.setFullName(req.getFullName().trim());
        registrationOtp.setAddress(req.getAddress().trim());
        registrationOtp.setPhone(req.getPhone().trim());
        registrationOtp.setOtpHash(passwordEncoder.encode(otp));
        registrationOtp.setCreatedAt(LocalDateTime.now());
        registrationOtp.setExpiresAt(LocalDateTime.now().plusMinutes(expirationMinutes));
        registrationOtp.setAttempts(0);
        registrationOtp.setConsumed(false);
        otpRepository.save(registrationOtp);

        mailService.sendRegistrationOtp(email, otp, expirationMinutes);
    }

    @Transactional
    public User verifyOtpAndRegister(VerifyRegistrationOtpRequest req) {
        String email = normalizeEmail(req.getEmail());
        RegistrationOtp registrationOtp = otpRepository
                .findFirstByEmailIgnoreCaseAndConsumedFalseOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay yeu cau dang ky hoac OTP da het han"));

        if (registrationOtp.getExpiresAt().isBefore(LocalDateTime.now())) {
            registrationOtp.setConsumed(true);
            otpRepository.save(registrationOtp);
            throw new IllegalArgumentException("Ma OTP da het han");
        }

        if (registrationOtp.getAttempts() >= maxAttempts) {
            registrationOtp.setConsumed(true);
            otpRepository.save(registrationOtp);
            throw new IllegalArgumentException("Ma OTP da vuot qua so lan thu cho phep");
        }

        if (!passwordEncoder.matches(req.getOtp(), registrationOtp.getOtpHash())) {
            registrationOtp.setAttempts(registrationOtp.getAttempts() + 1);
            if (registrationOtp.getAttempts() >= maxAttempts) {
                registrationOtp.setConsumed(true);
            }
            otpRepository.save(registrationOtp);
            throw new IllegalArgumentException("Ma OTP khong dung");
        }

        if (userService.checkEmailExist(email)) {
            registrationOtp.setConsumed(true);
            otpRepository.save(registrationOtp);
            throw new IllegalArgumentException("Email da duoc su dung");
        }

        User user = userService.registerVerified(
                registrationOtp.getEmail(),
                registrationOtp.getPasswordHash(),
                registrationOtp.getFullName(),
                registrationOtp.getAddress(),
                registrationOtp.getPhone());

        registrationOtp.setConsumed(true);
        otpRepository.save(registrationOtp);
        return user;
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private void validateAllowedEmailDomain(String email) {
        if (!StringUtils.hasText(allowedEmailDomain)) {
            return;
        }

        String normalizedDomain = allowedEmailDomain.trim().toLowerCase(Locale.ROOT);
        if (!email.endsWith("@" + normalizedDomain)) {
            throw new IllegalArgumentException("Chi chap nhan dia chi email @" + normalizedDomain);
        }
    }

    private String generateOtp() {
        int value = secureRandom.nextInt(1_000_000);
        return String.format("%06d", value);
    }
}
