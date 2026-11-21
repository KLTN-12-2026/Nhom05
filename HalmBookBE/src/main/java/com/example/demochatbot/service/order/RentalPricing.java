package com.example.demochatbot.service.order;

import com.example.demochatbot.model.Book;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/** Authoritative tariff shared by cart quotes and checkout. */
public final class RentalPricing {
    private RentalPricing() {}

    public static int duration(String plan) {
        if (plan == null) throw new IllegalArgumentException("Thiếu gói thuê.");
        return switch (plan.trim().toLowerCase(java.util.Locale.ROOT)) {
            case "1" -> 1; case "3" -> 3; case "7" -> 7; case "14" -> 14;
            case "15" -> 15; case "30" -> 30; case "90" -> 90; case "forever" -> 36500;
            default -> throw new IllegalArgumentException("Gói thuê không hợp lệ: " + plan);
        };
    }

    public static double price(String plan, Book book) {
        if (plan == null) throw new IllegalArgumentException("Thiếu gói thuê.");
        return switch (plan.trim().toLowerCase(java.util.Locale.ROOT)) {
            case "1" -> 2;
            case "3" -> 5;
            case "7" -> 9;
            case "14" -> 15;
            case "15" -> 18;
            case "30" -> 25;
            case "90" -> 50;
            case "forever" -> book != null && book.getRent_price() != null && book.getRent_price() > 0 ? book.getRent_price() : 39;
            default -> throw new IllegalArgumentException("Gói thuê không hợp lệ: " + plan);
        };
    }

    public static String digest(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException(ex);
        }
    }
}
