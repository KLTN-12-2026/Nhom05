package com.example.demochatbot.service.order;

import com.example.demochatbot.dto.CheckoutItemRequest;
import com.example.demochatbot.dto.CheckoutRequest;
import com.example.demochatbot.dto.CheckoutResponse;
import com.example.demochatbot.dto.RentedBookDto;
import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

/**
 * ============================================================================
 * Class: OrderServiceImpl
 * Mô tả: Xử lý toàn bộ logic thanh toán thuê sách bằng Khoai Tây:
 *        1. Khóa bi quan bản ghi ví (Pessimistic Locking) bảo vệ số dư khi có
 *           yêu cầu thanh toán đồng thời (IMP-03).
 *        2. Kiểm tra toàn bộ đơn hàng, loại bỏ sách trùng và xác thực quyền sở
 *           hữu mục giỏ hàng TRƯỚC KHI trừ khoai (IMP-02).
 *        3. Server quyết định 100% bảng giá và thời hạn thuê (IMP-01).
 *        4. Chống thanh toán lặp với Idempotency Key & sinh mã giao dịch duy
 *           nhất tuyệt đối (IMP-04).
 *        5. Tự động cấp/gia hạn quyền đọc sách (Access_Record).
 *        6. Tích lũy điểm cày XP và thăng hạng thành viên.
 * ============================================================================
 */
