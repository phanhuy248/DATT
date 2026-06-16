package com.smartshop.demo.repository;

import com.smartshop.demo.domain.Coupon;
import com.smartshop.demo.domain.CouponUsage;
import com.smartshop.demo.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CouponUsageRepository extends JpaRepository<CouponUsage, Long> {
    boolean existsByUserAndCoupon(User user, Coupon coupon);
    Optional<CouponUsage> findByUserAndCoupon(User user, Coupon coupon);
}
