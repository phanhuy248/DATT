package com.example.demo.service;

import com.example.demo.domain.Product;
import com.example.demo.domain.Review;
import com.example.demo.domain.User;
import com.example.demo.repository.ReviewRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReviewService {
    private final ReviewRepository reviewRepository;

    public ReviewService(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    public List<Review> getReviewsByProduct(Product product) {
        return reviewRepository.findByProductOrderByCreatedDateDesc(product);
    }

    public boolean hasUserReviewed(User user, Product product) {
        return reviewRepository.existsByUserAndProduct(user, product);
    }

    public Review save(Review review) {
        return reviewRepository.save(review);
    }

    public double getAverageRating(Product product) {
        Double avg = reviewRepository.getAverageRatingByProduct(product);
        return avg != null ? Math.round(avg * 10.0) / 10.0 : 0;
    }

    public long getReviewCount(Product product) {
        return reviewRepository.countByProduct(product);
    }
}
