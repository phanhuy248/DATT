package com.smartshop.demo.repository;

import com.smartshop.demo.domain.CartItem;
import com.smartshop.demo.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUser(User user);
    Optional<CartItem> findByUserAndProductId(User user, long productId);
    void deleteByUser(User user);
    void deleteByUserAndProductId(User user, long productId);
}
