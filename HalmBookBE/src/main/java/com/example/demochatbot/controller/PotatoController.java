package com.example.demochatbot.controller;

import com.example.demochatbot.dto.TopupRequest;
import com.example.demochatbot.dto.TransferRequest;
import com.example.demochatbot.dto.WalletResponseDto;
import com.example.demochatbot.model.PotatoPackage;
import com.example.demochatbot.model.PotatoTransaction;
import com.example.demochatbot.repository.PotatoPackageRepository;
import com.example.demochatbot.service.customer.CustomerService;
import com.example.demochatbot.service.potato.PotatoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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

    @Autowired
    private PotatoPackageRepository potatoPackageRepository;

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
     * API 2: Lấy danh sách các gói nạp Khoai Tây đang hoạt động (Dành cho User)
     */
    @GetMapping("/packages")
    public ResponseEntity<?> getPackages() {
        try {
            List<PotatoPackage> packages = potatoPackageRepository.findByIsActiveTrueOrderByPriceVndAsc();
            return ResponseEntity.ok(packages);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorMap("Lỗi khi tải danh sách gói nạp: " + e.getMessage()));
        }
    }

    /**
     * API 2.0: Lấy toàn bộ danh sách gói nạp từ CSDL (Dành cho Admin - bao gồm cả gói ẩn)
     */
    @GetMapping({"/packages/all", "/packages/admin"})
    public ResponseEntity<?> getAllPackagesForAdmin() {
        try {
            List<PotatoPackage> packages = potatoPackageRepository.findAll();
            return ResponseEntity.ok(packages);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorMap("Lỗi khi tải toàn bộ gói nạp: " + e.getMessage()));
        }
    }

    /**
     * API 2.1: Thêm gói nạp Khoai Tây mới (Dành cho Admin)
     */
    @PostMapping("/packages")
    public ResponseEntity<?> createPackage(@RequestBody Map<String, Object> body) {
        try {
            PotatoPackage p = new PotatoPackage();
            p.setPackageName((String) body.getOrDefault("packageName", body.getOrDefault("package_name", "Gói Nạp Khoai")));
            
            Object potObj = body.getOrDefault("potatoAmount", body.get("potato_amount"));
            p.setPotatoAmount(potObj instanceof Number ? ((Number) potObj).intValue() : Integer.parseInt(potObj != null ? potObj.toString() : "50"));
            
            Object bonusObj = body.getOrDefault("bonusPotato", body.get("bonus_potato"));
            p.setBonusPotato(bonusObj instanceof Number ? ((Number) bonusObj).intValue() : (bonusObj != null ? Integer.parseInt(bonusObj.toString()) : 0));
            
            Object priceObj = body.getOrDefault("priceVnd", body.get("price_vnd"));
            p.setPriceVnd(priceObj instanceof Number ? ((Number) priceObj).doubleValue() : (priceObj != null ? Double.parseDouble(priceObj.toString()) : 50000.0));
            
            p.setBadgeTag((String) body.getOrDefault("badgeTag", body.getOrDefault("badge_tag", "")));
            p.setDescription((String) body.getOrDefault("description", ""));
            
            Object activeObj = body.getOrDefault("isActive", body.get("is_active"));
            p.setIsActive(activeObj instanceof Boolean ? (Boolean) activeObj : true);
            p.setCreatedAt(java.time.LocalDateTime.now());

            PotatoPackage saved = potatoPackageRepository.save(p);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorMap("Lỗi tạo gói nạp: " + e.getMessage()));
        }
    }

    /**
     * API 2.2: Cập nhật thông tin / giá gói nạp Khoai Tây (Dành cho Admin)
     */
    @PutMapping("/packages/{id}")
    public ResponseEntity<?> updatePackage(@PathVariable int id, @RequestBody Map<String, Object> body) {
        try {
            Optional<PotatoPackage> opt = potatoPackageRepository.findById(id);
            if (opt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorMap("Không tìm thấy gói nạp ID: " + id));
            }
            PotatoPackage p = opt.get();
            if (body.containsKey("packageName")) p.setPackageName((String) body.get("packageName"));
            else if (body.containsKey("package_name")) p.setPackageName((String) body.get("package_name"));

            if (body.containsKey("potatoAmount") || body.containsKey("potato_amount")) {
                Object v = body.getOrDefault("potatoAmount", body.get("potato_amount"));
                p.setPotatoAmount(v instanceof Number ? ((Number) v).intValue() : Integer.parseInt(v.toString()));
            }
            if (body.containsKey("bonusPotato") || body.containsKey("bonus_potato")) {
                Object v = body.getOrDefault("bonusPotato", body.get("bonus_potato"));
                p.setBonusPotato(v instanceof Number ? ((Number) v).intValue() : Integer.parseInt(v.toString()));
            }
            if (body.containsKey("priceVnd") || body.containsKey("price_vnd")) {
                Object v = body.getOrDefault("priceVnd", body.get("price_vnd"));
                p.setPriceVnd(v instanceof Number ? ((Number) v).doubleValue() : Double.parseDouble(v.toString()));
            }
            if (body.containsKey("badgeTag")) p.setBadgeTag((String) body.get("badgeTag"));
            else if (body.containsKey("badge_tag")) p.setBadgeTag((String) body.get("badge_tag"));

            if (body.containsKey("description")) p.setDescription((String) body.get("description"));

            if (body.containsKey("isActive")) p.setIsActive((Boolean) body.get("isActive"));
            else if (body.containsKey("is_active")) p.setIsActive((Boolean) body.get("is_active"));

            PotatoPackage updated = potatoPackageRepository.save(p);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorMap("Lỗi cập nhật gói nạp: " + e.getMessage()));
        }
    }

    /**
     * API 2.3: Xóa gói nạp Khoai Tây (Dành cho Admin)
     */
    @DeleteMapping("/packages/{id}")
    public ResponseEntity<?> deletePackage(@PathVariable int id) {
        try {
            if (!potatoPackageRepository.existsById(id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorMap("Không tìm thấy gói nạp ID: " + id));
            }
            potatoPackageRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Đã xóa gói nạp " + id + " thành công!", "id", id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorMap("Lỗi xóa gói nạp: " + e.getMessage()));
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
