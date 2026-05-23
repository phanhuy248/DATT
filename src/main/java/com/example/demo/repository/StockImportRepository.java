package com.example.demo.repository;

import com.example.demo.domain.StockImport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockImportRepository extends JpaRepository<StockImport, Long> {
    List<StockImport> findByProductIdOrderByCreatedAtDesc(long productId);
}
