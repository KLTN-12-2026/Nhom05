package com.example.demochatbot.service.potato;

import com.example.demochatbot.dto.TransferRequest;
import com.example.demochatbot.dto.WalletResponseDto;
import com.example.demochatbot.model.Customer;
import com.example.demochatbot.model.MembershipTier;
import com.example.demochatbot.model.PotatoPackage;
import com.example.demochatbot.model.PotatoTransaction;
import com.example.demochatbot.repository.CustomerRepository;
import com.example.demochatbot.repository.PotatoPackageRepository;
import com.example.demochatbot.repository.PotatoTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * ============================================================================
 * Class: PotatoServiceImpl
 * Mô tả: Hiện thực chi tiết toàn bộ nghiệp vụ Ví Khoai Tây cho độc giả HALM BOOK
 *        - Lấy số dư Khoai thực tế từ cơ sở dữ liệu
 *        - Khởi tạo & lấy danh sách các gói nạp
 *        - Cộng Khoai sau khi cổng thanh toán xác nhận giao dịch
 *        - Sổ cái minh bạch lịch sử giao dịch (cộng/trừ khoai)
 *        - Tặng khoai cho bạn bè độc giả
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
    private com.example.demochatbot.service.tier.TierService tierService;

    /**
     * Lấy thông tin ví và số dư Khoai thực tế của tài khoản đăng nhập
     */
    @Override
    public WalletResponseDto getWalletInfo(int accountId) {
        Customer customer = customerRepository.findCustomerById(accountId);
        if (customer == null) {
            throw new RuntimeException("Không tìm thấy thông tin khách hàng cho tài khoản ID: " + accountId);
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

    @Override
    @Transactional
    public PotatoTransaction creditVerifiedTopup(int accountId, int amount, String description) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Số Khoai nạp phải lớn hơn 0.");
        }

        Customer customer = customerRepository.findCustomerById(accountId);
        if (customer == null) {
            throw new RuntimeException("Không tìm thấy thông tin khách hàng!");
        }

        int currentBalance = customer.getPotatoBalance() != null ? customer.getPotatoBalance() : 0;
        int newBalance = Math.addExact(currentBalance, amount);
        int currentEarned = customer.getTotalPotatoEarned() != null
                ? customer.getTotalPotatoEarned()
                : currentBalance;
        customer.setPotatoBalance(newBalance);
        customer.setTotalPotatoEarned(Math.addExact(currentEarned, amount));
        customerRepository.save(customer);
        tierService.calculateAndUpdateCustomerTier(customer);

        PotatoTransaction transaction = new PotatoTransaction();
        transaction.setCustomer(customer);
        transaction.setAmount(amount);
        transaction.setBalanceAfter(newBalance);
        transaction.setType("TOPUP");
        transaction.setDescription(description);
        transaction.setCreatedAt(LocalDateTime.now());

        return potatoTransactionRepository.save(transaction);
    }

    /**
     * Xử lý chuyển/tặng Khoai cho độc giả khác
     */
    @Override
    @Transactional
    public PotatoTransaction transferPotato(int accountId, TransferRequest request) {
        Customer sender = customerRepository.findCustomerById(accountId);
        if (sender == null) {
            throw new RuntimeException("Không tìm thấy thông tin tài khoản người gửi!");
        }

        if (request.getAmount() <= 0) {
            throw new RuntimeException("Số lượng Khoai tặng phải lớn hơn 0!");
        }

        int currentSenderBalance = sender.getPotatoBalance() != null ? sender.getPotatoBalance() : 0;
        if (currentSenderBalance < request.getAmount()) {
            throw new RuntimeException("Số dư Khoai trong ví không đủ để thực hiện tặng (" + currentSenderBalance + " < " + request.getAmount() + ")!");
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

        // 2. Trừ khoai người gửi
        int newSenderBalance = currentSenderBalance - request.getAmount();
        sender.setPotatoBalance(newSenderBalance);
        customerRepository.save(sender);

        // 3. Tạo giao dịch trừ cho người gửi
        PotatoTransaction senderTx = new PotatoTransaction();
        senderTx.setCustomer(sender);
        senderTx.setAmount(-request.getAmount());
        senderTx.setBalanceAfter(newSenderBalance);
        senderTx.setType("TRANSFER_OUT");
        String noteMsg = (request.getNote() != null && !request.getNote().trim().isEmpty())
                ? " - Lời nhắn: " + request.getNote().trim()
                : "";
        String receiverName = receiver.getCustomerName() != null ? receiver.getCustomerName() : receiver.getCustomer_id();
        senderTx.setDescription("Tặng " + request.getAmount() + " Khoai cho độc giả " + receiverName + " (" + receiver.getCustomer_id() + ")" + noteMsg);
        senderTx.setCreatedAt(LocalDateTime.now());
        potatoTransactionRepository.save(senderTx);

        // 4. Cộng khoai cho người nhận
        int curRecBalance = receiver.getPotatoBalance() != null ? receiver.getPotatoBalance() : 0;
        int newRecBalance = curRecBalance + request.getAmount();
        receiver.setPotatoBalance(newRecBalance);
        int recEarned = receiver.getTotalPotatoEarned() != null ? receiver.getTotalPotatoEarned() : curRecBalance;
        receiver.setTotalPotatoEarned(recEarned + request.getAmount());
        customerRepository.save(receiver);

        // 5. Tạo giao dịch cộng cho người nhận
        PotatoTransaction recTx = new PotatoTransaction();
        recTx.setCustomer(receiver);
        recTx.setAmount(request.getAmount());
        recTx.setBalanceAfter(newRecBalance);
        recTx.setType("TRANSFER_IN");
        String senderName = sender.getCustomerName() != null ? sender.getCustomerName() : "bạn đọc HALM";
        recTx.setDescription("Nhận " + request.getAmount() + " Khoai tặng từ " + senderName + noteMsg);
        recTx.setCreatedAt(LocalDateTime.now());
        potatoTransactionRepository.save(recTx);

        return senderTx;
    }

    /**
     * Trừ Khoai khi thanh toán đơn thuê/mua sách
     */
    @Override
    @Transactional
    public PotatoTransaction deductPotato(int accountId, int amount, String description) {
        Customer customer = customerRepository.findCustomerById(accountId);
        if (customer == null) {
            throw new RuntimeException("Không tìm thấy thông tin khách hàng!");
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
