package com.example.demochatbot.order;

import com.example.demochatbot.dto.CheckoutItemRequest;
import com.example.demochatbot.dto.CheckoutRequest;
import com.example.demochatbot.dto.CheckoutResponse;
import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import com.example.demochatbot.service.order.OrderServiceImpl;
import com.example.demochatbot.service.order.CheckoutCoordinator;
import java.util.function.Supplier;
import com.example.demochatbot.service.tier.TierService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Tính tiền & Mua/Thuê sách Test Suite (Order & Pricing)")
class OrderAndPricingTests {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private BookRepository bookRepository;

    @Mock
    private OrdersRepository ordersRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private AccessRecordRepository accessRecordRepository;

    @Mock
    private PotatoTransactionRepository potatoTransactionRepository;

    @Mock
    private TierService tierService;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private PromotionRepository promotionRepository;

    @Mock
    private CheckoutCoordinator checkoutCoordinator;

    @InjectMocks
    private OrderServiceImpl orderService;

    private Customer sampleCustomer;
    private Book sampleBook;

    @BeforeEach
    void setUp() {
        lenient().when(checkoutCoordinator.execute(any(), any())).thenAnswer(invocation -> ((Supplier<?>) invocation.getArgument(1)).get());
        sampleCustomer = new Customer();
        sampleCustomer.setCustomer_id("CUST-001");
        sampleCustomer.setCustomerName("Nguyễn Văn Độc Giả");
        sampleCustomer.setEmail("reader@halmbook.vn");
        sampleCustomer.setPotatoBalance(100);

        sampleBook = new Book();
        sampleBook.setBook_id("BOOK-001");
        sampleBook.setBookName("Mắt Biếc");
        sampleBook.setAuthor("Nguyễn Nhật Ánh");
        sampleBook.setRent_price(10.0);
    }

    @Test
    @DisplayName("1. Tính giá thuê sách theo các gói thời hạn (1, 3, 7, 14, 15, 30 ngày & vĩnh viễn)")
    void testResolveItemPriceByDurationPlans() {
        double price1 = ReflectionTestUtils.invokeMethod(orderService, "resolveItemPrice", "1", sampleBook);
        assertEquals(2.0, price1, "Gói 1 ngày phải có giá 2 Khoai");

        double price3 = ReflectionTestUtils.invokeMethod(orderService, "resolveItemPrice", "3", sampleBook);
        assertEquals(5.0, price3, "Gói 3 ngày phải có giá 5 Khoai");

        double price7 = ReflectionTestUtils.invokeMethod(orderService, "resolveItemPrice", "7", sampleBook);
        assertEquals(9.0, price7, "Gói 7 ngày phải có giá 9 Khoai");

        double price15 = ReflectionTestUtils.invokeMethod(orderService, "resolveItemPrice", "15", sampleBook);
        assertEquals(18.0, price15, "Gói 15 ngày phải có giá 18 Khoai");

        double price30 = ReflectionTestUtils.invokeMethod(orderService, "resolveItemPrice", "30", sampleBook);
        assertEquals(25.0, price30, "Gói 30 ngày phải có giá 25 Khoai");

        double priceForever = ReflectionTestUtils.invokeMethod(orderService, "resolveItemPrice", "forever", sampleBook);
        assertEquals(10.0, priceForever, "Mua vĩnh viễn phải lấy theo giá sách (10 Khoai)");
    }

    @Test
    @DisplayName("2. Áp dụng chiết khấu hạng thành viên (Membership Tier Discount)")
    void testMembershipTierDiscountOnCheckout() {
        MembershipTier tier = new MembershipTier();
        tier.setTierName("Lão Nông");
        tier.setDiscountPercent(10);
        sampleCustomer.setMembershipTier(tier);

        sampleBook.setRent_price(20.0);

        when(customerRepository.findCustomerById(1)).thenReturn(sampleCustomer);
        when(bookRepository.findById("BOOK-001")).thenReturn(Optional.of(sampleBook));
        when(ordersRepository.save(any(Orders.class))).thenAnswer(inv -> {
            Orders o = inv.getArgument(0);
            o.setOrders_id(1);
            return o;
        });

        CheckoutItemRequest item = new CheckoutItemRequest();
        item.setBookId("BOOK-001");
        item.setPlanKey("forever");

        CheckoutRequest request = new CheckoutRequest();
        request.setItems(List.of(item));

        CheckoutResponse response = orderService.checkoutWithPotato(1, request);

        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertEquals(18, response.getTotalKhoaiPaid(), "Tổng thanh toán sau giảm 10% hạng Lão Nông phải là 18 Khoai");
        assertEquals(82, response.getRemainingPotatoBalance(), "Số dư còn lại phải là 100 - 18 = 82 Khoai");
    }

