package com.example.demochatbot.controller;

import com.example.demochatbot.dto.BannerDto;
import com.example.demochatbot.service.banner.BannerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * ============================================================================
 * Controller: BannerController
 * Cung cấp API quản lý Banner quảng cáo và Thiết lập chung website (Site Settings)
 * Phục vụ cả phía hiển thị Trang chủ (User) và Giao diện Quản trị (Admin)
 * ============================================================================
 */
@Slf4j
@RestController
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class BannerController {

    private final BannerService bannerService;

    // =========================================================================
    // PUBLIC APIS (TRANG CHỦ / USER)
    // =========================================================================

    @GetMapping("/api/home/banners")
    public ResponseEntity<?> getActiveBanners(@RequestParam(defaultValue = "WEB") String platform) {
        try {
            List<BannerDto> banners = bannerService.getActiveBanners(platform);
            return ResponseEntity.ok(banners);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Lỗi khi lấy danh sách banner kích hoạt: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi nạp banner: " + e.getMessage()));
        }
    }

    @GetMapping("/api/home/site-settings")
    public ResponseEntity<?> getPublicSiteSettings() {
        try {
            Map<String, String> settings = bannerService.getSiteSettings();
            return ResponseEntity.ok(settings);
        } catch (Exception e) {
            log.error("Lỗi khi lấy thông tin thiết lập website: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi nạp thiết lập website: " + e.getMessage()));
        }
    }

    // =========================================================================
    // ADMIN APIS (QUẢN TRỊ VIÊN)
    // =========================================================================

    @GetMapping("/api/admin/banners")
    public ResponseEntity<?> getAllBanners(@RequestParam(defaultValue = "WEB") String platform) {
        try {
            List<BannerDto> list = bannerService.getAllBanners(platform);
            return ResponseEntity.ok(list);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Lỗi khi admin lấy toàn bộ banner: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tải banner quản trị: " + e.getMessage()));
        }
    }

    @GetMapping("/api/admin/banners/{id}")
    public ResponseEntity<?> getBannerById(@PathVariable String id, @RequestParam(defaultValue = "WEB") String platform) {
        try {
            BannerDto banner = bannerService.getBannerById(id, platform);
            return ResponseEntity.ok(banner);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/api/admin/banners")
    public ResponseEntity<?> createBanner(@RequestBody BannerDto bannerDto) {
        try {
            BannerDto created = bannerService.createBanner(bannerDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Lỗi khi tạo banner mới: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Không thể tạo banner: " + e.getMessage()));
        }
    }

    @PutMapping("/api/admin/banners/{id}")
    public ResponseEntity<?> updateBanner(@PathVariable String id, @RequestBody BannerDto bannerDto, @RequestParam(defaultValue = "WEB") String platform) {
        try {
            BannerDto updated = bannerService.updateBanner(id, bannerDto, platform);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Lỗi khi cập nhật banner {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Không thể cập nhật banner: " + e.getMessage()));
        }
    }

    @PatchMapping("/api/admin/banners/{id}/toggle")
    public ResponseEntity<?> toggleBannerStatus(@PathVariable String id, @RequestParam(defaultValue = "WEB") String platform) {
        try {
            bannerService.toggleBannerStatus(id, platform);
            return ResponseEntity.ok(Map.of("message", "Thay đổi trạng thái banner thành công!"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/api/admin/banners/{id}/toggle")
    public ResponseEntity<?> toggleBannerStatusPut(@PathVariable String id, @RequestParam(defaultValue = "WEB") String platform) {
        return toggleBannerStatus(id, platform);
    }

    @DeleteMapping("/api/admin/banners/{id}")
    public ResponseEntity<?> deleteBanner(@PathVariable String id, @RequestParam(defaultValue = "WEB") String platform) {
        try {
            bannerService.deleteBanner(id, platform);
            return ResponseEntity.ok(Map.of("message", "Đã xóa banner thành công!"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/api/admin/banners/reorder")
    public ResponseEntity<?> saveAllBanners(@RequestBody List<BannerDto> bannerDtos, @RequestParam(defaultValue = "WEB") String platform) {
        try {
            List<BannerDto> saved = bannerService.saveAllBanners(bannerDtos, platform);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("Lỗi khi cập nhật danh sách thứ tự banner: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Lỗi sắp xếp banner: " + e.getMessage()));
        }
    }

    @PostMapping("/api/admin/banners/reset")
    public ResponseEntity<?> resetDefaultBanners(@RequestParam(defaultValue = "WEB") String platform) {
        try {
            List<BannerDto> defaults = bannerService.resetDefaultBanners(platform);
            return ResponseEntity.ok(defaults);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Lỗi khi khôi phục banner mặc định: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Không thể khôi phục banner mặc định: " + e.getMessage()));
        }
    }

    @GetMapping("/api/admin/site-settings")
    public ResponseEntity<?> getAdminSiteSettings() {
        try {
            return ResponseEntity.ok(bannerService.getSiteSettings());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/api/admin/site-settings")
    public ResponseEntity<?> saveAdminSiteSettings(@RequestBody Map<String, String> settings) {
        try {
            Map<String, String> saved = bannerService.saveSiteSettings(settings);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("Lỗi khi lưu thiết lập website: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Không thể lưu thiết lập website: " + e.getMessage()));
        }
    }
}
