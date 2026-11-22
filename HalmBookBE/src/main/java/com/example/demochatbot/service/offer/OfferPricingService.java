package com.example.demochatbot.service.offer;

import com.example.demochatbot.dto.CheckoutItemRequest;
import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import com.example.demochatbot.service.order.CheckoutPricing;
import com.example.demochatbot.service.order.RentalPricing;
import com.example.demochatbot.service.policy.CommercePolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

/** One pricing path for cart quotes and committed checkout. Offers stack with membership; vouchers apply to regular lines after membership. */
@Service @RequiredArgsConstructor
public class OfferPricingService {
    private final BookOfferService offers;
    private final BookRepository books;
    private final PromotionRepository promotions;
    private final CommercePolicyService policies;
    @jakarta.persistence.PersistenceContext private jakarta.persistence.EntityManager em;
    public record Quote(double subtotal, double offerDiscount, double tierDiscount, double couponDiscount, int total,
                        String couponCode, String fingerprint, Promotion promotion, List<Double> offerPrices, int[] netPrices,
                        List<CheckoutItemRequest> items, long policyRevision) {
        public Map<String, Object> view() {
            List<Map<String, Object>> lines = new ArrayList<>();
            for (int i = 0; i < items.size(); i++) {
                var item = items.get(i); Map<String, Object> row = new LinkedHashMap<>(); row.put("bookId", item.getBookId()); row.put("cartItemId", item.getCartItemId());
                row.put("planKey", item.getPlanKey()); row.put("offerId", item.getOfferId()); row.put("priceKhoai", Math.round(offerPrices.get(i))); row.put("netPrice", netPrices[i]); lines.add(row);
            }
            return Map.of("subtotal", Math.round(subtotal), "offerDiscountAmount", Math.round(offerDiscount), "tierDiscountAmount", Math.round(tierDiscount), "couponDiscountAmount", Math.round(couponDiscount),
                "totalKhoaiPaid", total, "couponCode", couponCode, "quoteFingerprint", fingerprint, "items", lines, "policyRevision", policyRevision);
        }
    }
    public Quote quote(Customer customer, List<CheckoutItemRequest> items, CommercePolicyService.Snapshot policy, String requestedCoupon) {
        if (items == null || items.isEmpty() || items.size() > 100) throw BookOfferService.bad("Chọn từ 1 đến 100 sách để thanh toán.");
        List<Book> selected = new ArrayList<>(); List<Double> prices = new ArrayList<>(); Set<String> unique = new HashSet<>();
        for (var item : items) {
            if (item == null || item.getBookId() == null || !unique.add(item.getBookId().trim())) throw BookOfferService.bad("Danh sách sách trống hoặc trùng lặp.");
            Book book = books.findById(item.getBookId().trim()).orElseThrow(() -> BookOfferService.bad("Không tìm thấy sách " + item.getBookId()));
            if (!BookOfferService.published(book)) throw BookOfferService.bad("Sách " + book.getBookName() + " hiện không khả dụng.");
            selected.add(book); prices.add((double) policies.price(policy, item.getPlanKey(), book, true));
        }
        double subtotal = prices.stream().mapToDouble(Double::doubleValue).sum();
        if (subtotal > Integer.MAX_VALUE) throw BookOfferService.bad("Giá trị đơn vượt giới hạn.");
        StringBuilder identity = new StringBuilder(customer.getCustomer_id()).append('|').append(policy.revision());
        Map<String, List<Integer>> groups = new TreeMap<>();
        for (int i = 0; i < items.size(); i++) if (items.get(i).getOfferId() != null && !items.get(i).getOfferId().isBlank()) groups.computeIfAbsent(items.get(i).getOfferId(), k -> new ArrayList<>()).add(i);
        for (var group : groups.entrySet()) {
            group.getValue().sort(Comparator.comparing(index -> items.get(index).getBookId()));
            BookOffer offer = offers.locked(group.getKey());
            Set<String> actual = new HashSet<>(group.getValue().stream().map(i -> items.get(i).getBookId()).toList());
            if (!actual.equals(new HashSet<>(offer.getBookIds())) || actual.size() != offer.getBookIds().size()
                || group.getValue().stream().anyMatch(i -> !offer.getPlanKey().equalsIgnoreCase(items.get(i).getPlanKey())))
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Hãy chọn đủ sách và đúng kỳ hạn của combo/ưu đãi " + offer.getName() + ".");
            List<Double> weights = group.getValue().stream().map(prices::get).toList();
            if (offer.getPriceKhoai() > weights.stream().mapToDouble(Double::doubleValue).sum()) throw new ResponseStatusException(HttpStatus.CONFLICT, "Biểu giá đã đổi. Ưu đãi cần được admin cập nhật.");
            int[] allocation = CheckoutPricing.allocateNetPayment(weights, offer.getPriceKhoai());
            for (int n = 0; n < group.getValue().size(); n++) prices.set(group.getValue().get(n), (double) allocation[n]);
            identity.append("|offer:").append(offer.getId()).append(':').append(offer.getVersion());
        }
        double offerDiscount = subtotal - prices.stream().mapToDouble(Double::doubleValue).sum();
        int discount = customer.getMembershipTier() == null || customer.getMembershipTier().getDiscountPercent() == null ? 0 : customer.getMembershipTier().getDiscountPercent();
        if (customer.getMembershipTier() != null) {
            int tierId = customer.getMembershipTier().getTierId(); discount = policy.tiers().stream().filter(t -> t.getTierId() == tierId).map(t -> t.getDiscountPercent()).findFirst().orElse(discount);
        }
        if (discount < 0 || discount > 100) throw BookOfferService.bad("Cấu hình giảm hạng không hợp lệ.");
        List<Double> net = new ArrayList<>(); double tierDiscount = 0;
        for (double price : prices) { double reduction = price * discount / 100.0; tierDiscount += reduction; net.add(price - reduction); }
        String code = requestedCoupon == null && customer.getCart() != null ? customer.getCart().getCouponCode() : requestedCoupon;
        code = Objects.toString(code, "").trim().toUpperCase(Locale.ROOT); Promotion promotion = null; double couponDiscount = 0;
        if (!code.isEmpty()) {
            promotion = promotions.findById(code).orElseThrow(() -> BookOfferService.bad("Mã ưu đãi không tồn tại hoặc đã bị xóa."));
            if (em != null) em.refresh(promotion, jakarta.persistence.LockModeType.PESSIMISTIC_READ);
            if (!BookOfferService.active(promotion.getStatus(), promotion.getStart_date(), promotion.getEnd_date())) throw BookOfferService.bad("Mã ưu đãi đã tắt, chưa bắt đầu hoặc đã hết hạn.");
            List<Integer> eligible = new ArrayList<>(); double eligiblePrice = 0;
            for (int i = 0; i < selected.size(); i++) {
                if (items.get(i).getOfferId() != null && !items.get(i).getOfferId().isBlank()) continue;
                Book book = selected.get(i);
                boolean bookMatch = promotion.getBook() == null || promotion.getBook().getBook_id().equals(book.getBook_id());
                boolean categoryMatch = promotion.getCategory() == null || book.getCategory() != null && Objects.equals(promotion.getCategory().getCategory_id(), book.getCategory().getCategory_id());
                if (bookMatch && categoryMatch) { eligible.add(i); eligiblePrice += net.get(i); }
            }
            if (eligible.isEmpty()) throw BookOfferService.bad("Mã ưu đãi không áp dụng cho sách đã chọn. Combo/deal không cộng thêm voucher.");
            if (promotion.getDiscount_percent() < 0 || promotion.getDiscount_percent() > 100 || promotion.getDiscount_amount() < 0) throw BookOfferService.bad("Cấu hình mã ưu đãi không hợp lệ.");
            couponDiscount = promotion.getDiscount_percent() > 0 ? eligiblePrice * promotion.getDiscount_percent() / 100.0 : Math.min(eligiblePrice, promotion.getDiscount_amount());
            if (eligiblePrice > 0) for (int index : eligible) net.set(index, Math.max(0, net.get(index) - couponDiscount * net.get(index) / eligiblePrice));
            identity.append("|coupon:").append(code).append(':').append(promotion.getDiscount_percent()).append(':').append(promotion.getDiscount_amount())
                .append(':').append(promotion.getStart_date()).append(':').append(promotion.getEnd_date()).append(':').append(promotion.getBook_id())
                .append(':').append(promotion.getCategory() == null ? "" : promotion.getCategory().getCategory_id());
        }
        int total = (int) Math.max(0, Math.round(net.stream().mapToDouble(Double::doubleValue).sum()));
        List<String> canonical = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) canonical.add(items.get(i).getBookId() + ":" + items.get(i).getPlanKey() + ":" + items.get(i).getOfferId() + ":" + prices.get(i) + ":" + net.get(i));
        Collections.sort(canonical); identity.append('|').append(canonical).append('|').append(total).append('|').append(discount);
        return new Quote(Math.round(subtotal), Math.round(offerDiscount), Math.round(tierDiscount), Math.round(couponDiscount), total, code, RentalPricing.digest(identity.toString()), promotion,
            List.copyOf(prices), CheckoutPricing.allocateNetPayment(net, total), items, policy.revision());
    }
}