    @Test
    @DisplayName("3. Áp dụng mã giảm giá chiến dịch (Voucher / Coupon)")
    void testCouponDiscountOnCheckout() {
        when(customerRepository.findCustomerById(1)).thenReturn(sampleCustomer);
        when(bookRepository.findById("BOOK-001")).thenReturn(Optional.of(sampleBook));
        when(ordersRepository.save(any(Orders.class))).thenAnswer(inv -> {
            Orders o = inv.getArgument(0);
            o.setOrders_id(2);
            return o;
        });

        when(promotionRepository.findById("KHOAI5")).thenReturn(Optional.empty());

        CheckoutItemRequest item = new CheckoutItemRequest();
        item.setBookId("BOOK-001");
        item.setPlanKey("14");

        CheckoutRequest request = new CheckoutRequest();
        request.setItems(List.of(item));
        request.setCouponCode("KHOAI5");

        CheckoutResponse response = orderService.checkoutWithPotato(1, request);

        assertTrue(response.isSuccess());
        assertEquals(10, response.getTotalKhoaiPaid(), "Giá 15 Khoai trừ voucher KHOAI5 (5 Khoai) phải còn 10 Khoai");
        assertEquals(90, response.getRemainingPotatoBalance(), "Số dư còn lại: 100 - 10 = 90 Khoai");
    }

