package com.example.demochatbot.repository;

import com.example.demochatbot.model.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
