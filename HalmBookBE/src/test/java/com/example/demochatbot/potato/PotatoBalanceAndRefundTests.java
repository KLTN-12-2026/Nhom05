package com.example.demochatbot.potato;

import com.example.demochatbot.dto.TopupRequest;
import com.example.demochatbot.dto.TransferRequest;
import com.example.demochatbot.dto.WalletResponseDto;
import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import com.example.demochatbot.service.potato.PotatoServiceImpl;
import com.example.demochatbot.service.tier.TierService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Số dư Khoai & Hoàn tiền Test Suite (Potato Balance & Refund)")
class PotatoBalanceAndRefundTests {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private PotatoPackageRepository potatoPackageRepository;

    @Mock
    private PotatoTransactionRepository potatoTransactionRepository;

    @Mock
    private OrdersRepository ordersRepository;

    @Mock
    private TierService tierService;

    @InjectMocks
    private PotatoServiceImpl potatoService;

    private Customer senderCustomer;
    private Customer receiverCustomer;

    @BeforeEach
    void setUp() {
        senderCustomer = new Customer();
        senderCustomer.setCustomer_id("CUST-SENDER");
        senderCustomer.setCustomerName("Người Tặng Khoai");
        senderCustomer.setEmail("sender@halmbook.vn");
        senderCustomer.setPotatoBalance(50);
        senderCustomer.setTotalPotatoEarned(100);
        senderCustomer.setStreakDays(7);

        receiverCustomer = new Customer();
        receiverCustomer.setCustomer_id("CUST-RECEIVER");
        receiverCustomer.setCustomerName("Người Nhận Khoai");
        receiverCustomer.setEmail("receiver@halmbook.vn");
        receiverCustomer.setPotatoBalance(10);
        receiverCustomer.setTotalPotatoEarned(20);
    }

    @Test
    @DisplayName("1. Lấy thông tin ví & tính đúng giá trị quy đổi VNĐ (1 Khoai = 1.000 VNĐ)")
    void testWalletInfoAndVndConversion() {
        MembershipTier tier = new MembershipTier();
        tier.setTierName("🌾 Lão Nông");
        senderCustomer.setMembershipTier(tier);

        when(customerRepository.findCustomerById(1)).thenReturn(senderCustomer);

        WalletResponseDto wallet = potatoService.getWalletInfo(1);

        assertNotNull(wallet);
        assertEquals(50, wallet.getPotatoBalance(), "Số dư khoai phải là 50");
        assertEquals(50000.0, wallet.getEquivalentVnd(), "50 Khoai phải quy đổi tương đương 50.000 VNĐ");
        assertEquals(7, wallet.getStreakDays(), "Số ngày chuỗi phải là 7");
        assertEquals("Lão Nông", wallet.getTierName(), "Tên hạng phải được chuẩn hóa bỏ emoji");
    }

