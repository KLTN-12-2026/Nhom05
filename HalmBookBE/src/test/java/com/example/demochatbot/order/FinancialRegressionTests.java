package com.example.demochatbot.order;

import com.example.demochatbot.dto.*;
import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import com.example.demochatbot.service.order.*;
import com.example.demochatbot.service.potato.PotatoServiceImpl;
import com.example.demochatbot.service.tier.TierService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Supplier;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class FinancialRegressionTests {
    @Test void adminApprovalUsesSnapshotAndCannotCreditTwice() {
        var controller = new com.example.demochatbot.controller.FinanceAdminController();
        OrdersRepository orders = mock(OrdersRepository.class);
        CustomerRepository customers = mock(CustomerRepository.class);
        PotatoPackageRepository packages = mock(PotatoPackageRepository.class);
        PotatoTransactionRepository ledger = mock(PotatoTransactionRepository.class);
        ReflectionTestUtils.setField(controller, "ordersRepository", orders);
        ReflectionTestUtils.setField(controller, "customerRepository", customers);
        ReflectionTestUtils.setField(controller, "potatoPackageRepository", packages);
        ReflectionTestUtils.setField(controller, "potatoTransactionRepository", ledger);
        ReflectionTestUtils.setField(controller, "notificationRepository", mock(NotificationRepository.class));
        ReflectionTestUtils.setField(controller, "tierService", mock(TierService.class));
        Customer customer = new Customer(); customer.setCustomer_id("fixture"); customer.setPotatoBalance(10);
        Orders order = new Orders(); order.setOrders_id(7); order.setCustomer(customer); order.setOrderType("TOPUP_POTATO");
        order.setPaymentCurrency("VND"); order.setPayment_status("PENDING"); order.setTotal_amount(200000); order.setTopupPotatoAmount(220);
        when(orders.findById(7)).thenReturn(Optional.of(order));
        when(customers.findByIdForUpdate("fixture")).thenReturn(Optional.of(customer));
        assertEquals(200, controller.approveTransaction("7").getStatusCode().value());
        assertEquals(230, customer.getPotatoBalance());
        assertEquals(409, controller.approveTransaction("7").getStatusCode().value());
        verifyNoInteractions(packages); verify(ledger, times(1)).save(any());
    }

    @Test void cartQuoteUsesTheSameTariffAsCheckout() {
        for (int days : new int[]{7, 14, 30, 90}) {
            assertEquals(RentalPricing.price(String.valueOf(days), null),
                    com.example.demochatbot.service.cart.CartServiceImpl.calculatePriceKhoai(200, days));
        }
    }

    @Test void legacyDiscountedRefundsNeverExceedActualPayment() {
        Orders order = new Orders(); order.setPaymentCurrency("POTATO"); order.setPayment_status("PAID"); order.setTotal_amount(27);
        Order_Item first = new Order_Item(); first.setOrder_item_id(1); first.setOrders(order); first.setPrice(20.0);
        Order_Item second = new Order_Item(); second.setOrder_item_id(2); second.setOrders(order); second.setPrice(10.0);
        order.setOrder_items(List.of(first, second));
        assertEquals(18, CheckoutPricing.refundableAmount(first));
        assertEquals(9, CheckoutPricing.refundableAmount(second));
        order.setTotal_amount(0);
        assertEquals(0, CheckoutPricing.refundableAmount(first));
        assertEquals(0, CheckoutPricing.refundableAmount(new Order_Item()));
    }

    @Test void topupSnapshotSurvivesPackageEdits() {
        PotatoServiceImpl service = new PotatoServiceImpl();
        CustomerRepository customers = mock(CustomerRepository.class);
        PotatoPackageRepository packages = mock(PotatoPackageRepository.class);
        OrdersRepository orders = mock(OrdersRepository.class);
        ReflectionTestUtils.setField(service, "customerRepository", customers);
        ReflectionTestUtils.setField(service, "potatoPackageRepository", packages);
        ReflectionTestUtils.setField(service, "ordersRepository", orders);
        Customer customer = new Customer(); customer.setCustomer_id("fixture");
        when(customers.findCustomerById(1)).thenReturn(customer);
        PotatoPackage pack = new PotatoPackage(); pack.setPackageId(2); pack.setPackageName("Original"); pack.setIsActive(true);
        pack.setPriceVnd(200000.0); pack.setPotatoAmount(200); pack.setBonusPotato(20);
        when(packages.findById(2)).thenReturn(Optional.of(pack));
        when(orders.save(any())).thenAnswer(call -> call.getArgument(0));
        TopupRequest request = new TopupRequest(); request.setPackageId(2); request.setAmountMoney(1.0);
        Orders order = service.createTopupRequest(1, request);
        pack.setBonusPotato(999); pack.setPackageName("Edited"); pack.setIsActive(false);
        assertEquals(220, order.getTopupPotatoAmount()); assertEquals("Original", order.getTopupPackageName());
        assertEquals(200000, order.getTotal_amount()); assertEquals("PENDING", order.getPayment_status());
    }

    @Test void legacyCartCheckoutReplaysAfterRowsWereDeletedWithoutAnotherDebit() {
        OrderServiceImpl service = new OrderServiceImpl();
        CustomerRepository customers = mock(CustomerRepository.class);
        BookRepository books = mock(BookRepository.class);
        OrdersRepository orders = mock(OrdersRepository.class);
        OrderItemRepository lines = mock(OrderItemRepository.class);
        CartItemRepository carts = mock(CartItemRepository.class);
        CheckoutCoordinator coordinator = mock(CheckoutCoordinator.class);
        when(coordinator.execute(any(), any())).thenAnswer(call -> ((Supplier<?>) call.getArgument(1)).get());
        Map<String, Object> dependencies = Map.of("customerRepository", customers, "bookRepository", books,
                "ordersRepository", orders, "orderItemRepository", lines, "cartItemRepository", carts,
                "accessRecordRepository", mock(AccessRecordRepository.class), "tierService", mock(TierService.class),
                "potatoTransactionRepository", mock(PotatoTransactionRepository.class), "checkoutCoordinator", coordinator,
                "promotionRepository", mock(PromotionRepository.class));
        dependencies.forEach((name, value) -> ReflectionTestUtils.setField(service, name, value));
        ReflectionTestUtils.setField(service, "commercePolicy", com.example.demochatbot.support.TestCommercePolicies.defaults((TierService) dependencies.get("tierService")));
        ReflectionTestUtils.setField(service, "offerPricing", com.example.demochatbot.support.TestCommercePolicies.pricing(books, (PromotionRepository) dependencies.get("promotionRepository"), (com.example.demochatbot.service.policy.CommercePolicyService) ReflectionTestUtils.getField(service, "commercePolicy")));
        Customer customer = new Customer(); customer.setCustomer_id("fixture"); customer.setPotatoBalance(100);
        Cart cart = new Cart(); cart.setCart_id(1); cart.setCustomer(customer); customer.setCart(cart);
        Book book = new Book(); book.setBook_id("fixture-book"); book.setRent_price(200.0);
        Cart_Item row = new Cart_Item(); row.setCart_item_id(42); row.setCart(cart); row.setBook(book); row.setPlanKey("7");
        when(customers.findCustomerById(1)).thenReturn(customer);
        when(customers.findByIdForUpdate("fixture")).thenReturn(Optional.of(customer));
        when(books.findById("fixture-book")).thenReturn(Optional.of(book));
        when(carts.findByIdsAndUserId(List.of(42), 1)).thenReturn(List.of(row));
        when(carts.findById(42)).thenReturn(Optional.of(row));
        AtomicReference<Orders> committed = new AtomicReference<>();
        when(orders.findByTransactionNo(any())).thenAnswer(call -> Optional.ofNullable(committed.get()).filter(order -> order.getTransaction_no().equals(call.getArgument(0))));
        when(orders.save(any())).thenAnswer(call -> { Orders order = call.getArgument(0); order.setOrders_id(1); order.setOrder_items(new ArrayList<>()); committed.set(order); return order; });
        when(lines.save(any())).thenAnswer(call -> { Order_Item line = call.getArgument(0); committed.get().getOrder_items().add(line); return line; });
        CheckoutRequest request = new CheckoutRequest(); request.setCartItemIds(List.of(42)); request.setIdempotencyKey("legacy-retry");
        CheckoutResponse first = service.checkoutWithPotato(1, request);
        CheckoutRequest retry = new CheckoutRequest(); retry.setCartItemIds(List.of(42)); retry.setIdempotencyKey("legacy-retry");
        CheckoutResponse second = service.checkoutWithPotato(1, retry);
        assertEquals(9, first.getTotalKhoaiPaid()); assertEquals(first.getOrderId(), second.getOrderId()); assertEquals(91, customer.getPotatoBalance());
        verify(customers, times(1)).save(customer); verify(carts, times(1)).findByIdsAndUserId(List.of(42), 1);
        assertEquals(9.0, committed.get().getOrder_items().getFirst().getPrice());
    }
}
