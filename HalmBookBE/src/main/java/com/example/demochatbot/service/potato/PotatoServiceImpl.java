package com.example.demochatbot.service.potato;

import com.example.demochatbot.dto.TopupRequest;
import com.example.demochatbot.dto.TransferRequest;
import com.example.demochatbot.dto.WalletResponseDto;
import com.example.demochatbot.model.Customer;
import com.example.demochatbot.model.MembershipTier;
import com.example.demochatbot.model.PotatoPackage;
import com.example.demochatbot.model.PotatoTransaction;
import com.example.demochatbot.model.Orders;
import com.example.demochatbot.repository.CustomerRepository;
import com.example.demochatbot.repository.PotatoPackageRepository;
import com.example.demochatbot.repository.PotatoTransactionRepository;
import com.example.demochatbot.repository.OrdersRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * ============================================================================
 * Class: PotatoServiceImpl
 * Mô tả: Hiện thực chi tiết toàn bộ nghiệp vụ Ví Khoai Tây cho độc giả HALM BOOK
 *        - Lấy số dư Khoai thực tế từ cơ sở dữ liệu
 *        - Khởi tạo & lấy danh sách các gói nạp
 *        - Nạp Khoai siêu tốc qua VietQR / Chuyển khoản (có khóa Pessimistic - IMP-03)
 *        - Sổ cái minh bạch lịch sử giao dịch (cộng/trừ khoai)
 *        - Tặng khoai cho bạn bè độc giả (Khóa 2 chiều có thứ tự tránh deadlock - IMP-03)
 *        - Khấu trừ khoai khi thanh toán đơn thuê sách
 * ============================================================================
 */