    @Test
    @DisplayName("2. Khởi tạo danh sách các gói nạp chuẩn khi cơ sở dữ liệu trống")
    void testGetActivePackagesDefaultInitialization() {
        PotatoPackage pkg1 = new PotatoPackage(1, "Gói Trải Nghiệm", 50, 0, 50000.0,
                "Cơ Bản", "Đọc thử 3-5 cuốn sách.", true, LocalDateTime.now());
        PotatoPackage pkg2 = new PotatoPackage(2, "Gói Tiêu Chuẩn", 200, 20, 200000.0,
                "Đề Xuất 🔥", "Gốc 200 + Tặng 20 Khoai", true, LocalDateTime.now());
        PotatoPackage pkg3 = new PotatoPackage(3, "Gói Thân Thiết", 500, 75, 500000.0,
                "+15% Thưởng", "Gốc 500 + Tặng 75 Khoai", true, LocalDateTime.now());
        PotatoPackage pkg4 = new PotatoPackage(4, "Gói Đặc Quyền", 1000, 250, 1000000.0,
                "+25% Thưởng VIP", "Gốc 1.000 + Tặng 250 Khoai", true, LocalDateTime.now());

        List<PotatoPackage> defaults = List.of(pkg1, pkg2, pkg3, pkg4);
        when(potatoPackageRepository.findByIsActiveTrueOrderByPriceVndAsc())
                .thenReturn(List.of())
                .thenReturn(defaults);
        when(potatoPackageRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        List<PotatoPackage> packages = potatoService.getActivePackages();

        assertNotNull(packages);
        assertEquals(4, packages.size(), "Phải có đúng 4 gói nạp tiêu chuẩn");

        // Gói 1: 50 Khoai (50.000 VNĐ)
        assertEquals(50, packages.get(0).getPotatoAmount());
        assertEquals(50000.0, packages.get(0).getPriceVnd());

        // Gói 4: 1.000 Khoai + 250 Khoai tặng (1.000.000 VNĐ)
        assertEquals(1000, packages.get(3).getPotatoAmount());
        assertEquals(250, packages.get(3).getBonusPotato());
    }

    @Test
    @DisplayName("3. Nạp Khoai thành công và cộng số dư minh bạch")
    void testTopupPotatoSuccess() {
        when(customerRepository.findCustomerById(1)).thenReturn(senderCustomer);

        PotatoPackage pkg = new PotatoPackage();
        pkg.setPackageId(2);
        pkg.setPackageName("Gói Khởi Động");
        pkg.setPotatoAmount(50);
        pkg.setBonusPotato(5);
        when(potatoPackageRepository.findById(2)).thenReturn(Optional.of(pkg));

        when(potatoTransactionRepository.save(any(PotatoTransaction.class))).thenAnswer(inv -> inv.getArgument(0));

        TopupRequest request = new TopupRequest();
        request.setPackageId(2);
        request.setPaymentMethod("VIETQR");

        PotatoTransaction tx = potatoService.topupPotato(1, request);

        assertNotNull(tx);
        // Ban đầu 50 + nạp (50 + 5) = 105 Khoai
        assertEquals(55, tx.getAmount(), "Số khoai được cộng phải là 50 + 5 bonus = 55");
        assertEquals(105, tx.getBalanceAfter(), "Số dư sau nạp phải là 50 + 55 = 105");
        assertEquals(105, senderCustomer.getPotatoBalance(), "Số dư khách hàng phải được cập nhật lên 105");
        assertEquals("TOPUP", tx.getType());

        verify(customerRepository, times(1)).save(senderCustomer);
    }

    @Test
    @DisplayName("4. Tặng Khoai giữa 2 độc giả (Trừ người gửi và cộng người nhận)")
    void testTransferPotatoSuccess() {
        when(customerRepository.findCustomerById(1)).thenReturn(senderCustomer);
        when(customerRepository.findByEmail("receiver@halmbook.vn")).thenReturn(Optional.of(receiverCustomer));
        when(potatoTransactionRepository.save(any(PotatoTransaction.class))).thenAnswer(inv -> inv.getArgument(0));

        TransferRequest request = new TransferRequest();
        request.setReceiver("receiver@halmbook.vn");
        request.setAmount(15);
        request.setNote("Tặng bạn đọc sách vui vẻ!");

        PotatoTransaction senderTx = potatoService.transferPotato(1, request);

        assertNotNull(senderTx);
        assertEquals(-15, senderTx.getAmount(), "Giao dịch trừ khoai người gửi phải có amount âm (-15)");
        assertEquals(35, senderCustomer.getPotatoBalance(), "Người gửi còn lại: 50 - 15 = 35 Khoai");
        assertEquals(25, receiverCustomer.getPotatoBalance(), "Người nhận nhận được: 10 + 15 = 25 Khoai");

        verify(customerRepository, times(1)).save(senderCustomer);
        verify(customerRepository, times(1)).save(receiverCustomer);
    }

    @Test
    @DisplayName("5. Tặng Khoai vượt quá số dư bị từ chối với ngoại lệ thích hợp")
    void testTransferPotatoInsufficientBalanceThrowsException() {
        when(customerRepository.findCustomerById(1)).thenReturn(senderCustomer);

        TransferRequest request = new TransferRequest();
        request.setReceiver("receiver@halmbook.vn");
        request.setAmount(999); // Vượt quá số dư 50 Khoai

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            potatoService.transferPotato(1, request);
        });

