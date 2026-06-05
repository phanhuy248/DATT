package com.example.demo.security;

import com.example.demo.domain.User;
import com.example.demo.service.GoogleOAuth2AccountService.GoogleLoginResult;
import com.example.demo.service.GoogleOAuth2AccountService;
import com.example.demo.service.RefreshTokenService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2AuthenticationSuccessHandler.class);

    private final GoogleOAuth2AccountService googleOAuth2AccountService;
    private final UserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;

    @Value("${app.oauth2.frontend-redirect-uri:http://localhost:3000/oauth2/callback}")
    private String frontendRedirectUri;

    @Value("${app.oauth2.frontend-profile-completion-uri:http://localhost:3000/oauth2/complete-profile}")
    private String frontendProfileCompletionUri;

    public OAuth2AuthenticationSuccessHandler(GoogleOAuth2AccountService googleOAuth2AccountService,
                                              UserDetailsService userDetailsService,
                                              JwtUtil jwtUtil,
                                              RefreshTokenService refreshTokenService) {
        this.googleOAuth2AccountService = googleOAuth2AccountService;
        this.userDetailsService = userDetailsService;
        this.jwtUtil = jwtUtil;
        this.refreshTokenService = refreshTokenService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        try {
            OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
            GoogleLoginResult loginResult = googleOAuth2AccountService.prepareGoogleLogin(oauthUser);
            if (loginResult.profileCompletionRequired()) {
                clearServerLoginState(request);
                response.sendRedirect(profileCompletionRedirectUrl(loginResult.completionToken()));
                return;
            }

            User user = loginResult.user();
            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
            String accessToken = jwtUtil.generateAccessToken(userDetails);
            String refreshToken = refreshTokenService.createToken(user, request.getHeader("User-Agent")).getToken();

            clearServerLoginState(request);
            response.sendRedirect(successRedirectUrl(accessToken, refreshToken));
        } catch (Exception ex) {
            log.warn("Google OAuth2 login failed: {}", ex.getMessage());
            clearServerLoginState(request);
            response.sendRedirect(errorRedirectUrl("google_login_failed"));
        }
    }

    private void clearServerLoginState(HttpServletRequest request) {
        SecurityContextHolder.clearContext();
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }

    private String successRedirectUrl(String accessToken, String refreshToken) {
        String fragment = "accessToken=" + encode(accessToken)
                + "&refreshToken=" + encode(refreshToken);
        return withoutFragment(frontendRedirectUri) + "#" + fragment;
    }

    private String profileCompletionRedirectUrl(String completionToken) {
        return withoutFragment(frontendProfileCompletionUri) + "#token=" + encode(completionToken);
    }

    private String errorRedirectUrl(String error) {
        String base = withoutFragment(frontendRedirectUri);
        String separator = base.contains("?") ? "&" : "?";
        return base + separator + "error=" + encode(error);
    }

    private String withoutFragment(String url) {
        int fragmentIndex = url.indexOf('#');
        return fragmentIndex >= 0 ? url.substring(0, fragmentIndex) : url;
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
