package com.example.demochatbot.order;

import com.example.demochatbot.service.order.CheckoutPricing;
import org.junit.jupiter.api.Test;
import java.util.Arrays;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class CheckoutPricingTests {
    @Test void discountedItemsRefundExactlyWhatWasPaid() {
        int[] allocated = CheckoutPricing.allocateNetPayment(List.of(5.0, 5.0), 5);
        assertEquals(5, Arrays.stream(allocated).sum());
        assertArrayEquals(new int[]{3, 2}, allocated);
    }
    @Test void fullyDiscountedItemsCannotCreateRefundMoney() {
        assertArrayEquals(new int[]{0, 0}, CheckoutPricing.allocateNetPayment(List.of(2.0, 9.0), 0));
    }
    @Test void fractionalSharesConservePaymentAcrossManyItems() {
        for (int paid = 0; paid < 1000; paid++) {
            int[] allocated = CheckoutPricing.allocateNetPayment(List.of(2.0, 5.0, 9.0, 25.0), paid);
            assertEquals(paid, Arrays.stream(allocated).sum());
            assertTrue(Arrays.stream(allocated).allMatch(value -> value >= 0));
        }
    }
    @Test void invalidPricesAreRejected() {
        assertThrows(IllegalArgumentException.class, () -> CheckoutPricing.allocateNetPayment(List.of(-1.0), 5));
        assertThrows(IllegalArgumentException.class, () -> CheckoutPricing.allocateNetPayment(List.of(Double.NaN), 5));
        assertThrows(IllegalArgumentException.class, () -> CheckoutPricing.allocateNetPayment(List.of(), 5));
    }
}
