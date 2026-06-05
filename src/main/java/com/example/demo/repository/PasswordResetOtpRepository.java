package com.example.demo.repository;

import com.example.demo.domain.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {
    List<PasswordResetOtp> findByEmailIgnoreCaseAndConsumedFalse(String email);
    Optional<PasswordResetOtp> findFirstByEmailIgnoreCaseAndConsumedFalseOrderByCreatedAtDesc(String email);
}
