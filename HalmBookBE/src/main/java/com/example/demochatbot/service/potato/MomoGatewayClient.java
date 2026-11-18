package com.example.demochatbot.service.potato;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class MomoGatewayClient {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${momo.partner-code:}")
    private String partnerCode;

    @Value("${momo.access-key:}")
    private String accessKey;

    @Value("${momo.secret-key:}")
    private String secretKey;

    @Value("${momo.create-url:https://test-payment.momo.vn/v2/gateway/api/create}")
    private String createUrl;

    @Value("${momo.redirect-url:}")
    private String redirectUrl;

    @Value("${momo.ipn-url:}")
    private String ipnUrl;

    public MomoGatewayClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public boolean isConfigured() {
        return hasText(partnerCode)
                && hasText(accessKey)
                && hasText(secretKey)
                && isAbsoluteUrl(redirectUrl)
                && isHttpsUrl(createUrl)
                && isHttpsUrl(ipnUrl);
    }

    public MomoCreateResult createPayment(
            String orderId,
            String requestId,
            long amount,
            String orderInfo
    ) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("partnerCode", partnerCode);
        payload.put("requestId", requestId);
        payload.put("amount", amount);
        payload.put("orderId", orderId);
        payload.put("orderInfo", orderInfo);
        payload.put("redirectUrl", redirectUrl);
        payload.put("ipnUrl", ipnUrl);
        payload.put("requestType", "captureWallet");
        payload.put("extraData", "");
        payload.put("lang", "vi");

        String rawSignature = "accessKey=" + accessKey
                + "&amount=" + amount
                + "&extraData="
                + "&ipnUrl=" + ipnUrl
                + "&orderId=" + orderId
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + partnerCode
                + "&redirectUrl=" + redirectUrl
                + "&requestId=" + requestId
                + "&requestType=captureWallet";
        payload.put("signature", MomoSignature.sign(secretKey, rawSignature));

        try {
            String requestBody = objectMapper.writeValueAsString(payload);
            HttpRequest request = HttpRequest.newBuilder(URI.create(createUrl))
                    .timeout(Duration.ofSeconds(20))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
            );
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new MomoPaymentException("Cổng MoMo không thể tạo phiên thanh toán.");
            }

            JsonNode result = objectMapper.readTree(response.body());
            if (result.path("resultCode").asInt(-1) != 0) {
                throw new MomoPaymentException("MoMo từ chối yêu cầu thanh toán: "
                        + result.path("message").asText("Không rõ nguyên nhân."));
            }
            String payUrl = result.path("payUrl").asText();
            if (!isMomoPaymentUrl(payUrl)) {
                throw new MomoPaymentException("MoMo trả về đường dẫn thanh toán không hợp lệ.");
            }
            if (!orderId.equals(result.path("orderId").asText())
                    || !requestId.equals(result.path("requestId").asText())
                    || result.path("amount").asLong(-1) != amount) {
                throw new MomoPaymentException("Phản hồi MoMo không khớp với giao dịch đã tạo.");
            }

            return new MomoCreateResult(
                    payUrl,
                    result.path("deeplink").asText(""),
                    redirectUrl
            );
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new MomoPaymentException("Yêu cầu đến MoMo bị gián đoạn.", exception);
        } catch (IOException | IllegalArgumentException exception) {
            throw new MomoPaymentException("Không thể kết nối hoặc đọc phản hồi từ MoMo.", exception);
        }
    }

    public boolean verifyIpn(Map<String, Object> payload) {
        if (!isConfigured()
                || !partnerCode.equals(text(payload.get("partnerCode")))) {
            return false;
        }

        String rawSignature = "accessKey=" + accessKey
                + "&amount=" + text(payload.get("amount"))
                + "&extraData=" + text(payload.get("extraData"))
                + "&message=" + text(payload.get("message"))
                + "&orderId=" + text(payload.get("orderId"))
                + "&orderInfo=" + text(payload.get("orderInfo"))
                + "&orderType=" + text(payload.get("orderType"))
                + "&partnerCode=" + text(payload.get("partnerCode"))
                + "&payType=" + text(payload.get("payType"))
                + "&requestId=" + text(payload.get("requestId"))
                + "&responseTime=" + text(payload.get("responseTime"))
                + "&resultCode=" + text(payload.get("resultCode"))
                + "&transId=" + text(payload.get("transId"));
        return MomoSignature.matches(secretKey, rawSignature, text(payload.get("signature")));
    }

    private static String text(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static boolean isAbsoluteUrl(String value) {
        if (!hasText(value)) {
            return false;
        }
        try {
            return URI.create(value).isAbsolute();
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private static boolean isHttpsUrl(String value) {
        if (!hasText(value)) {
            return false;
        }
        try {
            URI uri = URI.create(value);
            return "https".equalsIgnoreCase(uri.getScheme())
                    && hasText(uri.getHost())
                    && uri.getUserInfo() == null;
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private static boolean isMomoPaymentUrl(String value) {
        if (!isHttpsUrl(value)) {
            return false;
        }
        String host = URI.create(value).getHost();
        return "payment.momo.vn".equalsIgnoreCase(host)
                || "test-payment.momo.vn".equalsIgnoreCase(host);
    }

    public record MomoCreateResult(String payUrl, String deeplink, String redirectUrl) {
    }
}
