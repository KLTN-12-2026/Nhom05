package com.example.demochatbot.service.potato;

import com.example.demochatbot.model.Account;
import com.example.demochatbot.model.Customer;
import com.example.demochatbot.model.MomoTopupOrder;
import com.example.demochatbot.repository.CustomerRepository;
import com.example.demochatbot.repository.MomoTopupOrderRepository;
import com.example.demochatbot.repository.PotatoPackageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class MomoTopupPaymentServiceTest {

    private MomoGatewayClient momoGatewayClient;
    private MomoTopupOrderRepository orderRepository;
    private PotatoService potatoService;
    private MomoTopupPaymentService paymentService;
    private MomoTopupOrder order;

    @BeforeEach
    void setUp() {
        momoGatewayClient = mock(MomoGatewayClient.class);
        orderRepository = mock(MomoTopupOrderRepository.class);
        CustomerRepository customerRepository = mock(CustomerRepository.class);
        PotatoPackageRepository packageRepository = mock(PotatoPackageRepository.class);
        potatoService = mock(PotatoService.class);
        paymentService = new MomoTopupPaymentService(
                momoGatewayClient,
                orderRepository,
                packageRepository,
                customerRepository,
                potatoService
        );

        Account account = new Account();
        account.setAccount_id(12);
        Customer customer = new Customer();
        customer.setCustomer_id("customer-12");
        customer.setAccount(account);

        order = new MomoTopupOrder();
        order.setOrderId("HLM-order");
        order.setRequestId("request-12");
        order.setCustomer(customer);
        order.setPackageName("Gói Tiêu Chuẩn");
        order.setAmountVnd(200000);
        order.setPotatoAmount(220);
        order.setStatus(MomoTopupOrder.Status.PENDING);

        when(momoGatewayClient.verifyIpn(anyMap())).thenReturn(true);
        when(orderRepository.findByOrderIdForUpdate("HLM-order")).thenReturn(Optional.of(order));
    }

    @Test
    void creditsOnlyOnceWhenMomoRetriesSuccessfulIpn() {
        Map<String, Object> payload = successfulIpn(200000L);

        paymentService.processIpn(payload);
        paymentService.processIpn(payload);

        verify(potatoService, times(1)).creditVerifiedTopup(
                12,
                220,
                "Nạp Gói Tiêu Chuẩn thành công qua MoMo (transaction-12)"
        );
        assertEquals(MomoTopupOrder.Status.PAID, order.getStatus());
    }

    @Test
    void doesNotCreditWhenIpnAmountDoesNotMatchOrder() {
        assertThrows(ResponseStatusException.class, () -> paymentService.processIpn(successfulIpn(1L)));
        verifyNoInteractions(potatoService);
    }

    private static Map<String, Object> successfulIpn(long amount) {
        return Map.of(
                "orderId", "HLM-order",
                "requestId", "request-12",
                "amount", amount,
                "resultCode", 0,
                "transId", "transaction-12"
        );
    }
}
