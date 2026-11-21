package com.example.demochatbot.policy;

import com.example.demochatbot.dto.*;
import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import com.example.demochatbot.service.order.*;
import com.example.demochatbot.service.policy.CommercePolicyService;
import com.example.demochatbot.service.policy.CommercePolicyService.*;
import com.example.demochatbot.service.tier.TierServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import java.util.function.Supplier;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CommercePolicyTests {
    static class Fixture {
        final CommercePolicyRepository policies = mock(CommercePolicyRepository.class);
        final MembershipTierRepository tierRows = mock(MembershipTierRepository.class);
        final CustomerRepository customers = mock(CustomerRepository.class);
        final AccessRecordRepository access = mock(AccessRecordRepository.class);
        final PotatoTransactionRepository ledger = mock(PotatoTransactionRepository.class);
        final ObjectMapper json = new ObjectMapper();
        final TierServiceImpl tiers = new TierServiceImpl();
        final List<MembershipTier> levels = new ArrayList<>();
        final CommercePolicy row = new CommercePolicy();
        final CommercePolicyService service;
        final Customer reader = new Customer();
        Fixture() throws Exception {
            for (int i = 0; i < 4; i++) {
                MembershipTier tier = new MembershipTier((i + 1) * 10, "Custom tier " + (i + 1), new int[]{0, 10, 50, 150}[i], new int[]{0, 500, 2500, 10000}[i], i * 5, "*", "Configured description", null);
                tier.setRankOrder(i + 1); tier.setUpgradeReward(i == 0 ? 0 : 73); tier.setBenefitsJson("[\"Configured benefit\"]"); levels.add(tier);
            }
            when(tierRows.findAllByOrderByTierIdAsc()).thenAnswer(i -> levels); when(tierRows.count()).thenReturn(4L);
            ReflectionTestUtils.setField(tiers, "membershipTierRepository", tierRows); ReflectionTestUtils.setField(tiers, "customerRepository", customers);
            ReflectionTestUtils.setField(tiers, "accessRecordRepository", access); ReflectionTestUtils.setField(tiers, "potatoTransactionRepository", ledger);
            reader.setCustomer_id("alice"); reader.setPotatoBalance(100); reader.setTotalPotatoEarned(100); reader.setMembershipTier(levels.getFirst());
            when(customers.findByIdForUpdate("alice")).thenReturn(Optional.of(reader));
            row.setId(1); row.setRevision(4); row.setRentalPlansJson(json.writeValueAsString(CommercePolicyService.defaults()));
            when(policies.findById(1)).thenReturn(Optional.of(row)); when(policies.existsById(1)).thenReturn(true);
            when(policies.lockForUpdate()).thenReturn(Optional.of(row)); when(policies.lockForCheckout()).thenReturn(Optional.of(row));
            service = spy(new CommercePolicyService(policies, tierRows, tiers, json));
        }
        Snapshot snapshot() { return service.current(); }
        void price(String key, int price, boolean active) throws Exception {
            var plans = new ArrayList<>(snapshot().plans());
            for (int i = 0; i < plans.size(); i++) { var p = plans.get(i); if (p.key().equals(key)) plans.set(i, new RentalPlan(p.key(), p.durationDays(), p.label(), price, p.useBookPrice(), active, p.orderIndex())); }
            row.setRentalPlansJson(json.writeValueAsString(plans));
        }
    }
    @Test void restartingDoesNotOverwriteAdminThresholdsNamesDiscountsOrPlans() throws Exception {
        Fixture f = new Fixture(); f.levels.get(1).setMinPotatoRequired(777); f.levels.get(1).setDiscountPercent(17); f.price("7", 27, true);
        f.tiers.initDefaultTiersIfEmpty(); f.service.initialize();
        assertEquals(777, f.levels.get(1).getMinPotatoRequired()); assertEquals(17, f.levels.get(1).getDiscountPercent());
        assertEquals(27, f.service.price(f.snapshot(), "7", null, true)); verify(f.tierRows, never()).save(any()); verify(f.policies, never()).save(any());
    }
    @Test void tierNamesAndDatabaseIdsDoNotDetermineRankAndNextTier() throws Exception {
        Fixture f = new Fixture(); f.levels.get(1).setTierName("Reader Silver Renamed");
        CustomerTierSummaryDto summary = f.tiers.getCustomerTierSummary("alice");
        assertEquals(1, summary.getCurrentTier().getRankOrder()); assertEquals(20, summary.getNextTier().getTierId()); assertEquals(2, summary.getNextTier().getRankOrder());
        assertEquals("Reader Silver Renamed", summary.getNextTier().getTierName()); assertEquals(List.of("Configured benefit"), summary.getNextTier().getBenefits());
    }
    @Test void configuredThresholdsApplyWithBooksOrPointsAndUpgradeRewardIsPaidOnce() throws Exception {
        Fixture f = new Fixture(); f.levels.get(1).setMinPotatoRequired(125); f.reader.setTotalPotatoEarned(130);
        assertEquals(20, f.tiers.calculateAndUpdateCustomerTier(f.reader).getTierId()); assertEquals(173, f.reader.getPotatoBalance());
        f.tiers.calculateAndUpdateCustomerTier(f.reader); assertEquals(173, f.reader.getPotatoBalance()); verify(f.ledger, times(1)).save(argThat(t -> t.getAmount() == 73 && "TIER_UP_REWARD".equals(t.getType())));
        Fixture books = new Fixture(); when(books.access.countByCustomer(books.reader)).thenReturn(10L); books.levels.get(1).setMinPotatoRequired(100000);
        assertEquals(20, books.tiers.calculateAndUpdateCustomerTier(books.reader).getTierId());
    }
    @Test void raisingThresholdsNeverDemotesAnAlreadyEarnedTier() throws Exception {
        Fixture f = new Fixture(); f.reader.setMembershipTier(f.levels.get(2)); f.levels.get(2).setMinBooksRequired(900); f.levels.get(2).setMinPotatoRequired(999999);
        assertEquals(30, f.tiers.calculateAndUpdateCustomerTier(f.reader).getTierId()); assertEquals(100, f.reader.getPotatoBalance()); verifyNoInteractions(f.ledger);
    }
    @Test void planPriceUsesConfigurationSupportsFreeAndBookSpecificBuyPrices() throws Exception {
        Fixture f = new Fixture(); f.price("7", 27, true); assertEquals(27, f.service.price(f.snapshot(), "7", null, true));
        f.price("7", 0, true); assertEquals(0, f.service.price(f.snapshot(), "7", null, true));
        Book b = new Book(); b.setRent_price(61.0); assertEquals(61, f.service.price(f.snapshot(), "forever", b, true));
        b.setRent_price(0.0); assertEquals(39, f.service.price(f.snapshot(), "forever", b, true));
        assertEquals(90, f.service.plan(f.snapshot(), "90", true).durationDays());
    }
    @Test void inactivePlanCanBeDisplayedInAnExistingCartButCannotBePurchased() throws Exception {
        Fixture f = new Fixture(); f.price("7", 27, false);
        assertEquals(27, f.service.price(f.snapshot(), "7", null, false));
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> f.service.price(f.snapshot(), "7", null, true)).getStatusCode().value());
    }
    @Test void policyUpdateIsVersionedAndStaleAdminSavesCannotOverwriteIt() throws Exception {
        Fixture f = new Fixture(); Snapshot old = f.snapshot(); var inputs = old.tiers(); inputs.get(1).setTierName("Edited name"); inputs.get(1).setDiscountPercent(17);
        Snapshot saved = f.service.update(new Update(4, old.plans(), inputs)); assertEquals(5, saved.revision()); assertEquals("Edited name", f.levels.get(1).getTierName()); assertEquals(17, f.levels.get(1).getDiscountPercent());
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> f.service.update(new Update(4, old.plans(), inputs))).getStatusCode().value());
        verify(f.tierRows, times(1)).saveAll(any()); verify(f.policies, times(1)).saveAndFlush(any());
    }
    @Test void invalidPolicyDoesNotWriteAnyTierOrVersion() throws Exception {
        Fixture f = new Fixture(); Snapshot old = f.snapshot(); old.tiers().get(2).setMinPotatoRequired(1);
        assertThrows(ResponseStatusException.class, () -> f.service.update(new Update(4, old.plans(), old.tiers())));
        assertEquals(4, f.row.getRevision()); verify(f.tierRows, never()).saveAll(any()); verify(f.policies, never()).saveAndFlush(any());
    }
    @Test void validationRejectsReorderedIdentitiesInvalidDiscountsAndUnorderedThresholds() throws Exception {
        Fixture f = new Fixture(); var inputs = f.snapshot().tiers(); inputs.get(1).setRankOrder(4); assertThrows(ResponseStatusException.class, () -> CommercePolicyService.validateTiers(inputs, f.levels));
        inputs.get(1).setRankOrder(2); inputs.get(1).setDiscountPercent(101); assertThrows(ResponseStatusException.class, () -> CommercePolicyService.validateTiers(inputs, f.levels));
        inputs.get(1).setDiscountPercent(5); inputs.get(1).setMinBooksRequired(0); assertThrows(ResponseStatusException.class, () -> CommercePolicyService.validateTiers(inputs, f.levels));
    }
    @Test void planValidationRejectsMissingAllDisabledChangedDurationAndBookModeOnRental() {
        assertThrows(ResponseStatusException.class, () -> CommercePolicyService.validatePlans(List.of()));
        assertThrows(ResponseStatusException.class, () -> CommercePolicyService.validatePlans(CommercePolicyService.defaults().stream().map(p -> new RentalPlan(p.key(), p.durationDays(), p.label(), p.priceKhoai(), p.useBookPrice(), false, p.orderIndex())).toList()));
        var invalid = new ArrayList<>(CommercePolicyService.defaults()); invalid.set(0, new RentalPlan("1", 999, "Bad", 1, false, true, 1)); assertThrows(ResponseStatusException.class, () -> CommercePolicyService.validatePlans(invalid));
        invalid.set(0, new RentalPlan("1", 1, "Bad", 1, true, true, 1)); assertThrows(ResponseStatusException.class, () -> CommercePolicyService.validatePlans(invalid));
    }
    static class CheckoutFixture extends Fixture {
        final OrderServiceImpl checkout = new OrderServiceImpl(); final OrdersRepository orders = mock(OrdersRepository.class);
        final OrderItemRepository items = mock(OrderItemRepository.class); final BookRepository books = mock(BookRepository.class);
        final CartItemRepository cart = mock(CartItemRepository.class);
        final List<Order_Item> lines = new ArrayList<>(); final Map<String, Orders> receipts = new HashMap<>();
        CheckoutFixture() throws Exception {
            Book book = new Book(); book.setBook_id("b1"); book.setBookName("Fixture book"); book.setRent_price(61.0);
            when(books.findById("b1")).thenReturn(Optional.of(book)); when(customers.findCustomerById(1)).thenReturn(reader);
            when(orders.findByTransactionNo(anyString())).thenAnswer(i -> Optional.ofNullable(receipts.get(i.getArgument(0))));
            when(orders.save(any())).thenAnswer(i -> { Orders o = i.getArgument(0); o.setOrders_id(7); o.setOrder_items(lines); receipts.put(o.getTransaction_no(), o); return o; });
            when(items.save(any())).thenAnswer(i -> { Order_Item item = i.getArgument(0); item.setOrder_item_id(lines.size() + 1); lines.add(item); return item; });
            CheckoutCoordinator transactions = mock(CheckoutCoordinator.class); when(transactions.execute(any(), any())).thenAnswer(i -> ((Supplier<?>) i.getArgument(1)).get());
            Map<String, Object> dependencies = Map.of("customerRepository", customers, "bookRepository", books, "ordersRepository", orders, "orderItemRepository", items,
                "accessRecordRepository", access, "potatoTransactionRepository", ledger, "tierService", tiers, "commercePolicy", service, "checkoutCoordinator", transactions, "cartItemRepository", cart);
            dependencies.forEach((key, value) -> ReflectionTestUtils.setField(checkout, key, value));
            ReflectionTestUtils.setField(checkout, "offerPricing", com.example.demochatbot.support.TestCommercePolicies.pricing(books, mock(PromotionRepository.class), service));
        }
        CheckoutRequest request(int expected, long revision) {
            CheckoutItemRequest item = new CheckoutItemRequest(); item.setBookId("b1"); item.setPlanKey("7"); item.setPrice(0.01); item.setDurationDays(99999);
            CheckoutRequest request = new CheckoutRequest(); request.setItems(List.of(item)); request.setPolicyRevision(revision); request.setExpectedTotal(expected); request.setIdempotencyKey("fixture-checkout"); return request;
        }
    }
    @Test void checkoutChargesConfiguredPriceAndDiscountIgnoresClientPriceAndDuration() throws Exception {
        CheckoutFixture f = new CheckoutFixture(); f.price("7", 27, true); f.levels.getFirst().setDiscountPercent(25);
        CheckoutResponse result = f.checkout.checkoutWithPotato(1, f.request(20, 4));
        assertEquals(20, result.getTotalKhoaiPaid()); assertEquals(80, f.reader.getPotatoBalance()); assertEquals(7, f.lines.getFirst().getDurationDays());
        assertEquals(20.0, f.lines.getFirst().getPrice());
    }
    @Test void changedRevisionOrChangedTotalRejectsBeforeAnyDebit() throws Exception {
        CheckoutFixture f = new CheckoutFixture(); f.price("7", 27, true);
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> f.checkout.checkoutWithPotato(1, f.request(27, 3))).getStatusCode().value());
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> f.checkout.checkoutWithPotato(1, f.request(9, 4))).getStatusCode().value());
        assertEquals(100, f.reader.getPotatoBalance()); verifyNoInteractions(f.ledger); verify(f.orders, never()).save(any());
    }
    @Test void aPaidCheckoutReplaysAndRefundsItsOriginalReceiptAfterPolicyChanges() throws Exception {
        CheckoutFixture f = new CheckoutFixture(); f.price("7", 27, true);
        CheckoutResponse first = f.checkout.checkoutWithPotato(1, f.request(27, 4)); assertEquals(27, first.getTotalKhoaiPaid());
        f.price("7", 90, false); f.row.setRevision(5);
        CheckoutResponse retry = f.checkout.checkoutWithPotato(1, f.request(27, 4)); assertEquals(27, retry.getTotalKhoaiPaid()); assertEquals(4L, retry.getPolicyRevision()); assertEquals(73, f.reader.getPotatoBalance());
        assertEquals(27, CheckoutPricing.refundableAmount(f.lines.getFirst())); verify(f.service, times(1)).checkout(4L);
        verify(f.ledger, times(1)).save(argThat(t -> t.getAmount() == -27));
    }
    @Test void cartCheckoutWithoutAClientKeyAutomaticallyReplaysAfterRowsWereRemoved() throws Exception {
        CheckoutFixture f = new CheckoutFixture();
        Cart cart = new Cart(); cart.setCart_id(1); cart.setCustomer(f.reader); f.reader.setCart(cart);
        Cart_Item row = new Cart_Item(); row.setCart_item_id(9); row.setCart(cart); row.setBook(f.books.findById("b1").orElseThrow()); row.setPlanKey("7");
        when(f.cart.findById(9)).thenReturn(Optional.of(row)); when(f.cart.findByIdsAndUserId(List.of(9), 1)).thenReturn(List.of(row));
        CheckoutRequest request = f.request(9, 4); request.setCartItemIds(List.of(9)); request.setIdempotencyKey(null);
        CheckoutResponse first = f.checkout.checkoutWithPotato(1, request);
        CheckoutRequest retry = f.request(9, 4); retry.setCartItemIds(List.of(9)); retry.setIdempotencyKey(null);
        CheckoutResponse second = f.checkout.checkoutWithPotato(1, retry);
        assertEquals(first.getOrderId(), second.getOrderId()); assertEquals(91, f.reader.getPotatoBalance());
        verify(f.cart, times(1)).findByIdsAndUserId(List.of(9), 1);
    }
    @Test void aConfiguredFreePlanCreatesAZeroPaymentWithoutInventingAFallbackPrice() throws Exception {
        CheckoutFixture f = new CheckoutFixture(); f.price("7", 0, true);
        assertEquals(0, f.checkout.checkoutWithPotato(1, f.request(0, 4)).getTotalKhoaiPaid());
        assertEquals(100, f.reader.getPotatoBalance()); assertEquals(0.0, f.lines.getFirst().getPrice());
    }
    private static com.example.demochatbot.service.offer.OfferPricingService offerPricing(CheckoutFixture f, BookOffer offer) {
        BookOfferRepository rows = mock(BookOfferRepository.class); when(rows.findById("deal")).thenReturn(Optional.of(offer));
        var offers = new com.example.demochatbot.service.offer.BookOfferService(rows, f.books, f.service);
        var pricing = new com.example.demochatbot.service.offer.OfferPricingService(offers, f.books, mock(PromotionRepository.class), f.service);
        ReflectionTestUtils.setField(f.checkout, "offerPricing", pricing); return pricing;
    }
    private static BookOffer deal() {
        BookOffer offer = new BookOffer(); offer.setId("deal"); offer.setVersion(1L); offer.setKind("SINGLE"); offer.setName("Deal thật"); offer.setBookIds(List.of("b1")); offer.setPlanKey("7"); offer.setStatus("ACTIVE"); offer.setPriceKhoai(5); return offer;
    }
    @Test void changedOfferVersionRejectsAnOldQuoteEvenWhenTotalIsUnchangedBeforeDebiting() throws Exception {
        CheckoutFixture f = new CheckoutFixture(); BookOffer offer = deal(); var pricing = offerPricing(f, offer);
        CheckoutRequest request = f.request(5, 4); request.getItems().getFirst().setOfferId("deal");
        request.setQuoteFingerprint(pricing.quote(f.reader, request.getItems(), f.snapshot(), "").fingerprint()); offer.setVersion(2L);
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> f.checkout.checkoutWithPotato(1, request)).getStatusCode().value());
        assertEquals(100, f.reader.getPotatoBalance()); verifyNoInteractions(f.ledger); verify(f.orders, never()).save(any());
    }
    @Test void paidOfferRetryKeepsItsOriginalReceiptAndRefundAfterAdminDisablesOrRepricesIt() throws Exception {
        CheckoutFixture f = new CheckoutFixture(); BookOffer offer = deal(); var pricing = offerPricing(f, offer);
        CheckoutRequest request = f.request(5, 4); request.getItems().getFirst().setOfferId("deal");
        request.setQuoteFingerprint(pricing.quote(f.reader, request.getItems(), f.snapshot(), "").fingerprint());
        CheckoutResponse paid = f.checkout.checkoutWithPotato(1, request); assertEquals(4, paid.getOfferDiscountAmount());
        offer.setPriceKhoai(8); offer.setStatus("DELETED"); offer.setVersion(2L);
        CheckoutResponse replay = f.checkout.checkoutWithPotato(1, request);
        assertEquals(paid.getOrderId(), replay.getOrderId()); assertEquals(5, replay.getTotalKhoaiPaid()); assertEquals(4, replay.getOfferDiscountAmount());
        assertEquals(95, f.reader.getPotatoBalance()); assertEquals("deal", f.lines.getFirst().getOfferId()); assertEquals(5, CheckoutPricing.refundableAmount(f.lines.getFirst()));
        verify(f.ledger, times(1)).save(argThat(t -> t.getAmount() == -5));
    }
    @Test void aDefaultCartAdditionChoosesAnOpenPlanAndUsesItsConfiguredPrice() throws Exception {
        Fixture f = new Fixture();
        f.row.setRentalPlansJson(f.json.writeValueAsString(CommercePolicyService.defaults().stream().map(p ->
            new RentalPlan(p.key(), p.durationDays(), p.label(), 33, p.useBookPrice(), "30".equals(p.key()), p.orderIndex())).toList()));
        var cartService = new com.example.demochatbot.service.cart.CartServiceImpl();
        var current = mock(com.example.demochatbot.service.customer.CustomerService.class);
        when(current.getCurrentAccountId()).thenReturn(1); when(current.findCustomerById(1)).thenReturn(f.reader);
        var carts = mock(CartRepository.class); var items = mock(CartItemRepository.class); var books = mock(BookRepository.class);
        Cart cart = new Cart(); cart.setCart_id(1); cart.setCustomer(f.reader); when(carts.findByCustomerId("alice")).thenReturn(Optional.of(cart));
        Book book = new Book(); book.setBook_id("b1"); book.setRent_price(999.0); when(books.findById("b1")).thenReturn(Optional.of(book));
        ReflectionTestUtils.setField(cartService, "customerService", current); ReflectionTestUtils.setField(cartService, "commercePolicy", f.service);
        ReflectionTestUtils.setField(cartService, "cartRepository", carts); ReflectionTestUtils.setField(cartService, "cartItemRepository", items); ReflectionTestUtils.setField(cartService, "bookRepository", books);
        AddToCartRequest request = new AddToCartRequest(); request.setBookId("b1"); request.setPrice(0.01);
        cartService.addToCart(request);
        verify(items).save(argThat(item -> "30".equals(item.getPlanKey()) && item.getRentalDays() == 30 && item.getSelectedPrice() == 33));
    }
}
