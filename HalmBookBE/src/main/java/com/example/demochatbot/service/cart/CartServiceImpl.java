package com.example.demochatbot.service.cart;

import com.example.demochatbot.dto.AddToCartRequest;
import com.example.demochatbot.dto.CartItemDto;
import com.example.demochatbot.dto.CheckoutResponse;
import com.example.demochatbot.dto.CheckoutRequest;
import com.example.demochatbot.service.order.OrderService;
import com.example.demochatbot.service.order.RentalPricing;
import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import com.example.demochatbot.service.customer.CustomerService;
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
    private CustomerService customerService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private com.example.demochatbot.service.policy.CommercePolicyService commercePolicy;

    @Autowired
    private com.example.demochatbot.repository.BookOfferRepository bookOffers;

    @Autowired
    private com.example.demochatbot.repository.AccessRecordRepository accessRecordRepository;


    /**
     * Lấy thông tin Customer theo userId (accountId) hoặc ngữ cảnh đăng nhập hiện tại.
     */
    private Customer resolveCustomer(Integer userId) {
        int currentId = customerService.getCurrentAccountId();
        if (currentId <= 0) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED);
        if (userId != null && userId > 0 && userId != currentId) {
            throw new org.springframework.security.access.AccessDeniedException("Giỏ hàng không thuộc tài khoản hiện tại.");
        }
        Customer current = customerService.findCustomerById(currentId);
        if (current == null) throw new IllegalArgumentException("Không tìm thấy thông tin khách hàng!");
        return current;
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
        if (days == 1 || days == 3 || days == 15 || days == 36500 || days == 14 || days == 30 || days == 90 || days == 7) {
            return days;
        }
        if (days > 90) return 90;
        if (days >= 25) return 30;
        if (days >= 12) return 14;
        return 7;
    }

    private int resolveRentalDays(String planKey) {
        var policy = commercePolicy.current();
        String selected = planKey;
        if (selected == null || selected.isBlank()) selected = policy.plans().stream().filter(p -> p.active() && "7".equals(p.key()))
            .findFirst().or(() -> policy.plans().stream().filter(p -> p.active()).findFirst())
            .orElseThrow(() -> new IllegalArgumentException("Hiện chưa có gói thuê đang mở.")).key();
        return commercePolicy.plan(policy, selected, true).durationDays();
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

    /** Same server tariff as the primary checkout endpoint. */
    public static int calculatePriceKhoai(int baseKhoai, int rentalDays) {
        return (int) RentalPricing.price(String.valueOf(rentalDays), null);
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
        String plan = item.getPlanKey() == null ? String.valueOf(normalizeRentalDays(item.getRentalDays())) : item.getPlanKey();
        int days = commercePolicy.plan(commercePolicy.current(), plan, false).durationDays();
        int baseKhoai = resolveBaseKhoai(b);
        int priceKhoai = item.getOfferId() != null && item.getSelectedPrice() != null ? (int) Math.round(item.getSelectedPrice()) : commercePolicy.price(commercePolicy.current(), plan, b, false);
        String title = b != null && b.getBookName() != null ? b.getBookName() : "";
        String author = b != null && b.getAuthor() != null ? b.getAuthor() : "HALM BOOK";
        String coverUrl = b != null && b.getImg_url() != null ? b.getImg_url() : "";
        String description = resolveDescription(b);

        return CartItemDto.builder()
                .cartItemId(item.getCart_item_id())
                .bookId(b != null ? b.getBook_id() : "")
                .offerId(item.getOfferId()).offerName(item.getOfferId() == null ? null : bookOffers.findById(item.getOfferId()).map(com.example.demochatbot.model.BookOffer::getName).orElse("Ưu đãi đã ngừng"))
                .title(title)
                .bookName(title)
                .author(author)
                .coverUrl(coverUrl)
                .imgUrl(coverUrl)
                .description(description)
                .rentalDays(days)
                .priceKhoai(priceKhoai)
                .rentPrice(b != null && b.getRent_price() != null && b.getRent_price() > 0 ? b.getRent_price() : 0.0)
                .planKey(plan)
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

        // Kiểm tra xem khách hàng đã sở hữu vĩnh viễn cuốn sách này chưa
        Optional<com.example.demochatbot.model.Access_Record> existingAccess = accessRecordRepository.findByCustomerIdAndBookId(customer.getCustomer_id(), book.getBook_id());
        if (existingAccess.isPresent()) {
            com.example.demochatbot.model.Access_Record ar = existingAccess.get();
            boolean isForever = (ar.getEnd_date() == null || (ar.getEnd_date().isAfter(LocalDateTime.now()) && java.time.temporal.ChronoUnit.DAYS.between(LocalDateTime.now(), ar.getEnd_date()) > 1000));
            if ("ACTIVE".equalsIgnoreCase(ar.getStatus()) && isForever) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "Bạn đã sở hữu vĩnh viễn cuốn sách này trong Tủ sách cá nhân!"
                );
            }
        }

        Optional<Cart_Item> existingItem = cartItemRepository.findByCartIdAndBookId(cart.getCart_id(), book.getBook_id());
        int days = resolveRentalDays(request.getPlanKey());
        int baseKhoai = resolveBaseKhoai(book);
        String plan = days == 36500 ? "forever" : String.valueOf(days);
        int dynamicPrice = commercePolicy.price(commercePolicy.current(), plan, book, true);
        double finalPrice = dynamicPrice;

        if (existingItem.isPresent()) {
            Cart_Item item = existingItem.get();
            if (item.getOfferId() != null) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "Sách đang thuộc combo/deal. Hãy xóa ưu đãi đó để chọn sách lẻ.");
            item.setPlanKey(plan);
            item.setRentalDays(days);
            item.setSelectedPrice(finalPrice);
            item.setUpdatedAt(LocalDateTime.now());
            cartItemRepository.save(item);
            return;
        }

        Cart_Item newItem = new Cart_Item();
        newItem.setCart(cart);
        newItem.setBook(book);
        newItem.setPlanKey(plan);
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

        if (item.getCart() == null || item.getCart().getCart_id() != cart.getCart_id()) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa mục giỏ hàng này!");
        }

        if (item.getOfferId() != null && days != item.getRentalDays()) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "Kỳ hạn combo/deal được cố định theo ưu đãi.");
        if (item.getOfferId() != null) return toCartItemDto(item);
        int normalizedDays = normalizeRentalDays(days);
        int baseKhoai = resolveBaseKhoai(item.getBook());
        String plan = normalizedDays == 36500 ? "forever" : String.valueOf(normalizedDays);
        int priceKhoai = commercePolicy.price(commercePolicy.current(), plan, item.getBook(), true);

        item.setRentalDays(normalizedDays);
        item.setPlanKey(plan);
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

        if (item.getCart() == null || item.getCart().getCart_id() != cart.getCart_id()) {
            throw new RuntimeException("Bạn không có quyền xóa sản phẩm này!");
        }

        if (item.getOfferId() == null) cartItemRepository.delete(item);
        else cartItemRepository.deleteAll(cartItemRepository.findByCartId(item.getCart().getCart_id()).stream().filter(row -> item.getOfferId().equals(row.getOfferId())).toList());
    }

    @Override
    public CheckoutResponse checkout(int userId, List<Integer> cartItemIds) {
        return checkout(userId, cartItemIds, null);
    }

    @Override
    public CheckoutResponse checkout(int userId, List<Integer> cartItemIds, String idempotencyKey) {
        resolveCustomer(userId);
        if (cartItemIds == null || cartItemIds.isEmpty() || cartItemIds.stream().anyMatch(id -> id == null || id <= 0)
                || new HashSet<>(cartItemIds).size() != cartItemIds.size()) {
            throw new IllegalArgumentException("Danh sách mục giỏ hàng không hợp lệ.");
        }
        CheckoutRequest request = new CheckoutRequest();
        request.setCartItemIds(List.copyOf(cartItemIds));
        // Cart row IDs are never reused. A retry still identifies this purchase.
        request.setIdempotencyKey(idempotencyKey == null || idempotencyKey.isBlank()
                ? "CART-" + userId + "-" + RentalPricing.digest(cartItemIds.stream().sorted().map(String::valueOf).collect(Collectors.joining(",")))
                : idempotencyKey);
        return orderService.checkoutWithPotato(userId, request);
    }
}
