package com.smartshop.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

import com.smartshop.demo.domain.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
    boolean existsByEmailIgnoreCase(String email);
    User findByEmail(String email);
    User findByEmailIgnoreCase(String email);
    List<User> findByActiveTrue();
}
