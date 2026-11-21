package com.example.demochatbot.repository;

import com.example.demochatbot.model.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ============================================================================
 * Repository: PromotionRepository
 * Quản lý các voucher, mã giảm giá và chương trình ưu đãi trong Database
 * ============================================================================
 */
@Repository
public interface PromotionRepository extends JpaRepository<Promotion, String> {

    List<Promotion> findByStatusIgnoreCase(String status);

    @Query("SELECT p FROM Promotion p WHERE p.status IS NULL OR UPPER(p.status) = 'ACTIVE'")
    List<Promotion> findActivePromotions();
}
