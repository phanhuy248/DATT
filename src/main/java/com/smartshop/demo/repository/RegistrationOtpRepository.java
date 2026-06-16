package com.smartshop.demo.repository;

import com.smartshop.demo.domain.RegistrationOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegistrationOtpRepository extends JpaRepository<RegistrationOtp, Long> {
    List<RegistrationOtp> findByEmailIgnoreCaseAndConsumedFalse(String email);

    Optional<RegistrationOtp> findFirstByEmailIgnoreCaseAndConsumedFalseOrderByCreatedAtDesc(String email);
}
