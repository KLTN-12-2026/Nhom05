package com.example.demochatbot.controller;

import com.example.demochatbot.dto.CustomerTierSummaryDto;
import com.example.demochatbot.dto.TierDto;
import com.example.demochatbot.model.Customer;
import com.example.demochatbot.repository.CustomerRepository;
import com.example.demochatbot.service.customer.CustomerService;
import com.example.demochatbot.service.tier.TierService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * ============================================================================
 * Controller: TierController
 * Đường dẫn: /api/home/membership
 * Mô tả: Cung cấp API cho hệ thống Hạng thành viên & Điểm tích lũy độc giả:
 *        1. GET  /api/home/membership/tiers          - Danh sách 4 cấp bậc thành viên & quyền lợi
 *        2. GET  /api/home/membership/my-tier        - Tiến trình thăng hạng & điểm cày thực tế của user
 *        3. POST /api/home/membership/checkin-streak - Điểm danh duy trì chuỗi đọc sách và nhận XP
 * ============================================================================
 */
@RestController
@RequestMapping("/api/home/membership")
@CrossOrigin(origins = "*")
public class TierController {

    @Autowired
    private TierService tierService;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private CustomerRepository customerRepository;

    private Map<String, Object> createErrorMap(String message) {
        Map<String, Object> err = new HashMap<>();
        err.put("success", false);
        err.put("message", message);
        return err;
    }

    /**
     * API 1: Lấy danh sách toàn bộ 4 cấp bậc thành viên
     */
    @GetMapping("/tiers")
    public ResponseEntity<?> getAllTiers() {
        try {
            List<TierDto> tiers = tierService.getAllTiers();
            return ResponseEntity.ok(tiers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorMap("Lỗi khi tải danh sách hạng thành viên: " + e.getMessage()));
        }
    }

    /**
     * API 2: Lấy thông tin chi tiết cấp bậc, điểm cày (XP) và lộ trình thăng hạng của độc giả hiện tại
     */
    @GetMapping("/my-tier")
    public ResponseEntity<?> getMyTierSummary() {
        try {
            int accountId = customerService.getCurrentAccountId();
            if (accountId <= 0) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorMap("Vui lòng đăng nhập để xem hạng thành viên!"));
            }

            Customer customer = customerRepository.findCustomerById(accountId);
            if (customer == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorMap("Không tìm thấy hồ sơ khách hàng!"));
            }

            CustomerTierSummaryDto summary = tierService.getCustomerTierSummary(customer.getCustomer_id());
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorMap("Không thể tải thông tin hạng thành viên: " + e.getMessage()));
        }
    }

    /**
     * API 3: Điểm danh đọc sách hằng ngày, duy trì streak và cộng điểm cày (XP)
     */
    @PostMapping("/checkin-streak")
    public ResponseEntity<?> checkinStreak() {
        try {
            int accountId = customerService.getCurrentAccountId();
            if (accountId <= 0) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorMap("Vui lòng đăng nhập để điểm danh!"));
            }

            Customer customer = customerRepository.findCustomerById(accountId);
            if (customer == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorMap("Không tìm thấy hồ sơ khách hàng!"));
            }

            Map<String, Object> result = tierService.checkinDailyStreak(customer.getCustomer_id());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorMap("Lỗi khi thực hiện điểm danh: " + e.getMessage()));
        }
    }
}
