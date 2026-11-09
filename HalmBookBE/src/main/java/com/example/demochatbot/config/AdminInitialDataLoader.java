package com.example.demochatbot.config;

import com.example.demochatbot.enums.Role;
import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

/**
 * ============================================================================
 * SEED DATA: AdminInitialDataLoader
 * Khởi tạo dữ liệu mẫu thực tế ban đầu vào MySQL cho các chức năng Quản lý Tài chính,
 * Thuê sách, Hỗ trợ khiếu nại và đảm bảo có tài khoản Admin chuẩn xác.
 * ============================================================================
 */
@Component
public class AdminInitialDataLoader implements CommandLineRunner {

    @Autowired
    private OrdersRepository ordersRepository;

    @Autowired
    private AccessRecordRepository accessRecordRepository;

    @Autowired
    private SupportTicketRepository supportTicketRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private PotatoTransactionRepository potatoTransactionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        try {
            ensureAdminAccountAndCustomers();
            // seedSupportTickets(); // Đã gỡ bỏ dữ liệu mẫu theo yêu cầu
            seedFinanceOrders();
            seedBookRentals();
        } catch (Exception e) {
            System.err.println("Notice: AdminInitialDataLoader encountered notice: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * 1. Đảm bảo tài khoản ADMIN và danh sách khách hàng sống động
     */
    private void ensureAdminAccountAndCustomers() {
        // Kiểm tra hoặc tạo tài khoản Admin
        Optional<Account> adminOpt = accountRepository.findByUsername("admin");
        if (adminOpt.isEmpty()) {
            Account adminAcc = new Account();
            adminAcc.setUsername("admin");
            adminAcc.setPassword(passwordEncoder.encode("admin123"));
            adminAcc.setRole(Role.ADMIN);
            adminAcc.setStatus("ACTIVE");
            accountRepository.save(adminAcc);

            Customer adminCust = new Customer();
            adminCust.setCustomer_id("CUST-ADMIN-01");
            adminCust.setCustomerName("Tổng Quản Trị Viên");
            adminCust.setEmail("admin@halmbook.vn");
            adminCust.setPhoneNumber("0988888888");
            adminCust.setAddress("Hà Nội, Việt Nam");
            adminCust.setAvatarUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80");
            adminCust.setPotatoBalance(99999);
            adminCust.setTotalPotatoEarned(99999);
            adminCust.setAccount(adminAcc);
            customerRepository.save(adminCust);
            System.out.println(">>> [AdminInitialDataLoader] Created default admin account: admin / admin123");
        }

        // Tạo thêm khách hàng nếu database có ít hơn 4 khách hàng
        if (customerRepository.count() < 4) {
            String[][] seedCustomers = {
                    {"CUST-001", "dat.hoang", "Hoàng Minh Đạt", "dat.hoang@gmail.com", "0912345678", "Hà Nội", "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80", "1250"},
                    {"CUST-002", "anh.le", "Lê Thị Ngọc Ánh", "anh.le@gmail.com", "0987654321", "TP. Hồ Chí Minh", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80", "420"},
                    {"CUST-003", "duc.nguyen", "Nguyễn Minh Đức", "duc.nguyen@gmail.com", "0933221100", "Đà Nẵng", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80", "3100"},
                    {"CUST-004", "huong.pham", "Phạm Thu Hương", "huong.pham@gmail.com", "0904556677", "Hải Phòng", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80", "85"},
                    {"CUST-005", "huy.dang", "Đặng Quốc Huy", "huy.dang@gmail.com", "0978112233", "Cần Thơ", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80", "590"}
            };

            for (String[] row : seedCustomers) {
                if (customerRepository.findById(row[0]).isEmpty()) {
                    Account acc = new Account();
                    acc.setUsername(row[1]);
                    acc.setPassword(passwordEncoder.encode("123456"));
                    acc.setRole(Role.USER);
                    acc.setStatus("ACTIVE");
                    accountRepository.save(acc);

                    Customer cust = new Customer();
                    cust.setCustomer_id(row[0]);
                    cust.setCustomerName(row[2]);
                    cust.setEmail(row[3]);
                    cust.setPhoneNumber(row[4]);
                    cust.setAddress(row[5]);
                    cust.setAvatarUrl(row[6]);
                    int pot = Integer.parseInt(row[7]);
                    cust.setPotatoBalance(pot);
                    cust.setTotalPotatoEarned(pot + 100);
                    cust.setAccount(acc);
                    customerRepository.save(cust);
                }
            }
            System.out.println(">>> [AdminInitialDataLoader] Seeded active customers successfully.");
        }
    }

    /**
     * 2. Khởi tạo dữ liệu Hỗ Trợ & Khiếu Nại
     */
    private void seedSupportTickets() {
        if (supportTicketRepository.count() > 0) return;

        List<Customer> customers = customerRepository.findAll();
        Customer c1 = !customers.isEmpty() ? customers.get(0) : null;
        Customer c2 = customers.size() > 1 ? customers.get(1) : c1;
        Customer c3 = customers.size() > 2 ? customers.get(2) : c1;
        Customer c4 = customers.size() > 3 ? customers.get(3) : c2;

        LocalDateTime now = LocalDateTime.now();

        List<SupportTicket> tickets = List.of(
                SupportTicket.builder()
                        .code("TK-80291")
                        .customer(c1)
                        .senderName(c1 != null ? c1.getCustomerName() : "Hoàng Minh Đạt")
                        .senderEmail(c1 != null ? c1.getEmail() : "dat.hoang@gmail.com")
                        .senderPhone(c1 != null && c1.getPhoneNumber() != null ? c1.getPhoneNumber() : "0912345678")
                        .category("PAYMENT")
                        .priority("HIGH")
                        .subject("Đã chuyển khoản MoMo nhưng chưa nhận được Củ Khoai")
                        .message("Tôi vừa chuyển khoản 50.000 VNĐ qua MoMo lúc 09:30 sáng nay, mã giao dịch TX-MM-982134 nhưng tài khoản chưa được cộng 50 củ khoai. Nhờ admin kiểm tra giúp!")
                        .status("pending")
                        .createdAt(now.minusHours(2))
                        .build(),

                SupportTicket.builder()
                        .code("TK-80292")
                        .customer(c2)
                        .senderName(c2 != null ? c2.getCustomerName() : "Lê Thị Ngọc Ánh")
                        .senderEmail(c2 != null ? c2.getEmail() : "anh.le@gmail.com")
                        .senderPhone("0987654321")
                        .category("READING")
                        .priority("NORMAL")
                        .subject("File PDF cuốn sách 'Nhà Giả Kim' bị mờ trang 45-47")
                        .message("Chào ban quản trị, tôi đang đọc cuốn Nhà Giả Kim thì thấy trang 45-47 bị lỗi font chữ và hơi mờ trên iPad. Nhờ thư viện cập nhật lại bản scan rõ hơn nhé.")
                        .status("in_progress")
                        .createdAt(now.minusHours(6))
                        .build(),

                SupportTicket.builder()
                        .code("TK-80290")
                        .customer(c3)
                        .senderName(c3 != null ? c3.getCustomerName() : "Nguyễn Minh Đức")
                        .senderEmail(c3 != null ? c3.getEmail() : "duc.nguyen@gmail.com")
                        .senderPhone("0933221100")
                        .category("ACCOUNT")
                        .priority("LOW")
                        .subject("Yêu cầu hướng dẫn đổi mật khẩu và liên kết Google")
                        .message("Tôi muốn liên kết tài khoản Facebook với tài khoản HalmBook hiện tại thì làm như thế nào?")
                        .status("resolved")
                        .adminReply("Chào bạn, bạn có thể vào Trang Cá Nhân -> Cài Đặt Tài Khoản -> Bảo Mật để liên kết tài khoản Google/Facebook nhé. Chúc bạn đọc sách vui vẻ!")
                        .replyAt(now.minusHours(4))
                        .createdAt(now.minusDays(1))
                        .build(),

                SupportTicket.builder()
                        .code("TK-80288")
                        .customer(c4)
                        .senderName(c4 != null ? c4.getCustomerName() : "Phạm Thu Hương")
                        .senderEmail(c4 != null ? c4.getEmail() : "huong.pham@gmail.com")
                        .senderPhone("0904556677")
                        .category("PAYMENT")
                        .priority("URGENT")
                        .subject("Bị trừ khoai 2 lần khi bấm thuê sách do mạng giật")
                        .message("Lúc 14:15 tôi bấm thuê cuốn 'Tâm Lý Học Tội Phạm' bị lag nên bấm 2 lần, hệ thống đã trừ của tôi 20 củ khoai thay vì 10 khoai. Nhờ ban quản trị hoàn lại 10 khoai giúp tôi ạ.")
                        .status("pending")
                        .createdAt(now.minusMinutes(45))
                        .build(),

                SupportTicket.builder()
                        .code("TK-80285")
                        .customer(c1)
                        .senderName(c1 != null ? c1.getCustomerName() : "Hoàng Minh Đạt")
                        .senderEmail(c1 != null ? c1.getEmail() : "dat.hoang@gmail.com")
                        .senderPhone("0912345678")
                        .category("OTHER")
                        .priority("LOW")
                        .subject("Góp ý thêm tính năng đọc sách ban đêm (Dark Mode)")
                        .message("Giao diện đọc sách hiện tại rất đẹp, nhưng nếu có thêm chế độ màu giấy vàng (Sepia) và nền đen tuyền (OLED Dark Mode) khi đọc đêm thì tuyệt vời hơn nữa!")
                        .status("resolved")
                        .adminReply("Cảm ơn bạn Đạt rất nhiều vì lời góp ý quý báu. Đội ngũ kỹ thuật HALM Book đã bổ sung chế độ Dark Mode và chỉnh cỡ chữ ngay trong bản cập nhật tuần này!")
                        .replyAt(now.minusDays(2))
                        .createdAt(now.minusDays(3))
                        .build()
        );

        supportTicketRepository.saveAll(tickets);
        System.out.println(">>> [AdminInitialDataLoader] Seeded 5 realistic support tickets.");
    }

    /**
     * 3. Khởi tạo dữ liệu Đơn hàng & Tài chính thực tế
     */
    private void seedFinanceOrders() {
        long topupCount = ordersRepository.findAll().stream()
                .filter(o -> o.getOrderType() != null && (o.getOrderType().startsWith("TOPUP") || "VND".equalsIgnoreCase(o.getPaymentCurrency())))
                .count();
        if (topupCount >= 10) return;

        List<Customer> customers = customerRepository.findAll();
        if (customers.isEmpty()) return;

        Customer c1 = customers.get(0);
        Customer c2 = customers.size() > 1 ? customers.get(1) : c1;
        Customer c3 = customers.size() > 2 ? customers.get(2) : c1;
        Customer c4 = customers.size() > 3 ? customers.get(3) : c2;
        Customer c5 = customers.size() > 4 ? customers.get(4) : c1;

        LocalDateTime now = LocalDateTime.now();

        Object[][] orderData = {
                // Hôm nay (1d)
                {c1, "TOPUP_POTATO", "VND", 50000.0, "Ví MoMo", "APPROVED", "TX-MM-982134", now.minusHours(1)},
                {c2, "TOPUP_POTATO", "VND", 200000.0, "Chuyển khoản Ngân hàng", "PENDING", "TX-VCB-77821", now.minusHours(3)},
                {c3, "TOPUP_POTATO", "VND", 100000.0, "Ví ZaloPay", "APPROVED", "TX-ZP-445129", now.minusHours(5)},
                {c4, "TOPUP_POTATO", "VND", 500000.0, "Chuyển khoản Ngân hàng", "APPROVED", "TX-MB-662190", now.minusHours(7)},
                // Hôm qua (1 ngày trước)
                {c5, "TOPUP_POTATO", "VND", 50000.0, "Ví MoMo", "APPROVED", "TX-MM-334102", now.minusDays(1).withHour(14)},
                {c2, "TOPUP_POTATO", "VND", 100000.0, "Ví ZaloPay", "APPROVED", "TX-ZP-774011", now.minusDays(1).withHour(16)},
                {c1, "TOPUP_POTATO", "VND", 1000000.0, "Chuyển khoản Ngân hàng", "APPROVED", "TX-TCB-11209", now.minusDays(1).withHour(19)},
                // 2 ngày trước
                {c3, "TOPUP_POTATO", "VND", 20000.0, "Ví MoMo", "REJECTED", "TX-MM-556102", now.minusDays(2).withHour(10)},
                {c4, "TOPUP_POTATO", "VND", 300000.0, "Chuyển khoản Ngân hàng", "APPROVED", "TX-VCB-998123", now.minusDays(2).withHour(15)},
                // 3 ngày trước
                {c1, "TOPUP_POTATO", "VND", 50000.0, "Ví ZaloPay", "APPROVED", "TX-ZP-882103", now.minusDays(3).withHour(9)},
                {c5, "TOPUP_POTATO", "VND", 200000.0, "Chuyển khoản Ngân hàng", "APPROVED", "TX-MB-771239", now.minusDays(3).withHour(17)},
                // 4 ngày trước
                {c2, "TOPUP_POTATO", "VND", 100000.0, "Ví MoMo", "APPROVED", "TX-MM-112944", now.minusDays(4).withHour(11)},
                {c3, "TOPUP_POTATO", "VND", 499000.0, "Chuyển khoản Ngân hàng", "APPROVED", "TX-MB-889012", now.minusDays(4).withHour(20)},
                // 5 ngày trước
                {c4, "TOPUP_POTATO", "VND", 150000.0, "Ví ZaloPay", "APPROVED", "TX-ZP-993821", now.minusDays(5).withHour(13)},
                // 6 ngày trước
                {c1, "TOPUP_POTATO", "VND", 500000.0, "Chuyển khoản Ngân hàng", "APPROVED", "TX-VCB-443211", now.minusDays(6).withHour(18)},
                // 15 ngày trước (30d)
                {c2, "TOPUP_POTATO", "VND", 200000.0, "Ví MoMo", "APPROVED", "TX-MM-884102", now.minusDays(15).withHour(10)},
                // 25 ngày trước (30d)
                {c3, "TOPUP_POTATO", "VND", 1000000.0, "Chuyển khoản Ngân hàng", "APPROVED", "TX-TCB-553102", now.minusDays(25).withHour(14)}
        };

        List<Orders> ordersToSave = new ArrayList<>();
        List<PotatoTransaction> txsToSave = new ArrayList<>();

        for (Object[] r : orderData) {
            Customer cust = (Customer) r[0];
            String type = (String) r[1];
            String curr = (String) r[2];
            double amt = (double) r[3];
            String method = (String) r[4];
            String status = (String) r[5];
            String code = (String) r[6];
            LocalDateTime dt = (LocalDateTime) r[7];

            Orders o = new Orders();
            o.setCustomer(cust);
            o.setOrderType(type);
            o.setPaymentCurrency(curr);
            o.setTotal_amount(amt);
            o.setPayment_method(method);
            o.setPayment_status(status);
            o.setTransaction_no(code);
            o.setOrder_date(dt);
            ordersToSave.add(o);

            if ("APPROVED".equalsIgnoreCase(status)) {
                int potatoes = (int) Math.round(amt / 1000.0);
                PotatoTransaction pt = new PotatoTransaction();
                pt.setCustomer(cust);
                pt.setAmount(potatoes);
                pt.setBalanceAfter((cust.getPotatoBalance() != null ? cust.getPotatoBalance() : 0) + potatoes);
                pt.setType("TOPUP");
                pt.setDescription("Nạp Củ Khoai Tây thành công qua " + method + " (" + code + ")");
                pt.setCreatedAt(dt);
                txsToSave.add(pt);
            }
        }

        ordersRepository.saveAll(ordersToSave);
        potatoTransactionRepository.saveAll(txsToSave);
        System.out.println(">>> [AdminInitialDataLoader] Seeded " + ordersToSave.size() + " realistic finance orders with PotatoTransactions.");
    }

    /**
     * 4. Khởi tạo dữ liệu Giao Dịch Thuê Sách thực tế
     */
    private void seedBookRentals() {
        if (accessRecordRepository.count() >= 12) return;

        List<Customer> customers = customerRepository.findAll();
        List<Book> books = bookRepository.findAll();
        if (customers.isEmpty() || books.isEmpty()) return;

        Customer c1 = customers.get(0);
        Customer c2 = customers.size() > 1 ? customers.get(1) : c1;
        Customer c3 = customers.size() > 2 ? customers.get(2) : c1;
        Customer c4 = customers.size() > 3 ? customers.get(3) : c2;
        Customer c5 = customers.size() > 4 ? customers.get(4) : c1;

        Book b1 = books.get(0);
        Book b2 = books.size() > 1 ? books.get(1) : b1;
        Book b3 = books.size() > 2 ? books.get(2) : b1;
        Book b4 = books.size() > 3 ? books.get(3) : b2;
        Book b5 = books.size() > 4 ? books.get(4) : b3;

        LocalDateTime now = LocalDateTime.now();

        Object[][] rentalData = {
                // Hôm nay
                {c1, b1, now.minusHours(2), now.plusDays(7), "ACTIVE", 25, 20.0, now.minusMinutes(30)},
                {c2, b2, now.minusHours(5), now.plusDays(14), "PENDING", 1, 0.0, now.minusHours(5)},
                {c3, b3, now.minusHours(8), now.plusDays(30), "ACTIVE", 45, 35.0, now.minusHours(1)},
                // Hôm qua (1 ngày trước)
                {c4, b4, now.minusDays(1).withHour(10), now.plusDays(6), "ACTIVE", 60, 50.0, now.minusHours(4)},
                {c5, b5, now.minusDays(1).withHour(15), now.plusDays(13), "ACTIVE", 12, 10.0, now.minusHours(6)},
                // 2 ngày trước
                {c1, b2, now.minusDays(2).withHour(9), now.plusDays(5), "ACTIVE", 90, 75.0, now.minusDays(1)},
                {c2, b3, now.minusDays(2).withHour(14), now.plusDays(28), "ACTIVE", 25, 20.0, now.minusDays(1)},
                {c3, b1, now.minusDays(2).withHour(20), now.plusDays(12), "REVOKED", 15, 12.0, now.minusDays(2)},
                // 3 ngày trước
                {c4, b5, now.minusDays(3).withHour(11), now.plusDays(4), "ACTIVE", 140, 85.0, now.minusDays(1)},
                {c5, b4, now.minusDays(3).withHour(16), now.plusDays(11), "ACTIVE", 65, 45.0, now.minusDays(2)},
                // 4 ngày trước
                {c1, b3, now.minusDays(4).withHour(8), now.plusDays(3), "ACTIVE", 80, 60.0, now.minusDays(2)},
                {c2, b1, now.minusDays(4).withHour(17), now.plusDays(10), "ACTIVE", 110, 90.0, now.minusDays(1)},
                // 5 ngày trước
                {c3, b2, now.minusDays(5).withHour(13), now.plusDays(2), "ACTIVE", 200, 100.0, now.minusDays(2)},
                // 6 ngày trước
                {c4, b3, now.minusDays(6).withHour(10), now.plusDays(1), "ACTIVE", 175, 95.0, now.minusDays(3)},
                {c5, b1, now.minusDays(6).withHour(19), now.plusDays(8), "EXPIRED", 250, 100.0, now.minusDays(1)}
        };

        List<Access_Record> records = new ArrayList<>();
        for (Object[] r : rentalData) {
            Access_Record ar = new Access_Record();
            ar.setCustomer((Customer) r[0]);
            ar.setBook((Book) r[1]);
            ar.setStart_date((LocalDateTime) r[2]);
            ar.setEnd_date((LocalDateTime) r[3]);
            ar.setStatus((String) r[4]);
            ar.setCurrentPage((Integer) r[5]);
            ar.setReadingPercentage((Double) r[6]);
            ar.setLastReadAt((LocalDateTime) r[7]);
            records.add(ar);
        }

        accessRecordRepository.saveAll(records);
        System.out.println(">>> [AdminInitialDataLoader] Seeded " + records.size() + " realistic book rentals.");
    }
}
