package com.example.demochatbot.service.potato;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.GeneralSecurityException;
import java.util.HexFormat;
import java.util.Locale;

public final class MomoSignature {
    private MomoSignature() {
    }

    public static String sign(String secretKey, String rawData) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(rawData.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException exception) {
            throw new MomoPaymentException("Không thể tạo chữ ký thanh toán MoMo.", exception);
        }
    }

    public static boolean matches(String secretKey, String rawData, String providedSignature) {
        if (providedSignature == null || providedSignature.isBlank()) {
            return false;
        }

        byte[] expected = sign(secretKey, rawData).getBytes(StandardCharsets.US_ASCII);
        byte[] provided = providedSignature.trim().toLowerCase(Locale.ROOT)
                .getBytes(StandardCharsets.US_ASCII);
        return MessageDigest.isEqual(expected, provided);
    }
}
