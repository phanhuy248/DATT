package com.smartshop.demo.repository;

import com.smartshop.demo.domain.GoogleOAuth2ProfileCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GoogleOAuth2ProfileCompletionRepository extends JpaRepository<GoogleOAuth2ProfileCompletion, Long> {
    Optional<GoogleOAuth2ProfileCompletion> findByTokenHashAndConsumedFalse(String tokenHash);

    List<GoogleOAuth2ProfileCompletion> findByEmailIgnoreCaseAndConsumedFalse(String email);
}
