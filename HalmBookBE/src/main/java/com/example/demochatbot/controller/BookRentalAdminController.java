package com.example.demochatbot.controller;

import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.AccessRecordRepository;
import com.example.demochatbot.repository.CustomerRepository;
import com.example.demochatbot.repository.NotificationRepository;
import com.example.demochatbot.repository.PotatoTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * ============================================================================
 * CONTROLLER: BookRentalAdminController
 * Quản trị Giao dịch Thuê Sách & Quyền Truy Cập Bản Quyền cho Admin Portal
 * Đường dẫn: /api/admin/rentals
 * ============================================================================
 */
@RestController
@RequestMapping("/api/admin/rentals")
@CrossOrigin(origins = "*", maxAge = 3600)
public class BookRentalAdminController {

    @Autowired
    private AccessRecordRepository accessRecordRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private PotatoTransactionRepository potatoTransactionRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /**
     * 1. Lấy dữ liệu tổng hợp và biểu đồ lượt thuê sách 7 ngày gần nhất
     */
    @GetMapping("/summary")
    public ResponseEntity<?> getRentalSummary() {
        try {
            List<Access_Record> allRecords = accessRecordRepository.findAll();

            long activeCount = 0;
            long pendingCount = 0;
            long revokedCount = 0;
            long totalPotatoesSpent = 0;

            for (Access_Record ar : allRecords) {
                String st = ar.getStatus() != null ? ar.getStatus().toUpperCase() : "ACTIVE";
                Book b = ar.getBook();
                long cost = 15;
                if (b != null && b.getRent_price() != null) {
                    cost = b.getRent_price() > 500 ? Math.round(b.getRent_price() / 1000.0) : Math.round(b.getRent_price());
                }

                if ("ACTIVE".equals(st)) {
                    activeCount++;
                    totalPotatoesSpent += cost;
                } else if ("PENDING".equals(st) || "WAITING".equals(st)) {
                    pendingCount++;
                } else if ("REVOKED".equals(st) || "REJECTED".equals(st)) {
                    revokedCount++;
                } else if ("EXPIRED".equals(st)) {
                    totalPotatoesSpent += cost;
                }
            }

            // Biểu đồ 7 ngày gần nhất
            LocalDate today = LocalDate.now();
            List<String> labels = new ArrayList<>();
            int[] chartData = new int[7];

            for (int i = 6; i >= 0; i--) {
                LocalDate d = today.minusDays(i);
                String dayLabel = (d.getDayOfWeek().getValue() == 7 ? "Chủ Nhật" : "Thứ " + (d.getDayOfWeek().getValue() + 1));
                labels.add(dayLabel);
                int idx = 6 - i;

                for (Access_Record ar : allRecords) {
                    LocalDateTime dt = ar.getStart_date() != null ? ar.getStart_date() : ar.getLastReadAt();
                    if (dt != null && dt.toLocalDate().equals(d)) {
                        chartData[idx]++;
                    }
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("totalRentals", (long) allRecords.size());
            response.put("activeRentals", activeCount);
            response.put("pendingRentals", pendingCount);
            response.put("revokedRentals", revokedCount);
            response.put("totalPotatoesSpent", totalPotatoesSpent);
            response.put("chart", Map.of("labels", labels, "data", chartData));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi lấy dữ liệu tổng hợp thuê sách: " + e.getMessage()));
        }
    }

    /**
     * 2. Lấy danh sách giao dịch thuê sách có lọc và tìm kiếm
     */
    @GetMapping
    public ResponseEntity<?> getRentals(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "status", required = false) String status
    ) {
        try {
            List<Access_Record> allRecords = accessRecordRepository.findAll();

            // Sắp xếp mới nhất lên đầu
            allRecords.sort((a, b) -> {
                LocalDateTime d1 = a.getStart_date() != null ? a.getStart_date() : (a.getLastReadAt() != null ? a.getLastReadAt() : LocalDateTime.MIN);
                LocalDateTime d2 = b.getStart_date() != null ? b.getStart_date() : (b.getLastReadAt() != null ? b.getLastReadAt() : LocalDateTime.MIN);
                return d2.compareTo(d1);
            });

            List<Map<String, Object>> resultList = new ArrayList<>();
            LocalDateTime now = LocalDateTime.now();

            for (Access_Record ar : allRecords) {
                // Chuẩn hóa trạng thái
                String rawStatus = ar.getStatus() != null ? ar.getStatus().toUpperCase() : "ACTIVE";
                String normalizedStatus = "active";

                // Kiểm tra hết hạn nếu đang active
                if ("ACTIVE".equals(rawStatus) && ar.getEnd_date() != null && ar.getEnd_date().isBefore(now)) {
                    normalizedStatus = "expired";
                } else if ("PENDING".equals(rawStatus) || "WAITING".equals(rawStatus)) {
                    normalizedStatus = "pending";
                } else if ("REVOKED".equals(rawStatus)) {
                    normalizedStatus = "revoked";
                } else if ("REJECTED".equals(rawStatus)) {
                    normalizedStatus = "rejected";
                } else if ("EXPIRED".equals(rawStatus)) {
                    normalizedStatus = "expired";
                }

                if (status != null && !status.isEmpty() && !normalizedStatus.equalsIgnoreCase(status)) {
                    continue;
                }

                Customer customer = ar.getCustomer();
                Book book = ar.getBook();

                String code = "RT-" + String.format("%05d", ar.getAccess_record_id());
                String bookTitle = book != null ? book.getBookName() : "Sách chưa xác định";
                String bookId = book != null ? book.getBook_id() : "";
                String bookCover = book != null && book.getImg_url() != null && !book.getImg_url().isEmpty()
                        ? book.getImg_url()
                        : "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80";

                String userName = customer != null ? customer.getCustomerName() : "Độc giả";
                String userEmail = customer != null ? customer.getEmail() : "";
                String userId = customer != null ? customer.getCustomer_id() : "";

                // Thời hạn thuê
                long durationDays = 30;
                if (ar.getStart_date() != null && ar.getEnd_date() != null) {
                    durationDays = ChronoUnit.DAYS.between(ar.getStart_date().toLocalDate(), ar.getEnd_date().toLocalDate());
                    if (durationDays <= 0) durationDays = 30;
                }
                String duration = durationDays + " ngày";

                long costPotatoes = (book != null && book.getRent_price() != null)
                        ? (book.getRent_price() > 500 ? Math.round(book.getRent_price() / 1000.0) : Math.round(book.getRent_price()))
                        : 15;
                String startDate = ar.getStart_date() != null ? ar.getStart_date().format(DATE_FORMATTER) : now.format(DATE_FORMATTER);
                String endDate = ar.getEnd_date() != null ? ar.getEnd_date().format(DATE_FORMATTER) : now.plusDays(30).format(DATE_FORMATTER);

                // Lọc tìm kiếm
                if (search != null && !search.trim().isEmpty()) {
                    String q = search.trim().toLowerCase();
                    boolean match = code.toLowerCase().contains(q) ||
                            bookTitle.toLowerCase().contains(q) ||
                            userName.toLowerCase().contains(q) ||
                            userEmail.toLowerCase().contains(q) ||
                            bookId.toLowerCase().contains(q);
                    if (!match) continue;
                }

                Map<String, Object> item = new HashMap<>();
                item.put("id", ar.getAccess_record_id());
                item.put("code", code);
                item.put("bookId", bookId);
                item.put("bookTitle", bookTitle);
                item.put("bookCover", bookCover);
                item.put("userId", userId);
                item.put("userName", userName);
                item.put("userEmail", userEmail);
                item.put("duration", duration);
                item.put("costPotatoes", costPotatoes);
                item.put("startDate", startDate);
                item.put("endDate", endDate);
                item.put("status", normalizedStatus);

                resultList.add(item);
            }

            return ResponseEntity.ok(resultList);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi lấy danh sách giao dịch thuê sách: " + e.getMessage()));
        }
    }

    /**
     * 3. Duyệt đơn thuê sách
     */
    @PostMapping("/{id}/approve")
    @Transactional
    public ResponseEntity<?> approveRental(@PathVariable("id") int id) {
        try {
            Optional<Access_Record> opt = accessRecordRepository.findById(id);
            if (opt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy yêu cầu thuê sách với mã #" + id));
            }

            Access_Record ar = opt.get();
            ar.setStatus("ACTIVE");
            if (ar.getStart_date() == null) {
                ar.setStart_date(LocalDateTime.now());
            }
            if (ar.getEnd_date() == null || ar.getEnd_date().isBefore(LocalDateTime.now())) {
                ar.setEnd_date(LocalDateTime.now().plusDays(30));
            }
            accessRecordRepository.save(ar);

            Customer c = ar.getCustomer();
            Book b = ar.getBook();
            if (c != null && b != null) {
                Notification notif = Notification.builder()
                        .customerId(c.getCustomer_id())
                        .title("Yêu Cầu Thuê Sách Đã Được Duyệt! 📖")
                        .message("Bạn đã được cấp quyền đọc cuốn sách \"" + b.getBookName() + "\" đến ngày " + ar.getEnd_date().format(DATE_FORMATTER) + ". Chúc bạn có những phút giây đọc sách bổ ích!")
                        .type("RENT")
                        .link("/doc-sach/" + b.getBook_id())
                        .isRead(false)
                        .createdAt(LocalDateTime.now())
                        .build();
                notificationRepository.save(notif);
            }

            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("message", "Đã duyệt đơn thuê sách thành công!");
            res.put("bookTitle", b != null ? b.getBookName() : "");
            res.put("userName", c != null ? c.getCustomerName() : "");
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi duyệt đơn thuê sách: " + e.getMessage()));
        }
    }

    /**
     * 4. Từ chối đơn thuê sách & Hoàn củ khoai
     */
    @PostMapping("/{id}/reject")
    @Transactional
    public ResponseEntity<?> rejectRental(
            @PathVariable("id") int id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        try {
            Optional<Access_Record> opt = accessRecordRepository.findById(id);
            if (opt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy yêu cầu thuê sách với mã #" + id));
            }

            Access_Record ar = opt.get();
            ar.setStatus("REJECTED");
            accessRecordRepository.save(ar);

            String reason = body != null && body.containsKey("reason") ? body.get("reason") : "Đầu sách đang bảo trì bản quyền";

            Customer c = ar.getCustomer();
            Book b = ar.getBook();

            if (c != null && b != null) {
                long refundPotatoes = b.getRent_price() != null ? Math.round(b.getRent_price()) : 10;

                int curBalance = c.getPotatoBalance() != null ? c.getPotatoBalance() : 0;
                int newBalance = curBalance + (int) refundPotatoes;
                c.setPotatoBalance(newBalance);
                customerRepository.save(c);

                // Ghi nhận biến động số dư hoàn khoai
                PotatoTransaction pt = new PotatoTransaction();
                pt.setCustomer(c);
                pt.setAmount((int) refundPotatoes);
                pt.setBalanceAfter(newBalance);
                pt.setType("REWARD");
                pt.setDescription("Hoàn củ khoai cho đơn thuê sách \"" + b.getBookName() + "\" bị từ chối: " + reason);
                pt.setCreatedAt(LocalDateTime.now());
                potatoTransactionRepository.save(pt);

                // Gửi thông báo
                Notification notif = Notification.builder()
                        .customerId(c.getCustomer_id())
                        .title("Đơn Thuê Sách Bị Từ Chối & Đã Hoàn Khoai")
                        .message("Yêu cầu thuê cuốn \"" + b.getBookName() + "\" không được duyệt. Lý do: " + reason + ". Hệ thống đã hoàn lại +" + refundPotatoes + " 🥔 vào ví của bạn.")
                        .type("RENT")
                        .link("/canhan?tab=wallet")
                        .isRead(false)
                        .createdAt(LocalDateTime.now())
                        .build();
                notificationRepository.save(notif);
            }

            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("message", "Đã từ chối đơn thuê và hoàn củ khoai cho độc giả!");
            res.put("userName", c != null ? c.getCustomerName() : "");
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi từ chối đơn thuê: " + e.getMessage()));
        }
    }

    /**
     * 5. Thu hồi quyền đọc sách
     */
    @PostMapping("/{id}/revoke")
    @Transactional
    public ResponseEntity<?> revokeRental(@PathVariable("id") int id) {
        try {
            Optional<Access_Record> opt = accessRecordRepository.findById(id);
            if (opt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy quyền đọc sách với mã #" + id));
            }

            Access_Record ar = opt.get();
            ar.setStatus("REVOKED");
            accessRecordRepository.save(ar);

            Customer c = ar.getCustomer();
            Book b = ar.getBook();

            if (c != null && b != null) {
                Notification notif = Notification.builder()
                        .customerId(c.getCustomer_id())
                        .title("Thu Hồi Quyền Đọc Sách")
                        .message("Quyền truy cập cuốn sách \"" + b.getBookName() + "\" của bạn đã bị Quản trị viên thu hồi. Nếu có thắc mắc vui lòng gửi yêu cầu hỗ trợ.")
                        .type("RENT")
                        .link("/hotro")
                        .isRead(false)
                        .createdAt(LocalDateTime.now())
                        .build();
                notificationRepository.save(notif);
            }

            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("message", "Đã thu hồi quyền đọc sách thành công!");
            res.put("code", "RT-" + String.format("%05d", ar.getAccess_record_id()));
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi thu hồi quyền đọc sách: " + e.getMessage()));
        }
    }
}