    @Test
    @DisplayName("4. Báo lỗi khi số dư Khoai trong ví không đủ thanh toán")
    void testInsufficientBalanceThrowsException() {
        sampleCustomer.setPotatoBalance(5);
        sampleBook.setRent_price(20.0);

        when(customerRepository.findCustomerById(1)).thenReturn(sampleCustomer);
        when(bookRepository.findById("BOOK-001")).thenReturn(Optional.of(sampleBook));

        CheckoutItemRequest item = new CheckoutItemRequest();
        item.setBookId("BOOK-001");
        item.setPlanKey("forever");

        CheckoutRequest request = new CheckoutRequest();
        request.setItems(List.of(item));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            orderService.checkoutWithPotato(1, request);
        });

        assertTrue(exception.getMessage().contains("Số dư Ví Khoai không đủ"),
                "Thông báo lỗi phải chỉ rõ số dư khoai không đủ");
        verify(ordersRepository, never()).save(any());
        verify(potatoTransactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("5. Giỏ hàng rỗng ném ngoại lệ hợp lệ")
    void testEmptyCartThrowsException() {
        when(customerRepository.findCustomerById(1)).thenReturn(sampleCustomer);

        CheckoutRequest request = new CheckoutRequest();
        request.setItems(Collections.emptyList());

        assertThrows(RuntimeException.class, () -> {
            orderService.checkoutWithPotato(1, request);
        });
    }

    @Test
    @DisplayName("6. Từ chối thanh toán khi mã gói thuê không hợp lệ (Invalid planKey)")
    void testInvalidPlanKeyThrowsException() {
        when(customerRepository.findCustomerById(1)).thenReturn(sampleCustomer);

        CheckoutItemRequest item = new CheckoutItemRequest();
        item.setBookId("BOOK-001");
        item.setPlanKey("NOT_A_PLAN");

        CheckoutRequest request = new CheckoutRequest();
        request.setItems(List.of(item));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            orderService.checkoutWithPotato(1, request);
        });

        assertTrue(ex.getMessage().contains("không hợp lệ"), "Phải chặn mã gói không hợp lệ");
    }

    @Test
    @DisplayName("7. Từ chối thanh toán khi mã sách không tồn tại")
    void testNonExistentBookThrowsException() {
        when(customerRepository.findCustomerById(1)).thenReturn(sampleCustomer);
        when(bookRepository.findById("NON_EXISTENT_ID")).thenReturn(Optional.empty());

        CheckoutItemRequest item = new CheckoutItemRequest();
        item.setBookId("NON_EXISTENT_ID");
        item.setPlanKey("7");

        CheckoutRequest request = new CheckoutRequest();
        request.setItems(List.of(item));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            orderService.checkoutWithPotato(1, request);
        });

        assertTrue(ex.getMessage().contains("không tồn tại"), "Phải chặn khi sách không tồn tại");
    }

    @Test
    @DisplayName("8. Bỏ qua giá và thời hạn do client tự sửa - Server luôn quyết định theo planKey")
    void testServerStrictlyDeterminesPriceAndDuration() {
        when(customerRepository.findCustomerById(1)).thenReturn(sampleCustomer);
        when(bookRepository.findById("BOOK-001")).thenReturn(Optional.of(sampleBook));
        when(ordersRepository.save(any(Orders.class))).thenAnswer(inv -> {
            Orders o = inv.getArgument(0);
            o.setOrders_id(88);
            return o;
        });

        CheckoutItemRequest item = new CheckoutItemRequest();
        item.setBookId("BOOK-001");
        item.setPlanKey("7");
        item.setPrice(1.0);
        item.setDurationDays(36500);

        CheckoutRequest request = new CheckoutRequest();
        request.setItems(List.of(item));

        CheckoutResponse response = orderService.checkoutWithPotato(1, request);

        assertEquals(9, response.getTotalKhoaiPaid(), "Server phải tính đúng 9 Khoai cho gói 7 ngày, không dùng giá 1 Khoai của client");
        assertEquals(91, response.getRemainingPotatoBalance(), "Số dư còn lại: 100 - 9 = 91 Khoai");
        assertEquals(1, response.getRentedBooks().size());
        assertEquals(7, response.getRentedBooks().get(0).get("durationDays"), "Thời hạn cấp phải đúng 7 ngày theo planKey");
    }

    @Test
    @DisplayName("Gói forever có khoảng trắng vẫn cấp quyền mua vĩnh viễn")
    void foreverPlanWhitespacePreservesPurchaseSemantics() {
        when(customerRepository.findCustomerById(1)).thenReturn(sampleCustomer);
        when(bookRepository.findById("BOOK-001")).thenReturn(Optional.of(sampleBook));
        when(ordersRepository.save(any(Orders.class))).thenAnswer(inv -> inv.getArgument(0));
        CheckoutItemRequest item = new CheckoutItemRequest();
        item.setBookId("BOOK-001");
        item.setPlanKey(" forever ");
        CheckoutRequest request = new CheckoutRequest();
        request.setItems(List.of(item));
        CheckoutResponse response = orderService.checkoutWithPotato(1, request);
        assertEquals(Boolean.TRUE, response.getRentedBooks().get(0).get("isForever"));
        verify(orderItemRepository).save(argThat(saved -> "BUY".equals(saved.getRentalType())));
    }

    @Test
    @DisplayName("9. Chặn sách trùng lặp trong cùng một đơn hàng thanh toán (IMP-02)")
    void testDuplicateBookInOrderThrowsException() {
        when(customerRepository.findCustomerById(1)).thenReturn(sampleCustomer);

        CheckoutItemRequest item1 = new CheckoutItemRequest();
        item1.setBookId("BOOK-001");
        item1.setPlanKey("7");

        CheckoutItemRequest item2 = new CheckoutItemRequest();
        item2.setBookId("BOOK-001");
        item2.setPlanKey("14");

        CheckoutRequest request = new CheckoutRequest();
        request.setItems(List.of(item1, item2));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            orderService.checkoutWithPotato(1, request);
        });

        assertTrue(ex.getMessage().contains("trùng lặp"), "Phải chặn sách trùng lặp trong đơn");
        verify(ordersRepository, never()).save(any());
        verify(potatoTransactionRepository, never()).save(any());
        assertEquals(100, sampleCustomer.getPotatoBalance(), "Số dư không được thay đổi");
    }

    @Test
    @DisplayName("10. Từ chối mục giỏ hàng không thuộc sở hữu của khách hàng trước khi trừ khoai (IMP-02)")
    void testForeignCartItemThrowsExceptionBeforeDeductingPotato() {
        when(customerRepository.findCustomerById(1)).thenReturn(sampleCustomer);
        when(bookRepository.findById("BOOK-001")).thenReturn(Optional.of(sampleBook));

        Cart foreignCart = new Cart();
        foreignCart.setCart_id(999);

        Cart_Item foreignItem = new Cart_Item();
        foreignItem.setCart_item_id(123);
        foreignItem.setCart(foreignCart);
        foreignItem.setBook(sampleBook);

        Cart myCart = new Cart();
        myCart.setCart_id(1);
        sampleCustomer.setCart(myCart);

        when(cartItemRepository.findById(123)).thenReturn(Optional.of(foreignItem));

        CheckoutItemRequest item = new CheckoutItemRequest();
        item.setBookId("BOOK-001");
        item.setPlanKey("7");
        item.setCartItemId(123);

        CheckoutRequest request = new CheckoutRequest();
        request.setItems(List.of(item));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            orderService.checkoutWithPotato(1, request);
        });

        assertTrue(ex.getMessage().contains("không thuộc sở hữu"), "Phải chặn mục giỏ hàng của người khác");
        verify(ordersRepository, never()).save(any());
        verify(potatoTransactionRepository, never()).save(any());
        assertEquals(100, sampleCustomer.getPotatoBalance(), "Số dư không được khấu trừ");
    }

    @Test
    @DisplayName("11. Idempotency Key an toàn: gửi lại request cùng key trả về đơn cũ không trừ khoai lần 2 (IMP-04)")
    void testIdempotencyKeyReturnsExistingOrderWithoutDoubleCharging() {
        when(customerRepository.findCustomerById(1)).thenReturn(sampleCustomer);

        Orders existingOrder = new Orders();
        existingOrder.setOrders_id(555);
        existingOrder.setCustomer(sampleCustomer);
        existingOrder.setTransaction_no("IDEM-REQ-XYZ-001");
        existingOrder.setTotal_amount(9.0);
        existingOrder.setDiscount_amount(0.0);
        existingOrder.setOrder_date(LocalDateTime.now().minusMinutes(5));

        when(ordersRepository.findByTransactionNo("REQ-XYZ-001")).thenReturn(Optional.empty());
        when(ordersRepository.findByTransactionNo("IDEM-REQ-XYZ-001")).thenReturn(Optional.of(existingOrder));

        CheckoutItemRequest item = new CheckoutItemRequest();
        item.setBookId("BOOK-001");
        item.setPlanKey("7");

        CheckoutRequest request = new CheckoutRequest();
        request.setItems(List.of(item));
        request.setIdempotencyKey("REQ-XYZ-001");

        CheckoutResponse response = orderService.checkoutWithPotato(1, request);

        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertEquals(555, response.getOrderId());
        assertEquals("IDEM-REQ-XYZ-001", response.getTransactionNo());
        assertEquals(9, response.getTotalKhoaiPaid());
        assertEquals(100, response.getRemainingPotatoBalance(), "Số dư không được trừ thêm lần nào");
        verify(ordersRepository, never()).save(any(Orders.class));
        verify(potatoTransactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("12. Trả về bảng tính giá đầy đủ (subtotal, discount, total) theo IMP-01")
    void testPricingBreakdownInResponse() {
        MembershipTier tier = new MembershipTier();
        tier.setTierName("Lão Nông");
        tier.setDiscountPercent(10);
        sampleCustomer.setMembershipTier(tier);

        when(customerRepository.findCustomerById(1)).thenReturn(sampleCustomer);
        when(bookRepository.findById("BOOK-001")).thenReturn(Optional.of(sampleBook));
        when(ordersRepository.save(any(Orders.class))).thenAnswer(inv -> {
            Orders o = inv.getArgument(0);
            o.setOrders_id(101);
            return o;
        });

        CheckoutItemRequest item = new CheckoutItemRequest();
        item.setBookId("BOOK-001");
        item.setPlanKey("30");

        CheckoutRequest request = new CheckoutRequest();
        request.setItems(List.of(item));

        CheckoutResponse response = orderService.checkoutWithPotato(1, request);

        assertNotNull(response);
        assertEquals(25.0, response.getSubtotal(), "Giá gốc subtotal phải là 25 Khoai");
        assertEquals(2.5, response.getTierDiscountAmount(), "Giảm giá thành viên 10% của 25 phải là 2.5 Khoai");
        assertEquals(2.5, response.getDiscountAmount(), "Tổng giảm giá phải là 2.5 Khoai");
        assertEquals(23, response.getTotalKhoaiPaid(), "Tổng thanh toán làm tròn Math.round(25 - 2.5) = 23 Khoai");
        assertEquals(77, response.getRemainingPotatoBalance(), "Số dư còn lại: 100 - 23 = 77 Khoai");
    }

    @Test
    @DisplayName("13. Từ chối thanh toán khi sách ở trạng thái ngưng phát hành (DRAFT hoặc HIDDEN) (IMP-02)")
    void testHiddenOrDraftBookThrowsException() {
        when(customerRepository.findCustomerById(1)).thenReturn(sampleCustomer);
        sampleBook.setStatus("HIDDEN");
        when(bookRepository.findById("BOOK-001")).thenReturn(Optional.of(sampleBook));

        CheckoutItemRequest item = new CheckoutItemRequest();
        item.setBookId("BOOK-001");
        item.setPlanKey("7");

        CheckoutRequest request = new CheckoutRequest();
        request.setItems(List.of(item));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            orderService.checkoutWithPotato(1, request);
        });

        assertTrue(ex.getMessage().contains("tạm ngưng phát hành"), "Phải chặn sách ở trạng thái HIDDEN");
        verify(ordersRepository, never()).save(any());
        verify(potatoTransactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("14. Khóa giao dịch cũ nhưng payload khác sách/gói phải bị từ chối (IDEM-DIFFERENT-PAYLOAD)")
    void testIdempotencyKeyWithDifferentPayloadThrowsException() {
        when(customerRepository.findCustomerById(1)).thenReturn(sampleCustomer);

        Orders existingOrder = new Orders();
        existingOrder.setOrders_id(888);
        existingOrder.setCustomer(sampleCustomer);
        existingOrder.setTransaction_no("IDEM-KEY-DIFF-PAYLOAD");
        existingOrder.setTotal_amount(9.0);
        existingOrder.setDiscount_amount(0.0);

        Order_Item existingItem = new Order_Item();
        existingItem.setBook(sampleBook); // BOOK-001
        existingItem.setDurationDays(7);
        existingOrder.setOrder_items(List.of(existingItem));

        when(ordersRepository.findByTransactionNo("KEY-DIFF-PAYLOAD")).thenReturn(Optional.empty());
        when(ordersRepository.findByTransactionNo("IDEM-KEY-DIFF-PAYLOAD")).thenReturn(Optional.of(existingOrder));

        // Gửi request cùng key nhưng chọn sách BOOK-002
        CheckoutItemRequest newItem = new CheckoutItemRequest();
        newItem.setBookId("BOOK-002");
        newItem.setPlanKey("30");

        CheckoutRequest request = new CheckoutRequest();
        request.setItems(List.of(newItem));
        request.setIdempotencyKey("KEY-DIFF-PAYLOAD");

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            orderService.checkoutWithPotato(1, request);
        });

        assertTrue(ex.getMessage().contains("nội dung khác"), "Phải từ chối khi cùng khóa nhưng khác sách/gói");
    }

    @Test
    @DisplayName("15. Replay giao dịch giữ nguyên breakdown subtotal, tier discount, coupon discount (IDEM-RECEIPT)")
    void testIdempotencyKeyPreservesReceiptBreakdown() {
        MembershipTier tier = new MembershipTier();
        tier.setDiscountPercent(5);
        sampleCustomer.setMembershipTier(tier);

        when(customerRepository.findCustomerById(1)).thenReturn(sampleCustomer);

        Orders existingOrder = new Orders();
        existingOrder.setOrders_id(889);
        existingOrder.setCustomer(sampleCustomer);
        existingOrder.setTransaction_no("IDEM-KEY-RECEIPT");
        existingOrder.setTotal_amount(19.0);
        existingOrder.setDiscount_amount(6.25); // tier 1.25 + coupon 5.0

        Order_Item existingItem = new Order_Item();
        sampleBook.setRent_price(25.0);
        existingItem.setBook(sampleBook);
        existingItem.setDurationDays(30);
        existingOrder.setOrder_items(List.of(existingItem));

        when(ordersRepository.findByTransactionNo("KEY-RECEIPT")).thenReturn(Optional.empty());
        when(ordersRepository.findByTransactionNo("IDEM-KEY-RECEIPT")).thenReturn(Optional.of(existingOrder));

        CheckoutItemRequest reqItem = new CheckoutItemRequest();
        reqItem.setBookId("BOOK-001");
        reqItem.setPlanKey("30");

        CheckoutRequest request = new CheckoutRequest();
        request.setItems(List.of(reqItem));
        request.setIdempotencyKey("KEY-RECEIPT");

        CheckoutResponse resp = orderService.checkoutWithPotato(1, request);

        assertNotNull(resp);
        assertEquals(25.0, resp.getSubtotal(), 0.01, "Subtotal phải là 25.0");
        assertEquals(1.25, resp.getTierDiscountAmount(), 0.01, "Tier discount phải là 1.25");
        assertEquals(5.0, resp.getCouponDiscountAmount(), 0.01, "Coupon discount phải là 5.0");
        assertEquals(6.25, resp.getDiscountAmount(), 0.01, "Total discount phải là 6.25");
        assertEquals(19, resp.getTotalKhoaiPaid(), "Total paid phải là 19");
    }
}
