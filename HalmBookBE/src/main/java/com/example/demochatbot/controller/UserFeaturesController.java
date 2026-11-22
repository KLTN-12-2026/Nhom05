package com.example.demochatbot.controller;

import com.example.demochatbot.dto.BookGiftDto;
import com.example.demochatbot.dto.CloudinaryResultDto;
import com.example.demochatbot.dto.CustomerMusicDto;
import com.example.demochatbot.dto.CustomerVoucherDto;
import com.example.demochatbot.dto.MissionClaimRequest;
import com.example.demochatbot.dto.ReadingProgressRequest;
import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import com.example.demochatbot.service.customer.CustomerService;
import com.example.demochatbot.service.data.CloudinaryService;
import com.example.demochatbot.service.order.OrderService;
import com.example.demochatbot.service.tier.TierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "https://localhost:5173"}, allowedHeaders = "*")
@RequestMapping("/api/home")
@RequiredArgsConstructor
public class UserFeaturesController {

    private final CustomerService customerService;
    private final OrderService orderService;
    private final CloudinaryService cloudinaryService;
    private final CustomerRepository customerRepository;
    private final AccessRecordRepository accessRecordRepository;
    private final UserMissionClaimRepository userMissionClaimRepository;
    private final NotificationRepository notificationRepository;
    private final FavoriteBookRepository favoriteBookRepository;
    private final PotatoTransactionRepository potatoTransactionRepository;
    private final BookRepository bookRepository;
    private final TierService tierService;
    private final CustomerMusicRepository customerMusicRepository;
    private final CustomerVoucherRepository customerVoucherRepository;
    private final BookGiftRepository bookGiftRepository;
    private final PromotionRepository promotionRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private com.example.demochatbot.service.mission.MissionService missions;

    // Helper: Lấy customer đăng nhập hiện tại
    private Customer getAuthenticatedCustomer() {
        try {
            int accountId = customerService.getCurrentAccountId();
            if (accountId <= 0) return null;
            return customerRepository.findCustomerById(accountId);
        } catch (Exception e) {
            return null;
        }
    }

