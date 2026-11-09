package com.example.demochatbot.controller;

import com.example.demochatbot.model.Customer;
import com.example.demochatbot.model.Notification;
import com.example.demochatbot.model.Orders;
import com.example.demochatbot.model.PotatoTransaction;
import com.example.demochatbot.repository.CustomerRepository;
import com.example.demochatbot.repository.NotificationRepository;
import com.example.demochatbot.repository.OrdersRepository;
import com.example.demochatbot.repository.PotatoTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ============================================================================
 * CONTROLLER: FinanceAdminController
 * Quản trị Tài chính & Dòng tiền cho Admin Portal
 * Đường dẫn: /api/admin/finance
 * ============================================================================
 */
@RestController
@RequestMapping("/api/admin/finance")
@CrossOrigin(origins = "*", maxAge = 3600)
public class FinanceAdminController {

    @Autowired
    private OrdersRepository ordersRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private PotatoTransactionRepository potatoTransactionRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    /**
     * 1. Lấy dữ liệu tổng hợp tài chính và biểu đồ theo các kỳ (1d, 7d, 30d, all)
     */
    @GetMapping("/summary")
    public ResponseEntity<?> getFinanceSummary(@RequestParam(value = "period", defaultValue = "7d") String period) {
        try {
            List<Orders> allOrders = ordersRepository.findAll();

            // Lọc các đơn nạp tiền hoặc đơn giao dịch tài chính
            List<Orders> topupOrders = allOrders.stream()
                    .filter(o -> o.getOrderType() != null && (
                            o.getOrderType().equalsIgnoreCase("TOPUP_POTATO") ||
                            o.getOrderType().equalsIgnoreCase("TOPUP") ||
                            "VND".equalsIgnoreCase(o.getPaymentCurrency())
                    ))
                    .collect(Collectors.toList());

            // Thống kê thẻ
            long approvedCount = 0;
            long pendingCount = 0;
            double approvedRevenue = 0.0;
            double pendingRevenue = 0.0;
            long totalPotatoes = 0;

            for (Orders o : topupOrders) {
                String st = (o.getPayment_status() != null ? o.getPayment_status() : "").toUpperCase();
                double amount = o.getTotal_amount();
                // Quy đổi ước tính số khoai nếu là nạp tiền (1000đ = 1 khoai hoặc theo tỉ lệ)
                long potatoes = Math.round(amount / 1000.0);

                if ("APPROVED".equals(st) || "COMPLETED".equals(st) || "SUCCESS".equals(st)) {
                    approvedCount++;
                    approvedRevenue += amount;
                    totalPotatoes += potatoes;
                } else if ("PENDING".equals(st) || "WAITING".equals(st)) {
                    pendingCount++;
                    pendingRevenue += amount;
                }
            }

            // Xây dựng config biểu đồ theo 4 kỳ
            Map<String, Object> periodConfigs = buildPeriodConfigs(topupOrders);

            Map<String, Object> response = new HashMap<>();
            response.put("approvedRevenue", approvedRevenue);
            response.put("approvedCount", approvedCount);
            response.put("pendingRevenue", pendingRevenue);
            response.put("pendingCount", pendingCount);
            response.put("totalPotatoes", totalPotatoes);
            response.put("totalTxsCount", topupOrders.size());
            response.put("periodConfigs", periodConfigs);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi tải dữ liệu tổng quan tài chính: " + e.getMessage()));
        }
    }

