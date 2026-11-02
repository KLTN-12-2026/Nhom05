package com.example.demochatbot.repository;

import com.example.demochatbot.model.MembershipTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * ============================================================================
 * Repository: MembershipTierRepository
 * Quản lý các cấp bậc thành viên độc giả (Thợ Cày 🌱, Cao Thủ Cày 🚜, Lão Nông 🌾, Đại Điền Chủ 👑)
 * ============================================================================
 */
@Repository
public interface MembershipTierRepository extends JpaRepository<MembershipTier, Integer> {

    List<MembershipTier> findAllByOrderByTierIdAsc();

    Optional<MembershipTier> findByTierName(String tierName);
}