    // Helper: Kiểm tra quyền quản trị viên (Admin/Manager)
    private boolean isCurrentUserAdmin() {
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            return auth != null && auth.getAuthorities() != null && auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority() != null && (
                            a.getAuthority().toUpperCase().contains("ADMIN") ||
                            a.getAuthority().toUpperCase().contains("MANAGER") ||
                            a.getAuthority().toUpperCase().contains("ROLE_ADMIN")
                    ));
        } catch (Exception e) {
            return false;
        }
    }

    // =========================================================================
    // 1. TIẾN ĐỘ ĐỌC SÁCH (READING PROGRESS & AUTO-RESUME)
    // =========================================================================

    /**
     * API kiểm tra chi tiết quyền đọc và lấy lại trang đọc dở (Auto-Resume)
     */
    @GetMapping("/bookshelf/check-detail/{bookId}")
    public ResponseEntity<?> getBookAccessDetail(@PathVariable("bookId") String bookId) {
        if (isCurrentUserAdmin()) {
            return ResponseEntity.ok().header("Cache-Control", "private, no-store").body(Map.of(
                    "hasAccess", true,
                    "currentPage", 1,
                    "readingPercentage", 0.0,
                    "remainingDays", 9999
            ));
        }

        Customer customer = getAuthenticatedCustomer();
        if (customer == null) {
            return ResponseEntity.ok().header("Cache-Control", "private, no-store").body(Map.of(
                    "hasAccess", false,
                    "currentPage", 1,
                    "readingPercentage", 0.0,
                    "remainingDays", 0
            ));
        }

        Optional<Access_Record> recordOpt = accessRecordRepository.findByCustomerIdAndBookId(customer.getCustomer_id(), bookId);
        if (recordOpt.isEmpty()) {
            return ResponseEntity.ok().header("Cache-Control", "private, no-store").body(Map.of(
                    "hasAccess", false,
                    "currentPage", 1,
                    "readingPercentage", 0.0,
                    "remainingDays", 0
            ));
        }

        Access_Record ar = recordOpt.get();

        boolean isExpired = false;
        long remainingDays = 0;

        if (ar.getEnd_date() != null) {
            LocalDateTime now = LocalDateTime.now();
            if (ar.getEnd_date().isBefore(now)) {
                isExpired = true;
                if ("ACTIVE".equalsIgnoreCase(ar.getStatus())) {
                    ar.setStatus("EXPIRED");
                    accessRecordRepository.save(ar);
                }
            } else {
                remainingDays = Math.max(1, ChronoUnit.DAYS.between(now, ar.getEnd_date()));
            }
        } else {
            // Sách mua vĩnh viễn
            remainingDays = 9999;
        }

        boolean hasAccess = !isExpired && "ACTIVE".equalsIgnoreCase(ar.getStatus());
        double resolvedPct = com.example.demochatbot.service.evaluate.EvaluateServiceImpl.resolveReadingPercentage(ar.getBook(), ar);

        return ResponseEntity.ok().header("Cache-Control", "private, no-store").body(Map.of(
                "hasAccess", hasAccess,
                "currentPage", ar.getCurrentPage() != null && ar.getCurrentPage() > 0 ? ar.getCurrentPage() : 1,
                "readingPercentage", resolvedPct,
                "canEvaluate", resolvedPct >= 50.0,
                "requiredPercentage", 50.0,
                "remainingDays", remainingDays,
                "status", ar.getStatus() != null ? ar.getStatus() : "ACTIVE",
                "lastReadAt", ar.getLastReadAt() != null ? ar.getLastReadAt().toString() : ""
        ));
    }

    /**
     * API lưu tiến độ đọc sách thời gian thực
     */
    @PostMapping("/books/{bookId}/reading-progress")
    @Transactional
    public ResponseEntity<?> updateReadingProgress(
            @PathVariable("bookId") String bookId,
            @RequestBody ReadingProgressRequest request) {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Vui lòng đăng nhập để lưu tiến độ đọc sách!"));
        }

        if (request == null || request.getCurrentPage() == null || request.getCurrentPage() < 1) {
            return ResponseEntity.badRequest().body(Map.of("message", "Dữ liệu trang đọc không hợp lệ!"));
        }

        Optional<Access_Record> recordOpt = accessRecordRepository.findByCustomerIdAndBookId(customer.getCustomer_id(), bookId);
        if (recordOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy quyền đọc của sách này trong tài khoản!"));
        }

        Access_Record ar = recordOpt.get();

        LocalDateTime now = LocalDateTime.now();
        boolean isExpired = ar.getEnd_date() != null && ar.getEnd_date().isBefore(now);
        boolean hasAccess = !isExpired && "ACTIVE".equalsIgnoreCase(ar.getStatus());
        if (!hasAccess) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Quyền đọc sách đã hết hạn hoặc đã bị thu hồi!"));
        }

        ar.setCurrentPage(request.getCurrentPage());

        if (request.getReadingPercentage() != null) {
            ar.setReadingPercentage(Math.min(100.0, Math.max(0.0, request.getReadingPercentage())));
        } else {
            Integer totalPages = request.getTotalPages();
            if ((totalPages == null || totalPages <= 0) && ar.getBook() != null) {
                totalPages = ar.getBook().getTotalPages();
            }
            if (totalPages != null && totalPages > 0) {
                double calcPercent = ((double) request.getCurrentPage() / totalPages) * 100.0;
                ar.setReadingPercentage(Math.min(100.0, Math.max(0.0, Math.round(calcPercent * 10.0) / 10.0)));
            }
        }

        ar.setLastReadAt(LocalDateTime.now());
        accessRecordRepository.save(ar);

        return ResponseEntity.ok(Map.of(
                "message", "Đã cập nhật tiến độ đọc!",
                "currentPage", ar.getCurrentPage(),
                "readingPercentage", ar.getReadingPercentage()
        ));
    }

    // =========================================================================
    // 2. UPLOAD ẢNH ĐẠI DIỆN AVATAR LÊN CLOUDINARY
    // =========================================================================

    @PostMapping(value = "/customer/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<?> uploadCustomerAvatar(@RequestParam("file") MultipartFile file) {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Vui lòng đăng nhập để đổi ảnh đại diện!"));
        }

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng chọn tệp hình ảnh!"));
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Chỉ hỗ trợ tệp định dạng hình ảnh (PNG, JPG, WEBP)!"));
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(Map.of("message", "Dung lượng ảnh tối đa là 5MB!"));
        }

        try {
            CloudinaryResultDto result = cloudinaryService.uploadFile(file, false);
            String secureUrl = result.getSecureUrl();

            customer.setAvatarUrl(secureUrl);
            customer.setAvatar(secureUrl);
            customerRepository.save(customer);

            // Tự động tạo 1 thông báo
            Notification noti = Notification.builder()
                    .customerId(customer.getCustomer_id())
                    .title("Đổi Ảnh Đại Diện Thành Công")
                    .message("Ảnh đại diện hồ sơ cá nhân của bạn đã được cập nhật mới trên toàn hệ thống.")
                    .type("SYSTEM")
                    .link("/canhan")
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(noti);

            return ResponseEntity.ok(Map.of(
                    "message", "Cập nhật ảnh đại diện thành công!",
                    "avatarUrl", secureUrl
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi tải ảnh lên máy chủ Cloudinary: " + e.getMessage()));
        }
    }

    // =========================================================================
    // 3. NHIỆM VỤ ĐỘC GIẢ (MISSIONS) LƯU VÀO DATABASE THẬT
    // =========================================================================

    /**
     * API lấy danh sách các nhiệm vụ đã nhận hôm nay và các milestone đã nhận
     */
    @GetMapping("/missions/claimed")
    public ResponseEntity<?> getClaimedMissions() {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) {
            return ResponseEntity.ok(Map.of(
                    "dailyClaimed", List.of(),
                    "milestoneClaimed", List.of()
            ));
        }

        Map<String, Object> dashboard = missions.dashboard(customer);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) dashboard.get("missions");
        return ResponseEntity.ok().header("Cache-Control", "private, no-store").body(Map.of(
            "dailyClaimed", rows.stream().filter(r -> "DAILY".equals(r.get("period")) && Boolean.TRUE.equals(r.get("claimed"))).map(r -> r.get("id")).toList(),
            "milestoneClaimed", rows.stream().filter(r -> "MILESTONE".equals(r.get("period")) && Boolean.TRUE.equals(r.get("claimed"))).map(r -> r.get("id")).toList(),
            "potatoBalance", dashboard.get("potatoBalance")));
    }

    @PostMapping("/missions/claim")
    public ResponseEntity<?> claimMissionReward(@RequestBody MissionClaimRequest request) {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập!"));
        if (request == null || request.getMissionId() == null || request.getMissionId().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Mã nhiệm vụ không hợp lệ."));
        return ResponseEntity.ok(missions.claim(customer.getCustomer_id(), request.getMissionId().trim()));
    }

    // =========================================================================
    // 4. CHUÔNG THÔNG BÁO (NOTIFICATION CENTER)
    // =========================================================================

    /**
     * API lấy danh sách thông báo và số lượng chưa đọc
     */
    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications() {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) {
            return ResponseEntity.ok().header("Cache-Control", "private, no-store").body(Map.of(
                    "unreadCount", 0,
                    "notifications", List.of()
            ));
        }

        List<Notification> list = notificationRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getCustomer_id());
        long unreadCount = notificationRepository.countByCustomerIdAndIsReadFalse(customer.getCustomer_id());

        return ResponseEntity.ok().header("Cache-Control", "private, no-store").body(Map.of(
                "unreadCount", unreadCount,
                "notifications", list
        ));
    }

    /**
     * Đánh dấu 1 thông báo đã đọc
     */
    @PutMapping("/notifications/{id}/read")
    @Transactional
    public ResponseEntity<?> markNotificationAsRead(@PathVariable("id") Long id) {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập!"));
        }

        Optional<Notification> opt = notificationRepository.findByNotificationIdAndCustomerId(id, customer.getCustomer_id());
        if (opt.isPresent()) {
            Notification noti = opt.get();
            noti.setIsRead(true);
            notificationRepository.save(noti);
            return ResponseEntity.ok(Map.of("message", "Đã đánh dấu thông báo đã đọc!"));
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy thông báo!"));
    }

    /**
     * Đánh dấu toàn bộ thông báo là đã đọc
     */
    @PutMapping("/notifications/read-all")
    @Transactional
    public ResponseEntity<?> markAllNotificationsAsRead() {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập!"));
        }

        List<Notification> unreadList = notificationRepository.findByCustomerIdAndIsReadFalse(customer.getCustomer_id());
        for (Notification noti : unreadList) {
            noti.setIsRead(true);
        }
        notificationRepository.saveAll(unreadList);

        return ResponseEntity.ok(Map.of("message", "Đã đánh dấu tất cả thông báo là đã đọc!"));
    }

    // =========================================================================
    // 5. TỦ SÁCH YÊU THÍCH (WISHLIST)
    // =========================================================================

    /**
     * Lấy danh sách sách yêu thích của người dùng
     */
    @GetMapping("/favorites")
    public ResponseEntity<?> getFavoriteBooks() {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) {
            return ResponseEntity.ok(List.of());
        }

        List<FavoriteBook> favorites = favoriteBookRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getCustomer_id());
        List<Map<String, Object>> result = favorites.stream().map(fav -> {
            Book b = fav.getBook();
            if (b == null) return null;
            Map<String, Object> map = new HashMap<>();
            map.put("favoriteId", fav.getId());
            map.put("bookId", b.getBook_id());
            map.put("title", b.getBookName());
            map.put("bookName", b.getBookName());
            map.put("author", b.getAuthor());
            map.put("img", b.getImg_url());
            map.put("imgUrl", b.getImg_url());
            map.put("categoryName", b.getCategory() != null ? b.getCategory().getCategory_name() : "Chung");
            map.put("rating", 5.0);
            map.put("price", b.getRent_price());
            map.put("createdAt", fav.getCreatedAt());
            return map;
        }).filter(Objects::nonNull).toList();

        return ResponseEntity.ok(result);
    }

    /**
     * Kiểm tra cuốn sách đã được yêu thích hay chưa
     */
    @GetMapping("/favorites/check/{bookId}")
    public ResponseEntity<?> checkIsFavorite(@PathVariable("bookId") String bookId) {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) {
            return ResponseEntity.ok(Map.of("isFavorite", false));
        }

        boolean isFavorite = favoriteBookRepository.existsByCustomerIdAndBookId(customer.getCustomer_id(), bookId);
        return ResponseEntity.ok(Map.of("isFavorite", isFavorite));
    }

    /**
     * Thêm hoặc Toggle yêu thích cuốn sách
     */
    @PostMapping("/favorites/{bookId}")
    @Transactional
    public ResponseEntity<?> toggleFavorite(@PathVariable("bookId") String bookId) {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Vui lòng đăng nhập để lưu sách yêu thích!"));
        }

        Optional<Book> bookOpt = bookRepository.findById(bookId);
        if (bookOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy cuốn sách!"));
        }

        Optional<FavoriteBook> favOpt = favoriteBookRepository.findByCustomerIdAndBookId(customer.getCustomer_id(), bookId);
        if (favOpt.isPresent()) {
            favoriteBookRepository.delete(favOpt.get());
            return ResponseEntity.ok(Map.of(
                    "isFavorite", false,
                    "message", "Đã xóa tác phẩm khỏi danh sách Yêu Thích!"
            ));
        } else {
            FavoriteBook fav = FavoriteBook.builder()
                    .customerId(customer.getCustomer_id())
                    .book(bookOpt.get())
                    .createdAt(LocalDateTime.now())
                    .build();
            favoriteBookRepository.save(fav);
            return ResponseEntity.ok(Map.of(
                    "isFavorite", true,
                    "message", "Đã thêm tác phẩm vào danh sách Yêu Thích!"
            ));
        }
    }

    /**
     * Xóa cuốn sách khỏi danh sách yêu thích
     */
    @DeleteMapping("/favorites/{bookId}")
    @Transactional
    public ResponseEntity<?> removeFavorite(@PathVariable("bookId") String bookId) {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Vui lòng đăng nhập!"));
        }

        favoriteBookRepository.deleteByCustomerIdAndBookId(customer.getCustomer_id(), bookId);
        return ResponseEntity.ok(Map.of(
                "isFavorite", false,
                "message", "Đã xóa tác phẩm khỏi danh sách Yêu Thích!"
        ));
    }

    // =========================================================================
    // 6. NHẠC NỀN CÁ NHÂN CỦA ĐỘC GIẢ (CUSTOMER BACKGROUND MUSIC)
    // =========================================================================

    /**
     * Lấy danh sách nhạc nền cá nhân do độc giả đã upload
     */
    @GetMapping("/customer/music")
    public ResponseEntity<?> getCustomerMusic() {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        List<CustomerMusic> list = customerMusicRepository.findByCustomerId(customer.getCustomer_id());
        List<CustomerMusicDto> dtos = list.stream()
                .map(CustomerMusicDto::fromEntity)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    /**
     * Tải lên bài nhạc nền cá nhân và lưu theo id khách
     */
    @PostMapping(value = "/customer/music", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<?> uploadCustomerMusic(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String customTitle
    ) {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Vui lòng đăng nhập để lưu bài hát cá nhân vào tài khoản!"));
        }

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng chọn tệp âm thanh!"));
        }

        // Giới hạn dung lượng tối đa 35MB cho 1 tệp âm thanh
        if (file.getSize() > 35 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(Map.of("message", "Dung lượng tệp âm thanh tối đa là 35MB!"));
        }

        String originalName = file.getOriginalFilename();
        String extension = "";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf(".")).toLowerCase();
        }

        List<String> validExtensions = List.of(".mp3", ".ogg", ".wav", ".m4a", ".aac", ".flac");
        if (!validExtensions.contains(extension)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Định dạng không được hỗ trợ! Vui lòng chọn tệp .mp3, .ogg, .wav hoặc .m4a."));
        }

        try {
            // Lưu vào thư mục uploads/audio/
            Path uploadDirPath = Paths.get("uploads", "audio").toAbsolutePath().normalize();
            if (!Files.exists(uploadDirPath)) {
                Files.createDirectories(uploadDirPath);
            }

            String safeFileName = UUID.randomUUID().toString() + extension;
            Path targetPath = uploadDirPath.resolve(safeFileName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            // Đồng bộ sang cả thư mục uploads lân cận nếu ứng dụng chạy từ thư mục con hoặc thư mục gốc
            try {
                Path altPath1 = Paths.get("HalmBookBE", "uploads", "audio").resolve(safeFileName).toAbsolutePath().normalize();
                if (!altPath1.equals(targetPath)) {
                    Files.createDirectories(altPath1.getParent());
                    Files.copy(targetPath, altPath1, StandardCopyOption.REPLACE_EXISTING);
                }
            } catch (Exception ignored) {}
            try {
                Path altPath2 = Paths.get("..", "uploads", "audio").resolve(safeFileName).toAbsolutePath().normalize();
                if (!altPath2.equals(targetPath)) {
                    Files.createDirectories(altPath2.getParent());
                    Files.copy(targetPath, altPath2, StandardCopyOption.REPLACE_EXISTING);
                }
            } catch (Exception ignored) {}

            String localUrl = "/uploads/audio/" + safeFileName;

            // Xác định tiêu đề hiển thị
            String title = (customTitle != null && !customTitle.trim().isEmpty())
                    ? customTitle.trim()
                    : (originalName != null ? originalName.replaceFirst("[.][^.]+$", "") : "Nhạc cá nhân");

            CustomerMusic music = CustomerMusic.builder()
                    .customer(customer)
                    .title(title)
                    .originalFilename(originalName)
                    .fileUrl(localUrl)
                    .fileSize(file.getSize())
                    .createdAt(LocalDateTime.now())
                    .build();

            CustomerMusic saved = customerMusicRepository.save(music);
            return ResponseEntity.status(HttpStatus.CREATED).body(CustomerMusicDto.fromEntity(saved));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi lưu tệp âm thanh: " + e.getMessage()));
        }
    }

    /**
     * Xóa bài nhạc nền cá nhân của độc giả
     */
    @DeleteMapping("/customer/music/{id}")
    @Transactional
    public ResponseEntity<?> deleteCustomerMusic(@PathVariable("id") Integer id) {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Vui lòng đăng nhập!"));
        }

        Optional<CustomerMusic> musicOpt = customerMusicRepository.findByIdAndCustomerId(id, customer.getCustomer_id());
        if (musicOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy bài hát cần xóa hoặc bạn không có quyền!"));
        }

        CustomerMusic music = musicOpt.get();
        // Xóa tệp vật lý nếu tồn tại
        try {
            if (music.getFileUrl() != null && music.getFileUrl().startsWith("/uploads/")) {
                String relativePath = music.getFileUrl().substring("/uploads/".length());
                Path filePath = Paths.get("uploads").resolve(relativePath);
                Files.deleteIfExists(filePath);
                try {
                    Files.deleteIfExists(Paths.get("HalmBookBE", "uploads").resolve(relativePath));
                } catch (Exception ignored) {}
                try {
                    Files.deleteIfExists(Paths.get("..", "uploads").resolve(relativePath));
                } catch (Exception ignored) {}
            }
        } catch (Exception ignored) {}

        customerMusicRepository.delete(music);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã xóa bài hát khỏi tài khoản thành công!"
        ));
    }

    // =========================================================================
    // 7. VOUCHER CỦA TÔI (MY VOUCHER WALLET)
    // =========================================================================

    /**
     * Lấy danh sách voucher trong ví của độc giả hiện tại
     */
    @GetMapping("/customer/vouchers")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMyVouchers() {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập!"));
        }

        List<CustomerVoucher> vouchers = customerVoucherRepository.findByCustomerId(customer.getCustomer_id());
        List<CustomerVoucherDto> dtos = vouchers.stream().map(CustomerVoucherDto::fromEntity).toList();
        return ResponseEntity.ok(dtos);
    }

    /**
     * Lưu voucher vào ví (từ mã khuyến mãi chung hoặc người dùng tự nhập mã)
     */
    @PostMapping("/customer/vouchers/save")
    @Transactional
    public ResponseEntity<?> saveVoucherToWallet(@RequestBody Map<String, Object> body) {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập để lưu voucher!"));
        }

        String code = (String) body.get("code");
        if (code == null || code.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập mã voucher!"));
        }
        code = code.trim().toUpperCase(Locale.ROOT);

        // Kiểm tra xem đã có trong ví chưa
        Optional<CustomerVoucher> existingOpt = customerVoucherRepository.findByCustomerIdAndCode(customer.getCustomer_id(), code);
        if (existingOpt.isPresent()) {
            CustomerVoucher existing = existingOpt.get();
            if (Boolean.TRUE.equals(existing.getIsUsed())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Mã voucher này đã được sử dụng trong tài khoản của bạn!"));
            }
            return ResponseEntity.badRequest().body(Map.of("message", "Voucher này đã có sẵn trong ví của bạn!"));
        }

        // Tìm trong bảng Promotion
        Optional<Promotion> promoOpt = promotionRepository.findById(code);
        if (promoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Mã voucher '" + code + "' không tồn tại trong hệ thống!"));
        }

        Promotion promo = promoOpt.get();
        if ("DELETED".equalsIgnoreCase(promo.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mã voucher này không còn hiệu lực!"));
        }

        CustomerVoucher cv = CustomerVoucher.builder()
                .customer(customer)
                .promotion(promo)
                .code(promo.getPromotion_id())
                .title(promo.getPromotion_name() != null ? promo.getPromotion_name() : "Voucher " + promo.getPromotion_id())
                .description(promo.getDescription())
                .discountPercent(promo.getDiscount_percent())
                .discountAmount(promo.getDiscount_amount())
                .minOrderValue(0)
                .startDate(promo.getStart_date())
                .endDate(promo.getEnd_date())
                .isUsed(false)
                .savedAt(LocalDateTime.now())
                .isExclusive(false)
                .build();

        CustomerVoucher saved = customerVoucherRepository.save(cv);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "Đã lưu voucher " + saved.getCode() + " vào ví thành công!",
                "voucher", CustomerVoucherDto.fromEntity(saved)
        ));
    }

    /**
     * Cấp voucher độc quyền cho khách hàng (Chỉ dành riêng cho Admin/Manager)
     */
    @PostMapping("/customer/vouchers/grant-exclusive")
    @Transactional
    public ResponseEntity<?> grantExclusiveVoucher(@RequestBody Map<String, Object> body) {
        if (!isCurrentUserAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "message", "Bạn không có quyền quản trị viên (Admin) để thực hiện thao tác cấp voucher độc quyền!"
            ));
        }

        String customerId = (String) body.get("customerId");
        String code = (String) body.get("code");
        String title = (String) body.get("title");
        String desc = (String) body.get("description");
        Integer discPct = body.get("discountPercent") != null ? Integer.parseInt(body.get("discountPercent").toString()) : 0;
        Integer discAmt = body.get("discountAmount") != null ? Integer.parseInt(body.get("discountAmount").toString()) : 0;
        String note = (String) body.get("note");

        if (customerId == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu customerId hoặc code!"));
        }

        Optional<Customer> custOpt = customerRepository.findById(customerId);
        if (custOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy khách hàng: " + customerId));
        }

        Customer target = custOpt.get();
        CustomerVoucher cv = CustomerVoucher.builder()
                .customer(target)
                .code(code.trim().toUpperCase(Locale.ROOT))
                .title(title != null ? title : "Voucher Tri Ân Dành Riêng")
                .description(desc != null ? desc : "Voucher độc quyền tặng riêng cho bạn")
                .discountPercent(discPct)
                .discountAmount(discAmt)
                .minOrderValue(0)
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(30))
                .isUsed(false)
                .savedAt(LocalDateTime.now())
                .isExclusive(true)
                .exclusiveNote(note != null ? note : "Tặng riêng độc giả thân thiết")
                .build();

        CustomerVoucher saved = customerVoucherRepository.save(cv);

        // Gửi thông báo đến độc giả
        Notification notif = Notification.builder()
                .customerId(target.getCustomer_id())
                .title("🎟️ Bạn nhận được Voucher Độc Quyền!")
                .message("HALM BOOK vừa gửi tặng bạn mã voucher: " + saved.getCode() + " (" + (discPct > 0 ? "Giảm " + discPct + "%" : "Giảm " + discAmt + "đ") + "). Xem ngay trong Ví Voucher của bạn!")
                .type("VOUCHER")
                .link("/canhan?tab=vouchers")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notif);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã cấp voucher độc quyền thành công cho " + target.getCustomerName(),
                "voucher", CustomerVoucherDto.fromEntity(saved)
        ));
    }

    // =========================================================================
    // 8. TẶNG SÁCH CHO ĐỘC GIẢ KHÁC (BOOK GIFTING FEATURE)
    // =========================================================================

    /**
     * Tìm kiếm người nhận quà tặng sách theo email, số điện thoại, username hoặc ID
     */
    @GetMapping("/books/gift-recipient-search")
    @Transactional(readOnly = true)
    public ResponseEntity<?> searchGiftRecipient(@RequestParam("query") String query) {
        Customer sender = getAuthenticatedCustomer();
        if (sender == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập!"));
        }

        if (query == null || query.trim().length() < 2) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<Customer> list = customerRepository.findByIdentifier(query.trim());
        // Lọc bỏ chính người gửi
        List<Map<String, Object>> results = list.stream()
                .filter(c -> !c.getCustomer_id().equals(sender.getCustomer_id()))
                .map(c -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("customerId", c.getCustomer_id());
                    map.put("customerName", c.getCustomerName() != null ? c.getCustomerName() : "Độc giả " + c.getCustomer_id());
                    // Mask email for privacy: a***@gmail.com
                    String em = c.getEmail();
                    if (em != null && em.contains("@")) {
                        String[] parts = em.split("@", 2);
                        String masked = (parts[0].length() > 2 ? parts[0].substring(0, 2) + "***" : parts[0] + "***") + "@" + parts[1];
                        map.put("emailMasked", masked);
                    } else {
                        map.put("emailMasked", "Ẩn thông tin");
                    }
                    map.put("avatar", c.getAvatarUrl() != null ? c.getAvatarUrl() : c.getAvatar());
                    map.put("username", c.getAccount() != null ? c.getAccount().getUsername() : null);
                    return map;
                })
                .toList();

        return ResponseEntity.ok(results);
    }

    /**
     * Thực hiện tặng sách cho độc giả khác
     */
    @PostMapping("/books/{bookId}/gift")
    @Transactional
    public ResponseEntity<?> giftBookToRecipient(
            @PathVariable("bookId") String bookId,
            @RequestBody Map<String, Object> body) {

        Customer sender = getAuthenticatedCustomer();
        if (sender == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập để tặng sách!"));
        }

        Book book = bookRepository.findById(bookId.trim()).orElse(null);
        if (book == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Cuốn sách không tồn tại!"));
        }

        String recipientIdentifier = (String) body.get("recipientIdentifier");
        if (recipientIdentifier == null || recipientIdentifier.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập email, tên đăng nhập hoặc số điện thoại người nhận!"));
        }

        List<Customer> matching = customerRepository.findByIdentifier(recipientIdentifier.trim());
        if (matching.isEmpty()) {
            matching = customerRepository.findById(recipientIdentifier.trim()).map(List::of).orElse(Collections.emptyList());
        }

        if (matching.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy người nhận với thông tin: " + recipientIdentifier));
        }

        Customer receiver = matching.get(0);
        if (receiver.getCustomer_id().equals(sender.getCustomer_id())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Bạn không thể tự tặng sách cho chính mình! Hãy chọn mua hoặc thuê sách cho bản thân."));
        }

        String planKey = (String) body.getOrDefault("planKey", "7");
        String message = (String) body.getOrDefault("message", "Chúc bạn đọc sách vui vẻ!");

        int rentalDays;
        int potatoPrice;
        try {
            rentalDays = com.example.demochatbot.service.order.RentalPricing.duration(planKey);
            potatoPrice = (int) Math.round(com.example.demochatbot.service.order.RentalPricing.price(planKey, book));
        } catch (Exception e) {
            rentalDays = 7;
            potatoPrice = 9;
        }

        // Đồng bộ và kiểm tra số dư Khoai
        customerRepository.synchronizeLockedWallet(sender);
        if (sender.getPotatoBalance() == null || sender.getPotatoBalance() < potatoPrice) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Số dư Khoai của bạn không đủ (" + (sender.getPotatoBalance() != null ? sender.getPotatoBalance() : 0) + " 🥔). Cần " + potatoPrice + " 🥔 để tặng sách này. Vui lòng nạp thêm Khoai!",
                    "requiredPotato", potatoPrice,
                    "currentPotato", sender.getPotatoBalance() != null ? sender.getPotatoBalance() : 0
            ));
        }

        // 1. Trừ khoai người gửi
        int newSenderBalance = sender.getPotatoBalance() - potatoPrice;
        sender.setPotatoBalance(newSenderBalance);
        customerRepository.save(sender);

        // 2. Ghi nhật ký giao dịch PotatoTransaction
        String durationText = rentalDays > 1000 ? "Vĩnh viễn" : (rentalDays + " ngày");
        String receiverDisplayName = receiver.getCustomerName() != null ? receiver.getCustomerName() : receiver.getCustomer_id();
        PotatoTransaction senderTx = new PotatoTransaction();
        senderTx.setCustomer(sender);
        senderTx.setAmount(-potatoPrice);
        senderTx.setBalanceAfter(newSenderBalance);
        senderTx.setType("GIFT_BOOK");
        senderTx.setDescription("Tặng sách '" + book.getBookName() + "' (" + durationText + ") cho độc giả " + receiverDisplayName);
        senderTx.setCreatedAt(LocalDateTime.now());
        potatoTransactionRepository.save(senderTx);

        // 3. Cấp quyền đọc sách cho người nhận (Access_Record)
        LocalDateTime now = LocalDateTime.now();
        Optional<Access_Record> accessOpt = accessRecordRepository.findByCustomerIdAndBookId(receiver.getCustomer_id(), book.getBook_id());
        Access_Record ar;
        if (accessOpt.isPresent()) {
            ar = accessOpt.get();
            if (ar.getEnd_date() != null && ar.getEnd_date().isAfter(now)) {
                ar.setEnd_date(rentalDays > 1000 ? now.plusYears(100) : ar.getEnd_date().plusDays(rentalDays));
            } else {
                ar.setStart_date(now);
                ar.setEnd_date(rentalDays > 1000 ? now.plusYears(100) : now.plusDays(rentalDays));
            }
            ar.setStatus("ACTIVE");
            ar.setRenewCount((ar.getRenewCount() != null ? ar.getRenewCount() : 0) + 1);
        } else {
            ar = new Access_Record();
            ar.setCustomer(receiver);
            ar.setBook(book);
            ar.setStart_date(now);
            ar.setEnd_date(rentalDays > 1000 ? now.plusYears(100) : now.plusDays(rentalDays));
            ar.setStatus("ACTIVE");
            ar.setCurrentPage(1);
            ar.setReadingPercentage(0.0);
            ar.setLastReadAt(now);
            ar.setRenewCount(0);
        }
        accessRecordRepository.save(ar);

        // 4. Lưu bản ghi BookGift
        BookGift gift = BookGift.builder()
                .sender(sender)
                .receiver(receiver)
                .book(book)
                .planKey(planKey)
                .rentalDays(rentalDays)
                .potatoPrice(potatoPrice)
                .message(message)
                .createdAt(now)
                .build();
        BookGift savedGift = bookGiftRepository.save(gift);

        // 5. Gửi thông báo đến người nhận
        String senderDisplayName = sender.getCustomerName() != null ? sender.getCustomerName() : "Một độc giả";
        Notification notifReceiver = Notification.builder()
                .customerId(receiver.getCustomer_id())
                .title("🎁 Bạn nhận được quà tặng sách từ " + senderDisplayName + "!")
                .message(senderDisplayName + " vừa gửi tặng bạn tác phẩm '" + book.getBookName() + "' (Thời hạn: " + durationText + "). Lời nhắn: \"" + message + "\". Hãy vào Tủ Sách Cá Nhân để đọc ngay!")
                .type("GIFT")
                .link("/tusachcn?tab=gifts")
                .isRead(false)
                .createdAt(now)
                .build();
        notificationRepository.save(notifReceiver);

        // 6. Gửi thông báo cho người tặng
        Notification notifSender = Notification.builder()
                .customerId(sender.getCustomer_id())
                .title("🎉 Tặng sách thành công!")
                .message("Bạn đã gửi tặng thành công tác phẩm '" + book.getBookName() + "' cho độc giả " + receiverDisplayName + ". Chi phí: " + potatoPrice + " 🥔.")
                .type("GIFT")
                .link("/tusachcn?tab=gifts")
                .isRead(false)
                .createdAt(now)
                .build();
        notificationRepository.save(notifSender);

        // 7. Tăng lượt đọc của sách
        book.setReadCount((book.getReadCount() != null ? book.getReadCount() : 0) + 1);
        bookRepository.save(book);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã gửi tặng sách '" + book.getBookName() + "' cho độc giả " + receiverDisplayName + " thành công!",
                "gift", BookGiftDto.fromEntity(savedGift),
                "remainingPotato", newSenderBalance
        ));
    }

    /**
     * Lấy danh sách quà tặng đã gửi đi
     */
    @GetMapping("/customer/gifts-sent")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getGiftsSent() {
        Customer sender = getAuthenticatedCustomer();
        if (sender == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập!"));
        }

        List<BookGift> list = bookGiftRepository.findBySenderCustomerId(sender.getCustomer_id());
        return ResponseEntity.ok(list.stream().map(BookGiftDto::fromEntity).toList());
    }

    /**
     * Lấy danh sách quà tặng nhận được từ người khác
     */
    @GetMapping("/customer/gifts-received")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getGiftsReceived() {
        Customer receiver = getAuthenticatedCustomer();
        if (receiver == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập!"));
        }

        List<BookGift> list = bookGiftRepository.findByReceiverCustomerId(receiver.getCustomer_id());
        return ResponseEntity.ok(list.stream().map(BookGiftDto::fromEntity).toList());
    }

    // =========================================================================
    // 9. TRẢ SÁCH CÓ HẠN THUÊ TRONG TỦ SÁCH CÁ NHÂN
    // =========================================================================

    /**
     * Trả lại sách có hạn thuê trước thời hạn
     */
    @PostMapping("/bookshelf/{bookId}/return")
    @Transactional
    public ResponseEntity<?> returnRentedBook(@PathVariable("bookId") String bookId) {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập!"));
        }

        if (bookId == null || bookId.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mã sách không hợp lệ!"));
        }

        String targetBookId = bookId.trim();
        List<Access_Record> records = new ArrayList<>();

        // 1. Thử tìm theo ID bản ghi nếu param truyền vào là số (accessRecordId)
        try {
            int accessId = Integer.parseInt(targetBookId);
            accessRecordRepository.findById(accessId).ifPresent(ar -> {
                if (ar.getCustomer() != null && ar.getCustomer().getCustomer_id().equals(customer.getCustomer_id())) {
                    records.add(ar);
                }
            });
        } catch (NumberFormatException ignored) {}

        // 2. Nếu không tìm thấy bằng accessId, tìm theo book_id của khách hàng
        if (records.isEmpty()) {
            List<Access_Record> matching = accessRecordRepository.findAllByCustomerIdAndBookId(customer.getCustomer_id(), targetBookId);
            records.addAll(matching);
        }

        if (records.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy quyền đọc cuốn sách này trong tủ sách của bạn!"));
        }

        LocalDateTime now = LocalDateTime.now();

        // Kiểm tra xem tất cả các bản ghi có phải là sách vĩnh viễn không
        boolean hasOnlyForever = records.stream().allMatch(ar -> {
            if (ar.getEnd_date() == null) return true;
            return ar.getEnd_date().isAfter(now) && java.time.Duration.between(now, ar.getEnd_date()).toDays() > 1000;
        });

        if (hasOnlyForever) {
            return ResponseEntity.badRequest().body(Map.of("message", "Sách sở hữu vĩnh viễn không thể trả lại!"));
        }

        // Cập nhật tất cả các bản ghi thuê có thời hạn của cuốn sách sang RETURNED
        String bookTitle = "Tác phẩm";
        int returnedCount = 0;
        for (Access_Record ar : records) {
            boolean isForever = ar.getEnd_date() == null || (ar.getEnd_date().isAfter(now) && java.time.Duration.between(now, ar.getEnd_date()).toDays() > 1000);
            if (!isForever) {
                ar.setStatus("RETURNED");
                ar.setEnd_date(now);
                accessRecordRepository.save(ar);
                returnedCount++;
                if (ar.getBook() != null && ar.getBook().getBookName() != null) {
                    bookTitle = ar.getBook().getBookName();
                }
            }
        }

        if (returnedCount == 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Sách sở hữu vĩnh viễn không thể trả lại!"));
        }

        try {
            Notification notif = Notification.builder()
                    .customerId(customer.getCustomer_id())
                    .title("📚 Đã trả sách thành công")
                    .message("Bạn đã hoàn tất trả lại cuốn sách '" + bookTitle + "'. Sách đã được chuyển sang lịch sử thuê sách.")
                    .type("RENT")
                    .link("/tusachcn?tab=history")
                    .isRead(false)
                    .createdAt(now)
                    .build();
            notificationRepository.save(notif);
        } catch (Exception ignored) {}

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã trả lại cuốn sách '" + bookTitle + "' thành công!",
                "bookId", bookId
        ));
    }
}
