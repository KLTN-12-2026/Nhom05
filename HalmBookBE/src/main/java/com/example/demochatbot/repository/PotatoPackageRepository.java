package com.example.demochatbot.repository;

import com.example.demochatbot.model.PotatoPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ============================================================================
 * Repository: PotatoPackageRepository
 * Mô tả: Truy vấn và quản lý các gói nạp Khoai Tây trong cơ sở dữ liệu
 * ============================================================================
 */
@Repository
public interface PotatoPackageRepository extends JpaRepository<PotatoPackage, Integer> {

    /**
     * Lấy danh sách các gói nạp đang hoạt động (isActive = true), sắp xếp theo giá tăng dần
     */
    List<PotatoPackage> findByIsActiveTrueOrderByPriceVndAsc();
}