    /**
     * 2. Lấy danh sách giao dịch tài chính
     */
    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "period", defaultValue = "all") String period
    ) {
        try {
            List<Orders> allOrders = ordersRepository.findAll();

            // Sắp xếp đơn hàng mới nhất lên đầu
            allOrders.sort((a, b) -> {
                LocalDateTime d1 = a.getOrder_date() != null ? a.getOrder_date() : LocalDateTime.MIN;
                LocalDateTime d2 = b.getOrder_date() != null ? b.getOrder_date() : LocalDateTime.MIN;
                return d2.compareTo(d1);
            });

            List<Map<String, Object>> resultList = new ArrayList<>();
            LocalDateTime now = LocalDateTime.now();

            for (Orders o : allOrders) {
                // Lọc đơn liên quan đến tài chính
                boolean isFinance = o.getOrderType() != null && (
                        o.getOrderType().equalsIgnoreCase("TOPUP_POTATO") ||
                        o.getOrderType().equalsIgnoreCase("TOPUP") ||
                        "VND".equalsIgnoreCase(o.getPaymentCurrency())
                );
                if (!isFinance) continue;

                // Lọc theo kỳ
                LocalDateTime orderDate = o.getOrder_date() != null ? o.getOrder_date() : now;
                if (!matchesPeriod(orderDate, now, period)) {
                    continue;
                }

                // Map trạng thái sang chuẩn Frontend: 'approved', 'pending', 'rejected'
                String rawStatus = o.getPayment_status() != null ? o.getPayment_status().toUpperCase() : "PENDING";
                String normalizedStatus = "pending";
                if ("APPROVED".equals(rawStatus) || "COMPLETED".equals(rawStatus) || "SUCCESS".equals(rawStatus)) {
                    normalizedStatus = "approved";
                } else if ("REJECTED".equals(rawStatus) || "FAILED".equals(rawStatus) || "CANCELLED".equals(rawStatus)) {
                    normalizedStatus = "rejected";
                }

                if (status != null && !status.isEmpty() && !normalizedStatus.equalsIgnoreCase(status)) {
                    continue;
                }

                // Thông tin khách hàng
                Customer c = o.getCustomer();
                String userName = c != null ? c.getCustomerName() : "Độc giả ẩn danh";
                String userEmail = c != null ? c.getEmail() : "";
                String customerId = c != null ? c.getCustomer_id() : "";

                String code = o.getTransaction_no() != null && !o.getTransaction_no().isEmpty()
                        ? o.getTransaction_no()
                        : "TX-" + String.format("%06d", o.getOrders_id());

                String type = "Nạp Củ Khoai Tây";
                if (o.getOrderType() != null && o.getOrderType().equalsIgnoreCase("BUY_BOOK")) {
                    type = "Mua Bản Quyền Sách";
                }

                double amount = o.getTotal_amount();
                long potatoes = Math.round(amount / 1000.0);

                // Lọc theo từ khóa tìm kiếm
                if (search != null && !search.trim().isEmpty()) {
                    String q = search.trim().toLowerCase();
                    boolean match = code.toLowerCase().contains(q) ||
                            userName.toLowerCase().contains(q) ||
                            userEmail.toLowerCase().contains(q) ||
                            type.toLowerCase().contains(q) ||
                            (o.getPayment_method() != null && o.getPayment_method().toLowerCase().contains(q));
                    if (!match) continue;
                }

                Map<String, Object> item = new HashMap<>();
                item.put("id", o.getOrders_id());
                item.put("code", code);
                item.put("userId", customerId);
                item.put("userName", userName);
                item.put("userEmail", userEmail);
                item.put("type", type);
                item.put("method", o.getPayment_method() != null ? o.getPayment_method() : "Chuyển khoản");
                item.put("amount", amount);
                item.put("potatoes", potatoes);
                item.put("createdAt", orderDate.format(DATE_TIME_FORMATTER));
                item.put("status", normalizedStatus);
                item.put("rejectReason", "");

                resultList.add(item);
            }

            return ResponseEntity.ok(resultList);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi lấy danh sách giao dịch: " + e.getMessage()));
        }
    }

    /**
     * 3. Duyệt giao dịch nạp tiền
     */
    @PostMapping("/transactions/{id}/approve")
    @Transactional
    public ResponseEntity<?> approveTransaction(@PathVariable("id") int id) {
        try {
            Optional<Orders> opt = ordersRepository.findById(id);
            if (opt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy giao dịch với mã #" + id));
            }

            Orders order = opt.get();
            order.setPayment_status("APPROVED");
            ordersRepository.save(order);

            Customer customer = order.getCustomer();
            long potatoesToAdd = Math.round(order.getTotal_amount() / 1000.0);

            if (customer != null && potatoesToAdd > 0) {
                int curBalance = customer.getPotatoBalance() != null ? customer.getPotatoBalance() : 0;
                int newBalance = curBalance + (int) potatoesToAdd;
                customer.setPotatoBalance(newBalance);

                int totalEarned = customer.getTotalPotatoEarned() != null ? customer.getTotalPotatoEarned() : 0;
                customer.setTotalPotatoEarned(totalEarned + (int) potatoesToAdd);
                customerRepository.save(customer);

                // Ghi nhận biến động số dư khoai
                PotatoTransaction pt = new PotatoTransaction();
                pt.setCustomer(customer);
                pt.setAmount((int) potatoesToAdd);
                pt.setBalanceAfter(newBalance);
                pt.setType("TOPUP");
                pt.setDescription("Duyệt nạp củ khoai tây từ giao dịch " + (order.getTransaction_no() != null ? order.getTransaction_no() : "#" + order.getOrders_id()));
                pt.setCreatedAt(LocalDateTime.now());
                potatoTransactionRepository.save(pt);

                // Gửi thông báo đến độc giả
                Notification notif = Notification.builder()
                        .customerId(customer.getCustomer_id())
                        .title("Nạp Củ Khoai Tây Thành Công! 🥔")
                        .message("Giao dịch " + (order.getTransaction_no() != null ? order.getTransaction_no() : "#" + order.getOrders_id()) + " (" + ((long) order.getTotal_amount()) + " đ) đã được Admin phê duyệt. Bạn nhận được +" + potatoesToAdd + " 🥔.")
                        .type("TOPUP")
                        .link("/canhan?tab=wallet")
                        .isRead(false)
                        .createdAt(LocalDateTime.now())
                        .build();
                notificationRepository.save(notif);
            }

            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("message", "Đã duyệt giao dịch thành công!");
            res.put("id", order.getOrders_id());
            res.put("code", order.getTransaction_no() != null ? order.getTransaction_no() : "#" + order.getOrders_id());
            res.put("amount", order.getTotal_amount());
            res.put("userName", customer != null ? customer.getCustomerName() : "Khách hàng");
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi duyệt giao dịch: " + e.getMessage()));
        }
    }

    /**
     * 4. Từ chối giao dịch nạp tiền
     */
    @PostMapping("/transactions/{id}/reject")
    @Transactional
    public ResponseEntity<?> rejectTransaction(
            @PathVariable("id") int id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        try {
            Optional<Orders> opt = ordersRepository.findById(id);
            if (opt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy giao dịch với mã #" + id));
            }

            Orders order = opt.get();
            order.setPayment_status("REJECTED");
            ordersRepository.save(order);

            String reason = body != null && body.containsKey("reason") ? body.get("reason") : "Chưa nhận được thanh toán hợp lệ";

            Customer customer = order.getCustomer();
            if (customer != null) {
                Notification notif = Notification.builder()
                        .customerId(customer.getCustomer_id())
                        .title("Giao Dịch Nạp Tiền Bị Từ Chối")
                        .message("Giao dịch " + (order.getTransaction_no() != null ? order.getTransaction_no() : "#" + order.getOrders_id()) + " của bạn đã bị từ chối. Lý do: " + reason)
                        .type("TOPUP")
                        .link("/canhan?tab=wallet")
                        .isRead(false)
                        .createdAt(LocalDateTime.now())
                        .build();
                notificationRepository.save(notif);
            }

            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("message", "Đã từ chối giao dịch!");
            res.put("id", order.getOrders_id());
            res.put("code", order.getTransaction_no() != null ? order.getTransaction_no() : "#" + order.getOrders_id());
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi từ chối giao dịch: " + e.getMessage()));
        }
    }

    // Helper: kiểm tra đơn hàng có nằm trong kỳ lọc không
    private boolean matchesPeriod(LocalDateTime orderDate, LocalDateTime now, String period) {
        if ("all".equalsIgnoreCase(period)) return true;
        LocalDate d = orderDate.toLocalDate();
        LocalDate today = now.toLocalDate();
        if ("1d".equalsIgnoreCase(period)) {
            return d.equals(today);
        } else if ("7d".equalsIgnoreCase(period)) {
            return !d.isBefore(today.minusDays(6)) && !d.isAfter(today);
        } else if ("30d".equalsIgnoreCase(period)) {
            return !d.isBefore(today.minusDays(29)) && !d.isAfter(today);
        }
        return true;
    }

    // Helper: Tính toán dữ liệu biểu đồ cho các chu kỳ
    private Map<String, Object> buildPeriodConfigs(List<Orders> orders) {
        Map<String, Object> configs = new HashMap<>();

        // 1. Giai đoạn 1d (Hôm nay theo các khung giờ)
        configs.put("1d", build1dConfig(orders));

        // 2. Giai đoạn 7d (7 ngày gần nhất)
        configs.put("7d", build7dConfig(orders));

        // 3. Giai đoạn 30d (4 tuần gần nhất)
        configs.put("30d", build30dConfig(orders));

        // 4. Giai đoạn all (Tất cả theo tháng)
        configs.put("all", buildAllConfig(orders));

        return configs;
    }

    private Map<String, Object> build1dConfig(List<Orders> orders) {
        LocalDate today = LocalDate.now();
        String[] labels = new String[]{"00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:59"};
        double[] revData = new double[labels.length];
        int[] countData = new int[labels.length];

        for (Orders o : orders) {
            if (o.getOrder_date() == null) continue;
            if (o.getOrder_date().toLocalDate().equals(today)) {
                int hour = o.getOrder_date().getHour();
                int idx = Math.min(hour / 4, labels.length - 1);
                boolean isSuccess = "APPROVED".equalsIgnoreCase(o.getPayment_status()) || "COMPLETED".equalsIgnoreCase(o.getPayment_status());
                if (isSuccess) {
                    revData[idx] += (o.getTotal_amount() / 1000000.0);
                }
                countData[idx]++;
            }
        }

        // Tỉ lệ phương thức
        Map<String, Object> methodShare = calculateMethodShare(orders, today, today);

        Map<String, Object> res = new HashMap<>();
        res.put("sub1", "Đơn vị: Triệu VNĐ (Hôm nay)");
        res.put("sub2", "Đơn vị: Tỷ lệ phần trăm (%) - Hôm nay");
        res.put("sub3", "Đơn vị: Lượt nạp (Hôm nay)");
        res.put("chart1", Map.of("labels", labels, "data", roundArray(revData)));
        res.put("chart2", methodShare);
        res.put("chart3", Map.of("labels", labels, "data", countData));
        return res;
    }

    private Map<String, Object> build7dConfig(List<Orders> orders) {
        LocalDate today = LocalDate.now();
        List<String> labels = new ArrayList<>();
        double[] revData = new double[7];
        int[] countData = new int[7];

        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            String dayLabel = (d.getDayOfWeek().getValue() == 7 ? "Chủ Nhật" : "Thứ " + (d.getDayOfWeek().getValue() + 1));
            labels.add(dayLabel);
            int idx = 6 - i;

            for (Orders o : orders) {
                if (o.getOrder_date() != null && o.getOrder_date().toLocalDate().equals(d)) {
                    boolean isSuccess = "APPROVED".equalsIgnoreCase(o.getPayment_status()) || "COMPLETED".equalsIgnoreCase(o.getPayment_status());
                    if (isSuccess) {
                        revData[idx] += (o.getTotal_amount() / 1000000.0);
                    }
                    countData[idx]++;
                }
            }
        }

        Map<String, Object> methodShare = calculateMethodShare(orders, today.minusDays(6), today);

        Map<String, Object> res = new HashMap<>();
        res.put("sub1", "Đơn vị: Triệu VNĐ (7 ngày gần nhất)");
        res.put("sub2", "Đơn vị: Tỷ lệ phần trăm (%) - 7 ngày");
        res.put("sub3", "Đơn vị: Lượt nạp (7 ngày gần nhất)");
        res.put("chart1", Map.of("labels", labels, "data", roundArray(revData)));
        res.put("chart2", methodShare);
        res.put("chart3", Map.of("labels", labels, "data", countData));
        return res;
    }

    private Map<String, Object> build30dConfig(List<Orders> orders) {
        String[] labels = new String[]{"Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"};
        double[] revData = new double[4];
        int[] countData = new int[4];
        LocalDate today = LocalDate.now();

        for (Orders o : orders) {
            if (o.getOrder_date() == null) continue;
            LocalDate d = o.getOrder_date().toLocalDate();
            long diffDays = java.time.temporal.ChronoUnit.DAYS.between(d, today);
            if (diffDays >= 0 && diffDays < 28) {
                int weekIdx = 3 - (int) (diffDays / 7);
                if (weekIdx >= 0 && weekIdx < 4) {
                    boolean isSuccess = "APPROVED".equalsIgnoreCase(o.getPayment_status()) || "COMPLETED".equalsIgnoreCase(o.getPayment_status());
                    if (isSuccess) {
                        revData[weekIdx] += (o.getTotal_amount() / 1000000.0);
                    }
                    countData[weekIdx]++;
                }
            }
        }

        Map<String, Object> methodShare = calculateMethodShare(orders, today.minusDays(27), today);

        Map<String, Object> res = new HashMap<>();
        res.put("sub1", "Đơn vị: Triệu VNĐ (30 ngày gần nhất)");
        res.put("sub2", "Đơn vị: Tỷ lệ phần trăm (%) - 30 ngày");
        res.put("sub3", "Đơn vị: Lượt nạp (30 ngày gần nhất)");
        res.put("chart1", Map.of("labels", labels, "data", roundArray(revData)));
        res.put("chart2", methodShare);
        res.put("chart3", Map.of("labels", labels, "data", countData));
        return res;
    }

    private Map<String, Object> buildAllConfig(List<Orders> orders) {
        LocalDate today = LocalDate.now();
        List<String> labels = new ArrayList<>();
        double[] revData = new double[6];
        int[] countData = new int[6];

        for (int i = 5; i >= 0; i--) {
            LocalDate m = today.minusMonths(i);
            labels.add("Tháng " + m.getMonthValue());
            int idx = 5 - i;

            for (Orders o : orders) {
                if (o.getOrder_date() != null) {
                    LocalDate od = o.getOrder_date().toLocalDate();
                    if (od.getYear() == m.getYear() && od.getMonthValue() == m.getMonthValue()) {
                        boolean isSuccess = "APPROVED".equalsIgnoreCase(o.getPayment_status()) || "COMPLETED".equalsIgnoreCase(o.getPayment_status());
                        if (isSuccess) {
                            revData[idx] += (o.getTotal_amount() / 1000000.0);
                        }
                        countData[idx]++;
                    }
                }
            }
        }

        Map<String, Object> methodShare = calculateMethodShare(orders, null, null);

        Map<String, Object> res = new HashMap<>();
        res.put("sub1", "Đơn vị: Triệu VNĐ (Toàn bộ thời gian)");
        res.put("sub2", "Đơn vị: Tỷ lệ phần trăm (%) - Toàn bộ");
        res.put("sub3", "Đơn vị: Lượt nạp (Toàn bộ thời gian)");
        res.put("chart1", Map.of("labels", labels, "data", roundArray(revData)));
        res.put("chart2", methodShare);
        res.put("chart3", Map.of("labels", labels, "data", countData));
        return res;
    }

    private Map<String, Object> calculateMethodShare(List<Orders> orders, LocalDate start, LocalDate end) {
        int momo = 0;
        int zalopay = 0;
        int bank = 0;

        for (Orders o : orders) {
            if (o.getOrder_date() != null) {
                LocalDate d = o.getOrder_date().toLocalDate();
                if (start != null && d.isBefore(start)) continue;
                if (end != null && d.isAfter(end)) continue;
            }
            String m = o.getPayment_method() != null ? o.getPayment_method().toUpperCase() : "BANK";
            if (m.contains("MOMO")) momo++;
            else if (m.contains("ZALO")) zalopay++;
            else bank++;
        }

        int total = momo + zalopay + bank;
        int momoPct = total > 0 ? (int) Math.round((momo * 100.0) / total) : 0;
        int zaloPct = total > 0 ? (int) Math.round((zalopay * 100.0) / total) : 0;
        int bankPct = total > 0 ? (100 - momoPct - zaloPct) : 0;

        return Map.of(
                "labels", new String[]{"Ví MoMo", "Ví ZaloPay", "Chuyển khoản Ngân hàng"},
                "data", new int[]{momoPct, zaloPct, bankPct}
        );
    }

    private double[] roundArray(double[] arr) {
        double[] rounded = new double[arr.length];
        for (int i = 0; i < arr.length; i++) {
            rounded[i] = Math.round(arr[i] * 10.0) / 10.0;
        }
        return rounded;
    }
}
