package com.smartshop.demo.service;

import com.smartshop.demo.domain.PasswordResetOtp;
import com.smartshop.demo.domain.PasswordResetToken;
import com.smartshop.demo.domain.User;
import com.smartshop.demo.repository.PasswordResetOtpRepository;
import com.smartshop.demo.repository.PasswordResetTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock PasswordResetTokenRepository tokenRepository;
    @Mock PasswordResetOtpRepository otpRepository;
    @Mock UserService userService;
    @Mock MailService mailService;

    // Dùng BCrypt thật để test encode/matches hoạt động đúng
    PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    PasswordResetService service;

    private User activeUser;

    @BeforeEach
    void setUp() {
        service = new PasswordResetService(tokenRepository, otpRepository, userService, passwordEncoder, mailService);

        activeUser = new User();
        activeUser.setId(1L);
        activeUser.setEmail("user@gmail.com");
        activeUser.setActive(true);
    }

    // ── requestOtp ────────────────────────────────────────────

    @Test
    void requestOtp_activeUser_savesOtpAndSendsMail() {
        when(userService.findByEmail("user@gmail.com")).thenReturn(activeUser);
        when(otpRepository.findByEmailIgnoreCaseAndConsumedFalse("user@gmail.com")).thenReturn(List.of());
        when(otpRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.requestOtp("user@gmail.com");

        ArgumentCaptor<PasswordResetOtp> captor = ArgumentCaptor.forClass(PasswordResetOtp.class);
        verify(otpRepository).save(captor.capture());
        PasswordResetOtp saved = captor.getValue();

        assertThat(saved.getEmail()).isEqualTo("user@gmail.com");
        assertThat(saved.isConsumed()).isFalse();
        assertThat(saved.getAttempts()).isZero();
        assertThat(saved.getExpiresAt()).isAfter(LocalDateTime.now());
        // OTP hash phải khác plaintext (BCrypt)
        assertThat(saved.getOtpHash()).isNotBlank().doesNotMatch("\\d{6}");
        verify(mailService).sendPasswordResetOtp(eq("user@gmail.com"), anyString(), anyLong());
    }

    @Test
    void requestOtp_invalidatesOldOtps_beforeSavingNew() {
        PasswordResetOtp old = new PasswordResetOtp();
        old.setEmail("user@gmail.com");
        old.setConsumed(false);

        when(userService.findByEmail("user@gmail.com")).thenReturn(activeUser);
        when(otpRepository.findByEmailIgnoreCaseAndConsumedFalse("user@gmail.com")).thenReturn(List.of(old));
        when(otpRepository.saveAll(anyList())).thenReturn(List.of(old));
        when(otpRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.requestOtp("user@gmail.com");

        // OTP cũ phải bị đánh dấu consumed=true
        assertThat(old.isConsumed()).isTrue();
        verify(otpRepository).saveAll(List.of(old));
    }

    @Test
    void requestOtp_inactiveUser_doesNothing() {
        activeUser.setActive(false);
        when(userService.findByEmail("user@gmail.com")).thenReturn(activeUser);

        service.requestOtp("user@gmail.com");

        verify(otpRepository, never()).save(any());
        verify(mailService, never()).sendPasswordResetOtp(any(), any(), anyLong());
    }

    @Test
    void requestOtp_unknownEmail_doesNothing() {
        when(userService.findByEmail(anyString())).thenReturn(null);

        service.requestOtp("unknown@gmail.com");

        verify(otpRepository, never()).save(any());
    }

    // ── verifyOtpAndGetToken ──────────────────────────────────

    @Test
    void verifyOtp_correctOtp_returnsResetToken() {
        String plainOtp = "123456";
        PasswordResetOtp otp = buildValidOtp("user@gmail.com", plainOtp);

        when(otpRepository.findFirstByEmailIgnoreCaseAndConsumedFalseOrderByCreatedAtDesc("user@gmail.com"))
                .thenReturn(Optional.of(otp));
        when(userService.findByEmail("user@gmail.com")).thenReturn(activeUser);
        when(tokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(otpRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        String token = service.verifyOtpAndGetToken("user@gmail.com", plainOtp);

        assertThat(token).isNotBlank();
        assertThat(otp.isConsumed()).isTrue();
    }

    @Test
    void verifyOtp_wrongOtp_incrementsAttemptsAndThrows() {
        PasswordResetOtp otp = buildValidOtp("user@gmail.com", "123456");

        when(otpRepository.findFirstByEmailIgnoreCaseAndConsumedFalseOrderByCreatedAtDesc("user@gmail.com"))
                .thenReturn(Optional.of(otp));
        when(otpRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        assertThatThrownBy(() -> service.verifyOtpAndGetToken("user@gmail.com", "000000"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("không đúng");

        assertThat(otp.getAttempts()).isEqualTo(1);
    }

    @Test
    void verifyOtp_expiredOtp_throwsAndConsumes() {
        PasswordResetOtp otp = buildValidOtp("user@gmail.com", "123456");
        otp.setExpiresAt(LocalDateTime.now().minusMinutes(1)); // đã hết hạn

        when(otpRepository.findFirstByEmailIgnoreCaseAndConsumedFalseOrderByCreatedAtDesc("user@gmail.com"))
                .thenReturn(Optional.of(otp));
        when(otpRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        assertThatThrownBy(() -> service.verifyOtpAndGetToken("user@gmail.com", "123456"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("hết hạn");

        assertThat(otp.isConsumed()).isTrue();
    }

    @Test
    void verifyOtp_maxAttemptsReached_locksOtp() {
        PasswordResetOtp otp = buildValidOtp("user@gmail.com", "123456");
        otp.setAttempts(5); // đã đạt max

        when(otpRepository.findFirstByEmailIgnoreCaseAndConsumedFalseOrderByCreatedAtDesc("user@gmail.com"))
                .thenReturn(Optional.of(otp));
        when(otpRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        assertThatThrownBy(() -> service.verifyOtpAndGetToken("user@gmail.com", "123456"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("vượt quá số lần thử");
    }

    // ── resetPassword ─────────────────────────────────────────

    @Test
    void resetPassword_validToken_updatesPasswordAndMarksTokenUsed() {
        PasswordResetToken token = new PasswordResetToken();
        token.setToken("valid-token-uuid");
        token.setUser(activeUser);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        token.setUsed(false);

        when(tokenRepository.findByTokenAndUsedFalse("valid-token-uuid")).thenReturn(Optional.of(token));
        when(userService.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(tokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.resetPassword("valid-token-uuid", "newPassword123");

        assertThat(token.isUsed()).isTrue();
        // Password phải được hash
        assertThat(activeUser.getPassword()).isNotEqualTo("newPassword123");
        assertThat(passwordEncoder.matches("newPassword123", activeUser.getPassword())).isTrue();
    }

    @Test
    void resetPassword_expiredToken_throws() {
        PasswordResetToken token = new PasswordResetToken();
        token.setToken("expired-token");
        token.setUser(activeUser);
        token.setExpiresAt(LocalDateTime.now().minusMinutes(1)); // hết hạn
        token.setUsed(false);

        when(tokenRepository.findByTokenAndUsedFalse("expired-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> service.resetPassword("expired-token", "newPass"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("hết hạn");
    }

    @Test
    void resetPassword_invalidToken_throws() {
        when(tokenRepository.findByTokenAndUsedFalse("bad-token")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.resetPassword("bad-token", "newPass"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("không hợp lệ");
    }

    // ── helpers ───────────────────────────────────────────────

    private PasswordResetOtp buildValidOtp(String email, String plainOtp) {
        PasswordResetOtp otp = new PasswordResetOtp();
        otp.setEmail(email);
        otp.setOtpHash(passwordEncoder.encode(plainOtp));
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        otp.setAttempts(0);
        otp.setConsumed(false);
        return otp;
    }
}
