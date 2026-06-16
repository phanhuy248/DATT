package com.smartshop.demo.service;

import com.smartshop.demo.domain.Coupon;
import com.smartshop.demo.domain.DiscountType;
import com.smartshop.demo.exception.ResourceNotFoundException;
import com.smartshop.demo.repository.CouponRepository;
import com.smartshop.demo.repository.CouponUsageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CouponServiceTest {

    @Mock CouponRepository couponRepository;
    @Mock CouponUsageRepository couponUsageRepository;
    @InjectMocks CouponService couponService;

    private Coupon percentCoupon;
    private Coupon fixedCoupon;

    @BeforeEach
    void setUp() {
        percentCoupon = new Coupon();
        percentCoupon.setCode("PERCENT10");
        percentCoupon.setActive(true);
        percentCoupon.setDiscountType(DiscountType.PERCENT);
        percentCoupon.setDiscountValue(BigDecimal.valueOf(10)); // 10%
        percentCoupon.setMinOrderAmount(BigDecimal.ZERO);
        percentCoupon.setUsageLimit(0); // không giới hạn
        percentCoupon.setUsedCount(0);

        fixedCoupon = new Coupon();
        fixedCoupon.setCode("FIXED50K");
        fixedCoupon.setActive(true);
        fixedCoupon.setDiscountType(DiscountType.FIXED);
        fixedCoupon.setDiscountValue(BigDecimal.valueOf(50_000));
        fixedCoupon.setMinOrderAmount(BigDecimal.ZERO);
        fixedCoupon.setUsageLimit(0);
        fixedCoupon.setUsedCount(0);
    }

    // ── calculateDiscount — PERCENT ───────────────────────────

    @Test
    void calculateDiscount_percentType_returnsCorrectAmount() {
        when(couponRepository.findByCodeIgnoreCaseAndDeletedFalse("PERCENT10"))
                .thenReturn(Optional.of(percentCoupon));

        BigDecimal discount = couponService.calculateDiscount("PERCENT10", BigDecimal.valueOf(1_000_000));

        // 10% của 1.000.000 = 100.000
        assertThat(discount).isEqualByComparingTo(BigDecimal.valueOf(100_000));
    }

    @Test
    void calculateDiscount_fixedType_returnsFixedAmount() {
        when(couponRepository.findByCodeIgnoreCaseAndDeletedFalse("FIXED50K"))
                .thenReturn(Optional.of(fixedCoupon));

        BigDecimal discount = couponService.calculateDiscount("FIXED50K", BigDecimal.valueOf(500_000));

        assertThat(discount).isEqualByComparingTo(BigDecimal.valueOf(50_000));
    }

    @Test
    void calculateDiscount_fixedExceedsOrderAmount_capsAtOrderAmount() {
        when(couponRepository.findByCodeIgnoreCaseAndDeletedFalse("FIXED50K"))
                .thenReturn(Optional.of(fixedCoupon));

        // Đơn 30.000 < discount 50.000 → giảm tối đa = 30.000
        BigDecimal discount = couponService.calculateDiscount("FIXED50K", BigDecimal.valueOf(30_000));

        assertThat(discount).isEqualByComparingTo(BigDecimal.valueOf(30_000));
    }

    @Test
    void calculateDiscount_nullCode_returnsZero() {
        BigDecimal discount = couponService.calculateDiscount(null, BigDecimal.valueOf(500_000));
        assertThat(discount).isEqualByComparingTo(BigDecimal.ZERO);
        verifyNoInteractions(couponRepository);
    }

    @Test
    void calculateDiscount_blankCode_returnsZero() {
        BigDecimal discount = couponService.calculateDiscount("  ", BigDecimal.valueOf(500_000));
        assertThat(discount).isEqualByComparingTo(BigDecimal.ZERO);
    }

    // ── getUsableCoupon — validation ──────────────────────────

    @Test
    void getUsableCoupon_inactiveCoupon_throws() {
        percentCoupon.setActive(false);
        when(couponRepository.findByCodeIgnoreCaseAndDeletedFalse("PERCENT10"))
                .thenReturn(Optional.of(percentCoupon));

        assertThatThrownBy(() -> couponService.getUsableCoupon("PERCENT10", BigDecimal.valueOf(500_000)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("đang bị tắt");
    }

    @Test
    void getUsableCoupon_notStartedYet_throws() {
        percentCoupon.setStartDate(LocalDateTime.now().plusDays(1)); // chưa bắt đầu
        when(couponRepository.findByCodeIgnoreCaseAndDeletedFalse("PERCENT10"))
                .thenReturn(Optional.of(percentCoupon));

        assertThatThrownBy(() -> couponService.getUsableCoupon("PERCENT10", BigDecimal.valueOf(500_000)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("chưa có hiệu lực");
    }

    @Test
    void getUsableCoupon_expired_throws() {
        percentCoupon.setEndDate(LocalDateTime.now().minusDays(1)); // hết hạn hôm qua
        when(couponRepository.findByCodeIgnoreCaseAndDeletedFalse("PERCENT10"))
                .thenReturn(Optional.of(percentCoupon));

        assertThatThrownBy(() -> couponService.getUsableCoupon("PERCENT10", BigDecimal.valueOf(500_000)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("hết hạn");
    }

    @Test
    void getUsableCoupon_usageLimitReached_throws() {
        percentCoupon.setUsageLimit(10);
        percentCoupon.setUsedCount(10); // đã hết lượt
        when(couponRepository.findByCodeIgnoreCaseAndDeletedFalse("PERCENT10"))
                .thenReturn(Optional.of(percentCoupon));

        assertThatThrownBy(() -> couponService.getUsableCoupon("PERCENT10", BigDecimal.valueOf(500_000)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("hết lượt");
    }

    @Test
    void getUsableCoupon_orderBelowMinimum_throws() {
        percentCoupon.setMinOrderAmount(BigDecimal.valueOf(500_000));
        when(couponRepository.findByCodeIgnoreCaseAndDeletedFalse("PERCENT10"))
                .thenReturn(Optional.of(percentCoupon));

        // Đơn 100.000 < min 500.000
        assertThatThrownBy(() -> couponService.getUsableCoupon("PERCENT10", BigDecimal.valueOf(100_000)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("giá trị tối thiểu");
    }

    @Test
    void getUsableCoupon_codeNotFound_throws() {
        when(couponRepository.findByCodeIgnoreCaseAndDeletedFalse("NOTEXIST"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> couponService.getUsableCoupon("NOTEXIST", BigDecimal.valueOf(500_000)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── markUsed ──────────────────────────────────────────────

    @Test
    void markUsed_incrementsUsedCount() {
        percentCoupon.setUsedCount(3);
        when(couponRepository.findByCodeForUpdate("PERCENT10"))
                .thenReturn(Optional.of(percentCoupon));
        when(couponRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // user=null → bỏ qua kiểm tra per-user và không ghi coupon_usages
        couponService.markUsed("PERCENT10", null, 0L);

        assertThat(percentCoupon.getUsedCount()).isEqualTo(4);
    }

    @Test
    void markUsed_nullCode_doesNothing() {
        couponService.markUsed(null, null, 0L);
        verifyNoInteractions(couponRepository);
    }

    // ── normalizeCode ─────────────────────────────────────────

    @Test
    void calculateDiscount_lowercaseCode_normalizedToUppercase() {
        when(couponRepository.findByCodeIgnoreCaseAndDeletedFalse("PERCENT10"))
                .thenReturn(Optional.of(percentCoupon));

        // Truyền vào chữ thường → service phải normalize thành "PERCENT10"
        BigDecimal discount = couponService.calculateDiscount("percent10", BigDecimal.valueOf(1_000_000));

        assertThat(discount).isEqualByComparingTo(BigDecimal.valueOf(100_000));
        verify(couponRepository).findByCodeIgnoreCaseAndDeletedFalse("PERCENT10");
    }
}
