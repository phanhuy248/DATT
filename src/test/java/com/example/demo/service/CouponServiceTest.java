package com.example.demo.service;

import com.example.demo.domain.Coupon;
import com.example.demo.domain.DiscountType;
import com.example.demo.repository.CouponRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CouponServiceTest {
    @Mock
    CouponRepository couponRepository;
    @InjectMocks
    CouponService couponService;

    @Test
    void calculateDiscountCapsFixedDiscountAtOrderAmount() {
        Coupon coupon = new Coupon();
        coupon.setCode("BIGSALE");
        coupon.setActive(true);
        coupon.setDiscountType(DiscountType.FIXED);
        coupon.setDiscountValue(BigDecimal.valueOf(200_000));
        coupon.setMinOrderAmount(BigDecimal.ZERO);
        when(couponRepository.findByCodeIgnoreCaseAndDeletedFalse("BIGSALE")).thenReturn(Optional.of(coupon));

        BigDecimal discount = couponService.calculateDiscount("BIGSALE", BigDecimal.valueOf(100_000));

        assertEquals(0, BigDecimal.valueOf(100_000).compareTo(discount));
    }
}
