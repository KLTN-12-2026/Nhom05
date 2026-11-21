package com.example.demochatbot.service.mission;

import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import com.example.demochatbot.service.tier.TierService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.*;
import java.util.*;

@Service @RequiredArgsConstructor
public class MissionService {
    public static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    public static final Set<String> DAILY = Set.of("CHECKIN", "READING_SECONDS", "CHAT", "SEARCH", "OFFERS", "BOOKSHELF");
    public static final Set<String> MILESTONE = Set.of("STREAK_DAYS", "BOOKS_OWNED", "TOTAL_XP");
    private final MissionRepository missions;
    private final MissionActivityRepository activities;
    private final UserMissionClaimRepository claims;
    private final CustomerRepository customers;
    private final AccessRecordRepository access;
    private final ChatMessageRepository chat;
    private final PotatoTransactionRepository ledger;
    private final NotificationRepository notifications;
    private final TierService tiers;
    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;
    Clock clock = Clock.systemUTC();

    @EventListener(ApplicationReadyEvent.class) @Transactional
    public void seedDefaults() {
        if (missions.count() != 0) return;
        missions.saveAll(List.of(
            preset("m1", "Điểm danh hằng ngày", "Điểm danh tại trang nhiệm vụ hoặc hội viên.", "CHECKIN", 1, 5, 20, 1),
            preset("m2", "Đọc sách 20 phút", "Đọc sách thuê trên HALMBOOK đủ 1.200 giây trong ngày; chỉ tính khi màn hình đọc đang mở.", "READING_SECONDS", 1200, 10, 30, 2),
            preset("m3", "Trò chuyện cùng Khoai Nhỏ", "Gửi ít nhất một câu hỏi và nhận phản hồi từ trợ lý AI hôm nay.", "CHAT", 1, 5, 20, 3),
            preset("m4", "Tìm kiếm sách", "Tìm một tác phẩm với từ khóa ít nhất 2 ký tự.", "SEARCH", 1, 5, 20, 4),
            preset("m5", "Khám phá ưu đãi", "Mở trang Ưu đãi hôm nay.", "OFFERS", 1, 5, 20, 5),
            preset("m6", "Ghé thăm tủ sách", "Mở Tủ sách cá nhân hôm nay.", "BOOKSHELF", 1, 5, 20, 6),
            preset("ms1", "Độc giả chăm chỉ", "Duy trì chuỗi điểm danh 7 ngày liên tiếp.", "STREAK_DAYS", 7, 50, 150, 7),
            preset("ms2", "Tủ sách khởi đầu", "Có quyền đọc còn hiệu lực với 3 cuốn sách khác nhau.", "BOOKS_OWNED", 3, 30, 100, 8),
            preset("ms3", "Nhà tích lũy tri thức", "Đạt 100 điểm tích lũy trên hệ thống hội viên.", "TOTAL_XP", 100, 40, 120, 9),
            preset("ms4", "Đại sứ HALMBOOK", "Đạt 500 điểm tích lũy trên hệ thống hội viên.", "TOTAL_XP", 500, 100, 300, 10)));
    }
    private Mission preset(String id, String title, String description, String condition, int target, int potato, int xp, int order) {
        return Mission.builder().id(id).title(title).description(description).condition(condition)
            .period(DAILY.contains(condition) ? "DAILY" : "MILESTONE").targetValue(target)
            .rewardPotato(potato).rewardXp(xp).active(true).orderIndex(order).build();
    }
    LocalDate today() { return LocalDate.now(clock.withZone(ZONE)); }
    private LocalDateTime localNow() { return LocalDateTime.now(clock.withZone(ZoneId.systemDefault())); }
    private Customer lock(String customerId) {
        Customer customer = customers.findByIdForUpdate(customerId).orElseThrow(() -> error(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập lại."));
        // OSIV may already hold the profile loaded by the controller before this transaction.
        if (entityManager != null) entityManager.refresh(customer, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
        return customer;
    }
    private static int value(Integer number) { return number == null ? 0 : number; }
    private boolean claimed(String customerId, Mission mission) {
        return "DAILY".equals(mission.getPeriod())
            ? claims.existsByCustomerIdAndMissionIdAndClaimDate(customerId, mission.getId(), today())
            : claims.existsByCustomerIdAndMissionId(customerId, mission.getId());
    }
    private boolean validAccess(Access_Record record) {
        return "ACTIVE".equalsIgnoreCase(record.getStatus())
            && (record.getStart_date() == null || !record.getStart_date().isAfter(localNow()))
            && record.getEnd_date() != null && record.getEnd_date().isAfter(localNow());
    }
    long progress(Customer customer, Mission mission) {
        LocalDate day = today();
        return switch (mission.getCondition()) {
            case "CHECKIN" -> day.equals(customer.getLastStreakDate()) ? 1 : 0;
            case "STREAK_DAYS" -> day.equals(customer.getLastStreakDate()) || day.minusDays(1).equals(customer.getLastStreakDate())
                ? value(customer.getStreakDays()) : 0;
            case "BOOKS_OWNED" -> access.findByCustomerOrderByLastReadAtDesc(customer).stream().filter(this::validAccess)
                .filter(r -> r.getBook() != null).map(r -> r.getBook().getBook_id()).distinct().count();
            case "TOTAL_XP" -> tiers.getTotalPoints(customer);
            case "CHAT" -> chat.countUserMessages(customer.getCustomer_id(),
                LocalDateTime.ofInstant(day.atStartOfDay(ZONE).toInstant(), ZoneId.systemDefault()),
                LocalDateTime.ofInstant(day.plusDays(1).atStartOfDay(ZONE).toInstant(), ZoneId.systemDefault()));
            default -> activities.findById(activityKey(customer.getCustomer_id(), day, mission.getCondition()))
                .map(MissionActivity::getProgressValue).orElse(0);
        };
    }
    @Transactional(readOnly = true)
    public Map<String, Object> dashboard(Customer customer) {
        List<Map<String, Object>> rows = missions.findAllByOrderByOrderIndexAscIdAsc().stream().filter(Mission::isActive).map(m -> {
            long progress = Math.min(progress(customer, m), m.getTargetValue());
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", m.getId()); row.put("title", m.getTitle()); row.put("description", m.getDescription());
            row.put("condition", m.getCondition()); row.put("period", m.getPeriod()); row.put("targetValue", m.getTargetValue());
            row.put("progress", progress); row.put("completed", progress >= m.getTargetValue());
            row.put("claimed", claimed(customer.getCustomer_id(), m)); row.put("rewardPotato", m.getRewardPotato()); row.put("rewardXp", m.getRewardXp());
            return row;
        }).toList();
        return Map.of("missions", rows, "today", today().toString(), "resetAt", today().plusDays(1).atStartOfDay(ZONE).toInstant().toString(),
            "potatoBalance", value(customer.getPotatoBalance()), "totalXp", tiers.getTotalPoints(customer));
    }
    @Transactional
    public Map<String, Object> claim(String customerId, String missionId) {
        Customer customer = lock(customerId);
        Mission mission = missions.findLocked(Objects.toString(missionId, "")).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Nhiệm vụ không tồn tại."));
        // Legacy receipts are checked as well as new unique receipt keys.
        if (claimed(customerId, mission)) return Map.of("missionId", mission.getId(), "alreadyClaimed", true,
            "newBalance", value(customer.getPotatoBalance()), "rewardPotato", 0, "rewardXp", 0, "message", "Đã nhận thưởng nhiệm vụ này.");
        if (!mission.isActive()) throw error(HttpStatus.CONFLICT, "Nhiệm vụ đã tạm ngừng. Vui lòng tải lại danh sách.");
        if (progress(customer, mission) < mission.getTargetValue()) throw error(HttpStatus.CONFLICT, "Bạn chưa hoàn thành nhiệm vụ này.");
        int balance = Math.addExact(value(customer.getPotatoBalance()), mission.getRewardPotato());
        // The existing membership system stores its accumulated points in totalPotatoEarned.
        Math.addExact(Math.addExact(value(customer.getTotalPotatoEarned()), mission.getRewardPotato()), mission.getRewardXp());
        customer.setPotatoBalance(balance);
        customer.setTotalPotatoEarned(Math.addExact(value(customer.getTotalPotatoEarned()), mission.getRewardPotato()));
        customers.save(customer);
        PotatoTransaction transaction = new PotatoTransaction();
        transaction.setCustomer(customer); transaction.setAmount(mission.getRewardPotato()); transaction.setBalanceAfter(balance);
        transaction.setType("REWARD"); transaction.setDescription("Nhiệm vụ: " + mission.getTitle()); transaction.setCreatedAt(localNow());
        ledger.save(transaction);
        if (mission.getRewardXp() > 0) tiers.addExperiencePoints(customer, mission.getRewardXp(), "Nhiệm vụ " + mission.getId());
        else tiers.calculateAndUpdateCustomerTier(customer);
        UserMissionClaim receipt = UserMissionClaim.builder().customerId(customerId).missionId(mission.getId()).claimDate(today())
            .claimKey(hash(customerId, mission.getId(), "DAILY".equals(mission.getPeriod()) ? today().toString() : "once"))
            .missionTitle(mission.getTitle()).missionPeriod(mission.getPeriod()).rewardPotato(mission.getRewardPotato())
            .rewardXp(mission.getRewardXp()).balanceAfter(value(customer.getPotatoBalance())).createdAt(localNow()).build();
        claims.saveAndFlush(receipt);
        notifications.save(Notification.builder().customerId(customerId).type("REWARD").title("Nhận thưởng nhiệm vụ")
            .message(mission.getTitle() + ": +" + mission.getRewardPotato() + " Khoai, +" + mission.getRewardXp() + " XP.")
            .link("/canhan?tab=wallet").createdAt(localNow()).build());
        return Map.of("missionId", mission.getId(), "alreadyClaimed", false, "newBalance", value(customer.getPotatoBalance()),
            "rewardPotato", mission.getRewardPotato(), "rewardXp", mission.getRewardXp(), "message", "Nhận thưởng thành công!");
    }
    @Transactional
    public void visit(String customerId, String kind, String keyword) {
        if (!Set.of("OFFERS", "BOOKSHELF", "SEARCH").contains(Objects.toString(kind, ""))) throw error(HttpStatus.BAD_REQUEST, "Loại hoạt động không hợp lệ.");
        if ("SEARCH".equals(kind) && (keyword == null || keyword.trim().length() < 2 || keyword.length() > 200)) throw error(HttpStatus.BAD_REQUEST, "Từ khóa phải có từ 2 đến 200 ký tự.");
        lock(customerId);
        MissionActivity activity = activity(customerId, kind); activity.setProgressValue(1); activities.save(activity);
    }
    @Transactional
    public Map<String, Object> heartbeat(String customerId, String bookId, String sessionId) {
        if (bookId == null || bookId.length() > 100 || sessionId == null || !sessionId.matches("[a-zA-Z0-9-]{16,64}")) throw error(HttpStatus.BAD_REQUEST, "Phiên đọc không hợp lệ.");
        lock(customerId);
        if (access.findByCustomerIdAndBookId(customerId, bookId).filter(this::validAccess).isEmpty()) throw error(HttpStatus.FORBIDDEN, "Quyền đọc không còn hiệu lực.");
        MissionActivity activity = activity(customerId, "READING_SECONDS");
        Instant now = clock.instant();
        if (sessionId.equals(activity.getSessionId()) && bookId.equals(activity.getBookId()) && activity.getLastEventAt() != null) {
            long seconds = Duration.between(activity.getLastEventAt(), now).getSeconds();
            if (seconds >= 5 && seconds <= 45) activity.setProgressValue(Math.min(86400, activity.getProgressValue() + (int) Math.min(30, seconds)));
            // Frequent requests must not move the reference point forward and lose all progress.
            if (seconds >= 0 && seconds < 5) return Map.of("seconds", activity.getProgressValue());
        }
        activity.setLastEventAt(now); activity.setSessionId(sessionId); activity.setBookId(bookId); activities.save(activity);
        return Map.of("seconds", activity.getProgressValue());
    }
    private MissionActivity activity(String customerId, String kind) {
        String key = activityKey(customerId, today(), kind);
        return activities.findById(key).orElseGet(() -> {
            MissionActivity a = new MissionActivity(); a.setId(key); a.setCustomerId(customerId); a.setActivityDate(today()); a.setKind(kind); return a;
        });
    }
    static String activityKey(String customerId, LocalDate date, String kind) { return hash(customerId, date.toString(), kind); }
    private static String hash(String... parts) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(String.join("\u0000", parts).getBytes(StandardCharsets.UTF_8))); }
        catch (Exception e) { throw new IllegalStateException(e); }
    }
    public static void validate(Mission m) {
        if (m.getTitle() == null || m.getTitle().isBlank() || m.getTitle().trim().length() > 150 || m.getDescription() == null || m.getDescription().length() > 500
            || !(DAILY.contains(Objects.toString(m.getCondition(), "")) || MILESTONE.contains(Objects.toString(m.getCondition(), "")))
            || !(DAILY.contains(m.getCondition()) ? "DAILY" : "MILESTONE").equals(m.getPeriod())
            || m.getTargetValue() < 1 || m.getTargetValue() > 86400 || m.getRewardPotato() < 0 || m.getRewardPotato() > 10000
            || m.getRewardXp() < 0 || m.getRewardXp() > 10000 || m.getOrderIndex() < 0 || m.getOrderIndex() > 10000
            || (Set.of("CHECKIN", "SEARCH", "OFFERS", "BOOKSHELF").contains(m.getCondition()) && m.getTargetValue() != 1))
            throw error(HttpStatus.BAD_REQUEST, "Cấu hình nhiệm vụ không hợp lệ. Hoạt động một lần có mục tiêu bằng 1; phần thưởng từ 0 đến 10.000.");
        m.setTitle(m.getTitle().trim());
    }
    @Transactional
    public Mission saveConfig(String id, Mission input) {
        validate(input);
        if (id != null) {
            Mission current = missions.findLocked(id).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Nhiệm vụ không tồn tại."));
            if (!current.getCondition().equals(input.getCondition()) || !current.getPeriod().equals(input.getPeriod()))
                throw error(HttpStatus.BAD_REQUEST, "Điều kiện và chu kỳ của nhiệm vụ đã tạo không được thay đổi. Hãy tắt và tạo nhiệm vụ mới.");
            input.setId(id);
        } else input.setId(("DAILY".equals(input.getPeriod()) ? "m-" : "ms-") + UUID.randomUUID());
        return missions.save(input);
    }
    private static ResponseStatusException error(HttpStatus status, String message) { return new ResponseStatusException(status, message); }
}
