package com.example.demo.service;

import com.example.demo.domain.RefreshToken;
import com.example.demo.domain.User;
import com.example.demo.exception.BadRequestException;
import com.example.demo.repository.RefreshTokenRepository;
import com.example.demo.security.JwtUtil;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class RefreshTokenService {
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
                               JwtUtil jwtUtil,
                               UserDetailsService userDetailsService) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Transactional
    public RefreshToken createToken(User user, String deviceInfo) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(jwtUtil.generateRefreshToken(userDetails));
        refreshToken.setExpiryDate(LocalDateTime.now().plusNanos(jwtUtil.getRefreshExpirationMs() * 1_000_000));
        refreshToken.setDeviceInfo(trimDeviceInfo(deviceInfo));
        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public RefreshToken rotateToken(String token, String deviceInfo) {
        RefreshToken current = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Refresh token khong hop le"));
        verifyActive(current);
        User user = current.getUser();
        current.setRevoked(true);
        refreshTokenRepository.save(current);
        return createToken(user, deviceInfo);
    }

    @Transactional
    public void revokeToken(String token) {
        if (token == null || token.isBlank()) return;
        refreshTokenRepository.findByToken(token).ifPresent(refreshToken -> {
            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);
        });
    }

    private void verifyActive(RefreshToken refreshToken) {
        if (refreshToken.isRevoked()) {
            throw new BadRequestException("Refresh token da bi thu hoi");
        }
        if (refreshToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);
            throw new BadRequestException("Refresh token da het han");
        }
        UserDetails userDetails = userDetailsService.loadUserByUsername(refreshToken.getUser().getEmail());
        if (!jwtUtil.validateToken(refreshToken.getToken(), userDetails)) {
            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);
            throw new BadRequestException("Refresh token khong hop le");
        }
    }

    private String trimDeviceInfo(String deviceInfo) {
        if (deviceInfo == null || deviceInfo.isBlank()) {
            return null;
        }
        return deviceInfo.length() > 500 ? deviceInfo.substring(0, 500) : deviceInfo;
    }
}
