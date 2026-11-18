package com.example.demochatbot.service.order;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public final class CheckoutPricing {
    private CheckoutPricing() {}

    /** Largest-remainder allocation: integer refunds always add up to exactly the net payment. */
    public static int[] allocateNetPayment(List<Double> prices, int paid) {
        if (paid < 0 || prices.stream().anyMatch(p -> p == null || !Double.isFinite(p) || p < 0)) {
            throw new IllegalArgumentException("Giá thanh toán không hợp lệ.");
        }
        int[] result = new int[prices.size()];
        double subtotal = prices.stream().mapToDouble(Double::doubleValue).sum();
        if (paid == 0) return result;
        if (subtotal <= 0 || prices.isEmpty()) throw new IllegalArgumentException("Không thể phân bổ thanh toán.");
        List<Integer> indices = new ArrayList<>();
        double[] remainder = new double[prices.size()];
        int allocated = 0;
        for (int i = 0; i < prices.size(); i++) {
            double share = prices.get(i) / subtotal * paid;
            result[i] = (int) Math.floor(share);
            remainder[i] = share - result[i];
            allocated += result[i];
            indices.add(i);
        }
        indices.sort(Comparator.<Integer>comparingDouble(i -> remainder[i]).reversed().thenComparingInt(i -> i));
        for (int i = 0; i < paid - allocated; i++) result[indices.get(i % indices.size())]++;
        return result;
    }
}