@Service
public class OrderServiceImpl implements OrderService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private OrdersRepository ordersRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private AccessRecordRepository accessRecordRepository;

    @Autowired
    private PotatoTransactionRepository potatoTransactionRepository;

    @Autowired
    private com.example.demochatbot.service.tier.TierService tierService;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private PromotionRepository promotionRepository;

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    @Autowired
    private CheckoutCoordinator checkoutCoordinator;

    @Override
    public CheckoutResponse checkoutWithPotato(int accountId, CheckoutRequest request) {
        String key = request == null ? null : request.getIdempotencyKey();
        try {
            return checkoutCoordinator.execute(key, () -> processCheckout(accountId, request));
        } catch (DataIntegrityViolationException conflict) {
            if (key == null || key.isBlank()) throw conflict;
            // Another server may have committed this unique transaction number.
            return checkoutCoordinator.execute(key, () -> processCheckout(accountId, request));
        }
    }

    private CheckoutResponse processCheckout(int accountId, CheckoutRequest request) {
        // Khóa bi quan (Pessimistic Lock) dòng dữ liệu Customer theo Primary Key để đồng bộ ví (IMP-03)
        Customer initial = customerRepository.findCustomerById(accountId);
        if (initial == null) {
            throw new RuntimeException("Không tìm thấy thông tin khách hàng!");
        }
        Customer customer = customerRepository.findByIdForUpdate(initial.getCustomer_id())
                .orElse(initial);
        if (entityManager != null) {
            entityManager.refresh(customer, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        }

        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw new RuntimeException("Giỏ hàng thanh toán trống! Vui lòng chọn ít nhất 1 tác phẩm.");
        }

        String fingerprint = checkoutFingerprint(request);

        // Chống thanh toán lặp với Idempotency Key (IMP-04)
        String cleanIdempotencyKey = null;
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().trim().isEmpty()) {
            cleanIdempotencyKey = request.getIdempotencyKey().trim();
            if (cleanIdempotencyKey.length() > 80) {
                throw new IllegalArgumentException("Khóa giao dịch không được vượt quá 80 ký tự!");
            }
            synchronized (cleanIdempotencyKey.intern()) {
                String lookupTx1 = cleanIdempotencyKey;
                String lookupTx2 = cleanIdempotencyKey.startsWith("IDEM-") ? cleanIdempotencyKey : ("IDEM-" + cleanIdempotencyKey);
                Optional<Orders> existingOrderOpt = ordersRepository.findByTransactionNo(lookupTx1);
                if (existingOrderOpt.isEmpty()) {
                    existingOrderOpt = ordersRepository.findByTransactionNo(lookupTx2);
                }

                if (existingOrderOpt.isPresent()) {
                    Orders existingOrder = existingOrderOpt.get();
                    if (existingOrder.getCustomer() != null && !existingOrder.getCustomer().getCustomer_id().equalsIgnoreCase(customer.getCustomer_id())) {
                        throw new IllegalStateException("Khóa giao dịch (Idempotency Key) đã được sử dụng bởi tài khoản khác!");
                    }

                    if (existingOrder.getCheckoutFingerprint() != null
                            && !existingOrder.getCheckoutFingerprint().equals(fingerprint)) {
                        throw new IllegalStateException("Khóa giao dịch đã được sử dụng với payload khác!");
                    }

                    // IDEM-DIFFERENT-PAYLOAD: Kiểm tra nếu cùng khóa nhưng payload đơn hàng khác nhau thì từ chối
                    if (existingOrder.getOrder_items() != null && !existingOrder.getOrder_items().isEmpty()) {
                        if (request.getItems() != null && request.getItems().size() != existingOrder.getOrder_items().size()) {
                            throw new IllegalStateException("Khóa giao dịch đã được sử dụng cho một đơn hàng khác với nội dung khác!");
                        }
                        for (CheckoutItemRequest reqItem : request.getItems()) {
                            if (reqItem == null || reqItem.getBookId() == null) throw new IllegalArgumentException("Chi tiết sách thanh toán không hợp lệ!");
                            boolean matches = false;
                            for (Order_Item oi : existingOrder.getOrder_items()) {
                                if (oi.getBook() != null && oi.getBook().getBook_id().equalsIgnoreCase(reqItem.getBookId().trim())) {
                                    int reqDays = resolveDurationDays(reqItem.getPlanKey());
                                    if (oi.getDurationDays() == null || oi.getDurationDays().equals(reqDays)) {
                                        matches = true;
                                        break;
                                    }
                                }
                            }
                            if (!matches) {
                                throw new IllegalStateException("Khóa giao dịch đã được sử dụng cho một đơn hàng khác với nội dung khác!");
                            }
                        }
                    }

                    double originalSubtotal = existingOrder.getCheckoutSubtotal() != null
                            ? existingOrder.getCheckoutSubtotal()
                            : legacySubtotal(existingOrder);
                    double totalDiscount = existingOrder.getDiscount_amount();
                    double tierDiscount = existingOrder.getCheckoutTierDiscount() != null
                            ? existingOrder.getCheckoutTierDiscount() : Math.min(totalDiscount, originalSubtotal * (customer.getMembershipTier() != null && customer.getMembershipTier().getDiscountPercent() != null ? customer.getMembershipTier().getDiscountPercent() : 0) / 100.0);
                    double couponDiscount = existingOrder.getCheckoutCouponDiscount() != null
                            ? existingOrder.getCheckoutCouponDiscount() : Math.max(0.0, totalDiscount - tierDiscount);

                    List<Map<String, Object>> existingRentedBooks = new ArrayList<>();
                    if (existingOrder.getOrder_items() != null) {
                        for (Order_Item oi : existingOrder.getOrder_items()) {
                            if (oi.getBook() != null) {
                                Map<String, Object> info = new HashMap<>();
                                info.put("bookId", oi.getBook().getBook_id());
                                info.put("bookName", oi.getBook().getBookName());
                                info.put("author", oi.getBook().getAuthor());
                                info.put("imgUrl", oi.getBook().getImg_url());
                                info.put("durationDays", oi.getDurationDays() != null ? oi.getDurationDays() : 30);
                                info.put("isForever", "BUY".equalsIgnoreCase(oi.getRentalType()));
                                existingRentedBooks.add(info);
                            }
                        }
                    }
                    return CheckoutResponse.builder()
                            .success(true)
                            .message("Đơn hàng đã được ghi nhận trước đó (Xử lý gửi lại an toàn).")
                            .orderId(existingOrder.getOrders_id())
                            .transactionNo(existingOrder.getTransaction_no())
                            .idempotencyKey(cleanIdempotencyKey)
                            .subtotal(originalSubtotal)
                            .discountAmount(totalDiscount)
                            .tierDiscountAmount(tierDiscount)
                            .couponDiscountAmount(couponDiscount)
                            .totalKhoaiPaid((int) Math.round(existingOrder.getTotal_amount()))
                            .remainingPotatoBalance(customer.getPotatoBalance() != null ? customer.getPotatoBalance() : 0)
                            .orderDate(existingOrder.getOrder_date())
                            .rentedBooks(existingRentedBooks)
                            .build();
                }
            }
        }

        // 1. Kiểm tra toàn bộ đơn hàng (Validation & Deduplication) TRƯỚC KHI TRỪ KHOAI (IMP-02)
        Set<String> seenBookIds = new HashSet<>();
        List<Cart_Item> cartItemsToDelete = new ArrayList<>();
        double subtotal = 0.0;

        for (CheckoutItemRequest item : request.getItems()) {
            if (item == null) {
                throw new RuntimeException("Chi tiết sách thanh toán không được để trống!");
            }
            if (item.getBookId() == null || item.getBookId().trim().isEmpty()) {
                throw new RuntimeException("Mã sách (bookId) không được để trống!");
            }
            String bookId = item.getBookId().trim();
            if (seenBookIds.contains(bookId)) {
                throw new RuntimeException("Đơn hàng chứa ấn phẩm trùng lặp (Mã sách: '" + bookId + "'). Mỗi tác phẩm chỉ được thanh toán một lần trong mỗi giao dịch!");
            }
            seenBookIds.add(bookId);

            Book b = bookRepository.findById(bookId)
                    .orElseThrow(() -> new RuntimeException("Sách với mã '" + bookId + "' không tồn tại trong hệ thống!"));

            // Kiểm tra trạng thái bán/cho thuê của sách (IMP-02)
            if (b.getStatus() != null && ("DRAFT".equalsIgnoreCase(b.getStatus()) || "HIDDEN".equalsIgnoreCase(b.getStatus()) || "DELETED".equalsIgnoreCase(b.getStatus()))) {
                throw new RuntimeException("Tác phẩm '" + (b.getBookName() != null ? b.getBookName() : bookId) + "' hiện đang tạm ngưng phát hành hoặc không khả dụng để thuê!");
            }

            // Xác thực tính hợp lệ của mã gói thuê
            validatePlanKey(item.getPlanKey());

            // Xác thực quyền sở hữu mục giỏ hàng nếu có gửi kèm cartItemId (IMP-02)
            if (item.getCartItemId() != null && item.getCartItemId() > 0) {
                Optional<Cart_Item> ciOpt = cartItemRepository.findById(item.getCartItemId());
                if (ciOpt.isEmpty()) {
                    throw new RuntimeException("Mục giỏ hàng với mã '" + item.getCartItemId() + "' không tồn tại!");
                }
                Cart_Item ci = ciOpt.get();
                if (ci.getCart() == null || customer.getCart() == null || ci.getCart().getCart_id() != customer.getCart().getCart_id()) {
                    throw new RuntimeException("Mục giỏ hàng '" + item.getCartItemId() + "' không thuộc sở hữu của bạn!");
                }
                if (ci.getBook() != null && !ci.getBook().getBook_id().equals(b.getBook_id())) {
                    throw new RuntimeException("Mục giỏ hàng '" + item.getCartItemId() + "' không khớp với sách được chọn ('" + b.getBook_id() + "')!");
                }
                cartItemsToDelete.add(ci);
            }

            // Tính giá chuẩn của Server, tuyệt đối không tin cậy giá client gửi lên (IMP-01)
            double itemPrice = resolveItemPrice(item.getPlanKey(), b);
            item.setPrice(itemPrice);
            subtotal += itemPrice;
        }

        // Áp dụng chiết khấu hạng thành viên nếu có (Thợ Cày 0%, Cao Thủ Cày 5%, Lão Nông 10%, Đại Điền Chủ 20%)
        int tierDiscountPercent = (customer.getMembershipTier() != null && customer.getMembershipTier().getDiscountPercent() != null)
                ? customer.getMembershipTier().getDiscountPercent() : 0;
        double tierDiscountAmount = (tierDiscountPercent > 0) ? (subtotal * tierDiscountPercent / 100.0) : 0.0;

        // Xác thực mã giảm giá (Voucher / Coupon) hợp lệ từ CSDL hoặc danh mục chuẩn hệ thống
        double couponDiscountAmount = 0.0;
        Promotion appliedPromotion = null;
        if (request.getCouponCode() != null && !request.getCouponCode().trim().isEmpty()) {
            String code = request.getCouponCode().trim().toUpperCase();
            Optional<Promotion> promoOpt = promotionRepository.findById(code);
            if (promoOpt.isPresent()) {
                Promotion p = promoOpt.get();
                boolean isActive = "ACTIVE".equalsIgnoreCase(p.getStatus());
                boolean isStarted = p.getStart_date() == null || !p.getStart_date().isAfter(LocalDateTime.now());
                boolean isNotEnded = p.getEnd_date() == null || !p.getEnd_date().isBefore(LocalDateTime.now());
                if (isActive && isStarted && isNotEnded) {
                    appliedPromotion = p;
                    if (p.getDiscount_percent() > 0) {
                        couponDiscountAmount = subtotal * p.getDiscount_percent() / 100.0;
                    } else if (p.getDiscount_amount() > 0) {
                        couponDiscountAmount = p.getDiscount_amount();
                    }
                }
            } else {
                // Hỗ trợ fallback các voucher chiến dịch tiêu chuẩn của hệ sinh thái HALM BOOK
                if ("HALM2026".equals(code) || "VIPBOOK".equals(code) || "KHOAI5".equals(code)) {
                    couponDiscountAmount = 5.0;
                } else if ("HALMVIP10".equals(code)) {
                    couponDiscountAmount = 10.0;
                }
            }
        }

        double totalDiscount = Math.min(tierDiscountAmount + couponDiscountAmount, subtotal);
        int totalKhoaiPaid = (int) Math.max(0, Math.round(subtotal - totalDiscount));

        // 2. Kiểm tra số dư Khoai thực tế của khách hàng (Đã được lock dòng PESSIMISTIC_WRITE)
        int currentBalance = customer.getPotatoBalance() != null ? customer.getPotatoBalance() : 0;
        if (currentBalance < totalKhoaiPaid) {
            throw new RuntimeException("Số dư Ví Khoai không đủ (" + currentBalance + " < " + totalKhoaiPaid + " Khoai)! Vui lòng nạp thêm Khoai để hoàn tất thanh toán.");
        }

        // 3. Khấu trừ Khoai thực tế
        int newBalance = currentBalance - totalKhoaiPaid;
        customer.setPotatoBalance(newBalance);
        customerRepository.save(customer);

        // 4. Sinh mã giao dịch duy nhất tuyệt đối (IMP-04)
        String txCode;
        if (cleanIdempotencyKey != null) {
            txCode = cleanIdempotencyKey.startsWith("IDEM-") ? cleanIdempotencyKey : ("IDEM-" + cleanIdempotencyKey);
            if (txCode.length() > 90) txCode = txCode.substring(0, 90);
        } else {
            txCode = "HLM-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        PotatoTransaction potatoTx = new PotatoTransaction();
        potatoTx.setCustomer(customer);
        potatoTx.setAmount(-totalKhoaiPaid);
        potatoTx.setBalanceAfter(newBalance);
        potatoTx.setType("RENT_BOOK");
        potatoTx.setDescription("Thanh toán thuê " + request.getItems().size() + " tác phẩm qua Ví Khoai Tây (Mã: " + txCode + ")");
        potatoTx.setCreatedAt(LocalDateTime.now());
        potatoTransactionRepository.save(potatoTx);

        // 5. Tạo bản ghi đơn hàng Orders
        Orders order = new Orders();
        order.setCustomer(customer);
        order.setTotal_amount(totalKhoaiPaid);
        order.setPaymentCurrency("POTATO");
        order.setOrderType("RENT_BOOK");
        order.setPayment_status("PAID");
        order.setPayment_method("POTATO_WALLET");
        order.setTransaction_no(txCode);
        order.setDiscount_amount(totalDiscount);
        order.setCheckoutSubtotal(subtotal);
        order.setCheckoutTierDiscount(tierDiscountAmount);
        order.setCheckoutCouponDiscount(couponDiscountAmount);
        order.setCheckoutFingerprint(fingerprint);
        order.setOrder_date(LocalDateTime.now());
        if (appliedPromotion != null) {
            order.setPromotion(appliedPromotion);
        }
        Orders savedOrder = ordersRepository.save(order);

        List<Map<String, Object>> rentedBooksResult = new ArrayList<>();

        List<Double> grossPrices = request.getItems().stream()
                .map(item -> resolveItemPrice(item.getPlanKey(), bookRepository.findById(item.getBookId().trim())
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sách đã xác thực!"))))
                .toList();
        int[] netPrices = CheckoutPricing.allocateNetPayment(grossPrices, totalKhoaiPaid);
        int itemIndex = 0;

        // 6. Xử lý từng tác phẩm trong đơn hàng
        for (CheckoutItemRequest item : request.getItems()) {
            Book book = bookRepository.findById(item.getBookId().trim())
                    .orElseThrow(() -> new RuntimeException("Sách '" + item.getBookId() + "' không tồn tại!"));

            // Xác định số ngày thuê theo gói chuẩn của Server (tuyệt đối không cho client tự sửa durationDays)
            boolean isForever = "forever".equalsIgnoreCase(item.getPlanKey().trim());
            int durationDays = resolveDurationDays(item.getPlanKey());

            // Lưu chi tiết đơn hàng Order_Item với giá net thực trả đã trừ chiết khấu (IMP-01/02)
            Order_Item orderItem = new Order_Item();
            orderItem.setOrders(savedOrder);
            orderItem.setBook(book);
            orderItem.setRentalType(isForever ? "BUY" : "RENT");
            orderItem.setDurationDays(durationDays);
            double singleItemPrice = (item.getPrice() != null && item.getPrice() > 0) ? item.getPrice() : resolveItemPrice(item.getPlanKey(), book);
            double netPrice = netPrices[itemIndex++];
            orderItem.setPrice(netPrice);
            orderItemRepository.save(orderItem);

            // Cấp hoặc gia hạn quyền đọc Access_Record (Tủ Sách Cá Nhân)
            Optional<Access_Record> existingRecordOpt = accessRecordRepository.findByCustomerAndBook(customer, book);
            Access_Record accessRecord;
            LocalDateTime now = LocalDateTime.now();

            if (existingRecordOpt.isPresent()) {
                accessRecord = existingRecordOpt.get();
                // Nếu bản ghi cũ vẫn còn hạn, cộng dồn thêm ngày; nếu đã hết hạn, tính từ hiện tại
                LocalDateTime currentEndDate = accessRecord.getEnd_date();
                if (currentEndDate != null && currentEndDate.isAfter(now) && !isForever) {
                    accessRecord.setEnd_date(currentEndDate.plusDays(durationDays));
                } else {
                    accessRecord.setStart_date(now);
                    accessRecord.setEnd_date(now.plusDays(durationDays));
                }
                accessRecord.setStatus("ACTIVE");
                accessRecord.setRenewCount((accessRecord.getRenewCount() != null ? accessRecord.getRenewCount() : 0) + 1);
            } else {
                accessRecord = new Access_Record();
                accessRecord.setCustomer(customer);
                accessRecord.setBook(book);
                accessRecord.setStart_date(now);
                accessRecord.setEnd_date(now.plusDays(durationDays));
                accessRecord.setStatus("ACTIVE");
                accessRecord.setCurrentPage(1);
                accessRecord.setReadingPercentage(0.0);
                accessRecord.setLastReadAt(now);
                accessRecord.setRenewCount(0);
            }
            accessRecordRepository.save(accessRecord);

            // Tăng lượt đọc của sách
            book.setReadCount((book.getReadCount() != null ? book.getReadCount() : 0) + 1);
            bookRepository.save(book);

            Map<String, Object> bookInfo = new HashMap<>();
            bookInfo.put("bookId", book.getBook_id());
            bookInfo.put("bookName", book.getBookName());
            bookInfo.put("author", book.getAuthor());
            bookInfo.put("imgUrl", book.getImg_url());
            bookInfo.put("durationDays", durationDays);
            bookInfo.put("isForever", isForever);
            rentedBooksResult.add(bookInfo);
        }

        // 7. Xóa các mục giỏ hàng đã được xác thực an toàn (IMP-02)
        for (Cart_Item ci : cartItemsToDelete) {
            try {
                cartItemRepository.delete(ci);
            } catch (Exception ignored) {}
        }
        // Xóa thêm theo bookId trong giỏ nếu người dùng thanh toán mà không gửi cartItemId
        if (customer.getCart() != null) {
            for (String bId : seenBookIds) {
                try {
                    cartItemRepository.findByCartIdAndBookId(customer.getCart().getCart_id(), bId)
                            .ifPresent(ci -> cartItemRepository.delete(ci));
                } catch (Exception ignored) {}
            }
        }

        // 8. Tích lũy Điểm cày (XP): Mỗi cuốn sách thuê được thưởng +50 XP
        try {
            int earnedXp = request.getItems().size() * 50;
            tierService.addExperiencePoints(customer, earnedXp, "Thuê " + request.getItems().size() + " cuốn sách");
            tierService.calculateAndUpdateCustomerTier(customer);
        } catch (Exception e) {
            // Log nhưng không làm rollback đơn hàng
            System.err.println("Lỗi tích điểm hạng thành viên: " + e.getMessage());
        }

        // Trả về số dư thực tế cuối cùng trong transaction (bao gồm cả thưởng thăng hạng nếu có)
        int finalBalance = customer.getPotatoBalance() != null ? customer.getPotatoBalance() : newBalance;

        return CheckoutResponse.builder()
                .success(true)
                .message("Thuê sách thành công! Sách đã được chuyển vào Tủ Sách Cá Nhân của bạn.")
                .orderId(savedOrder.getOrders_id())
                .transactionNo(txCode)
                .idempotencyKey(cleanIdempotencyKey)
                .subtotal(subtotal)
                .discountAmount(totalDiscount)
                .tierDiscountAmount(tierDiscountAmount)
                .couponDiscountAmount(couponDiscountAmount)
                .totalKhoaiPaid(totalKhoaiPaid)
                .remainingPotatoBalance(finalBalance)
                .orderDate(savedOrder.getOrder_date())
                .rentedBooks(rentedBooksResult)
                .build();
    }

    @Override
    public List<RentedBookDto> getCustomerBookshelf(int accountId) {
        Customer customer = customerRepository.findCustomerById(accountId);
        if (customer == null) {
            return new ArrayList<>();
        }

        List<Access_Record> records = accessRecordRepository.findByCustomerOrderByLastReadAtDesc(customer);
        List<RentedBookDto> dtoList = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (Access_Record ar : records) {
            if (ar.getBook() == null) continue;

            Book b = ar.getBook();
            long remainingDays = 0;
            boolean isForever = false;

            if (ar.getEnd_date() != null) {
                if (ar.getEnd_date().isAfter(now)) {
                    long hours = Duration.between(now, ar.getEnd_date()).toHours();
                    remainingDays = (long) Math.ceil(hours / 24.0);
                    if (remainingDays <= 0) remainingDays = 1;
                    if (remainingDays > 1000) {
                        isForever = true;
                    }
                } else {
                    remainingDays = 0;
                    if (!"EXPIRED".equalsIgnoreCase(ar.getStatus())) {
                        ar.setStatus("EXPIRED");
                        accessRecordRepository.save(ar);
                    }
                }
            }

            dtoList.add(RentedBookDto.builder()
                    .accessRecordId(ar.getAccess_record_id())
                    .bookId(b.getBook_id())
                    .bookName(b.getBookName())
                    .author(b.getAuthor() != null ? b.getAuthor() : "Tác giả HALM BOOK")
                    .imgUrl(b.getImg_url())
                    .categoryName(b.getCategory() != null ? b.getCategory().getCategory_name() : "Chung")
                    .startDate(ar.getStart_date())
                    .endDate(ar.getEnd_date())
                    .remainingDays(remainingDays)
                    .isForever(isForever)
                    .status(ar.getStatus())
                    .currentPage(ar.getCurrentPage() != null ? ar.getCurrentPage() : 1)
                    .readingPercentage(ar.getReadingPercentage() != null ? ar.getReadingPercentage() : 0.0)
                    .lastReadAt(ar.getLastReadAt())
                    .build());
        }

        return dtoList;
    }

    @Override
    public boolean checkBookAccess(int accountId, String bookId) {
        Customer customer = customerRepository.findCustomerById(accountId);
        if (customer == null) return false;

        Optional<Access_Record> record = accessRecordRepository.findByCustomerIdAndBookId(customer.getCustomer_id(), bookId);
        if (record.isEmpty()) return false;

        Access_Record ar = record.get();
        if ("EXPIRED".equalsIgnoreCase(ar.getStatus())) return false;
        if (ar.getEnd_date() != null && ar.getEnd_date().isBefore(LocalDateTime.now())) {
            ar.setStatus("EXPIRED");
            accessRecordRepository.save(ar);
            return false;
        }

        return "ACTIVE".equalsIgnoreCase(ar.getStatus());
    }

    /**
     * Xác thực tính hợp lệ của mã gói thuê sách (planKey)
     */
    private void validatePlanKey(String planKey) {
        if (planKey == null || planKey.trim().isEmpty()) {
            throw new RuntimeException("Mã gói thuê sách không được để trống!");
        }
        String key = planKey.trim().toLowerCase();
        if (!key.equals("1") && !key.equals("3") && !key.equals("7") && !key.equals("14")
                && !key.equals("15") && !key.equals("30") && !key.equals("90") && !key.equals("forever")) {
            throw new RuntimeException("Gói thuê sách '" + planKey + "' không hợp lệ trong hệ thống!");
        }
    }

    /**
     * Xác định thời hạn thuê chính xác từ planKey của Server
     */
    private int resolveDurationDays(String planKey) {
        validatePlanKey(planKey);
        String key = planKey.trim().toLowerCase();
        switch (key) {
            case "1": return 1;
            case "3": return 3;
            case "7": return 7;
            case "14": return 14;
            case "15": return 15;
            case "30": return 30;
            case "90": return 90;
            case "forever": return 36500;
            default: return 7;
        }
    }

    /**
     * Xác định giá chuẩn của từng gói thuê sách từ cấu hình Server, tuyệt đối không cho client ghi đè
     */
    private double resolveItemPrice(String planKey, Book book) {
        validatePlanKey(planKey);
        String key = planKey.trim().toLowerCase();
        if ("forever".equals(key)) {
            return (book != null && book.getRent_price() != null && book.getRent_price() > 0)
                    ? book.getRent_price() : 39.0;
        }
        switch (key) {
            case "1": return 2.0;
            case "3": return 5.0;
            case "7": return 9.0;
            case "14": return 15.0;
            case "15": return 18.0;
            case "30": return 25.0;
            case "90": return 50.0;
            default:
                throw new RuntimeException("Gói thuê sách '" + planKey + "' không hợp lệ!");
        }
    }

    private String checkoutFingerprint(CheckoutRequest request) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Giỏ hàng thanh toán trống!");
        }
        List<String> items = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (CheckoutItemRequest item : request.getItems()) {
            if (item == null || item.getBookId() == null || item.getBookId().isBlank()
                    || item.getPlanKey() == null || item.getPlanKey().isBlank()) {
                throw new IllegalArgumentException("Chi tiết sách thanh toán không hợp lệ!");
            }
            String bookId = item.getBookId().trim().toLowerCase(Locale.ROOT);
            String plan = item.getPlanKey().trim().toLowerCase(Locale.ROOT);
            resolveDurationDays(plan);
            if (!seen.add(bookId)) throw new IllegalArgumentException("Đơn hàng chứa ấn phẩm trùng lặp!");
            items.add(bookId.length() + ":" + bookId + ":" + plan);
        }
        Collections.sort(items);
        String coupon = request.getCouponCode() == null ? "" : request.getCouponCode().trim().toUpperCase(Locale.ROOT);
        String canonical = String.join("|", items) + "|coupon:" + coupon;
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(canonical.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 không khả dụng.", impossible);
        }
    }
    private double legacySubtotal(Orders order) {
        if (order.getOrder_items() == null || order.getOrder_items().isEmpty()) {
            return order.getTotal_amount() + order.getDiscount_amount();
        }
        return order.getOrder_items().stream().filter(item -> item.getBook() != null)
                .mapToDouble(item -> resolveItemPrice("BUY".equalsIgnoreCase(item.getRentalType()) ? "forever"
                        : String.valueOf(item.getDurationDays() != null ? item.getDurationDays() : 30), item.getBook())).sum();
    }
}
