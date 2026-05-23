package com.example.demo.repository;

import com.example.demo.domain.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByCodeIgnoreCaseAndDeletedFalse(String code);
    boolean existsByCodeIgnoreCaseAndDeletedFalse(String code);
    List<Coupon> findByDeletedFalseOrderByIdDesc();
}
