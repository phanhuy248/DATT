package com.smartshop.demo.controller;

import com.smartshop.demo.domain.Product;
import com.smartshop.demo.domain.Review;
import com.smartshop.demo.domain.User;
import com.smartshop.demo.dto.ApiResponse;
import com.smartshop.demo.dto.review.ReviewDTO;
import com.smartshop.demo.dto.review.ReviewRequest;
import com.smartshop.demo.exception.ResourceNotFoundException;
import com.smartshop.demo.service.ProductService;
import com.smartshop.demo.service.ReviewService;
import com.smartshop.demo.service.OrderService;
import com.smartshop.demo.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;
    private final ProductService productService;
    private final UserService userService;
    private final OrderService orderService;

    public ReviewController(ReviewService reviewService,
                            ProductService productService,
                            UserService userService,
                            OrderService orderService) {
        this.reviewService = reviewService;
        this.productService = productService;
        this.userService = userService;
        this.orderService = orderService;
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<List<ReviewDTO>>> getByProduct(@PathVariable long productId) {
        Product product = productService.findById(productId);
        if (product == null) throw new ResourceNotFoundException("Không tìm thấy sản phẩm");
        List<ReviewDTO> reviews = reviewService.getReviewsByProduct(product)
                .stream().map(ReviewDTO::from).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(reviews));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReviewDTO>> addReview(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ReviewRequest req) {
        User user = userService.findByEmail(userDetails.getUsername());
        Product product = productService.findById(req.getProductId());
        if (product == null) throw new ResourceNotFoundException("Không tìm thấy sản phẩm");
        if (!orderService.hasDeliveredProduct(user, product.getId())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Bạn chỉ có thể đánh giá sản phẩm đã mua và đã giao thành công"));
        }
        if (reviewService.hasUserReviewed(user, product)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Bạn đã đánh giá sản phẩm này rồi"));
        }
        Review review = new Review();
        review.setUser(user);
        review.setProduct(product);
        review.setRating(req.getRating());
        review.setComment(req.getComment());
        return ResponseEntity.status(201).body(
                ApiResponse.ok("Đánh giá thành công", ReviewDTO.from(reviewService.save(review))));
    }
}
