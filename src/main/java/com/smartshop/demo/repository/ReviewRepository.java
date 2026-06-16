package com.smartshop.demo.repository;

import com.smartshop.demo.domain.Product;
import com.smartshop.demo.domain.Review;
import com.smartshop.demo.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProductOrderByCreatedDateDesc(Product product);
    boolean existsByUserAndProduct(User user, Product product);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product = :product")
    Double getAverageRatingByProduct(Product product);

    long countByProduct(Product product);
}
