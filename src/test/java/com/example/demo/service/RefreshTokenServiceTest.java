package com.example.demo.service;

import com.example.demo.domain.RefreshToken;
import com.example.demo.domain.User;
import com.example.demo.exception.BadRequestException;
import com.example.demo.repository.RefreshTokenRepository;
import com.example.demo.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {
    @Mock
    RefreshTokenRepository refreshTokenRepository;
    @Mock
    JwtUtil jwtUtil;
    @Mock
    UserDetailsService userDetailsService;

    @Test
    void rotateTokenRevokesOldTokenAndCreatesNewOne() {
        RefreshTokenService service = new RefreshTokenService(refreshTokenRepository, jwtUtil, userDetailsService);
        User user = new User();
        user.setEmail("user@example.com");
        RefreshToken oldToken = new RefreshToken();
        oldToken.setToken("old-refresh");
        oldToken.setUser(user);
        oldToken.setExpiryDate(LocalDateTime.now().plusDays(1));
        UserDetails userDetails = mock(UserDetails.class);

        when(refreshTokenRepository.findByToken("old-refresh")).thenReturn(Optional.of(oldToken));
        when(userDetailsService.loadUserByUsername("user@example.com")).thenReturn(userDetails);
        when(jwtUtil.validateToken("old-refresh", userDetails)).thenReturn(true);
        when(jwtUtil.generateRefreshToken(userDetails)).thenReturn("new-refresh");
        when(jwtUtil.getRefreshExpirationMs()).thenReturn(604800000L);
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.rotateToken("old-refresh", "JUnit");

        assertTrue(oldToken.isRevoked());
        ArgumentCaptor<RefreshToken> tokenCaptor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository, atLeastOnce()).save(tokenCaptor.capture());
        assertTrue(tokenCaptor.getAllValues().stream().anyMatch(token -> "new-refresh".equals(token.getToken())));
    }

    @Test
    void rotateTokenRejectsRevokedToken() {
        RefreshTokenService service = new RefreshTokenService(refreshTokenRepository, jwtUtil, userDetailsService);
        RefreshToken oldToken = new RefreshToken();
        oldToken.setToken("old-refresh");
        oldToken.setRevoked(true);
        oldToken.setExpiryDate(LocalDateTime.now().plusDays(1));

        when(refreshTokenRepository.findByToken("old-refresh")).thenReturn(Optional.of(oldToken));

        assertThrows(BadRequestException.class, () -> service.rotateToken("old-refresh", "JUnit"));
    }
}
