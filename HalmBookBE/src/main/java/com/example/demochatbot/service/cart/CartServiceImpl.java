package com.example.demochatbot.service.cart;

import com.example.demochatbot.dto.AddToCartRequest;
import com.example.demochatbot.dto.CartItemDto;
import com.example.demochatbot.dto.CheckoutResponse;
import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import com.example.demochatbot.service.customer.CustomerService;
import com.example.demochatbot.service.tier.TierService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CartServiceImpl implements CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private OrdersRepository ordersRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private AccessRecordRepository accessRecordRepository;

    @Autowired
    private PotatoTransactionRepository potatoTransactionRepository;

    @Autowired(required = false)
    private TierService tierService;

    /**
     * Lấy thông tin Customer theo userId (accountId) hoặc ngữ cảnh đăng nhập hiện tại.
     */
    private Customer resolveCustomer(Integer userId) {
        if (userId != null && userId > 0) {
            Customer byId = customerService.findCustomerById(userId);
            if (byId != null) {
                return byId;
            }
        }
        try {
            int currentAccountId = customerService.getCurrentAccountId();
            Customer current = customerService.findCustomerById(currentAccountId);
            if (current != null) {
                return current;
            }
        } catch (Exception ignored) {
        }
        List<Customer> all = customerRepository.findAll();
        if (!all.isEmpty()) {
            return all.get(0);
        }
        throw new RuntimeException("Không tìm thấy thông tin khách hàng!");
    }

    private Customer getCurrentCustomer() {
        return resolveCustomer(null);
    }

    private Cart getOrCreateCart(Customer customer) {
        return cartRepository.findByCustomerId(customer.getCustomer_id())
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    newCart.setCustomer(customer);
                    return cartRepository.save(newCart);
                });
    }

    /**
     * Chuẩn hóa mốc ngày thuê hợp lệ (7, 14, 30, 90).
     */
    public static int normalizeRentalDays(Integer days) {
        if (days == null) return 7;
        if (days == 14 || days == 30 || days == 90 || days == 7) {
            return days;
        }
        if (days > 90) return 90;
        if (days >= 25) return 30;
        if (days >= 12) return 14;
        return 7;
    }

    private int resolveRentalDays(String planKey) {
        if (planKey == null || planKey.trim().isEmpty()) {
            return 7;
        }
        if ("forever".equalsIgnoreCase(planKey)) {
            return 90;
        }
        try {
            return normalizeRentalDays(Integer.parseInt(planKey.trim()));
        } catch (NumberFormatException e) {
            return 7;
        }
    }

    /**
     * Xác định giá thuê gốc (baseKhoai) cho cuốn sách (mặc định tối thiểu 15-25 Khoai nếu DB để 0.0).
     */
    public static int resolveBaseKhoai(Book book) {
        if (book != null && book.getRent_price() != null && book.getRent_price() > 0) {
            return (int) Math.max(1, Math.round(book.getRent_price()));
        }
        String code = book != null && book.getBook_id() != null ? book.getBook_id().toUpperCase() : "";
        if (code.startsWith("KD")) return 25;
        if (code.startsWith("LS")) return 22;
        if (code.startsWith("VH")) return 20;
        if (code.startsWith("TT")) return 18;
        return 15;
    }

    /**
     * Công thức tính giá Khoai động theo số ngày thuê:
     * - 7 ngày:  100% baseKhoai (Mặc định)
     * - 14 ngày: làm tròn(baseKhoai * 1.8)
     * - 30 ngày: làm tròn(baseKhoai * 3.5)
     * - 90 ngày: làm tròn(baseKhoai * 9.0)
     */
    public static int calculatePriceKhoai(int baseKhoai, int rentalDays) {
        double multiplier;
        switch (rentalDays) {
            case 14:
                multiplier = 1.8;
                break;
            case 30:
                multiplier = 3.5;
                break;
            case 90:
                multiplier = 9.0;
                break;
            case 7:
            default:
                multiplier = 1.0;
                break;
        }
        return (int) Math.round(baseKhoai * multiplier);
    }

    private String resolveDescription(Book book) {
        if (book == null) {
            return "Tác phẩm văn học kinh điển được số hóa trên hệ thống thư viện HALM BOOK.";
        }
        if (book.getDescription() != null && !book.getDescription().trim().isEmpty()) {
            return book.getDescription().trim();
        }
        String title = book.getBookName() != null ? book.getBookName() : "Tác phẩm";
        String author = book.getAuthor() != null ? book.getAuthor() : "Tác giả";
        String category = book.getCategory() != null && book.getCategory().getCategory_name() != null
                ? book.getCategory().getCategory_name()
                : "Văn học kinh điển";
        return String.format(
                "\"%s\" là tác phẩm tiêu biểu của %s thuộc chuyên mục %s, mang giá trị nhân văn sâu sắc và góc nhìn chân thực về con người, thời đại.",
                title, author, category
        );
    }

    private CartItemDto toCartItemDto(Cart_Item item) {
        Book b = item.getBook();
        int days = normalizeRentalDays(item.getRentalDays());
        int baseKhoai = resolveBaseKhoai(b);
        int priceKhoai = calculatePriceKhoai(baseKhoai, days);
        String title = b != null && b.getBookName() != null ? b.getBookName() : "";
        String author = b != null && b.getAuthor() != null ? b.getAuthor() : "HALM BOOK";
        String coverUrl = b != null && b.getImg_url() != null ? b.getImg_url() : "";
        String description = resolveDescription(b);

        return CartItemDto.builder()
                .cartItemId(item.getCart_item_id())
                .bookId(b != null ? b.getBook_id() : "")
                .title(title)
                .bookName(title)
                .author(author)
                .coverUrl(coverUrl)
                .imgUrl(coverUrl)
                .description(description)
                .rentalDays(days)
                .priceKhoai(priceKhoai)
                .rentPrice((double) baseKhoai)
                .planKey(String.valueOf(days))
                .selectedPrice((double) priceKhoai)
                .build();
    }

    @Override
    @Transactional
    public void addToCart(AddToCartRequest request) {
        if (request == null || request.getBookId() == null || request.getBookId().trim().isEmpty()) {
            throw new IllegalArgumentException("Mã sách không hợp lệ!");
        }

        Customer customer = getCurrentCustomer();
        Cart cart = getOrCreateCart(customer);

        Book book = bookRepository.findById(request.getBookId())
                .orElseGet(() -> bookRepository.findBookById(request.getBookId()));

        if (book == null) {
            throw new RuntimeException("Sách không tồn tại trong hệ thống!");
        }

        Optional<Cart_Item> existingItem = cartItemRepository.findByCartIdAndBookId(cart.getCart_id(), book.getBook_id());
        int days = resolveRentalDays(request.getPlanKey());
        int baseKhoai = resolveBaseKhoai(book);
        int dynamicPrice = calculatePriceKhoai(baseKhoai, days);
        double finalPrice = (request.getPrice() != null && request.getPrice() > 0)
                ? request.getPrice()
                : (double) dynamicPrice;

        if (existingItem.isPresent()) {
            Cart_Item item = existingItem.get();
            item.setPlanKey(String.valueOf(days));
            item.setRentalDays(days);
            item.setSelectedPrice(finalPrice);
            item.setUpdatedAt(LocalDateTime.now());
            cartItemRepository.save(item);
            return;
        }

        Cart_Item newItem = new Cart_Item();
        newItem.setCart(cart);
        newItem.setBook(book);
        newItem.setPlanKey(String.valueOf(days));
        newItem.setRentalDays(days);
        newItem.setSelectedPrice(finalPrice);
        newItem.setCreatedAt(LocalDateTime.now());
        newItem.setUpdatedAt(LocalDateTime.now());
        cartItemRepository.save(newItem);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CartItemDto> getCartItems() {
        Customer customer = getCurrentCustomer();
        return getCartForCustomer(customer);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CartItemDto> getCart(int userId) {
        Customer customer = resolveCustomer(userId);
        return getCartForCustomer(customer);
    }

    private List<CartItemDto> getCartForCustomer(Customer customer) {
        Optional<Cart> cartOpt = cartRepository.findByCustomerId(customer.getCustomer_id());
        if (cartOpt.isEmpty()) {
            return new ArrayList<>();
        }
        List<Cart_Item> items = cartItemRepository.findByCartId(cartOpt.get().getCart_id());
        return items.stream()
                .map(this::toCartItemDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CartItemDto updateDuration(int userId, int cartItemId, int days) {
        Customer customer = resolveCustomer(userId);
        Cart cart = getOrCreateCart(customer);

        Cart_Item item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sách trong giỏ hàng!"));

        if (item.getCart() != null && item.getCart().getCart_id() != cart.getCart_id()) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa mục giỏ hàng này!");
        }

        int normalizedDays = normalizeRentalDays(days);
        int baseKhoai = resolveBaseKhoai(item.getBook());
        int priceKhoai = calculatePriceKhoai(baseKhoai, normalizedDays);

        item.setRentalDays(normalizedDays);
        item.setPlanKey(String.valueOf(normalizedDays));
        item.setSelectedPrice((double) priceKhoai);
        item.setUpdatedAt(LocalDateTime.now());

        Cart_Item saved = cartItemRepository.save(item);
        return toCartItemDto(saved);
    }

    @Override
    public int getCartItemCount() {
        try {
            Customer customer = getCurrentCustomer();
            Optional<Cart> cartOpt = cartRepository.findByCustomerId(customer.getCustomer_id());
            return cartOpt.map(cart -> cartItemRepository.countTotalItems(cart.getCart_id())).orElse(0);
        } catch (Exception e) {
            return 0;
        }
    }

    @Override
    @Transactional
    public void removeFromCart(int cartItemId) {
        removeFromCart(0, cartItemId);
    }

    @Override
    @Transactional
    public void removeFromCart(int userId, int cartItemId) {
        Customer customer = resolveCustomer(userId);
        Cart cart = cartRepository.findByCustomerId(customer.getCustomer_id())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng!"));

        Cart_Item item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm trong giỏ hàng!"));

        if (item.getCart() != null && item.getCart().getCart_id() != cart.getCart_id()) {
            throw new RuntimeException("Bạn không có quyền xóa sản phẩm này!");
        }

        cartItemRepository.delete(item);
    }

    @Override
    @Transactional
    public CheckoutResponse checkout(int userId, List<Integer> cartItemIds) {
        if (cartItemIds == null || cartItemIds.isEmpty()) {
            throw new RuntimeException("Vui lòng chọn ít nhất 1 cuốn sách để thanh toán!");
        }

        Customer customer = resolveCustomer(userId);
        Cart cart = getOrCreateCart(customer);

        List<Cart_Item> selectedItems = cartItemRepository.findAllById(cartItemIds).stream()
                .filter(ci -> ci.getCart() != null && ci.getCart().getCart_id() == cart.getCart_id())
                .collect(Collectors.toList());

        if (selectedItems.isEmpty()) {
            throw new RuntimeException("Không tìm thấy mục giỏ hàng hợp lệ để thanh toán!");
        }

        // 1. Tính tổng giá Khoai theo số ngày thuê thực tế của từng sách
        int subtotalKhoai = 0;
        for (Cart_Item item : selectedItems) {
            int days = normalizeRentalDays(item.getRentalDays());
            int baseKhoai = resolveBaseKhoai(item.getBook());
            int itemPrice = calculatePriceKhoai(baseKhoai, days);
            subtotalKhoai += itemPrice;
        }

        // Chiết khấu hạng thành viên (nếu có)
        int tierDiscountPercent = (customer.getMembershipTier() != null && customer.getMembershipTier().getDiscountPercent() != null)
                ? customer.getMembershipTier().getDiscountPercent()
                : 0;
        double discount = tierDiscountPercent > 0 ? (subtotalKhoai * tierDiscountPercent / 100.0) : 0.0;
        int totalKhoaiPaid = (int) Math.max(0, Math.round(subtotalKhoai - discount));

        // 2. Kiểm tra số dư Khoai của User
        int currentBalance = customer.getPotatoBalance() != null ? customer.getPotatoBalance() : 0;
        if (currentBalance < totalKhoaiPaid) {
            throw new RuntimeException(
                    "Số dư Ví Khoai không đủ (" + currentBalance + " < " + totalKhoaiPaid + " Khoai)! Vui lòng nạp thêm Khoai để thuê sách."
            );
        }

        // 3. Trừ Khoai của User
        int newBalance = currentBalance - totalKhoaiPaid;
        customer.setPotatoBalance(newBalance);
        customerRepository.save(customer);

        // 4. Ghi log vào bảng giao dịch Khoai (potato_transaction)
        String txCode = "HLM-" + (System.currentTimeMillis() % 1000000);
        PotatoTransaction potatoTx = new PotatoTransaction();
        potatoTx.setCustomer(customer);
        potatoTx.setAmount(-totalKhoaiPaid);
        potatoTx.setBalanceAfter(newBalance);
        potatoTx.setType("RENT_BOOK");
        potatoTx.setDescription("Thuê " + selectedItems.size() + " cuốn sách qua Giỏ hàng (Mã: " + txCode + ")");
        potatoTx.setCreatedAt(LocalDateTime.now());
        potatoTransactionRepository.save(potatoTx);

        // 5. Tạo bản ghi đơn hàng (Orders & Order_Item) và cấp quyền đọc (Access_Record)
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
        LocalDateTime now = LocalDateTime.now();

        for (Cart_Item ci : selectedItems) {
            Book book = ci.getBook();
            if (book == null) continue;

            int durationDays = normalizeRentalDays(ci.getRentalDays());
            int baseKhoai = resolveBaseKhoai(book);
            int priceKhoai = calculatePriceKhoai(baseKhoai, durationDays);

            Order_Item orderItem = new Order_Item();
            orderItem.setOrders(savedOrder);
            orderItem.setBook(book);
            orderItem.setRentalType("RENT");
            orderItem.setDurationDays(durationDays);
            orderItem.setPrice((double) priceKhoai);
            orderItemRepository.save(orderItem);

            // Cấp hoặc gia hạn quyền đọc sách trong bảng access_record
            Optional<Access_Record> existingRecordOpt = accessRecordRepository.findByCustomerAndBook(customer, book);
            Access_Record accessRecord;
            if (existingRecordOpt.isPresent()) {
                accessRecord = existingRecordOpt.get();
                LocalDateTime currentEndDate = accessRecord.getEnd_date();
                if (currentEndDate != null && currentEndDate.isAfter(now)) {
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

            book.setReadCount((book.getReadCount() != null ? book.getReadCount() : 0) + 1);
            bookRepository.save(book);

            Map<String, Object> bookInfo = new HashMap<>();
            bookInfo.put("bookId", book.getBook_id());
            bookInfo.put("bookName", book.getBookName());
            bookInfo.put("author", book.getAuthor());
            bookInfo.put("imgUrl", book.getImg_url());
            bookInfo.put("durationDays", durationDays);
            bookInfo.put("priceKhoai", priceKhoai);
            rentedBooksResult.add(bookInfo);
        }

        // 6. Xóa các mục đã thanh toán khỏi giỏ hàng
        List<Integer> idsToDelete = selectedItems.stream()
                .map(Cart_Item::getCart_item_id)
                .collect(Collectors.toList());
        cartItemRepository.deleteByIds(idsToDelete);

        // 7. Cộng điểm kinh nghiệm hạng thành viên (nếu có)
        if (tierService != null) {
            try {
                int earnedXp = selectedItems.size() * 50;
                tierService.addExperiencePoints(customer, earnedXp, "Thuê " + selectedItems.size() + " cuốn sách");
                tierService.calculateAndUpdateCustomerTier(customer);
            } catch (Exception ignored) {
            }
        }

        return CheckoutResponse.builder()
                .success(true)
                .message("Thuê sách thành công! Sách đã được thêm vào Tủ Sách Cá Nhân của bạn.")
                .orderId(savedOrder.getOrders_id())
                .transactionNo(txCode)
                .totalKhoaiPaid(totalKhoaiPaid)
                .remainingPotatoBalance(newBalance)
                .orderDate(savedOrder.getOrder_date())
                .rentedBooks(rentedBooksResult)
                .build();
    }
}
