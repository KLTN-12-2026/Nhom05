package com.example.demochatbot.service.offer;
import com.example.demochatbot.dto.CheckoutItemRequest;
import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import com.example.demochatbot.service.order.CheckoutPricing;
import com.example.demochatbot.service.policy.CommercePolicyService;
import com.example.demochatbot.service.tier.TierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@Service @RequiredArgsConstructor
public class OfferCartService {
    private final CustomerRepository customers;
    private final CartRepository carts;
    private final CartItemRepository rows;
    private final BookRepository books;
    private final BookOfferService offers;
    private final CommercePolicyService policies;
    private final OfferPricingService pricing;
    private final TierService tiers;
    @jakarta.persistence.PersistenceContext private jakarta.persistence.EntityManager em;
    private Customer owner(int accountId) {
        Customer found = customers.findCustomerById(accountId);
        if (found == null || accountId <= 0) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập.");
        Customer customer = customers.findByIdForUpdate(found.getCustomer_id()).orElseThrow(() -> BookOfferService.bad("Không tìm thấy tài khoản."));
        if (em != null) em.refresh(customer, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        return customer;
    }
    private Cart cart(Customer customer) {
        Cart cart = carts.findByCustomerId(customer.getCustomer_id()).orElseGet(() -> { Cart created = new Cart(); created.setCustomer(customer); return carts.save(created); });
        if (em != null) em.refresh(cart);
        customer.setCart(cart); return cart;
    }
    private List<CheckoutItemRequest> items(Customer customer, List<Integer> ids) {
        if (ids == null || ids.isEmpty() || ids.size() > 100 || ids.stream().anyMatch(i -> i == null || i <= 0) || new HashSet<>(ids).size() != ids.size()) throw BookOfferService.bad("Danh sách mục giỏ hàng không hợp lệ.");
        // Read by the locked customer's cart; do not trust account IDs or item prices from clients.
        Cart cart = cart(customer);
        List<Cart_Item> selected = rows.findByCartId(cart.getCart_id()).stream().filter(row -> ids.contains(row.getCart_item_id())).toList();
        if (selected.size() != ids.size()) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Mục giỏ hàng không thuộc tài khoản hoặc đã bị xóa.");
        return selected.stream().map(OfferCartService::item).toList();
    }
    public static CheckoutItemRequest item(Cart_Item row) {
        CheckoutItemRequest item = new CheckoutItemRequest(); item.setBookId(row.getBook().getBook_id()); item.setCartItemId(row.getCart_item_id());
        item.setPlanKey(row.getPlanKey()); item.setOfferId(row.getOfferId()); return item;
    }
    @Transactional public Map<String, Object> quote(int accountId, List<Integer> ids) {
        Customer customer = owner(accountId); var policy = policies.checkout(null); var tier = tiers.calculateAndUpdateCustomerTier(customer);
        if (tier != null) customer.setMembershipTier(tier);
        var quote = pricing.quote(customer, items(customer, ids), policy, null);
        Map<String, Object> result = new LinkedHashMap<>(quote.view()); result.put("potatoBalance", customer.getPotatoBalance()); return result;
    }
    @Transactional public Map<String, Object> addOffer(int accountId, String id) {
        Customer customer = owner(accountId); var policy = policies.checkout(null); BookOffer offer = offers.locked(id); Cart cart = cart(customer);
        List<Book> selected = offer.getBookIds().stream().map(bookId -> books.findById(bookId).filter(BookOfferService::published).orElseThrow(() -> BookOfferService.bad("Sách trong ưu đãi không còn khả dụng."))).toList();
        List<Double> prices = selected.stream().map(b -> (double) policies.price(policy, offer.getPlanKey(), b, true)).toList();
        if (offer.getPriceKhoai() > prices.stream().mapToDouble(Double::doubleValue).sum()) throw BookOfferService.bad("Ưu đãi cần được admin cập nhật theo biểu giá mới.");
        List<Cart_Item> targets = new ArrayList<>();
        for (Book book : selected) {
            Cart_Item row = rows.findByCartIdAndBookId(cart.getCart_id(), book.getBook_id()).orElseGet(Cart_Item::new);
            if (row.getOfferId() != null && !row.getOfferId().equals(id)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Một sách đã nằm trong combo khác. Hãy xóa combo đó trước khi chọn combo mới.");
            row.setCart(cart); row.setBook(book); targets.add(row);
        }
        int[] allocation = CheckoutPricing.allocateNetPayment(prices, offer.getPriceKhoai());
        // Re-adding a package after an admin edits its books replaces obsolete package rows atomically.
        rows.deleteAll(rows.findByCartId(cart.getCart_id()).stream()
            .filter(row -> id.equals(row.getOfferId()) && !offer.getBookIds().contains(row.getBook().getBook_id())).toList());
        for (int i = 0; i < targets.size(); i++) { Cart_Item row = targets.get(i); row.setOfferId(id); row.setPlanKey(offer.getPlanKey()); row.setRentalDays(policies.plan(policy, offer.getPlanKey(), true).durationDays()); row.setSelectedPrice((double) allocation[i]); rows.save(row); }
        // A new discounted offer is not combined with a previously selected voucher.
        cart.setCouponCode(null); carts.save(cart);
        return Map.of("success", true, "message", "Đã thêm đầy đủ sách trong ưu đãi vào giỏ hàng.", "offerId", id);
    }
    @Transactional public Map<String, Object> applyCoupon(int accountId, String code, String bookId, String planKey) {
        Customer customer = owner(accountId); var policy = policies.checkout(null); Cart cart = cart(customer);
        if (bookId != null && !bookId.isBlank()) {
            Book book = books.findById(bookId).filter(BookOfferService::published).orElseThrow(() -> BookOfferService.bad("Sách không khả dụng."));
            String plan = planKey;
            if (plan == null || plan.isBlank()) plan = policy.plans().stream().filter(p -> p.active() && "7".equals(p.key())).findFirst()
                .or(() -> policy.plans().stream().filter(p -> p.active()).findFirst()).orElseThrow().key();
            Cart_Item row = rows.findByCartIdAndBookId(cart.getCart_id(), bookId).orElseGet(Cart_Item::new);
            if (row.getOfferId() != null) throw BookOfferService.bad("Sách đang nằm trong combo/deal; không cộng thêm voucher.");
            row.setCart(cart); row.setBook(book); row.setPlanKey(plan); row.setRentalDays(policies.plan(policy, plan, true).durationDays()); row.setSelectedPrice((double) policies.price(policy, plan, book, true)); rows.saveAndFlush(row);
        }
        if (code == null || code.isBlank() || code.length() > 100) throw BookOfferService.bad("Mã ưu đãi không hợp lệ.");
        List<CheckoutItemRequest> selected = rows.findByCartId(cart.getCart_id()).stream().map(OfferCartService::item).toList();
        // Validate before committing the selected code; any failed cart insertion rolls back too.
        pricing.quote(customer, selected, policy, code);
        cart.setCouponCode(code.trim().toUpperCase(Locale.ROOT)); carts.save(cart);
        return Map.of("success", true, "message", "Đã áp dụng mã " + cart.getCouponCode() + ". Giỏ hàng sẽ hiển thị giá thực tế.");
    }
    @Transactional public void clearCoupon(int accountId) { Cart cart = cart(owner(accountId)); cart.setCouponCode(null); carts.save(cart); }
}
