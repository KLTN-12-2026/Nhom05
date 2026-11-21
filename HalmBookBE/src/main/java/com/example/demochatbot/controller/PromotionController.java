package com.example.demochatbot.controller;

import com.example.demochatbot.model.Promotion;
import com.example.demochatbot.model.Book;
import com.example.demochatbot.repository.BookRepository;
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

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private com.example.demochatbot.repository.CategoryRepository categoryRepository;

    private Book resolveBook(Object bookId) {
        if (bookId == null) return null;
        if (!(bookId instanceof String id)) throw new IllegalArgumentException("book_id phải là chuỗi.");
        if (id.isBlank()) return null;
        return bookRepository.findById(id.trim())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sách: " + id.trim()));
    }

    /**
     * API User & Public: Lấy danh sách voucher ưu đãi đang kích hoạt từ CSDL
     */
    @GetMapping({"/api/home/promotions", "/api/home/vouchers"})
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<?> getActivePromotions() {
        try {
            List<Promotion> active = promotionRepository.findByStatusIgnoreCase("ACTIVE");
            active.forEach(this::metadata);
            return ResponseEntity.ok().header("Cache-Control", "private, no-store").body(active.stream()
                .filter(p -> com.example.demochatbot.service.offer.BookOfferService.active(p.getStatus(), p.getStart_date(), p.getEnd_date()))
                .filter(p -> p.getBook() == null || com.example.demochatbot.service.offer.BookOfferService.published(p.getBook())).toList());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tải danh sách khuyến mãi: " + e.getMessage()));
        }
    }

    /**
     * API Admin: Lấy toàn bộ danh sách voucher khuyến mãi từ CSDL
     */
    @GetMapping({"/api/promotions", "/api/admin/promotions"})
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<?> getAllPromotions() {
        try {
            List<Promotion> list = promotionRepository.findAll().stream().filter(p -> !"DELETED".equals(p.getStatus())).toList();
            list.forEach(this::metadata);
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
            code = code.trim().toUpperCase(Locale.ROOT);

            if (promotionRepository.existsById(code)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Mã voucher '" + code + "' đã tồn tại!"));
            }

            Promotion p = new Promotion();
            p.setBook(resolveBook(body.get("book_id")));
            if (body.containsKey("category_id")) p.setCategory(resolveCategory(body.get("category_id")));
            p.setPromotion_id(code);
            p.setPromotion_name((String) body.getOrDefault("promotion_name", body.getOrDefault("name", "Voucher Ưu Đãi " + code)));
            p.setDescription((String) body.getOrDefault("description", body.getOrDefault("desc", "Giảm giá đặc biệt cho độc giả HALM BOOK.")));

            Object discPct = body.get("discount_percent");
            if (discPct instanceof Number) {
                p.setDiscount_percent(com.example.demochatbot.service.offer.BookOfferService.integer(discPct, 0));
            } else if (discPct instanceof String && !((String) discPct).isEmpty()) {
                p.setDiscount_percent(Integer.parseInt(((String) discPct).replace("%", "").trim()));
            } else {
                p.setDiscount_percent(body.containsKey("discount_amount") ? 0 : 10);
            }

            Object discAmt = body.get("discount_amount");
            if (discAmt != null) {
                p.setDiscount_amount(com.example.demochatbot.service.offer.BookOfferService.integer(discAmt, 0));
            } else {
                p.setDiscount_amount(0);
            }

            p.setStart_date(body.containsKey("start_date") ? com.example.demochatbot.service.offer.BookOfferService.date(body.get("start_date"), false) : com.example.demochatbot.service.offer.BookOfferService.now());
            p.setEnd_date(body.containsKey("end_date") ? com.example.demochatbot.service.offer.BookOfferService.date(body.get("end_date"), true) : com.example.demochatbot.service.offer.BookOfferService.now().plusMonths(6));
            p.setStatus((String) body.getOrDefault("status", "ACTIVE"));

            validate(p);
            Promotion saved = promotionRepository.save(p);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            throw e;
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
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

            if ("DELETED".equals(opt.get().getStatus())) return ResponseEntity.status(HttpStatus.GONE).body(Map.of("error", "Mã ưu đãi đã xóa."));
            Promotion p = new Promotion();
            org.springframework.beans.BeanUtils.copyProperties(opt.get(), p);
            if (body.containsKey("book_id")) p.setBook(resolveBook(body.get("book_id")));
            if (body.containsKey("category_id")) p.setCategory(resolveCategory(body.get("category_id")));
            if (body.containsKey("promotion_name")) p.setPromotion_name((String) body.get("promotion_name"));
            if (body.containsKey("description")) p.setDescription((String) body.get("description"));
            if (body.containsKey("status")) p.setStatus((String) body.get("status"));
            if (body.containsKey("discount_percent")) {
                Object v = body.get("discount_percent");
                p.setDiscount_percent(com.example.demochatbot.service.offer.BookOfferService.integer(v, 0));
            }
            if (body.containsKey("discount_amount")) {
                Object v = body.get("discount_amount");
                p.setDiscount_amount(com.example.demochatbot.service.offer.BookOfferService.integer(v, 0));
            }

            if (body.containsKey("start_date")) p.setStart_date(com.example.demochatbot.service.offer.BookOfferService.date(body.get("start_date"), false));
            if (body.containsKey("end_date")) p.setEnd_date(com.example.demochatbot.service.offer.BookOfferService.date(body.get("end_date"), true));
            validate(p);
            Promotion updated = promotionRepository.save(p);
            return ResponseEntity.ok(updated);
        } catch (org.springframework.web.server.ResponseStatusException e) {
            throw e;
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
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
            Promotion removed = promotionRepository.findById(id).orElseThrow();
            removed.setStatus("DELETED"); promotionRepository.save(removed);
            return ResponseEntity.ok(Map.of("message", "Đã xóa voucher " + id + " thành công!", "id", id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi xóa voucher: " + e.getMessage()));
        }
    }
    private com.example.demochatbot.model.Category resolveCategory(Object value) {
        if (value == null || value.toString().isBlank()) return null;
        int id = com.example.demochatbot.service.offer.BookOfferService.integer(value, 0);
        return categoryRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thể loại."));
    }
    private void validate(Promotion p) {
        if (p.getPromotion_id() == null || !p.getPromotion_id().matches("[A-Z0-9_-]{1,100}") || p.getPromotion_name() == null || p.getPromotion_name().isBlank()
            || p.getPromotion_name().length() > 150 || p.getDescription() != null && p.getDescription().length() > 255
            || p.getDiscount_percent() < 0 || p.getDiscount_percent() > 100 || p.getDiscount_amount() < 0 || p.getDiscount_amount() > 1000000
            || p.getDiscount_percent() == 0 && p.getDiscount_amount() == 0 || p.getDiscount_percent() > 0 && p.getDiscount_amount() > 0
            || !Set.of("ACTIVE", "INACTIVE").contains(Objects.toString(p.getStatus(), "").toUpperCase(Locale.ROOT))) throw new IllegalArgumentException("Thông tin mã ưu đãi không hợp lệ. Chỉ chọn một kiểu giảm: phần trăm hoặc Khoai.");
        if (p.getStart_date() != null && p.getEnd_date() != null && !p.getEnd_date().isAfter(p.getStart_date())) throw new IllegalArgumentException("Ngày kết thúc phải sau ngày bắt đầu.");
        if (p.getBook() != null && p.getCategory() != null && (p.getBook().getCategory() == null || !Objects.equals(p.getBook().getCategory().getCategory_id(), p.getCategory().getCategory_id()))) throw new IllegalArgumentException("Sách không thuộc thể loại đã chọn.");
        p.setStatus(p.getStatus().toUpperCase(Locale.ROOT));
    }

    private void metadata(Promotion p) {
        if (p.getBook() != null) p.setBookDetails(com.example.demochatbot.service.offer.BookOfferService.bookView(p.getBook()));
        if (p.getBook() == null && p.getCategory() != null) {
            var page = bookRepository.findBooksByCategoryId(p.getCategory().getCategory_id(), org.springframework.data.domain.PageRequest.of(0, 100));
            if (page != null) p.setEligibleBooks(page.getContent().stream().filter(com.example.demochatbot.service.offer.BookOfferService::published).map(com.example.demochatbot.service.offer.BookOfferService::bookView).toList());
        }
    }

}
