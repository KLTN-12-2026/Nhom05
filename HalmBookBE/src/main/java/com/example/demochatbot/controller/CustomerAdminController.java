package com.example.demochatbot.controller;

import com.example.demochatbot.model.Account;
import com.example.demochatbot.model.Customer;
import com.example.demochatbot.model.PotatoTransaction;
import com.example.demochatbot.repository.AccountRepository;
import com.example.demochatbot.repository.CustomerRepository;
import com.example.demochatbot.repository.PotatoTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ============================================================================
 * CONTROLLER: CustomerAdminController
 * Quản lý độc giả & khách hàng dành riêng cho Quản trị viên (Admin Portal)
 * Đường dẫn: /api/admin/customers
 * ============================================================================
 */
@RestController
@RequestMapping("/api/admin/customers")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CustomerAdminController {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private PotatoTransactionRepository potatoTransactionRepository;

    // DATE_FORMAT replaced with thread-safe instances

    /**
     * 1. Lấy danh sách khách hàng kèm bộ lọc và thống kê tổng quan
     */
    @GetMapping
    public ResponseEntity<?> getAllCustomers(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "tier", required = false) String tier,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "birthdayOnly", required = false, defaultValue = "false") boolean birthdayOnly
    ) {
        try {
            List<Customer> all = customerRepository.findAll();
            LocalDate today = LocalDate.now();

            List<Map<String, Object>> customerList = new ArrayList<>();
            long totalCount = all.size();
            long vipCount = 0;
            long lockedCount = 0;
            long birthdayTodayCount = 0;

            for (Customer c : all) {
                Account acc = c.getAccount();
                String accStatus = (acc != null && acc.getStatus() != null) ? acc.getStatus().toUpperCase() : "ACTIVE";
                String tierName = c.getMembershipTier() != null ? c.getMembershipTier().getTierName() : "Đồng";
                int potato = c.getPotatoBalance() != null ? c.getPotatoBalance() : 0;
                int totalEarned = c.getTotalPotatoEarned() != null ? c.getTotalPotatoEarned() : 0;

                // Đếm VIP: Hạng cao hơn hạng 1 hoặc có tích lũy từ 100 Khoai trở lên
                boolean isVip = (c.getMembershipTier() != null && c.getMembershipTier().getTierId() > 1) || totalEarned >= 100;
                if (isVip) vipCount++;

                // Đếm Locked
                if ("LOCKED".equalsIgnoreCase(accStatus)) lockedCount++;

                // Đếm Sinh nhật hôm nay
                boolean isBirthdayToday = false;
                if (c.getBirthday() != null) {
                    LocalDate bdate = c.getBirthday().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
                    if (bdate.getMonthValue() == today.getMonthValue() && bdate.getDayOfMonth() == today.getDayOfMonth()) {
                        isBirthdayToday = true;
                        birthdayTodayCount++;
                    }
                }

                // Áp dụng bộ lọc
                if (birthdayOnly && !isBirthdayToday) continue;

                if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status)) {
                    if (!status.equalsIgnoreCase(accStatus)) continue;
                }

                if (tier != null && !tier.trim().isEmpty() && !"ALL".equalsIgnoreCase(tier)) {
                    if (!tier.equalsIgnoreCase(tierName)) continue;
                }

                if (search != null && !search.trim().isEmpty()) {
                    String q = search.trim().toLowerCase();
                    boolean match = (c.getCustomer_id() != null && c.getCustomer_id().toLowerCase().contains(q))
                            || (c.getCustomerName() != null && c.getCustomerName().toLowerCase().contains(q))
                            || (c.getEmail() != null && c.getEmail().toLowerCase().contains(q))
                            || (c.getPhoneNumber() != null && c.getPhoneNumber().toLowerCase().contains(q))
                            || (acc != null && acc.getUsername() != null && acc.getUsername().toLowerCase().contains(q));
                    if (!match) continue;
                }

                Map<String, Object> dto = new HashMap<>();
                dto.put("customerId", c.getCustomer_id());
                dto.put("id", c.getCustomer_id());
                dto.put("accountId", acc != null ? acc.getAccount_id() : null);
                dto.put("name", c.getCustomerName() != null ? c.getCustomerName() : "Độc giả HALM");
                dto.put("customerName", c.getCustomerName());
                dto.put("username", acc != null ? acc.getUsername() : "");
                dto.put("email", c.getEmail() != null ? c.getEmail() : "");
                dto.put("phone", c.getPhoneNumber() != null ? c.getPhoneNumber() : "");
                dto.put("phoneNumber", c.getPhoneNumber() != null ? c.getPhoneNumber() : "");
                dto.put("address", c.getAddress() != null ? c.getAddress() : "");
                dto.put("gender", c.isGender());
                dto.put("birthday", c.getBirthday() != null ? new SimpleDateFormat("yyyy-MM-dd").format(c.getBirthday()) : "");
                dto.put("isBirthdayToday", isBirthdayToday);

                String avatar = c.getAvatarUrl() != null && !c.getAvatarUrl().isEmpty() 
                        ? c.getAvatarUrl() 
                        : (c.getAvatar() != null ? c.getAvatar() : "");
                dto.put("avatar", avatar);
                dto.put("avatarUrl", avatar);

                dto.put("potatoBalance", potato);
                dto.put("totalPotatoEarned", totalEarned);
                dto.put("streakDays", c.getStreakDays() != null ? c.getStreakDays() : 0);
                dto.put("tier", tierName);
                dto.put("tierName", tierName);
                dto.put("tierId", c.getMembershipTier() != null ? c.getMembershipTier().getTierId() : 1);
                dto.put("isVip", isVip);
                dto.put("status", accStatus);
                dto.put("createdAt", c.getCreatedAt() != null ? c.getCreatedAt().toString() : "");
                dto.put("rentedBooksCount", c.getAccessRecords() != null ? c.getAccessRecords().size() : 0);

                customerList.add(dto);
            }

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalCustomers", totalCount);
            stats.put("vipCustomers", vipCount);
            stats.put("lockedCustomers", lockedCount);
            stats.put("birthdayTodayCount", birthdayTodayCount);

            Map<String, Object> response = new HashMap<>();
            response.put("content", customerList);
            response.put("totalElements", customerList.size());
            response.put("stats", stats);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi nạp danh sách khách hàng: " + e.getMessage()));
        }
    }

    /**
     * 2. Khóa / Mở khóa tài khoản khách hàng
     */
    @PutMapping("/{customerId}/toggle-lock")
    @Transactional
    public ResponseEntity<?> toggleLockCustomer(@PathVariable("customerId") String customerId) {
        try {
            Optional<Customer> opt = customerRepository.findById(customerId);
            if (opt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy khách hàng với mã: " + customerId));
            }

            Customer c = opt.get();
            Account acc = c.getAccount();
            if (acc == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Khách hàng này chưa liên kết tài khoản hệ thống."));
            }

            String currentStatus = acc.getStatus() != null ? acc.getStatus().toUpperCase() : "ACTIVE";
            String newStatus = "ACTIVE".equals(currentStatus) ? "LOCKED" : "ACTIVE";

            acc.setStatus(newStatus);
            accountRepository.save(acc);

            String actionText = "LOCKED".equals(newStatus) ? "Đã khóa tài khoản thành công!" : "Đã mở khóa tài khoản thành công!";
            return ResponseEntity.ok(Map.of(
                    "message", actionText,
                    "customerId", customerId,
                    "newStatus", newStatus,
                    "status", newStatus
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi đổi trạng thái tài khoản: " + e.getMessage()));
        }
    }

    /**
     * 3. Chỉnh sửa hồ sơ thông tin khách hàng
     */
    @PutMapping("/{customerId}")
    @Transactional
    public ResponseEntity<?> updateCustomerInfo(
            @PathVariable("customerId") String customerId,
            @RequestBody Map<String, Object> body
    ) {
        try {
            Optional<Customer> opt = customerRepository.findById(customerId);
            if (opt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy khách hàng với mã: " + customerId));
            }

            Customer c = opt.get();

            if (body.containsKey("customerName") && body.get("customerName") != null) {
                c.setCustomerName(String.valueOf(body.get("customerName")).trim());
            }
            if (body.containsKey("name") && body.get("name") != null && c.getCustomerName() == null) {
                c.setCustomerName(String.valueOf(body.get("name")).trim());
            }
            if (body.containsKey("phoneNumber")) {
                c.setPhoneNumber(body.get("phoneNumber") != null ? String.valueOf(body.get("phoneNumber")).trim() : null);
            }
            if (body.containsKey("phone")) {
                c.setPhoneNumber(body.get("phone") != null ? String.valueOf(body.get("phone")).trim() : null);
            }
            if (body.containsKey("address")) {
                c.setAddress(body.get("address") != null ? String.valueOf(body.get("address")).trim() : null);
            }
            if (body.containsKey("email")) {
                c.setEmail(body.get("email") != null ? String.valueOf(body.get("email")).trim() : null);
            }
            if (body.containsKey("gender")) {
                Object g = body.get("gender");
                if (g instanceof Boolean) {
                    c.setGender((Boolean) g);
                } else if (g != null) {
                    String gStr = String.valueOf(g).trim().toLowerCase();
                    c.setGender("nam".equals(gStr) || "true".equals(gStr) || "1".equals(gStr) || "male".equals(gStr));
                }
            }
            if (body.containsKey("birthday") && body.get("birthday") != null) {
                String bStr = String.valueOf(body.get("birthday")).trim();
                if (!bStr.isEmpty()) {
                    try {
                        Date parsed = new SimpleDateFormat("yyyy-MM-dd").parse(bStr);
                        c.setBirthday(parsed);
                    } catch (Exception ignored) {}
                }
            }

            customerRepository.save(c);

            return ResponseEntity.ok(Map.of(
                    "message", "Cập nhật hồ sơ khách hàng thành công!",
                    "customerId", customerId,
                    "customerName", c.getCustomerName() != null ? c.getCustomerName() : ""
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi cập nhật hồ sơ khách hàng: " + e.getMessage()));
        }
    }

    /**
     * 4. Điều chỉnh số dư Khoai Tây (Thưởng / Trừ Khoai từ Quản trị viên)
     */
    @PostMapping("/{customerId}/adjust-potato")
    @Transactional
    public ResponseEntity<?> adjustPotato(
            @PathVariable("customerId") String customerId,
            @RequestBody Map<String, Object> body
    ) {
        try {
            Optional<Customer> opt = customerRepository.findById(customerId);
            if (opt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy khách hàng với mã: " + customerId));
            }

            Customer c = opt.get();
            int amount = 0;
            if (body.containsKey("amount") && body.get("amount") != null) {
                try {
                    amount = Integer.parseInt(String.valueOf(body.get("amount")).trim());
                } catch (NumberFormatException e) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Số lượng Khoai Tây không hợp lệ!"));
                }
            }

            if (amount == 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "Số lượng Khoai điều chỉnh phải khác 0!"));
            }

            String reason = body.containsKey("reason") && body.get("reason") != null 
                    ? String.valueOf(body.get("reason")).trim() 
                    : "Quản trị viên điều chỉnh số dư";

            int currentBalance = c.getPotatoBalance() != null ? c.getPotatoBalance() : 0;
            int newBalance = currentBalance + amount;
            if (newBalance < 0) {
                return ResponseEntity.badRequest().body(Map.of("message", "Số dư Khoai Tây không đủ để khấu trừ (Hiện có: " + currentBalance + " Khoai)!"));
            }

            c.setPotatoBalance(newBalance);
            if (amount > 0) {
                int totalEarned = c.getTotalPotatoEarned() != null ? c.getTotalPotatoEarned() : 0;
                c.setTotalPotatoEarned(totalEarned + amount);
            }
            customerRepository.save(c);

            // Ghi nhật ký biến động số dư Khoai
            try {
                PotatoTransaction trans = new PotatoTransaction();
                trans.setCustomer(c);
                trans.setAmount(amount);
                trans.setBalanceAfter(newBalance);
                trans.setType(amount > 0 ? "ADMIN_REWARD" : "ADMIN_DEDUCT");
                trans.setDescription(reason);
                potatoTransactionRepository.save(trans);
            } catch (Exception tErr) {
                System.err.println("Không thể lưu nhật ký giao dịch Khoai: " + tErr.getMessage());
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Đã điều chỉnh thành công " + (amount > 0 ? ("+" + amount) : amount) + " Khoai Tây!",
                    "customerId", customerId,
                    "newBalance", newBalance,
                    "potatoBalance", newBalance
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi điều chỉnh số dư Khoai Tây: " + e.getMessage()));
        }
    }
}
