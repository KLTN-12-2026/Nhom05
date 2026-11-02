package com.example.demochatbot.controller;

import com.example.demochatbot.dto.TopupRequest;
import com.example.demochatbot.dto.TransferRequest;
import com.example.demochatbot.dto.WalletResponseDto;
import com.example.demochatbot.model.PotatoPackage;
import com.example.demochatbot.model.PotatoTransaction;
import com.example.demochatbot.service.customer.CustomerService;
import com.example.demochatbot.service.potato.PotatoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * ============================================================================
 * Controller: PotatoController
 * Đường dẫn gốc: /api/home/potato
 * Mô tả: Cung cấp toàn bộ API cho chức năng Ví Khoai Tây:
 *        1. GET  /api/home/potato/wallet       - Lấy số dư Khoai thực tế và thống kê ví
 *        2. GET  /api/home/potato/packages     - Lấy danh sách các gói nạp Khoai đang khả dụng
 *        3. GET  /api/home/potato/transactions - Lấy lịch sử biến động số dư Khoai
 *        4. POST /api/home/potato/topup        - Nạp Khoai siêu tốc qua VietQR 24/7
 *        5. POST /api/home/potato/transfer     - Chuyển/tặng Khoai cho bạn bè
 * ============================================================================
 */
@RestController
@RequestMapping("/api/home/potato")
@CrossOrigin(origins = "*")
public class PotatoController {

    @Autowired
    private PotatoService potatoService;

    @Autowired
    private CustomerService customerService;

    /**
     * API 1: Lấy số dư Khoai thực tế và thông tin Ví Khoai Tây của người dùng đăng nhập
     */
    @GetMapping("/wallet")
    public ResponseEntity<?> getWalletInfo() {
        try {
            int accountId = customerService.getCurrentAccountId();
            if (accountId <= 0) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorMap("Vui lòng đăng nhập để xem thông tin Ví Khoai Tây!"));
            }

            WalletResponseDto wallet = potatoService.getWalletInfo(accountId);
            return ResponseEntity.ok(wallet);
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().toLowerCase().contains("dang nhap")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorMap("Vui lòng đăng nhập để xem thông tin Ví Khoai Tây!"));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorMap("Không thể lấy thông tin ví: " + e.getMessage()));
        }
    }

    /**
     * API 2: Lấy danh sách các gói nạp Khoai Tây
     */
    @GetMapping("/packages")
    public ResponseEntity<?> getPackages() {
        try {
            List<PotatoPackage> packages = potatoService.getActivePackages();
            return ResponseEntity.ok(packages);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorMap("Lỗi khi tải danh sách gói nạp: " + e.getMessage()));
        }
    }

    /**
     * API 3: Lấy lịch sử giao dịch biến động số dư Khoai
     */
    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactionHistory() {
        try {
            int accountId = customerService.getCurrentAccountId();
            if (accountId <= 0) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorMap("Vui lòng đăng nhập để xem lịch sử giao dịch!"));
            }

            List<PotatoTransaction> history = potatoService.getTransactionHistory(accountId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().toLowerCase().contains("dang nhap")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorMap("Vui lòng đăng nhập để xem lịch sử giao dịch!"));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorMap("Lỗi khi lấy lịch sử giao dịch: " + e.getMessage()));
        }
    }

    /**
     * API 4: Nạp Khoai siêu tốc (VietQR 24/7)
     */
    @PostMapping("/topup")
    public ResponseEntity<?> topupPotato(@RequestBody TopupRequest request) {
        try {
            int accountId = customerService.getCurrentAccountId();
            if (accountId <= 0) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorMap("Vui lòng đăng nhập để thực hiện nạp Khoai!"));
            }

            PotatoTransaction transaction = potatoService.topupPotato(accountId, request);
            WalletResponseDto updatedWallet = potatoService.getWalletInfo(accountId);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Nạp Khoai thành công!");
            response.put("transaction", transaction);
            response.put("wallet", updatedWallet);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorMap("Lỗi nạp Khoai: " + e.getMessage()));
        }
    }

    /**
     * API 5: Chuyển tặng Khoai cho độc giả khác
     */
    @PostMapping("/transfer")
    public ResponseEntity<?> transferPotato(@RequestBody TransferRequest request) {
        try {
            int accountId = customerService.getCurrentAccountId();
            if (accountId <= 0) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorMap("Vui lòng đăng nhập để thực hiện tặng Khoai!"));
            }

            PotatoTransaction transaction = potatoService.transferPotato(accountId, request);
            WalletResponseDto updatedWallet = potatoService.getWalletInfo(accountId);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Tặng Khoai thành công!");
            response.put("transaction", transaction);
            response.put("wallet", updatedWallet);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorMap("Lỗi tặng Khoai: " + e.getMessage()));
        }
    }

    private Map<String, String> createErrorMap(String message) {
        Map<String, String> err = new HashMap<>();
        err.put("error", message);
        return err;
    }
}
