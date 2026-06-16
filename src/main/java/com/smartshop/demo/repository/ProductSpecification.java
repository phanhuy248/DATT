package com.smartshop.demo.repository;

import com.smartshop.demo.domain.Product;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.math.BigDecimal;
import java.text.Normalizer;

public class ProductSpecification {

    public static Specification<Product> filter(String keyword, Long categoryId, String categoryName,
            BigDecimal minPrice, BigDecimal maxPrice, String brand, String ram, String target) {
        return filter(keyword, categoryId, categoryName, minPrice, maxPrice, brand, ram, target, false);
    }

    public static Specification<Product> filter(String keyword, Long categoryId, String categoryName,
            BigDecimal minPrice, BigDecimal maxPrice, String brand, String ram, String target,
            boolean includeInactive) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            Join<Object, Object> category = root.join("category", JoinType.LEFT);
            predicates.add(cb.or(
                    cb.isFalse(root.get("deleted")),
                    cb.isNull(root.get("deleted"))));
            if (!includeInactive) {
                predicates.add(cb.or(
                        cb.isTrue(root.get("active")),
                        cb.isNull(root.get("active"))));
            }

            if (keyword != null && !keyword.isBlank()) {
                String normalizedKeyword = stripVietnamese(keyword.trim().toLowerCase(Locale.ROOT));

                if (isTabletKeyword(normalizedKeyword)) {
                    predicates.add(categoryNameLike(cb, category, "may tinh bang", "tablet"));
                } else if (isLaptopKeyword(normalizedKeyword)) {
                    predicates.add(categoryNameLike(cb, category, "laptop"));
                } else if (isSmartphoneKeyword(normalizedKeyword)) {
                    predicates.add(categoryNameLike(cb, category, "dien thoai", "smartphone"));
                } else {
                    List<Predicate> keywordPredicates = new ArrayList<>();
                    boolean searchDetails = shouldSearchDetails(normalizedKeyword);

                    for (String term : expandSearchTerms(keyword)) {
                        String like = "%" + term.toLowerCase(Locale.ROOT) + "%";
                        List<Predicate> fieldPredicates = new ArrayList<>();
                        fieldPredicates.add(cb.like(cb.lower(root.get("name")), like));
                        fieldPredicates.add(cb.like(cb.lower(cb.coalesce(root.get("factory"), "")), like));
                        fieldPredicates.add(cb.like(cb.lower(cb.coalesce(category.get("name"), "")), like));

                        if (searchDetails) {
                            fieldPredicates.add(cb.like(cb.lower(cb.coalesce(root.get("shortDesc"), "")), like));
                            fieldPredicates.add(cb.like(cb.lower(cb.coalesce(root.get("detailDesc"), "")), like));
                            fieldPredicates.add(cb.like(cb.lower(cb.coalesce(root.get("target"), "")), like));
                            fieldPredicates.add(cb.like(cb.lower(cb.coalesce(root.get("specifications"), "")), like));
                        }

                        keywordPredicates.add(cb.or(fieldPredicates.toArray(new Predicate[0])));
                    }

                    predicates.add(cb.or(keywordPredicates.toArray(new Predicate[0])));
                }
            }

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            } else if (categoryName != null && !categoryName.isBlank()) {
                String like = "%" + categoryName.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.like(cb.lower(cb.coalesce(category.get("name"), "")), like));
            }

            if (brand != null && !brand.isBlank()) {
                String like = "%" + brand.trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("factory"), "")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("specifications"), "")), like)));
            }

            if (ram != null && !ram.isBlank()) {
                String compact = ram.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", "");
                String spaced = compact.replace("gb", " gb");
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), "%" + compact + "%"),
                        cb.like(cb.lower(root.get("name")), "%" + spaced + "%"),
                        cb.like(cb.lower(cb.coalesce(root.get("shortDesc"), "")), "%" + compact + "%"),
                        cb.like(cb.lower(cb.coalesce(root.get("shortDesc"), "")), "%" + spaced + "%"),
                        cb.like(cb.lower(cb.coalesce(root.get("detailDesc"), "")), "%" + compact + "%"),
                        cb.like(cb.lower(cb.coalesce(root.get("detailDesc"), "")), "%" + spaced + "%"),
                        cb.like(cb.lower(cb.coalesce(root.get("specifications"), "")), "%" + compact + "%"),
                        cb.like(cb.lower(cb.coalesce(root.get("specifications"), "")), "%" + spaced + "%")));
            }

            if (target != null && !target.isBlank()) {
                List<Predicate> targetPredicates = new ArrayList<>();
                for (String term : expandSearchTerms(target)) {
                    String like = "%" + term.toLowerCase(Locale.ROOT) + "%";
                    targetPredicates.add(cb.or(
                            cb.like(cb.lower(root.get("name")), like),
                            cb.like(cb.lower(cb.coalesce(root.get("target"), "")), like),
                            cb.like(cb.lower(cb.coalesce(root.get("specifications"), "")), like)));
                }
                predicates.add(cb.or(targetPredicates.toArray(new Predicate[0])));
            }

            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }

            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static Set<String> expandSearchTerms(String keyword) {
        String normalized = keyword.trim().toLowerCase(Locale.ROOT);
        String ascii = stripVietnamese(normalized);
        Set<String> terms = new LinkedHashSet<>();
        terms.add(normalized);
        terms.add(ascii);

        if (ascii.contains("may tinh bang") || ascii.contains("tablet")) {
            terms.add("tablet");
            terms.add("máy tính bảng");
            terms.add("may tinh bang");
        }

        if (ascii.contains("dien thoai") || ascii.contains("smartphone")) {
            terms.add("điện thoại");
            terms.add("dien thoai");
            terms.add("smartphone");
        }

        if (ascii.contains("phu kien") || ascii.contains("accessory")) {
            terms.add("phụ kiện");
            terms.add("phu kien");
            terms.add("accessory");
            terms.add("accessories");
        }

        if (ascii.contains("tai nghe") || ascii.contains("headphone")) {
            terms.add("tai nghe");
            terms.add("headphone");
            terms.add("headphones");
        }

        if (ascii.contains("chuot") || ascii.contains("mouse")) {
            terms.add("chuot");
            terms.add("mouse");
        }

        if (ascii.contains("ban phim") || ascii.contains("keyboard")) {
            terms.add("ban phim");
            terms.add("keyboard");
        }

        if (ascii.contains("am thanh") || ascii.contains("loa") || ascii.contains("speaker")) {
            terms.add("âm thanh");
            terms.add("am thanh");
            terms.add("loa");
            terms.add("speaker");
            terms.add("speakers");
        }

        if (ascii.contains("gaming") || ascii.contains("choi game") || ascii.contains("game")) {
            terms.add("gaming");
            terms.add("game");
        }

        if (ascii.contains("lap trinh java")) {
            terms.add("lap trinh java");
            terms.add("lap trinh");
            terms.add("java");
        } else if (ascii.contains("lap trinh") || ascii.contains("coding") || ascii.contains("developer")) {
            terms.add("lap trinh");
            terms.add("coding");
            terms.add("developer");
        }

        if (ascii.contains("sinh vien") || ascii.contains("hoc tap")) {
            terms.add("sinh vien");
            terms.add("hoc tap");
        }

        if (ascii.contains("chup anh") || ascii.contains("camera") || ascii.contains("selfie")) {
            terms.add("chup anh");
            terms.add("camera");
            terms.add("selfie");
        }

        if (ascii.contains("pin trau") || ascii.contains("pin lau") || ascii.contains("pin khoe")) {
            terms.add("pin trau");
            terms.add("pin lau");
            terms.add("pin");
        }

        if (ascii.contains("van phong") || ascii.contains("office")) {
            terms.add("van phong");
            terms.add("office");
        }

        terms.removeIf(String::isBlank);
        return terms;
    }

    private static Predicate categoryNameLike(jakarta.persistence.criteria.CriteriaBuilder cb,
                                              Join<Object, Object> category,
                                              String... terms) {
        List<Predicate> categoryPredicates = new ArrayList<>();
        for (String term : terms) {
            categoryPredicates.add(cb.like(cb.lower(cb.coalesce(category.get("name"), "")), "%" + term + "%"));
        }
        return cb.or(categoryPredicates.toArray(new Predicate[0]));
    }

    private static boolean isSmartphoneKeyword(String asciiKeyword) {
        return asciiKeyword.equals("dien thoai")
                || asciiKeyword.equals("smartphone")
                || asciiKeyword.equals("phone")
                || asciiKeyword.equals("iphone");
    }

    private static boolean isLaptopKeyword(String asciiKeyword) {
        return asciiKeyword.equals("may tinh")
                || asciiKeyword.equals("may tinh xach tay")
                || asciiKeyword.equals("laptop")
                || asciiKeyword.equals("notebook")
                || asciiKeyword.equals("macbook");
    }

    private static boolean isTabletKeyword(String asciiKeyword) {
        return asciiKeyword.equals("may tinh bang")
                || asciiKeyword.equals("tablet")
                || asciiKeyword.equals("ipad");
    }

    private static boolean shouldSearchDetails(String asciiKeyword) {
        return asciiKeyword.contains(" ") && asciiKeyword.length() >= 8;
    }

    private static String stripVietnamese(String value) {
        if (value == null) return "";
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('\u0111', 'd')
                .replace('\u0110', 'D');
    }

    @SuppressWarnings("unused")
    private static String legacyStripVietnamese(String value) {
        return value
                .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                .replaceAll("[ìíịỉĩ]", "i")
                .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                .replaceAll("[ùúụủũưừứựửữ]", "u")
                .replaceAll("[ỳýỵỷỹ]", "y")
                .replaceAll("đ", "d");
    }
}
