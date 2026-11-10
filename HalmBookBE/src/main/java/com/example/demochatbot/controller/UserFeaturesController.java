package com.example.demochatbot.controller;

import com.example.demochatbot.dto.CloudinaryResultDto;
import com.example.demochatbot.dto.MissionClaimRequest;
import com.example.demochatbot.dto.ReadingProgressRequest;
import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import com.example.demochatbot.service.customer.CustomerService;
import com.example.demochatbot.service.data.CloudinaryService;
import com.example.demochatbot.service.order.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    // =========================================================================
    // 1. TIẾN ĐỘ ĐỌC SÁCH (READING PROGRESS & AUTO-RESUME)
    // =========================================================================

    /**
     * API kiểm tra chi tiết quyền đọc và lấy lại trang đọc dở (Auto-Resume)
     */
    @GetMapping("/bookshelf/check-detail/{bookId}")
    public ResponseEntity<?> getBookAccessDetail(@PathVariable("bookId") String bookId) {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) {
            return ResponseEntity.ok(Map.of(
                    "hasAccess", false,
                    "currentPage", 1,
                    "readingPercentage", 0.0,
                    "remainingDays", 0
            ));
        }

        Optional<Access_Record> recordOpt = accessRecordRepository.findByCustomerIdAndBookId(customer.getCustomer_id(), bookId);
        if (recordOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of(
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
                ar.setStatus("EXPIRED");
                accessRecordRepository.save(ar);
            } else {
                remainingDays = Math.max(1, ChronoUnit.DAYS.between(now, ar.getEnd_date()));
            }
        } else {
            // Sách mua vĩnh viễn
            remainingDays = 9999;
        }

        boolean hasAccess = !isExpired && "ACTIVE".equalsIgnoreCase(ar.getStatus());

        return ResponseEntity.ok(Map.of(
                "hasAccess", hasAccess,
                "currentPage", ar.getCurrentPage() != null && ar.getCurrentPage() > 0 ? ar.getCurrentPage() : 1,
                "readingPercentage", ar.getReadingPercentage() != null ? ar.getReadingPercentage() : 0.0,
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
        ar.setCurrentPage(request.getCurrentPage());

        if (request.getReadingPercentage() != null) {
            ar.setReadingPercentage(Math.min(100.0, Math.max(0.0, request.getReadingPercentage())));
        } else if (request.getTotalPages() != null && request.getTotalPages() > 0) {
            double calcPercent = ((double) request.getCurrentPage() / request.getTotalPages()) * 100.0;
            ar.setReadingPercentage(Math.min(100.0, Math.round(calcPercent * 10.0) / 10.0));
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

        LocalDate today = LocalDate.now();
        List<UserMissionClaim> todayClaims = userMissionClaimRepository.findByCustomerIdAndClaimDate(customer.getCustomer_id(), today);
        List<UserMissionClaim> allClaims = userMissionClaimRepository.findByCustomerId(customer.getCustomer_id());

        List<String> dailyClaimedIds = todayClaims.stream()
                .map(UserMissionClaim::getMissionId)
                .filter(id -> id != null && id.startsWith("m"))
                .toList();

        List<String> milestoneClaimedIds = allClaims.stream()
                .map(UserMissionClaim::getMissionId)
                .filter(id -> id != null && id.startsWith("ms"))
                .distinct()
                .toList();

        return ResponseEntity.ok(Map.of(
                "dailyClaimed", dailyClaimedIds,
                "milestoneClaimed", milestoneClaimedIds,
                "potatoBalance", customer.getPotatoBalance() != null ? customer.getPotatoBalance() : 0
        ));
    }

    /**
     * API nhận thưởng nhiệm vụ (Cộng khoai vào DB & Lưu lịch sử giao dịch)
     */
    @PostMapping("/missions/claim")
    @Transactional
    public ResponseEntity<?> claimMissionReward(@RequestBody MissionClaimRequest request) {
        Customer customer = getAuthenticatedCustomer();
        if (customer == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Vui lòng đăng nhập để nhận thưởng nhiệm vụ!"));
        }

        if (request == null || request.getMissionId() == null || request.getMissionId().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mã nhiệm vụ không hợp lệ!"));
        }

        String missionId = request.getMissionId().trim();
        boolean isMilestone = Boolean.TRUE.equals(request.getIsMilestone()) || missionId.startsWith("ms");
        LocalDate today = LocalDate.now();

        // Kiểm tra xem đã nhận thưởng chưa
        if (isMilestone) {
            if (userMissionClaimRepository.existsByCustomerIdAndMissionId(customer.getCustomer_id(), missionId)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Cột mốc thành tựu này bạn đã nhận thưởng rồi!"));
            }
        } else {
            if (userMissionClaimRepository.existsByCustomerIdAndMissionIdAndClaimDate(customer.getCustomer_id(), missionId, today)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Hôm nay bạn đã nhận thưởng nhiệm vụ này rồi!"));
            }
        }

        int reward = (request.getRewardPotato() != null && request.getRewardPotato() > 0) ? request.getRewardPotato() : 5;
        int currentBalance = customer.getPotatoBalance() != null ? customer.getPotatoBalance() : 0;
        int newBalance = currentBalance + reward;

        // 1. Cập nhật số dư khoai của người dùng
        customer.setPotatoBalance(newBalance);
        customerRepository.save(customer);

        // 2. Ghi nhận giao dịch khoai tây
        PotatoTransaction tx = new PotatoTransaction();
        tx.setCustomer(customer);
        tx.setAmount(reward);
        tx.setBalanceAfter(newBalance);
        tx.setType("REWARD");
        tx.setDescription((isMilestone ? "Thưởng thành tựu: " : "Thưởng nhiệm vụ hằng ngày: ") + missionId);
        tx.setCreatedAt(LocalDateTime.now());
        potatoTransactionRepository.save(tx);

        // 3. Lưu bản ghi claim nhiệm vụ
        UserMissionClaim claim = UserMissionClaim.builder()
                .customerId(customer.getCustomer_id())
                .missionId(missionId)
                .claimDate(today)
                .rewardPotato(reward)
                .createdAt(LocalDateTime.now())
                .build();
        userMissionClaimRepository.save(claim);

        return ResponseEntity.ok(Map.of(
                "message", "Nhận thưởng thành công!",
                "missionId", missionId,
                "rewardPotato", reward,
                "newBalance", newBalance
        ));
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
            return ResponseEntity.ok(Map.of(
                    "unreadCount", 0,
                    "notifications", List.of()
            ));
        }

        List<Notification> list = notificationRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getCustomer_id());
        long unreadCount = notificationRepository.countByCustomerIdAndIsReadFalse(customer.getCustomer_id());

        // Nếu người dùng mới chưa có thông báo nào, tạo một thông báo chào mừng mặc định
        if (list.isEmpty()) {
            Notification welcomeNoti = Notification.builder()
                    .customerId(customer.getCustomer_id())
                    .title("Chào Mừng Bạn Đến Với HALM BOOK!")
                    .message("Khám phá hàng ngàn ấn phẩm tinh tuyển, tích lũy khoai tây mỗi ngày và trải nghiệm trợ lý đọc sách AI.")
                    .type("SYSTEM")
                    .link("/trangchu")
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(welcomeNoti);
            list = List.of(welcomeNoti);
            unreadCount = 1;
        }

        return ResponseEntity.ok(Map.of(
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
}
