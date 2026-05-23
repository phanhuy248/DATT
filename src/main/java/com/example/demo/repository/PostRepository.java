package com.example.demo.repository;

import com.example.demo.domain.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByDeletedFalseOrderByIdDesc();
    List<Post> findByDeletedFalseAndPublishedTrueOrderByCreatedAtDesc();
    Optional<Post> findBySlugAndDeletedFalseAndPublishedTrue(String slug);
    boolean existsBySlugAndDeletedFalse(String slug);
}
