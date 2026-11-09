package com.example.demochatbot.controller;

import com.example.demochatbot.model.Promotion;
import com.example.demochatbot.repository.PromotionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * ============================================================================
 * Controller: PromotionController
 * Quản lý các mã voucher, ưu đãi và chương trình khuyến mãi
 * Cung cấp API cho cả người dùng (User) và quản trị viên (Admin)
 * ============================================================================
 */
@RestController
@CrossOrigin(origins = "*")
public class PromotionController {

    @Autowired
    private PromotionRepository promotionRepository;

    /**
     * API User & Public: Lấy danh sách voucher ưu đãi đang kích hoạt từ CSDL
     */
    @GetMapping({"/api/home/promotions", "/api/home/vouchers"})
    public ResponseEntity<?> getActivePromotions() {
        try {
            List<Promotion> active = promotionRepository.findByStatusIgnoreCase("ACTIVE");
            return ResponseEntity.ok(active);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tải danh sách khuyến mãi: " + e.getMessage()));
        }
    }

    /**
     * API Admin: Lấy toàn bộ danh sách voucher khuyến mãi từ CSDL
     */
    @GetMapping({"/api/promotions", "/api/admin/promotions"})
    public ResponseEntity<?> getAllPromotions() {
        try {
            List<Promotion> list = promotionRepository.findAll();
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tải toàn bộ danh sách ưu đãi: " + e.getMessage()));
        }
    }

    /**
     * API Admin: Thêm mã voucher / khuyến mãi mới vào Database
     */
    @PostMapping({"/api/promotions", "/api/admin/promotions"})
    public ResponseEntity<?> createPromotion(@RequestBody Map<String, Object> body) {
        try {
            String code = (String) body.getOrDefault("promotion_id", body.get("code"));
            if (code == null || code.trim().isEmpty()) {
                code = "HALM" + (int)(Math.random() * 9000 + 1000);
            }
            code = code.trim().toUpperCase();

            if (promotionRepository.existsById(code)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Mã voucher '" + code + "' đã tồn tại!"));
            }

            Promotion p = new Promotion();
            p.setPromotion_id(code);
            p.setPromotion_name((String) body.getOrDefault("promotion_name", body.getOrDefault("name", "Voucher Ưu Đãi " + code)));
            p.setDescription((String) body.getOrDefault("description", body.getOrDefault("desc", "Giảm giá đặc biệt cho độc giả HALM BOOK.")));

            Object discPct = body.get("discount_percent");
            if (discPct instanceof Number) {
                p.setDiscount_percent(((Number) discPct).intValue());
            } else if (discPct instanceof String && !((String) discPct).isEmpty()) {
                p.setDiscount_percent(Integer.parseInt(((String) discPct).replace("%", "").trim()));
            } else {
                p.setDiscount_percent(10);
            }

            Object discAmt = body.get("discount_amount");
            if (discAmt instanceof Number) {
                p.setDiscount_amount(((Number) discAmt).intValue());
            } else {
                p.setDiscount_amount(0);
            }

            p.setStart_date(LocalDateTime.now());
            p.setEnd_date(LocalDateTime.now().plusMonths(6));
            p.setStatus((String) body.getOrDefault("status", "ACTIVE"));

            Promotion saved = promotionRepository.save(p);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Không thể tạo voucher: " + e.getMessage()));
        }
    }

    /**
     * API Admin: Cập nhật mã voucher / khuyến mãi
     */
    @PutMapping({"/api/promotions/{id}", "/api/admin/promotions/{id}"})
    public ResponseEntity<?> updatePromotion(@PathVariable String id, @RequestBody Map<String, Object> body) {
        try {
            Optional<Promotion> opt = promotionRepository.findById(id);
            if (opt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Không tìm thấy voucher: " + id));
            }

            Promotion p = opt.get();
            if (body.containsKey("promotion_name")) p.setPromotion_name((String) body.get("promotion_name"));
            if (body.containsKey("description")) p.setDescription((String) body.get("description"));
            if (body.containsKey("status")) p.setStatus((String) body.get("status"));
            if (body.containsKey("discount_percent")) {
                Object v = body.get("discount_percent");
                p.setDiscount_percent(v instanceof Number ? ((Number) v).intValue() : Integer.parseInt(v.toString()));
            }
            if (body.containsKey("discount_amount")) {
                Object v = body.get("discount_amount");
                p.setDiscount_amount(v instanceof Number ? ((Number) v).intValue() : Integer.parseInt(v.toString()));
            }

            Promotion updated = promotionRepository.save(p);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi cập nhật voucher: " + e.getMessage()));
        }
    }

    /**
     * API Admin: Xóa mã voucher
     */
    @DeleteMapping({"/api/promotions/{id}", "/api/admin/promotions/{id}"})
    public ResponseEntity<?> deletePromotion(@PathVariable String id) {
        try {
            if (!promotionRepository.existsById(id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Không tìm thấy voucher: " + id));
            }
            promotionRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Đã xóa voucher " + id + " thành công!", "id", id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi xóa voucher: " + e.getMessage()));
        }
    }
}
