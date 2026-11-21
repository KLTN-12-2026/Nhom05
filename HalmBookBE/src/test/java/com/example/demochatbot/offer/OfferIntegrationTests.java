package com.example.demochatbot.offer;

import com.example.demochatbot.controller.PromotionController;
import com.example.demochatbot.dto.CheckoutItemRequest;
import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import com.example.demochatbot.service.offer.*;
import com.example.demochatbot.service.policy.CommercePolicyService;
import com.example.demochatbot.service.tier.TierService;
import com.example.demochatbot.support.TestCommercePolicies;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OfferIntegrationTests {
    static class Fixture {
        final BookRepository books = mock(BookRepository.class);
        final PromotionRepository promotions = mock(PromotionRepository.class);
        final BookOfferRepository offerRows = mock(BookOfferRepository.class);
        final TierService tiers = mock(TierService.class);
        final CommercePolicyService policy = TestCommercePolicies.defaults(tiers);
        final BookOfferService offers = new BookOfferService(offerRows, books, policy);
        final OfferPricingService pricing = new OfferPricingService(offers, books, promotions, policy);
        final Customer reader = new Customer();
        final Cart cart = new Cart();
        final Category category = new Category();
        final BookOffer combo = new BookOffer();
        Fixture() {
            reader.setCustomer_id("reader"); reader.setPotatoBalance(100); cart.setCart_id(7); cart.setCustomer(reader); reader.setCart(cart);
            category.setCategory_id(1000); category.setCategory_name("Kỹ năng");
            for (String id : List.of("b1", "b2", "b3")) {
                Book book = new Book(); book.setBook_id(id); book.setBookName(id); book.setStatus("PUBLISHED"); book.setRent_price(61.0); book.setCategory(category);
                when(books.findById(id)).thenReturn(Optional.of(book));
            }
            combo.setId("combo"); combo.setKind("COMBO"); combo.setName("Hai cuốn"); combo.setVersion(1L); combo.setStatus("ACTIVE"); combo.setPlanKey("7"); combo.setPriceKhoai(11); combo.setBookIds(List.of("b2", "b1"));
            when(offerRows.findById("combo")).thenReturn(Optional.of(combo)); when(offerRows.findAllByOrderByOrderIndexAscIdAsc()).thenReturn(List.of(combo));
            when(offerRows.saveAndFlush(any())).thenAnswer(i -> i.getArgument(0));
        }
        Book book(String id) { return books.findById(id).orElseThrow(); }
        CheckoutItemRequest item(String id, String offerId) { var item = new CheckoutItemRequest(); item.setBookId(id); item.setPlanKey("7"); item.setOfferId(offerId); return item; }
        List<CheckoutItemRequest> comboItems() { return List.of(item("b1", "combo"), item("b2", "combo")); }
        OfferPricingService.Quote quote(List<CheckoutItemRequest> items, String code) { return pricing.quote(reader, items, policy.current(), code); }
        Promotion coupon() {
            Promotion p = new Promotion(); p.setPromotion_id("REAL"); p.setPromotion_name("Voucher"); p.setStatus("ACTIVE"); p.setDiscount_amount(5);
            when(promotions.findById("REAL")).thenReturn(Optional.of(p)); return p;
        }
        Map<String, Object> input() { return new HashMap<>(Map.of("kind", "COMBO", "name", "Combo thật", "bookIds", List.of("b1", "b2"), "potato", 11, "planKey", "7", "status", "ACTIVE")); }
    }
    @Test void comboUsesItsRealPriceAndAllocatesExactPaidAmountRegardlessOfSelectionOrder() {
        Fixture f = new Fixture(); var first = f.quote(f.comboItems(), ""); var reversed = f.quote(List.of(f.item("b2", "combo"), f.item("b1", "combo")), "");
        assertEquals(18, first.subtotal()); assertEquals(7, first.offerDiscount()); assertEquals(11, first.total()); assertEquals(11, Arrays.stream(first.netPrices()).sum());
        assertEquals(first.fingerprint(), reversed.fingerprint()); assertEquals(first.offerPrices().get(0), reversed.offerPrices().get(1));
    }
    @Test void partialComboOrTamperedPlanCannotReceiveThePackagePrice() {
        Fixture f = new Fixture(); assertEquals(409, assertThrows(ResponseStatusException.class, () -> f.quote(List.of(f.item("b1", "combo")), "")).getStatusCode().value());
        var items = f.comboItems(); items.get(1).setPlanKey("30"); assertThrows(ResponseStatusException.class, () -> f.quote(items, ""));
    }
    @Test void stoppedFutureExpiredAndHiddenBookOffersCannotBeQuoted() {
        Fixture f = new Fixture(); f.combo.setStatus("INACTIVE"); assertThrows(ResponseStatusException.class, () -> f.quote(f.comboItems(), ""));
        f.combo.setStatus("ACTIVE"); f.combo.setStartDate(BookOfferService.now().plusDays(1)); assertThrows(ResponseStatusException.class, () -> f.quote(f.comboItems(), ""));
        f.combo.setStartDate(null); f.combo.setEndDate(BookOfferService.now().minusSeconds(1)); assertThrows(ResponseStatusException.class, () -> f.quote(f.comboItems(), ""));
        f.combo.setEndDate(null); f.book("b2").setStatus("HIDDEN"); assertThrows(ResponseStatusException.class, () -> f.quote(f.comboItems(), ""));
    }
    @Test void zeroPriceOffersStayFreeAndAdminChangesInvalidateTheQuoteFingerprint() {
        Fixture f = new Fixture(); var first = f.quote(f.comboItems(), ""); f.combo.setPriceKhoai(0); f.combo.setVersion(2L);
        var free = f.quote(f.comboItems(), ""); assertEquals(0, free.total()); assertEquals(0, Arrays.stream(free.netPrices()).sum()); assertNotEquals(first.fingerprint(), free.fingerprint());
        f.combo.setPriceKhoai(19); assertThrows(ResponseStatusException.class, () -> f.quote(f.comboItems(), ""));
    }
    @Test void missingCouponNeverFallsBackToHardcodedDemoCodes() {
        Fixture f = new Fixture(); for (String code : List.of("HALM20", "KHOAI5", "MISSING")) assertThrows(ResponseStatusException.class, () -> f.quote(List.of(f.item("b1", null)), code));
    }
    @Test void couponValidityIsEnforcedAtCheckoutTime() {
        Fixture f = new Fixture(); Promotion p = f.coupon();
        for (String status : List.of("INACTIVE", "DELETED")) { p.setStatus(status); assertThrows(ResponseStatusException.class, () -> f.quote(List.of(f.item("b1", null)), "REAL")); }
        p.setStatus("ACTIVE"); p.setStart_date(BookOfferService.now().plusHours(1)); assertThrows(ResponseStatusException.class, () -> f.quote(List.of(f.item("b1", null)), "REAL"));
        p.setStart_date(null); p.setEnd_date(BookOfferService.now().minusSeconds(1)); assertThrows(ResponseStatusException.class, () -> f.quote(List.of(f.item("b1", null)), "REAL"));
    }
    @Test void scopedCouponOnlyDiscountsEligibleBooksAfterMembership() {
        Fixture f = new Fixture(); Promotion p = f.coupon(); p.setBook(f.book("b1"));
        MembershipTier tier = new MembershipTier(); tier.setTierId(99); tier.setDiscountPercent(50); f.reader.setMembershipTier(tier);
        var quote = f.quote(List.of(f.item("b1", null), f.item("b3", null)), "real");
        assertEquals(9, quote.tierDiscount()); assertEquals(4.5, quote.couponDiscount()); assertEquals(5, quote.total()); assertArrayEquals(new int[]{0, 5}, quote.netPrices());
        assertThrows(ResponseStatusException.class, () -> f.quote(List.of(f.item("b3", null)), "REAL"));
    }
    @Test void categoryScopeUsesDatabaseIdentityAndCannotReduceAnUnrelatedBook() {
        Fixture f = new Fixture(); Promotion p = f.coupon(); Category sameId = new Category(); sameId.setCategory_id(1000); p.setCategory(sameId);
        Category other = new Category(); other.setCategory_id(1001); f.book("b3").setCategory(other);
        var quote = f.quote(List.of(f.item("b1", null), f.item("b3", null)), "REAL"); assertEquals(13, quote.total()); assertArrayEquals(new int[]{4, 9}, quote.netPrices());
        assertThrows(ResponseStatusException.class, () -> f.quote(List.of(f.item("b3", null)), "REAL"));
    }
    @Test void couponExcludesComboLinesAndPersistedCartCodeIsUsed() {
        Fixture f = new Fixture(); f.coupon(); f.cart.setCouponCode("REAL");
        assertThrows(ResponseStatusException.class, () -> f.quote(f.comboItems(), null));
        var quote = f.quote(List.of(f.item("b1", "combo"), f.item("b2", "combo"), f.item("b3", null)), null);
        assertEquals(15, quote.total()); assertEquals(5, quote.couponDiscount()); assertEquals(11, quote.netPrices()[0] + quote.netPrices()[1]);
    }
    @Test void adminMustChooseRealUniqueBooksAndValidPriceDatesAndImages() {
        Fixture f = new Fixture(); var input = f.input(); input.put("bookIds", List.of("b1", "b1")); assertThrows(ResponseStatusException.class, () -> f.offers.save(null, input));
        input.put("bookIds", List.of("b1", "fake")); assertThrows(ResponseStatusException.class, () -> f.offers.save(null, input));
        input.put("bookIds", List.of("b1", "b2")); input.put("potato", 19); assertThrows(ResponseStatusException.class, () -> f.offers.save(null, input));
        input.put("potato", 1.5); assertThrows(ResponseStatusException.class, () -> f.offers.save(null, input));
        input.put("potato", 11); input.put("img", "javascript:alert(1)"); assertThrows(ResponseStatusException.class, () -> f.offers.save(null, input));
        input.remove("img"); input.put("start_date", "2027-02-02"); input.put("end_date", "2027-02-01"); assertThrows(ResponseStatusException.class, () -> f.offers.save(null, input));
        verify(f.offerRows, never()).saveAndFlush(any());
    }
    @Test void adminSaveAndSoftDeleteUseDatabaseAndPreserveOfferIdentity() {
        Fixture f = new Fixture(); assertNotNull(f.offers.save(null, f.input()).get("id"));
        var input = f.input(); input.put("version", 0); assertEquals(409, assertThrows(ResponseStatusException.class, () -> f.offers.save("combo", input)).getStatusCode().value());
        f.offers.delete("combo"); assertEquals("DELETED", f.combo.getStatus()); verify(f.offerRows).save(f.combo); verify(f.offerRows, never()).delete(any());
    }
    @Test void publicOffersFilterUnavailableRowsAndNeverExposePaidContent() {
        Fixture f = new Fixture(); var rows = f.offers.list(false, "COMBO"); assertEquals(1, rows.size());
        assertEquals(18, rows.getFirst().get("originalPotato")); assertFalse(rows.toString().contains("pdf_url"));
        f.combo.setStatus("INACTIVE"); assertTrue(f.offers.list(false, null).isEmpty()); assertEquals(1, f.offers.list(true, null).size());
        f.combo.setStatus("ACTIVE"); f.book("b1").setStatus("HIDDEN"); assertTrue(f.offers.list(false, null).isEmpty());
    }
    static class CartFixture extends Fixture {
        final CustomerRepository customers = mock(CustomerRepository.class); final CartRepository carts = mock(CartRepository.class); final CartItemRepository rows = mock(CartItemRepository.class);
        final List<Cart_Item> stored = new ArrayList<>();
        final OfferCartService service = new OfferCartService(customers, carts, rows, books, offers, policy, pricing, tiers);
        CartFixture() {
            when(customers.findCustomerById(1)).thenReturn(reader); when(customers.findByIdForUpdate("reader")).thenReturn(Optional.of(reader));
            when(carts.findByCustomerId("reader")).thenReturn(Optional.of(cart)); when(rows.findByCartId(7)).thenAnswer(i -> stored);
            when(rows.save(any())).thenAnswer(i -> { Cart_Item row = i.getArgument(0); if (!stored.contains(row)) { row.setCart_item_id(stored.size() + 1); stored.add(row); } return row; });
        }
    }
    @Test void addingComboCreatesAllRowsClearsOldCouponAndDoesNotDebitWallet() {
        CartFixture f = new CartFixture(); f.cart.setCouponCode("OLD"); f.service.addOffer(1, "combo");
        assertEquals(2, f.stored.size()); assertTrue(f.stored.stream().allMatch(r -> "combo".equals(r.getOfferId()) && "7".equals(r.getPlanKey())));
        assertEquals(11, f.stored.stream().mapToDouble(Cart_Item::getSelectedPrice).sum()); assertNull(f.cart.getCouponCode()); assertEquals(100, f.reader.getPotatoBalance());
    }
    @Test void overlappingOffersAreRejectedBeforeAnyCartRowIsSaved() {
        CartFixture f = new CartFixture(); Cart_Item row = new Cart_Item(); row.setOfferId("another");
        when(f.rows.findByCartIdAndBookId(7, "b1")).thenReturn(Optional.of(row));
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> f.service.addOffer(1, "combo")).getStatusCode().value()); verify(f.rows, never()).save(any());
    }
    @Test void readdingAnEditedComboRemovesObsoleteBooksAndRemovingOneRowRemovesOnlyItsPackage() {
        CartFixture f = new CartFixture(); Cart_Item old = new Cart_Item(); old.setCart_item_id(90); old.setCart(f.cart); old.setBook(f.book("b3")); old.setOfferId("combo"); f.stored.add(old);
        f.service.addOffer(1, "combo"); verify(f.rows).deleteAll(List.of(old));
        var cartService = new com.example.demochatbot.service.cart.CartServiceImpl();
        var identity = mock(com.example.demochatbot.service.customer.CustomerService.class); when(identity.getCurrentAccountId()).thenReturn(1); when(identity.findCustomerById(1)).thenReturn(f.reader);
        ReflectionTestUtils.setField(cartService, "customerService", identity); ReflectionTestUtils.setField(cartService, "cartRepository", f.carts); ReflectionTestUtils.setField(cartService, "cartItemRepository", f.rows);
        when(f.rows.findById(90)).thenReturn(Optional.of(old)); Cart_Item unrelated = new Cart_Item(); unrelated.setCart_item_id(91); unrelated.setCart(f.cart); unrelated.setBook(f.book("b3")); f.stored.add(unrelated);
        cartService.removeFromCart(1, 90);
        verify(f.rows).deleteAll(argThat(group -> { var ids = new HashSet<Integer>(); group.forEach(row -> ids.add(row.getCart_item_id())); return ids.size() == 3 && !ids.contains(91); }));
    }
    @Test void quotingAnotherAccountsCartRowIsForbiddenAndCouponIsOnlyPersistedAfterValidation() {
        CartFixture f = new CartFixture(); f.service.addOffer(1, "combo");
        assertEquals(403, assertThrows(ResponseStatusException.class, () -> f.service.quote(1, List.of(999))).getStatusCode().value());
        f.coupon(); assertThrows(ResponseStatusException.class, () -> f.service.applyCoupon(1, "REAL", null, null)); assertNull(f.cart.getCouponCode());
        f.stored.forEach(r -> r.setOfferId(null)); f.service.applyCoupon(1, "real", null, null); assertEquals("REAL", f.cart.getCouponCode());
        f.service.clearCoupon(1); assertNull(f.cart.getCouponCode());
    }
    @Test void publicPromotionsRespectDatesAndIncludeRealBookMetadata() {
        Fixture f = new Fixture(); Promotion current = f.coupon(); current.setBook(f.book("b1"));
        Promotion future = new Promotion(); future.setStatus("ACTIVE"); future.setStart_date(BookOfferService.now().plusDays(1));
        Promotion expired = new Promotion(); expired.setStatus("ACTIVE"); expired.setEnd_date(BookOfferService.now().minusDays(1));
        when(f.promotions.findByStatusIgnoreCase("ACTIVE")).thenReturn(List.of(current, future, expired));
        PromotionController controller = new PromotionController(); ReflectionTestUtils.setField(controller, "promotionRepository", f.promotions); ReflectionTestUtils.setField(controller, "bookRepository", f.books);
        var response = controller.getActivePromotions(); assertEquals(List.of(current), response.getBody()); assertEquals("b1", current.getBookDetails().get("book_id")); assertEquals("private, no-store", response.getHeaders().getFirst("Cache-Control"));
    }
}