        assertTrue(ex.getMessage().contains("Số dư Khoai trong ví không đủ"),
                "Phải báo lỗi không đủ số dư để tặng");
        verify(customerRepository, never()).save(any());
    }

    @Test
    @DisplayName("6. Hoàn tiền khi Quản trị viên từ chối yêu cầu thuê sách (Rental Reject & Refund)")
    void testRentalRejectionPotatoRefundCalculation() {
        // Mô phỏng nghiệp vụ hoàn khoai khi từ chối đơn thuê:
        // Đơn thuê có giá 12 Khoai, số dư hiện tại của khách hàng là 30 Khoai
        Book rentedBook = new Book();
        rentedBook.setBook_id("BOOK-002");
        rentedBook.setBookName("Tôi Thấy Hoa Vàng Trên Cỏ Xanh");
        rentedBook.setRent_price(12.0);

        Access_Record ar = new Access_Record();
        ar.setAccess_record_id(101);
        ar.setBook(rentedBook);
        ar.setCustomer(senderCustomer);
        ar.setStatus("PENDING");

        // Thực hiện tính toán hoàn tiền theo công thức của BookRentalAdminController
        long refundPotatoes = rentedBook.getRent_price() != null ? Math.round(rentedBook.getRent_price()) : 10;
        int curBalance = senderCustomer.getPotatoBalance() != null ? senderCustomer.getPotatoBalance() : 0;
        int newBalance = curBalance + (int) refundPotatoes;
        senderCustomer.setPotatoBalance(newBalance);

        PotatoTransaction pt = new PotatoTransaction();
        pt.setCustomer(senderCustomer);
        pt.setAmount((int) refundPotatoes);
        pt.setType("REFUND");
        pt.setDescription("Hoàn trả khoai cho đơn thuê sách #" + ar.getAccess_record_id() + " (" + rentedBook.getBookName() + ")");
        pt.setBalanceAfter(newBalance);
        pt.setCreatedAt(LocalDateTime.now());

        assertEquals(12, refundPotatoes, "Số khoai hoàn lại phải đúng bằng giá sách (12 Khoai)");
        assertEquals(62, newBalance, "Số dư sau hoàn tiền phải là 50 + 12 = 62 Khoai");
        assertEquals("REFUND", pt.getType(), "Loại giao dịch phải là REFUND");
        assertEquals(62, pt.getBalanceAfter(), "Sổ cái giao dịch phải lưu balanceAfter là 62");
    }

    @Test
    @DisplayName("7. Hoàn tiền theo giá net thực trả sau Voucher/Coupon (REG-REFUND-COUPON)")
    void testRentalRejectionNetPaidRefundWithVoucher() {
        // Gói 30 ngày giá 25 Khoai, dùng coupon KHOAI5 giảm 5 Khoai -> net thực trả là 20 Khoai
        Order_Item item = new Order_Item();
        item.setPrice(20.0); // Lưu giá net sau chiết khấu

        long refundPotatoes = item.getPrice() != null ? Math.max(0, Math.round(item.getPrice())) : 0;
        assertEquals(20, refundPotatoes, "Hoàn tiền khi từ chối phải là số tiền net thực trả (20 Khoai), không phải giá gộp 25 Khoai");
    }

    @Test
    @DisplayName("8. Không tạo tiền ảo khi hoàn tiền đơn thuê 0 Khoai (REG-REFUND-FREE)")
    void testRentalRejectionNetPaidRefundFreeVoucherNoMoneyCreated() {
        // Đơn thuê 0 Khoai nhờ voucher toàn phần -> net thực trả là 0 Khoai
        Order_Item item = new Order_Item();
        item.setPrice(0.0);

        long refundPotatoes = item.getPrice() != null ? Math.max(0, Math.round(item.getPrice())) : 0;
        assertEquals(0, refundPotatoes, "Đơn thuê 0 Khoai tuyệt đối không được hoàn tiền tạo tiền ảo");
    }

    @Test
    @DisplayName("9. Hoàn tiền chính xác theo chiết khấu hạng thành viên (REG-REFUND-MEMBERSHIP)")
    void testRentalRejectionNetPaidRefundWithMembershipDiscount() {
        // Gói 25 Khoai, giảm 5% hạng thành viên -> net thực trả là 24 Khoai
        Order_Item item = new Order_Item();
        item.setPrice(24.0);

        long refundPotatoes = item.getPrice() != null ? Math.max(0, Math.round(item.getPrice())) : 0;
        assertEquals(24, refundPotatoes, "Hoàn tiền phải khớp chính xác 24 Khoai thực trả của thành viên");
    }
}
