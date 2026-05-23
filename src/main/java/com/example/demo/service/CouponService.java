package com.example.demo.service;

import com.example.demo.domain.Coupon;
import com.example.demo.domain.DiscountType;
import com.example.demo.dto.coupon.CouponRequest;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.CouponRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CouponService {
    private final CouponRepository couponRepository;

    public CouponService(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    public List<Coupon> getAll() {
        return couponRepository.findByDeletedFalseOrderByIdDesc();
    }

    public Coupon findById(long id) {
        return couponRepository.findById(id).filter(c -> !c.isDeleted()).orElse(null);
    }

    @Transactional
    public Coupon save(Coupon coupon) {
        coupon.setCode(normalizeCode(coupon.getCode()));
        return couponRepository.save(coupon);
    }

    @Transactional
    public Coupon create(CouponRequest req) {
        String code = normalizeCode(req.getCode());
        if (couponRepository.existsByCodeIgnoreCaseAndDeletedFalse(code)) {
            throw new IllegalArgumentException("Mã giảm giá đã tồn tại");
        }
        Coupon coupon = new Coupon();
        applyRequest(coupon, req);
        return save(coupon);
    }

    @Transactional
    public Coupon update(long id, CouponRequest req) {
        Coupon coupon = couponRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mã giảm giá"));
        String code = normalizeCode(req.getCode());
        couponRepository.findByCodeIgnoreCaseAndDeletedFalse(code)
                .filter(existing -> existing.getId() != id)
                .ifPresent(existing -> { throw new IllegalArgumentException("Mã giảm giá đã tồn tại"); });
        applyRequest(coupon, req);
        return save(coupon);
    }

    @Transactional
    public void delete(long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mã giảm giá"));
        coupon.setDeleted(true);
        couponRepository.save(coupon);
    }

    public BigDecimal calculateDiscount(String code, BigDecimal orderAmount) {
        if (code == null || code.isBlank()) return BigDecimal.ZERO;
        Coupon coupon = getUsableCoupon(code, orderAmount);
        BigDecimal discount = coupon.getDiscountType() == DiscountType.PERCENT
                ? orderAmount.multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                : coupon.getDiscountValue();
        if (discount.compareTo(orderAmount) > 0) return orderAmount;
        return discount.max(BigDecimal.ZERO);
    }

    @Transactional
    public void markUsed(String code) {
        if (code == null || code.isBlank()) return;
        Coupon coupon = couponRepository.findByCodeIgnoreCaseAndDeletedFalse(normalizeCode(code))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mã giảm giá"));
        coupon.setUsedCount(coupon.getUsedCount() + 1);
        couponRepository.save(coupon);
    }

    public Coupon getUsableCoupon(String code, BigDecimal orderAmount) {
        Coupon coupon = couponRepository.findByCodeIgnoreCaseAndDeletedFalse(normalizeCode(code))
                .orElseThrow(() -> new ResourceNotFoundException("Mã giảm giá không tồn tại"));
        LocalDateTime now = LocalDateTime.now();
        if (!coupon.isActive()) throw new IllegalArgumentException("Mã giảm giá đang bị tắt");
        if (coupon.getStartDate() != null && now.isBefore(coupon.getStartDate())) throw new IllegalArgumentException("Mã giảm giá chưa có hiệu lực");
        if (coupon.getEndDate() != null && now.isAfter(coupon.getEndDate())) throw new IllegalArgumentException("Mã giảm giá đã hết hạn");
        if (coupon.getUsageLimit() > 0 && coupon.getUsedCount() >= coupon.getUsageLimit()) throw new IllegalArgumentException("Mã giảm giá đã hết lượt sử dụng");
        if (coupon.getMinOrderAmount() != null && orderAmount.compareTo(coupon.getMinOrderAmount()) < 0) {
            throw new IllegalArgumentException("Đơn hàng chưa đạt giá trị tối thiểu để dùng mã");
        }
        return coupon;
    }

    private void applyRequest(Coupon coupon, CouponRequest req) {
        coupon.setCode(normalizeCode(req.getCode()));
        coupon.setDescription(req.getDescription());
        coupon.setDiscountType(parseType(req.getDiscountType()));
        coupon.setDiscountValue(req.getDiscountValue());
        coupon.setMinOrderAmount(req.getMinOrderAmount() != null ? req.getMinOrderAmount() : BigDecimal.ZERO);
        coupon.setStartDate(req.getStartDate());
        coupon.setEndDate(req.getEndDate());
        coupon.setUsageLimit(req.getUsageLimit());
        coupon.setActive(req.isActive());
    }

    private DiscountType parseType(String type) {
        try {
            return DiscountType.valueOf(type);
        } catch (Exception e) {
            throw new IllegalArgumentException("Loại giảm giá không hợp lệ");
        }
    }

    private String normalizeCode(String code) {
        return code == null ? "" : code.trim().toUpperCase();
    }
}
