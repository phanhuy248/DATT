package com.example.demo.service;

import com.example.demo.domain.GoogleOAuth2ProfileCompletion;
import com.example.demo.domain.Role;
import com.example.demo.domain.User;
import com.example.demo.dto.auth.CompleteGoogleProfileRequest;
import com.example.demo.repository.GoogleOAuth2ProfileCompletionRepository;
import com.example.demo.repository.RoleRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class GoogleOAuth2AccountService {

    private static final String DEFAULT_ROLE = "USER";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final GoogleOAuth2ProfileCompletionRepository profileCompletionRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.oauth2.profile-completion-expiration-minutes:15}")
    private long profileCompletionExpirationMinutes;

    public GoogleOAuth2AccountService(UserRepository userRepository,
                                      RoleRepository roleRepository,
                                      GoogleOAuth2ProfileCompletionRepository profileCompletionRepository,
                                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.profileCompletionRepository = profileCompletionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public GoogleLoginResult prepareGoogleLogin(OAuth2User oauthUser) {
        GoogleProfile googleProfile = resolveGoogleProfile(oauthUser);
        User user = userRepository.findByEmailIgnoreCase(googleProfile.email());

        String completionToken = createProfileCompletionToken(user, googleProfile);
        return GoogleLoginResult.profileCompletionRequired(completionToken);
    }

    @Transactional
    public User completeProfile(CompleteGoogleProfileRequest req) {
        String tokenHash = hashToken(req.getToken());
        GoogleOAuth2ProfileCompletion completion = profileCompletionRepository
                .findByTokenHashAndConsumedFalse(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("Token hoan tat ho so Google khong hop le"));

        if (completion.getExpiresAt().isBefore(LocalDateTime.now())) {
            completion.setConsumed(true);
            profileCompletionRepository.save(completion);
            throw new IllegalArgumentException("Token hoan tat ho so Google da het han");
        }

        User user = resolveCompletingUser(completion);
        user.setFullName(req.getFullName().trim());
        user.setPhone(req.getPhone().trim());
        user.setAddress(req.getAddress().trim());
        if (StringUtils.hasText(completion.getAvatar())) {
            user.setAvatar(completion.getAvatar());
        }
        if (user.getRole() == null) {
            user.setRole(defaultUserRole());
        }
        user.setActive(true);

        completion.setConsumed(true);
        profileCompletionRepository.save(completion);
        return userRepository.save(user);
    }

    private User resolveCompletingUser(GoogleOAuth2ProfileCompletion completion) {
        if (completion.getExistingUserId() != null) {
            User user = userRepository.findById(completion.getExistingUserId())
                    .orElseThrow(() -> new IllegalArgumentException("Khong tim thay tai khoan can hoan tat"));
            return user;
        }

        User existingUser = userRepository.findByEmailIgnoreCase(completion.getEmail());
        if (existingUser != null) {
            return existingUser;
        }

        User user = new User();
        user.setEmail(completion.getEmail());
        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setRole(defaultUserRole());
        return user;
    }

    private String createProfileCompletionToken(User user, GoogleProfile googleProfile) {
        profileCompletionRepository
                .findByEmailIgnoreCaseAndConsumedFalse(googleProfile.email())
                .forEach(completion -> completion.setConsumed(true));

        String rawToken = generateSecureToken();
        GoogleOAuth2ProfileCompletion completion = new GoogleOAuth2ProfileCompletion();
        completion.setTokenHash(hashToken(rawToken));
        completion.setEmail(googleProfile.email());
        completion.setFullName(googleProfile.fullName());
        completion.setAvatar(googleProfile.avatar());
        completion.setExistingUserId(user != null ? user.getId() : null);
        completion.setCreatedAt(LocalDateTime.now());
        completion.setExpiresAt(LocalDateTime.now().plusMinutes(profileCompletionExpirationMinutes));
        completion.setConsumed(false);
        profileCompletionRepository.save(completion);
        return rawToken;
    }

    private GoogleProfile resolveGoogleProfile(OAuth2User oauthUser) {
        Map<String, Object> attributes = oauthUser.getAttributes();
        String email = stringAttribute(attributes, "email");
        if (!StringUtils.hasText(email)) {
            throw new IllegalArgumentException("Google account does not expose an email address");
        }
        if (!isEmailVerified(attributes.get("email_verified"))) {
            throw new IllegalArgumentException("Google email is not verified");
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        String fullName = resolveFullName(attributes, normalizedEmail);
        String picture = stringAttribute(attributes, "picture");
        return new GoogleProfile(normalizedEmail, fullName, picture);
    }

    private Role defaultUserRole() {
        Role role = roleRepository.findByName(DEFAULT_ROLE);
        if (role != null) {
            return role;
        }

        Role newRole = new Role();
        newRole.setName(DEFAULT_ROLE);
        newRole.setDescription("User");
        return roleRepository.save(newRole);
    }

    private String resolveFullName(Map<String, Object> attributes, String email) {
        String name = stringAttribute(attributes, "name");
        if (StringUtils.hasText(name)) {
            return name;
        }

        String givenName = stringAttribute(attributes, "given_name");
        String familyName = stringAttribute(attributes, "family_name");
        String combinedName = (givenName + " " + familyName).trim();
        if (StringUtils.hasText(combinedName)) {
            return combinedName;
        }

        int atIndex = email.indexOf('@');
        return atIndex > 0 ? email.substring(0, atIndex) : email;
    }

    private String stringAttribute(Map<String, Object> attributes, String key) {
        Object value = attributes.get(key);
        return value == null ? "" : value.toString().trim();
    }

    private boolean isEmailVerified(Object value) {
        if (value == null) {
            return true;
        }
        if (value instanceof Boolean verified) {
            return verified;
        }
        return Boolean.parseBoolean(value.toString());
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }

    private record GoogleProfile(String email, String fullName, String avatar) {}

    public record GoogleLoginResult(boolean profileCompletionRequired, String completionToken, User user) {
        public static GoogleLoginResult authenticated(User user) {
            return new GoogleLoginResult(false, null, user);
        }

        public static GoogleLoginResult profileCompletionRequired(String completionToken) {
            return new GoogleLoginResult(true, completionToken, null);
        }
    }
}
