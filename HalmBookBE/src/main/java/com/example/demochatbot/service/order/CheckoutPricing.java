package com.example.demochatbot.service.order;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public final class CheckoutPricing {
    private CheckoutPricing() {}

    /** Refund only a persisted, paid wallet receipt, including discounted legacy receipts. */
    public static int refundableAmount(com.example.demochatbot.model.Order_Item item) {
        if (item == null || item.getOrders() == null || item.getPrice() == null) return 0;
        var order = item.getOrders();
        if (!"POTATO".equalsIgnoreCase(order.getPaymentCurrency())
                || !("PAID".equalsIgnoreCase(order.getPayment_status()) || "SUCCESS".equalsIgnoreCase(order.getPayment_status()))) return 0;
        if (!Double.isFinite(order.getTotal_amount()) || order.getTotal_amount() < 0 || order.getTotal_amount() > Integer.MAX_VALUE) return 0;
        int paid = (int) Math.round(order.getTotal_amount());
        if (order.getCheckoutSubtotal() != null) return Math.min(paid, Math.max(0, (int) Math.round(item.getPrice())));
        var items = order.getOrder_items();
        if (items == null || items.isEmpty()) return 0;
        var sorted = items.stream().sorted(Comparator.comparingInt(com.example.demochatbot.model.Order_Item::getOrder_item_id)).toList();
        int[] allocation = allocateNetPayment(sorted.stream().map(com.example.demochatbot.model.Order_Item::getPrice).toList(), paid);
        for (int i = 0; i < sorted.size(); i++) if (sorted.get(i).getOrder_item_id() == item.getOrder_item_id()) return allocation[i];
        return 0;
    }

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
