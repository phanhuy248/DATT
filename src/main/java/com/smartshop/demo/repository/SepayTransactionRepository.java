package com.smartshop.demo.repository;

import com.smartshop.demo.domain.SepayTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SepayTransactionRepository extends JpaRepository<SepayTransaction, Long> {

    boolean existsBySepayId(Long sepayId);
}
