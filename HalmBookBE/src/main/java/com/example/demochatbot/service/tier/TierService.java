package com.example.demochatbot.service.tier;

import com.example.demochatbot.dto.CustomerTierSummaryDto;
import com.example.demochatbot.dto.TierDto;
import com.example.demochatbot.model.Customer;
import com.example.demochatbot.model.MembershipTier;

import java.util.List;
import java.util.Map;

/**
 * ============================================================================
 * Interface: TierService
 * Định nghĩa nghiệp vụ quản lý cấp bậc thành viên và tính điểm độc giả
 * ============================================================================
 */
public interface TierService {

    /**
     * Lấy danh sách tất cả các hạng thành viên kèm quyền lợi
     */
    List<TierDto> getAllTiers();

    /**
     * Lấy bảng tổng quan tiến trình thăng hạng và điểm tích lũy của khách hàng
     */
    CustomerTierSummaryDto getCustomerTierSummary(String customerId);

    /**
     * Thuật toán kiểm tra và tự động thăng hạng cho độc giả khi đủ sách hoặc điểm XP
     */
    MembershipTier calculateAndUpdateCustomerTier(Customer customer);

    /**
     * Điểm danh hằng ngày: cộng Khoai, cộng XP, cập nhật chuỗi streak và kiểm tra thăng hạng
     */
    Map<String, Object> checkinDailyStreak(String customerId);

    /**
     * Thêm điểm cày (XP) khi độc giả hoàn thành các hành động (thuê sách, đánh giá, nạp khoai)
     */
    void addExperiencePoints(Customer customer, int points, String reason);
}
