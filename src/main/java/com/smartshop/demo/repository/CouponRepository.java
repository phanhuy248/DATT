package com.smartshop.demo.repository;

import com.smartshop.demo.domain.Coupon;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByCodeIgnoreCaseAndDeletedFalse(String code);
    boolean existsByCodeIgnoreCaseAndDeletedFalse(String code);
    List<Coupon> findByDeletedFalseOrderByIdDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Coupon c WHERE UPPER(c.code) = UPPER(:code) AND c.deleted = false")
    Optional<Coupon> findByCodeForUpdate(@Param("code") String code);
}
