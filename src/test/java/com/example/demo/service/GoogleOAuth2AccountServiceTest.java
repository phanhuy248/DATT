package com.example.demo.service;

import com.example.demo.domain.User;
import com.example.demo.dto.auth.CompleteGoogleProfileRequest;
import com.example.demo.repository.GoogleOAuth2ProfileCompletionRepository;
import com.example.demo.repository.RoleRepository;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class GoogleOAuth2AccountServiceTest {

    @Autowired
    private GoogleOAuth2AccountService googleOAuth2AccountService;

    @Autowired
    private GoogleOAuth2ProfileCompletionRepository profileCompletionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void prepareGoogleLoginCreatesProfileCompletionForNewUser() {
        OAuth2User oauth2User = new DefaultOAuth2User(
                AuthorityUtils.NO_AUTHORITIES,
                Map.of(
                        "sub", "test-google-sub",
                        "email", "google-profile-completion-test@gmail.com",
                        "email_verified", true,
                        "name", "Google Test User",
                        "picture", "https://lh3.googleusercontent.com/a/test-avatar=s96-c"),
                "sub");

        GoogleOAuth2AccountService.GoogleLoginResult result =
                googleOAuth2AccountService.prepareGoogleLogin(oauth2User);

        assertThat(result.profileCompletionRequired()).isTrue();
        assertThat(result.completionToken()).isNotBlank();
        assertThat(profileCompletionRepository.findByEmailIgnoreCaseAndConsumedFalse(
                "google-profile-completion-test@gmail.com")).hasSize(1);
    }

    @Test
    void prepareGoogleLoginRequiresProfileCompletionForInactiveExistingUser() {
        User user = new User();
        user.setEmail("inactive-google-profile-test@gmail.com");
        user.setPassword(passwordEncoder.encode("secret-password"));
        user.setFullName("Inactive Google User");
        user.setPhone("");
        user.setAddress("");
        user.setActive(false);
        user.setRole(roleRepository.findByName("USER"));
        userRepository.save(user);

        OAuth2User oauth2User = new DefaultOAuth2User(
                AuthorityUtils.NO_AUTHORITIES,
                Map.of(
                        "sub", "inactive-google-sub",
                        "email", "inactive-google-profile-test@gmail.com",
                        "email_verified", true,
                        "name", "Inactive Google User",
                        "picture", "https://lh3.googleusercontent.com/a/inactive-avatar=s96-c"),
                "sub");

        GoogleOAuth2AccountService.GoogleLoginResult result =
                googleOAuth2AccountService.prepareGoogleLogin(oauth2User);

        assertThat(result.profileCompletionRequired()).isTrue();
        assertThat(result.completionToken()).isNotBlank();

        CompleteGoogleProfileRequest request = new CompleteGoogleProfileRequest();
        request.setToken(result.completionToken());
        request.setFullName("Inactive Google User Updated");
        request.setPhone("0911430000");
        request.setAddress("Ha Noi");

        User completedUser = googleOAuth2AccountService.completeProfile(request);

        assertThat(completedUser.isActive()).isTrue();
        assertThat(completedUser.getPhone()).isEqualTo("0911430000");
        assertThat(completedUser.getAddress()).isEqualTo("Ha Noi");
    }
}
