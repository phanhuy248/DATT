package com.example.demo.dto.review;

import com.example.demo.domain.Review;

import java.time.LocalDateTime;

public class ReviewDTO {
    private long id;
    private int rating;
    private String comment;
    private LocalDateTime createdDate;
    private String userFullName;
    private String userAvatar;

    public static ReviewDTO from(Review r) {
        ReviewDTO dto = new ReviewDTO();
        dto.id = r.getId();
        dto.rating = r.getRating();
        dto.comment = r.getComment();
        dto.createdDate = r.getCreatedDate();
        if (r.getUser() != null) {
            dto.userFullName = r.getUser().getFullName();
            dto.userAvatar = r.getUser().getAvatar();
        }
        return dto;
    }

    public long getId() { return id; }
    public int getRating() { return rating; }
    public String getComment() { return comment; }
    public LocalDateTime getCreatedDate() { return createdDate; }
    public String getUserFullName() { return userFullName; }
    public String getUserAvatar() { return userAvatar; }
}
