package com.example.demo.repository;

import com.example.demo.domain.Product;
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

public class ProductSpecification {

    public static Specification<Product> filter(String keyword, Long categoryId, String categoryName,
            BigDecimal minPrice, BigDecimal maxPrice, String brand, String ram, String target) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            Join<Object, Object> category = root.join("category", JoinType.LEFT);
            predicates.add(cb.or(
                    cb.isFalse(root.get("deleted")),
                    cb.isNull(root.get("deleted"))));

            if (keyword != null && !keyword.isBlank()) {
                List<Predicate> keywordPredicates = new ArrayList<>();

                for (String term : expandSearchTerms(keyword)) {
                    String like = "%" + term.toLowerCase(Locale.ROOT) + "%";
                    keywordPredicates.add(cb.or(
                            cb.like(cb.lower(root.get("name")), like),
                            cb.like(cb.lower(cb.coalesce(root.get("factory"), "")), like),
                            cb.like(cb.lower(cb.coalesce(root.get("shortDesc"), "")), like),
                            cb.like(cb.lower(cb.coalesce(root.get("detailDesc"), "")), like),
                            cb.like(cb.lower(cb.coalesce(root.get("target"), "")), like),
                            cb.like(cb.lower(cb.coalesce(root.get("specifications"), "")), like),
                            cb.like(cb.lower(cb.coalesce(category.get("name"), "")), like),
                            cb.like(cb.lower(cb.coalesce(category.get("description"), "")), like)));
                }

                predicates.add(cb.or(keywordPredicates.toArray(new Predicate[0])));
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
                        cb.like(cb.lower(cb.coalesce(root.get("specifications"), "")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("detailDesc"), "")), like)));
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
                            cb.like(cb.lower(cb.coalesce(root.get("shortDesc"), "")), like),
                            cb.like(cb.lower(cb.coalesce(root.get("detailDesc"), "")), like),
                            cb.like(cb.lower(cb.coalesce(root.get("specifications"), "")), like),
                            cb.like(cb.lower(cb.coalesce(category.get("name"), "")), like),
                            cb.like(cb.lower(cb.coalesce(category.get("description"), "")), like)));
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

        if (ascii.contains("may tinh") || ascii.contains("computer") || ascii.contains("pc")) {
            terms.add("laptop");
            terms.add("notebook");
            terms.add("macbook");
            terms.add("tablet");
            terms.add("máy tính bảng");
            terms.add("may tinh bang");
        }

        if (ascii.contains("dien thoai") || ascii.contains("smartphone") || ascii.contains("phone")) {
            terms.add("điện thoại");
            terms.add("dien thoai");
            terms.add("smartphone");
            terms.add("phone");
            terms.add("iphone");
        }

        if (ascii.contains("tai nghe") || ascii.contains("phu kien") || ascii.contains("accessory")) {
            terms.add("phụ kiện");
            terms.add("phu kien");
            terms.add("tai nghe");
            terms.add("headphone");
            terms.add("headphones");
            terms.add("mouse");
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

    private static String stripVietnamese(String value) {
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