@Service
public class PotatoServiceImpl implements PotatoService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private PotatoPackageRepository potatoPackageRepository;

    @Autowired
    private PotatoTransactionRepository potatoTransactionRepository;

    @Autowired
    private OrdersRepository ordersRepository;

    @Autowired
    private com.example.demochatbot.service.tier.TierService tierService;

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    /**
     * Lấy thông tin ví và số dư Khoai thực tế của tài khoản đăng nhập
     */
    @Override
    @Transactional
    public WalletResponseDto getWalletInfo(int accountId) {
        Customer customer = customerRepository.findCustomerById(accountId);
        if (customer == null) {
            throw new RuntimeException("Không tìm thấy thông tin khách hàng cho tài khoản ID: " + accountId);
        }

        // Tier initialization can save this entity. Refresh it under the same wallet lock
        // so a post-transfer wallet response cannot overwrite another committed transfer.
        customer = customerRepository.findByIdForUpdate(customer.getCustomer_id()).orElse(customer);
        if (entityManager != null) {
            entityManager.refresh(customer, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        }
        try {
            MembershipTier updatedTier = tierService.calculateAndUpdateCustomerTier(customer);
            if (updatedTier != null) {
                customer.setMembershipTier(updatedTier);
            }
        } catch (Exception ignored) {}

        int balance = customer.getPotatoBalance() != null ? customer.getPotatoBalance() : 0;
        int totalEarned = customer.getTotalPotatoEarned() != null ? customer.getTotalPotatoEarned() : balance;
        int streak = customer.getStreakDays() != null ? customer.getStreakDays() : 0;
        String tierName = (customer.getMembershipTier() != null && customer.getMembershipTier().getTierName() != null)
                ? customer.getMembershipTier().getTierName().replaceAll("^[🌱🚜🌾🏰🥉🥈🥇👑🏆⭐\\s]+", "").trim()
                : "Thợ Cày";

        return WalletResponseDto.builder()
                .customerId(customer.getCustomer_id())
                .customerName(customer.getCustomerName() != null ? customer.getCustomerName() : "Độc Giả HALM")
                .email(customer.getEmail())
                .phoneNumber(customer.getPhoneNumber())
                .potatoBalance(balance)
                .totalPotatoEarned(totalEarned)
                .streakDays(streak)
                .tierName(tierName)
                .equivalentVnd(balance * 1000.0) // Quy đổi: 1 Khoai = 1.000 VNĐ
                .build();
    }

    /**
     * Lấy danh sách gói nạp Khoai Tây. Tự động nạp 4 gói chuẩn nếu database chưa có dữ liệu.
     */
    @Override
    public List<PotatoPackage> getActivePackages() {
        List<PotatoPackage> packages = potatoPackageRepository.findByIsActiveTrueOrderByPriceVndAsc();
        if (packages.isEmpty()) {
            // Khởi tạo 4 gói nạp tiêu chuẩn
            List<PotatoPackage> defaults = new ArrayList<>();

            defaults.add(new PotatoPackage(0, "Gói Trải Nghiệm", 50, 0, 50000.0,
                    "Cơ Bản", "Đọc thử 3-5 cuốn sách văn học hoặc thiếu nhi.", true, LocalDateTime.now()));

            defaults.add(new PotatoPackage(0, "Gói Tiêu Chuẩn", 200, 20, 200000.0,
                    "Đề Xuất 🔥", "Gốc 200 + Tặng 20 Khoai (10%) & voucher giảm 20k.", true, LocalDateTime.now()));

            defaults.add(new PotatoPackage(0, "Gói Thân Thiết", 500, 75, 500000.0,
                    "+15% Thưởng", "Gốc 500 + Tặng 75 Khoai (15%) & 01 Bookmark Gỗ.", true, LocalDateTime.now()));

            defaults.add(new PotatoPackage(0, "Gói Đặc Quyền", 1000, 250, 1000000.0,
                    "+25% Thưởng VIP", "Gốc 1.000 + Tặng 250 Khoai (25%) & miễn phí cọc sách trọn đời.", true, LocalDateTime.now()));

            potatoPackageRepository.saveAll(defaults);
            packages = potatoPackageRepository.findByIsActiveTrueOrderByPriceVndAsc();
        }
        return packages;
    }

    /**
     * Lấy danh sách lịch sử giao dịch biến động số dư Khoai thực tế của khách hàng
     */
    @Override
    public List<PotatoTransaction> getTransactionHistory(int accountId) {
        Customer customer = customerRepository.findCustomerById(accountId);
        if (customer == null) {
            return new ArrayList<>();
        }

        List<PotatoTransaction> transactions = potatoTransactionRepository.findByCustomerOrderByCreatedAtDesc(customer);

        // Nếu khách hàng chưa có giao dịch nào nhưng đã có số dư khoai, tạo 1 giao dịch chào mừng để hiển thị minh bạch
        if (transactions.isEmpty() && customer.getPotatoBalance() != null && customer.getPotatoBalance() > 0) {
            PotatoTransaction initialTx = new PotatoTransaction();
            initialTx.setCustomer(customer);
            initialTx.setAmount(customer.getPotatoBalance());
            initialTx.setBalanceAfter(customer.getPotatoBalance());
            initialTx.setType("REWARD");
            initialTx.setDescription("Quà chào mừng kích hoạt tài khoản độc giả HALM BOOK");
            initialTx.setCreatedAt(customer.getCreatedAt() != null ? customer.getCreatedAt() : LocalDateTime.now());
            potatoTransactionRepository.save(initialTx);

            transactions.add(initialTx);
        }

        return transactions;
    }

    /**
     * Xử lý nạp Khoai Tây vào ví (VietQR 24/7) - Khóa bản ghi tránh race condition (IMP-03)
     */
    @Override
    @Transactional
    public PotatoTransaction topupPotato(int accountId, TopupRequest request) {
        Customer initial = customerRepository.findCustomerById(accountId);
        if (initial == null) {
            throw new RuntimeException("Không tìm thấy thông tin khách hàng!");
        }
        Customer customer = customerRepository.findByIdForUpdate(initial.getCustomer_id())
                .orElse(initial);
        if (entityManager != null) {
            entityManager.refresh(customer, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        }

        int totalKhoaiToAdd = 0;
        String packageName = "Nạp Khoai Siêu Tốc";

        if (request.getPackageId() != null && request.getPackageId() > 0) {
            Optional<PotatoPackage> pkgOpt = potatoPackageRepository.findById(request.getPackageId());
            if (pkgOpt.isPresent()) {
                PotatoPackage pkg = pkgOpt.get();
                totalKhoaiToAdd = pkg.getPotatoAmount() + pkg.getBonusPotato();
                packageName = pkg.getPackageName();
            }
        }

        // Nếu không có packageId, tính theo số tiền (1.000 VNĐ = 1 Khoai)
        if (totalKhoaiToAdd == 0) {
            double money = (request.getAmountMoney() != null && request.getAmountMoney() > 0) ? request.getAmountMoney() : 50000.0;
            totalKhoaiToAdd = (int) (money / 1000.0);
        }

        // Cập nhật số dư thực tế trong Customer
        int currentBalance = customer.getPotatoBalance() != null ? customer.getPotatoBalance() : 0;
        int newBalance = currentBalance + totalKhoaiToAdd;
        customer.setPotatoBalance(newBalance);

        int currentEarned = customer.getTotalPotatoEarned() != null ? customer.getTotalPotatoEarned() : currentBalance;
        customer.setTotalPotatoEarned(currentEarned + totalKhoaiToAdd);
        customerRepository.save(customer);

        // Tự động kiểm tra và thăng hạng thành viên nếu tích lũy đủ điểm
        try {
            tierService.calculateAndUpdateCustomerTier(customer);
        } catch (Exception e) {
            System.err.println("Lỗi kiểm tra thăng hạng khi nạp khoai: " + e.getMessage());
        }

        // Lưu vào sổ cái giao dịch
        PotatoTransaction transaction = new PotatoTransaction();
        transaction.setCustomer(customer);
        transaction.setAmount(totalKhoaiToAdd);
        transaction.setBalanceAfter(newBalance);
        transaction.setType("TOPUP");
        transaction.setDescription("Nạp " + packageName + " thành công qua VietQR 24/7");
        transaction.setCreatedAt(LocalDateTime.now());

        return potatoTransactionRepository.save(transaction);
    }

    /** Queue a top-up for admin verification; wallet credit happens only on approval. */
    @Override
    @Transactional
    public Orders createTopupRequest(int accountId, TopupRequest request) {
        Customer customer = customerRepository.findCustomerById(accountId);
        if (customer == null) {
            throw new RuntimeException("Không tìm thấy thông tin khách hàng!");
        }
        if (request == null) {
            throw new IllegalArgumentException("Thông tin yêu cầu nạp không hợp lệ!");
        }

        Double amountMoney = request.getAmountMoney();
        if (request.getPackageId() != null) {
            PotatoPackage selectedPackage = potatoPackageRepository.findById(request.getPackageId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy gói nạp đã chọn!"));
            if (Boolean.FALSE.equals(selectedPackage.getIsActive())) {
                throw new IllegalArgumentException("Gói nạp này hiện không còn khả dụng!");
            }
            amountMoney = selectedPackage.getPriceVnd();
        }
        if (amountMoney == null || amountMoney <= 0) {
            throw new IllegalArgumentException("Số tiền nạp phải lớn hơn 0!");
        }

        Orders order = new Orders();
        order.setCustomer(customer);
        order.setTotal_amount(amountMoney);
        order.setPaymentCurrency("VND");
        order.setOrderType("TOPUP_POTATO");
        order.setOrder_date(LocalDateTime.now());
        order.setPayment_status("PENDING");
        order.setPayment_method(request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank()
                ? request.getPaymentMethod().trim() : "VIETQR");
        order.setTransaction_no("TOPUP-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
        order.setDiscount_amount(0);
        return ordersRepository.save(order);
    }

    /**
     * Xử lý chuyển/tặng Khoai cho độc giả khác (Khóa theo thứ tự sắp xếp tránh Deadlock - IMP-03)
     */
    @Override
    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public PotatoTransaction transferPotato(int accountId, TransferRequest request) {
        Customer sender = customerRepository.findCustomerById(accountId);
        if (sender == null) {
            throw new RuntimeException("Không tìm thấy thông tin tài khoản người gửi!");
        }

        if (request.getAmount() <= 0) {
            throw new RuntimeException("Số lượng Khoai tặng phải lớn hơn 0!");
        }

        int preCheckBalance = sender.getPotatoBalance() != null ? sender.getPotatoBalance() : 0;
        if (preCheckBalance < request.getAmount()) {
            throw new RuntimeException("Số dư Khoai trong ví không đủ để thực hiện tặng (" + preCheckBalance + " < " + request.getAmount() + ")!");
        }

        // 1. Tìm và xác thực người nhận trước khi thực hiện trừ khoai
        String rawReceiver = request.getReceiver() != null ? request.getReceiver().trim() : "";
        if (rawReceiver.isEmpty()) {
            throw new RuntimeException("Vui lòng nhập Email, Mã độc giả hoặc Số điện thoại người nhận!");
        }

        String cleanReceiver = rawReceiver.replaceAll("^(?i)(id#|id|#)", "").trim();

        Optional<Customer> receiverOpt = customerRepository.findByEmail(rawReceiver);
        if (receiverOpt.isEmpty()) {
            receiverOpt = customerRepository.findByEmail(cleanReceiver);
        }
        if (receiverOpt.isEmpty()) {
            receiverOpt = customerRepository.findById(rawReceiver);
        }
        if (receiverOpt.isEmpty()) {
            receiverOpt = customerRepository.findById(cleanReceiver);
        }
        if (receiverOpt.isEmpty() && cleanReceiver.matches("(?i)c\\d+")) {
            receiverOpt = customerRepository.findById(cleanReceiver.toUpperCase());
        }
        if (receiverOpt.isEmpty() && cleanReceiver.matches("\\d+")) {
            String formattedId = String.format("C%05d", Integer.parseInt(cleanReceiver));
            receiverOpt = customerRepository.findById(formattedId);
            if (receiverOpt.isEmpty()) {
                Customer c = customerRepository.findCustomerById(Integer.parseInt(cleanReceiver));
                if (c != null) receiverOpt = Optional.of(c);
            }
        }
        if (receiverOpt.isEmpty()) {
            receiverOpt = customerRepository.findByPhoneNumber(rawReceiver);
            if (receiverOpt.isEmpty()) {
                receiverOpt = customerRepository.findByPhoneNumber(cleanReceiver);
            }
        }

        if (receiverOpt.isEmpty()) {
            throw new RuntimeException("Không tìm thấy bạn đọc nhận Khoai với thông tin: '" + rawReceiver + "'. Vui lòng kiểm tra lại email hoặc mã độc giả (ví dụ: id#C00007)!");
        }

        Customer receiver = receiverOpt.get();
        if (receiver.getCustomer_id() != null && receiver.getCustomer_id().equalsIgnoreCase(sender.getCustomer_id())) {
            throw new RuntimeException("Bạn không thể tự tặng Khoai cho chính mình!");
        }

        // 2. Khóa dòng PESSIMISTIC_WRITE theo thứ tự từ điển của customer_id để tuyệt đối chống Deadlock (IMP-03)
        String senderId = sender.getCustomer_id();
        String receiverId = receiver.getCustomer_id();
        Customer lockedSender;
        Customer lockedReceiver;

        if (senderId.compareTo(receiverId) < 0) {
            lockedSender = customerRepository.findByIdForUpdate(senderId).orElse(sender);
            lockedReceiver = customerRepository.findByIdForUpdate(receiverId).orElse(receiver);
        } else {
            lockedReceiver = customerRepository.findByIdForUpdate(receiverId).orElse(receiver);
            lockedSender = customerRepository.findByIdForUpdate(senderId).orElse(sender);
        }
        if (entityManager != null) {
            entityManager.refresh(lockedSender, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
            entityManager.refresh(lockedReceiver, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        }
        customerRepository.synchronizeLockedWallet(lockedSender);
        customerRepository.synchronizeLockedWallet(lockedReceiver);

        // 3. Kiểm tra số dư người gửi trên bản ghi đã khóa
        int currentSenderBalance = lockedSender.getPotatoBalance() != null ? lockedSender.getPotatoBalance() : 0;
        if (currentSenderBalance < request.getAmount()) {
            throw new RuntimeException("Số dư Khoai trong ví không đủ để thực hiện tặng (" + currentSenderBalance + " < " + request.getAmount() + ")!");
        }

        // 4. Trừ khoai người gửi
        int newSenderBalance = currentSenderBalance - request.getAmount();
        lockedSender.setPotatoBalance(newSenderBalance);
        customerRepository.save(lockedSender);

        // 5. Tạo giao dịch trừ cho người gửi
        PotatoTransaction senderTx = new PotatoTransaction();
        senderTx.setCustomer(lockedSender);
        senderTx.setAmount(-request.getAmount());
        senderTx.setBalanceAfter(newSenderBalance);
        senderTx.setType("TRANSFER_OUT");
        String noteMsg = (request.getNote() != null && !request.getNote().trim().isEmpty())
                ? " - Lời nhắn: " + request.getNote().trim()
                : "";
        String receiverName = lockedReceiver.getCustomerName() != null ? lockedReceiver.getCustomerName() : lockedReceiver.getCustomer_id();
        senderTx.setDescription("Tặng " + request.getAmount() + " Khoai cho độc giả " + receiverName + " (" + lockedReceiver.getCustomer_id() + ")" + noteMsg);
        senderTx.setCreatedAt(LocalDateTime.now());
        potatoTransactionRepository.save(senderTx);

        // 6. Cộng khoai cho người nhận
        int curRecBalance = lockedReceiver.getPotatoBalance() != null ? lockedReceiver.getPotatoBalance() : 0;
        int newRecBalance = curRecBalance + request.getAmount();
        lockedReceiver.setPotatoBalance(newRecBalance);
        int recEarned = lockedReceiver.getTotalPotatoEarned() != null ? lockedReceiver.getTotalPotatoEarned() : curRecBalance;
        lockedReceiver.setTotalPotatoEarned(recEarned + request.getAmount());
        customerRepository.save(lockedReceiver);

        // 7. Tạo giao dịch cộng cho người nhận
        PotatoTransaction recTx = new PotatoTransaction();
        recTx.setCustomer(lockedReceiver);
        recTx.setAmount(request.getAmount());
        recTx.setBalanceAfter(newRecBalance);
        recTx.setType("TRANSFER_IN");
        String senderName = lockedSender.getCustomerName() != null ? lockedSender.getCustomerName() : "bạn đọc HALM";
        recTx.setDescription("Nhận " + request.getAmount() + " Khoai tặng từ " + senderName + noteMsg);
        recTx.setCreatedAt(LocalDateTime.now());
        potatoTransactionRepository.save(recTx);

        return senderTx;
    }

    /**
     * Trừ Khoai khi thanh toán đơn thuê/mua sách (Có khóa Pessimistic - IMP-03)
     */
    @Override
    @Transactional
    public PotatoTransaction deductPotato(int accountId, int amount, String description) {
        Customer initial = customerRepository.findCustomerById(accountId);
        if (initial == null) {
            throw new RuntimeException("Không tìm thấy thông tin khách hàng!");
        }
        Customer customer = customerRepository.findByIdForUpdate(initial.getCustomer_id())
                .orElse(initial);
        if (entityManager != null) {
            entityManager.refresh(customer, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        }

        int currentBalance = customer.getPotatoBalance() != null ? customer.getPotatoBalance() : 0;
        if (currentBalance < amount) {
            throw new RuntimeException("Số dư Ví Khoai không đủ (" + currentBalance + " < " + amount + " Khoai)!");
        }

        int newBalance = currentBalance - amount;
        customer.setPotatoBalance(newBalance);
        customerRepository.save(customer);

        PotatoTransaction transaction = new PotatoTransaction();
        transaction.setCustomer(customer);
        transaction.setAmount(-amount);
        transaction.setBalanceAfter(newBalance);
        transaction.setType("RENT_BOOK");
        transaction.setDescription(description != null ? description : "Khấu trừ phí thuê sách qua Ví Khoai Tây");
        transaction.setCreatedAt(LocalDateTime.now());

        return potatoTransactionRepository.save(transaction);
    }
}
