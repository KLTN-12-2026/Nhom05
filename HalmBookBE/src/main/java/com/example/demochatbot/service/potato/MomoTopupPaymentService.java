package com.example.demochatbot.service.potato;

import com.example.demochatbot.dto.MomoTopupResponse;
import com.example.demochatbot.dto.MomoTopupStatusResponse;
import com.example.demochatbot.model.Customer;
import com.example.demochatbot.model.MomoTopupOrder;
import com.example.demochatbot.model.PotatoPackage;
import com.example.demochatbot.repository.CustomerRepository;
import com.example.demochatbot.repository.MomoTopupOrderRepository;
import com.example.demochatbot.repository.PotatoPackageRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
public class MomoTopupPaymentService {

    private final MomoGatewayClient momoGatewayClient;
    private final MomoTopupOrderRepository orderRepository;
    private final PotatoPackageRepository packageRepository;
    private final CustomerRepository customerRepository;
    private final PotatoService potatoService;

    public MomoTopupPaymentService(
            MomoGatewayClient momoGatewayClient,
            MomoTopupOrderRepository orderRepository,
            PotatoPackageRepository packageRepository,
            CustomerRepository customerRepository,
            PotatoService potatoService
    ) {
        this.momoGatewayClient = momoGatewayClient;
        this.orderRepository = orderRepository;
        this.packageRepository = packageRepository;
        this.customerRepository = customerRepository;
        this.potatoService = potatoService;
    }

    public MomoTopupResponse createPayment(int accountId, int packageId) {
        if (!momoGatewayClient.isConfigured()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Thanh toán MoMo chưa được cấu hình trên máy chủ."
            );
        }

        Customer customer = customerRepository.findCustomerById(accountId);
        if (customer == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản khách hàng.");
        }

        PotatoPackage potatoPackage = packageRepository.findById(packageId)
                .filter(item -> Boolean.TRUE.equals(item.getIsActive()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Gói Khoai không tồn tại hoặc đã ngừng hoạt động."
                ));

        if (potatoPackage.getPriceVnd() == null || potatoPackage.getPotatoAmount() == null) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT, "Thông tin gói Khoai không hợp lệ.");
        }

        long amountVnd;
        int potatoAmount;
        try {
            amountVnd = BigDecimal.valueOf(potatoPackage.getPriceVnd()).longValueExact();
            potatoAmount = Math.addExact(
                    potatoPackage.getPotatoAmount(),
                    potatoPackage.getBonusPotato() == null ? 0 : potatoPackage.getBonusPotato()
            );
        } catch (ArithmeticException exception) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT, "Thông tin gói Khoai không hợp lệ.");
        }
        if (amountVnd <= 0 || potatoAmount <= 0) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT, "Thông tin gói Khoai không hợp lệ.");
        }
        if (potatoPackage.getBonusPotato() != null && potatoPackage.getBonusPotato() < 0) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_CONTENT, "Thông tin gói Khoai không hợp lệ.");
        }

        String orderId = "HLM" + UUID.randomUUID().toString().replace("-", "");
        String requestId = UUID.randomUUID().toString().replace("-", "");
        MomoTopupOrder order = new MomoTopupOrder();
        order.setOrderId(orderId);
        order.setRequestId(requestId);
        order.setCustomer(customer);
        order.setPackageId(packageId);
        order.setPackageName(potatoPackage.getPackageName());
        order.setAmountVnd(amountVnd);
        order.setPotatoAmount(potatoAmount);
        order.setStatus(MomoTopupOrder.Status.PENDING);
        order.setCreatedAt(LocalDateTime.now());
        order = orderRepository.save(order);

        String orderInfo = "Nap Khoai " + potatoPackage.getPackageName() + " " + orderId;
        MomoGatewayClient.MomoCreateResult payment;
        try {
            payment = momoGatewayClient.createPayment(orderId, requestId, amountVnd, orderInfo);
        } catch (MomoPaymentException exception) {
            order.setStatus(MomoTopupOrder.Status.FAILED);
            orderRepository.save(order);
            throw exception;
        }

        return new MomoTopupResponse(
                orderId,
                order.getStatus().name(),
                order.getPackageName(),
                order.getAmountVnd(),
                order.getPotatoAmount(),
                payment.payUrl(),
                payment.deeplink(),
                payment.redirectUrl()
        );
    }

    public MomoTopupStatusResponse getStatus(int accountId, String orderId) {
        Customer customer = customerRepository.findCustomerById(accountId);
        if (customer == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản khách hàng.");
        }
        MomoTopupOrder order = orderRepository.findByOrderIdAndCustomer(orderId, customer)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy giao dịch nạp."));
        return toStatusResponse(order);
    }

    @org.springframework.transaction.annotation.Transactional
    public void processIpn(Map<String, Object> payload) {
        if (!momoGatewayClient.verifyIpn(payload)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Chữ ký thông báo MoMo không hợp lệ.");
        }

        String orderId = text(payload.get("orderId"));
        String requestId = text(payload.get("requestId"));
        String transId = text(payload.get("transId"));
        long amount = parseLong(payload.get("amount"), "Số tiền thanh toán không hợp lệ.");
        long resultCode = parseLong(payload.get("resultCode"), "Mã kết quả MoMo không hợp lệ.");

        MomoTopupOrder order = orderRepository.findByOrderIdForUpdate(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy giao dịch nạp."));
        if (!order.getRequestId().equals(requestId) || order.getAmountVnd() != amount) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thông tin giao dịch MoMo không khớp.");
        }
        if (order.getStatus() == MomoTopupOrder.Status.PAID) {
            return;
        }

        if (resultCode != 0L) {
            order.setStatus(MomoTopupOrder.Status.FAILED);
            orderRepository.save(order);
            return;
        }
        if (transId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu mã giao dịch MoMo.");
        }

        int accountId = order.getCustomer().getAccount().getAccount_id();
        potatoService.creditVerifiedTopup(
                accountId,
                order.getPotatoAmount(),
                "Nạp " + order.getPackageName() + " thành công qua MoMo (" + transId + ")"
        );
        order.setStatus(MomoTopupOrder.Status.PAID);
        order.setGatewayTransactionId(transId);
        order.setPaidAt(LocalDateTime.now());
        orderRepository.save(order);
    }

    private static MomoTopupStatusResponse toStatusResponse(MomoTopupOrder order) {
        return new MomoTopupStatusResponse(
                order.getOrderId(),
                order.getStatus().name(),
                order.getPackageName(),
                order.getAmountVnd(),
                order.getPotatoAmount(),
                order.getGatewayTransactionId()
        );
    }

    private static long parseLong(Object value, String errorMessage) {
        try {
            return Long.parseLong(text(value));
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
        }
    }

    private static String text(Object value) {
        return value == null ? "" : String.valueOf(value);
    }
}
