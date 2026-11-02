package com.example.demochatbot.service.order;

import com.example.demochatbot.dto.CheckoutItemRequest;
import com.example.demochatbot.dto.CheckoutRequest;
import com.example.demochatbot.dto.CheckoutResponse;
import com.example.demochatbot.dto.RentedBookDto;
import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

/**
 * ============================================================================
 * Class: OrderServiceImpl
 * Mô tả: Xử lý toàn bộ logic thanh toán thuê sách bằng Khoai Tây:
 *        1. Kiểm tra số dư Khoai thực tế và khấu trừ từ tài khoản.
 *        2. Lưu biến động số dư vào sổ cái giao dịch (PotatoTransaction).
 *        3. Tạo đơn hàng (Orders) và chi tiết đơn hàng (Order_Item).
 *        4. Tự động cấp quyền đọc sách (Access_Record) với thời hạn tương ứng.
 *        5. Xóa sách đã thanh toán khỏi giỏ hàng.
 *        6. Cung cấp API tải danh sách sách trong Tủ Sách Cá Nhân.
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

    @Override
    @Transactional
    public CheckoutResponse checkoutWithPotato(int accountId, CheckoutRequest request) {
        Customer customer = customerRepository.findCustomerById(accountId);
        if (customer == null) {
            throw new RuntimeException("Không tìm thấy thông tin khách hàng!");
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new RuntimeException("Giỏ hàng thanh toán trống! Vui lòng chọn ít nhất 1 tác phẩm.");
        }

        // 1. Tính tổng số Khoai cần thanh toán
        double subtotal = 0.0;
        for (CheckoutItemRequest item : request.getItems()) {
            if (item.getPrice() != null && item.getPrice() > 0) {
                subtotal += item.getPrice();
            }
        }

        // Áp dụng chiết khấu hạng thành viên nếu có (Thợ Cày 0%, Cao Thủ Cày 5%, Lão Nông 10%, Đại Điền Chủ 20%)
        int tierDiscountPercent = (customer.getMembershipTier() != null && customer.getMembershipTier().getDiscountPercent() != null)
                ? customer.getMembershipTier().getDiscountPercent() : 0;
        double tierDiscountAmount = (tierDiscountPercent > 0) ? (subtotal * tierDiscountPercent / 100.0) : 0.0;
        double inputDiscount = (request.getDiscountAmount() != null && request.getDiscountAmount() > 0) ? request.getDiscountAmount() : 0.0;
        double discount = Math.min(Math.max(tierDiscountAmount, inputDiscount), subtotal);

        int totalKhoaiPaid = (int) Math.max(0, Math.round(subtotal - discount));

        // 2. Kiểm tra số dư Khoai thực tế của khách hàng
        int currentBalance = customer.getPotatoBalance() != null ? customer.getPotatoBalance() : 0;
        if (currentBalance < totalKhoaiPaid) {
            throw new RuntimeException("Số dư Ví Khoai không đủ (" + currentBalance + " < " + totalKhoaiPaid + " Khoai)! Vui lòng nạp thêm Khoai để hoàn tất thanh toán.");
        }

        // 3. Khấu trừ Khoai thực tế
        int newBalance = currentBalance - totalKhoaiPaid;
        customer.setPotatoBalance(newBalance);
        customerRepository.save(customer);

        // 4. Lưu bản ghi biến động số dư vào sổ cái PotatoTransaction
        String txCode = "HLM-" + (System.currentTimeMillis() % 1000000);
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
        order.setDiscount_amount(discount);
        order.setOrder_date(LocalDateTime.now());
        Orders savedOrder = ordersRepository.save(order);

        List<Map<String, Object>> rentedBooksResult = new ArrayList<>();

        // 6. Xử lý từng tác phẩm trong đơn hàng
        for (CheckoutItemRequest item : request.getItems()) {
            Optional<Book> bookOpt = bookRepository.findById(item.getBookId());
            if (bookOpt.isEmpty()) {
                continue;
            }
            Book book = bookOpt.get();

            // Xác định số ngày thuê
            boolean isForever = "forever".equalsIgnoreCase(item.getPlanKey());
            int durationDays;
            if (isForever) {
                durationDays = 36500; // 100 năm = vĩnh viễn
            } else if (item.getDurationDays() != null && item.getDurationDays() > 0) {
                durationDays = item.getDurationDays();
            } else {
                // Fallback theo planKey
                try {
                    durationDays = Integer.parseInt(item.getPlanKey());
                } catch (Exception e) {
                    durationDays = 30;
                }
            }

            // Lưu chi tiết đơn hàng Order_Item
            Order_Item orderItem = new Order_Item();
            orderItem.setOrders(savedOrder);
            orderItem.setBook(book);
            orderItem.setRentalType(isForever ? "BUY" : "RENT");
            orderItem.setDurationDays(durationDays);
            orderItem.setPrice(item.getPrice() != null ? item.getPrice() : 0.0);
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

            // Xóa mục này khỏi giỏ hàng Cart_Item
            if (item.getCartItemId() != null && item.getCartItemId() > 0) {
                try {
                    cartItemRepository.deleteById(item.getCartItemId());
                } catch (Exception e) {
                    // Không chặn luồng nếu item đã bị xóa trước đó
                }
            } else if (customer.getCart() != null) {
                cartItemRepository.findByCartIdAndBookId(customer.getCart().getCart_id(), book.getBook_id())
                        .ifPresent(ci -> cartItemRepository.delete(ci));
            }

            Map<String, Object> bookInfo = new HashMap<>();
            bookInfo.put("bookId", book.getBook_id());
            bookInfo.put("bookName", book.getBookName());
            bookInfo.put("author", book.getAuthor());
            bookInfo.put("imgUrl", book.getImg_url());
            bookInfo.put("durationDays", durationDays);
            bookInfo.put("isForever", isForever);
            rentedBooksResult.add(bookInfo);
        }

        // Tích lũy Điểm cày (XP): Mỗi cuốn sách thuê được thưởng +50 XP
        try {
            int earnedXp = request.getItems().size() * 50;
            tierService.addExperiencePoints(customer, earnedXp, "Thuê " + request.getItems().size() + " cuốn sách");
            tierService.calculateAndUpdateCustomerTier(customer);
        } catch (Exception e) {
            // Log nhưng không làm rollback đơn hàng
            System.err.println("Lỗi tích điểm hạng thành viên: " + e.getMessage());
        }

        return CheckoutResponse.builder()
                .success(true)
                .message("Thuê sách thành công! Sách đã được chuyển vào Tủ Sách Cá Nhân của bạn.")
                .orderId(savedOrder.getOrders_id())
                .transactionNo(txCode)
                .totalKhoaiPaid(totalKhoaiPaid)
                .remainingPotatoBalance(newBalance)
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

        return true;
    }
}
