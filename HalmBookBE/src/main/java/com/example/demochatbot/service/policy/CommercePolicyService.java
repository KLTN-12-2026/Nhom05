package com.example.demochatbot.service.policy;

import com.example.demochatbot.dto.TierDto;
import com.example.demochatbot.model.*;
import com.example.demochatbot.repository.*;
import com.example.demochatbot.service.tier.TierService;
import com.example.demochatbot.service.tier.TierServiceImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class CommercePolicyService {
    private final CommercePolicyRepository policies;
    private final MembershipTierRepository tiers;
    private final TierService tierService;
    private final ObjectMapper json;
    @jakarta.persistence.PersistenceContext private jakarta.persistence.EntityManager entityManager;
    public record RentalPlan(String key, int durationDays, String label, int priceKhoai, boolean useBookPrice, boolean active, int orderIndex) {}
    public record Snapshot(long revision, List<RentalPlan> plans, List<TierDto> tiers, Instant updatedAt) {}
    public record Update(long revision, List<RentalPlan> plans, List<TierDto> tiers) {}
    private static final Map<String, Integer> DURATIONS = Map.of("1", 1, "3", 3, "7", 7, "14", 14, "15", 15, "30", 30, "90", 90, "forever", 36500);
    public static List<RentalPlan> defaults() {
        return List.of(new RentalPlan("1", 1, "1 ngày", 2, false, true, 1), new RentalPlan("3", 3, "3 ngày", 5, false, true, 2),
            new RentalPlan("7", 7, "7 ngày", 9, false, true, 3), new RentalPlan("14", 14, "14 ngày", 15, false, true, 4),
            new RentalPlan("15", 15, "15 ngày", 18, false, true, 5), new RentalPlan("30", 30, "30 ngày", 25, false, true, 6),
            new RentalPlan("90", 90, "90 ngày", 50, false, true, 7), new RentalPlan("forever", 36500, "Mua đứt", 39, true, true, 8));
    }
    @EventListener(ApplicationReadyEvent.class) @Transactional
    @org.springframework.core.annotation.Order(1)
    public void initialize() {
        Map<Integer, TierDto> metadata = new HashMap<>();
        tierService.getAllTiers().forEach(t -> metadata.put(t.getTierId(), t));
        for (MembershipTier tier : tiers.findAllByOrderByTierIdAsc()) {
            boolean changed = false;
            TierDto defaults = metadata.get(tier.getTierId());
            if (defaults == null) continue;
            if (tier.getRankOrder() == null) { tier.setRankOrder(defaults.getRankOrder()); changed = true; }
            if (tier.getUpgradeReward() == null) { tier.setUpgradeReward(defaults.getUpgradeReward()); changed = true; }
            if (tier.getBenefitsJson() == null) { tier.setBenefitsJson(encode(defaults.getBenefits())); changed = true; }
            if (changed) tiers.save(tier);
        }
        if (policies.existsById(1)) return;
        CommercePolicy state = new CommercePolicy(); state.setId(1); state.setRevision(1); state.setUpdatedAt(Instant.now());
        state.setRentalPlansJson(encode(defaults())); policies.save(state);
    }
    private String encode(Object value) { try { return json.writeValueAsString(value); } catch (Exception e) { throw new IllegalStateException(e); } }
    private List<RentalPlan> plans(CommercePolicy state) {
        try { return json.readValue(state.getRentalPlansJson(), new TypeReference<List<RentalPlan>>() {}).stream().sorted(Comparator.comparingInt(RentalPlan::orderIndex).thenComparing(RentalPlan::key)).toList(); }
        catch (Exception e) { throw new IllegalStateException("Không đọc được biểu giá. Vui lòng liên hệ quản trị viên.", e); }
    }
    private CommercePolicy state() { return policies.findById(1).orElseThrow(() -> new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Chính sách đang khởi tạo. Vui lòng thử lại.")); }
    @Transactional(readOnly = true)
    public Snapshot current() { CommercePolicy p = state(); return new Snapshot(p.getRevision(), plans(p), tierService.getAllTiers(), p.getUpdatedAt()); }
    @Transactional
    public Snapshot checkout(Long revision) {
        CommercePolicy p = policies.lockForCheckout().orElseThrow(() -> new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Biểu giá chưa sẵn sàng."));
        if (revision != null && revision != p.getRevision()) throw new ResponseStatusException(HttpStatus.CONFLICT, "Biểu giá hoặc chính sách hạng đã thay đổi. Vui lòng tải lại giỏ hàng để xác nhận giá mới.");
        if (entityManager != null) for (MembershipTier tier : tiers.findAllByOrderByTierIdAsc()) entityManager.refresh(tier);
        return new Snapshot(p.getRevision(), plans(p), tierService.getAllTiers(), p.getUpdatedAt());
    }
    public RentalPlan plan(Snapshot snapshot, String key, boolean requireActive) {
        String normalized = key == null ? "" : key.trim().toLowerCase(Locale.ROOT);
        RentalPlan plan = snapshot.plans().stream().filter(p -> p.key().equals(normalized)).findFirst().orElseThrow(() -> new IllegalArgumentException("Gói thuê không tồn tại."));
        if (requireActive && !plan.active()) throw new ResponseStatusException(HttpStatus.CONFLICT, "Gói " + plan.label() + " đã tạm ngừng. Vui lòng chọn gói khác.");
        return plan;
    }
    public int price(Snapshot snapshot, String key, Book book, boolean requireActive) {
        RentalPlan plan = plan(snapshot, key, requireActive);
        double amount = plan.useBookPrice() && book != null && book.getRent_price() != null && book.getRent_price() > 0 ? book.getRent_price() : plan.priceKhoai();
        if (!Double.isFinite(amount) || amount > 1000000 || amount < 0) throw new IllegalArgumentException("Giá thuê không hợp lệ.");
        return (int) Math.round(amount);
    }
    @Transactional
    public Snapshot update(Update update) {
        CommercePolicy state = policies.lockForUpdate().orElseThrow(() -> new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Chính sách chưa sẵn sàng."));
        if (update == null || update.revision() != state.getRevision()) throw new ResponseStatusException(HttpStatus.CONFLICT, "Cấu hình đã được cập nhật ở nơi khác. Hãy tải lại trước khi lưu.");
        validatePlans(update.plans());
        List<MembershipTier> existing = tiers.findAllByOrderByTierIdAsc();
        validateTiers(update.tiers());

        MembershipTier baseTier = existing.isEmpty() ? null : existing.getFirst();

        // 1. Xử lý các hạng bị xóa
        Set<Integer> incomingIds = update.tiers().stream()
                .map(TierDto::getTierId)
                .filter(id -> id > 0)
                .collect(Collectors.toSet());

        List<MembershipTier> toDelete = existing.stream()
                .filter(e -> !incomingIds.contains(e.getTierId()))
                .toList();

        MembershipTier fallbackTier = existing.stream()
                .filter(e -> incomingIds.contains(e.getTierId()))
                .min(Comparator.comparingInt(TierServiceImpl::rank))
                .orElse(baseTier);

        for (MembershipTier deletedTier : toDelete) {
            if (entityManager != null && fallbackTier != null && deletedTier.getTierId() != fallbackTier.getTierId()) {
                entityManager.createQuery("UPDATE Customer c SET c.membershipTier = :fallback WHERE c.membershipTier = :deleted")
                        .setParameter("fallback", fallbackTier)
                        .setParameter("deleted", deletedTier)
                        .executeUpdate();
            }
            tiers.delete(deletedTier);
        }

        // 2. Xử lý cập nhật và thêm mới các hạng
        List<TierDto> orderedInputs = update.tiers().stream()
                .sorted(Comparator.comparingInt(TierDto::getRankOrder))
                .toList();

        List<MembershipTier> toSave = new ArrayList<>();
        for (int i = 0; i < orderedInputs.size(); i++) {
            TierDto input = orderedInputs.get(i);
            int rank = i + 1;
            MembershipTier tier;
            if (input.getTierId() > 0) {
                tier = existing.stream().filter(t -> t.getTierId() == input.getTierId()).findFirst().orElseGet(MembershipTier::new);
            } else {
                tier = new MembershipTier();
            }
            tier.setRankOrder(rank);
            tier.setTierName(input.getTierName().trim());
            tier.setMinBooksRequired(input.getMinBooksRequired());
            tier.setMinPotatoRequired(input.getMinPotatoRequired());
            tier.setDiscountPercent(input.getDiscountPercent());
            tier.setBadgeIcon(input.getBadgeIcon() != null && !input.getBadgeIcon().isBlank() ? input.getBadgeIcon() : "🌱");
            tier.setDescription(input.getDescription() != null ? input.getDescription() : "");
            tier.setUpgradeReward(input.getUpgradeReward());
            tier.setBenefitsJson(encode(input.getBenefits() != null ? input.getBenefits() : List.of()));
            toSave.add(tier);
        }
        tiers.saveAll(toSave);
        tiers.flush();

        state.setRentalPlansJson(encode(update.plans()));
        state.setRevision(Math.addExact(state.getRevision(), 1));
        state.setUpdatedAt(Instant.now());
        policies.saveAndFlush(state);
        return new Snapshot(state.getRevision(), plans(state), tierService.getAllTiers(), state.getUpdatedAt());
    }
    public static void validatePlans(List<RentalPlan> plans) {
        if (plans != null && plans.stream().anyMatch(Objects::isNull)) bad("Gói thuê không hợp lệ.");
        if (plans == null || plans.size() != DURATIONS.size() || !new HashSet<>(plans.stream().map(RentalPlan::key).toList()).equals(DURATIONS.keySet()) || plans.stream().noneMatch(RentalPlan::active)) bad("Cần đủ 8 kỳ hạn chuẩn và ít nhất một gói đang mở.");
        for (RentalPlan p : plans) if (p.label() == null || p.label().isBlank() || p.label().length() > 80 || p.durationDays() != DURATIONS.getOrDefault(p.key(), -1)
            || p.priceKhoai() < 0 || p.priceKhoai() > 1000000 || p.orderIndex() < 0 || p.orderIndex() > 1000 || (p.useBookPrice() && !"forever".equals(p.key()))) bad("Kỳ hạn, giá hoặc cách tính giá không hợp lệ.");
    }
    public static void validateTiers(List<TierDto> inputs, List<MembershipTier> existing) {
        validateTiers(inputs);
    }
    public static void validateTiers(List<TierDto> inputs) {
        if (inputs != null && inputs.stream().anyMatch(Objects::isNull)) bad("Hạng không hợp lệ.");
        if (inputs == null || inputs.isEmpty()) bad("Danh sách hạng không được để trống.");
        List<TierDto> ordered = inputs.stream().sorted(Comparator.comparingInt(TierDto::getRankOrder)).toList();
        int previousBooks = -1, previousXp = -1;
        Set<String> names = new HashSet<>();
        for (TierDto t : ordered) {
            if (t.getTierName() == null || t.getTierName().isBlank() || t.getTierName().length() > 100
                || !names.add(t.getTierName().trim().toLowerCase(Locale.ROOT)) || t.getMinBooksRequired() == null || t.getMinPotatoRequired() == null || t.getDiscountPercent() == null
                || t.getMinBooksRequired() < 0 || t.getMinBooksRequired() > 1000000 || t.getMinPotatoRequired() < 0 || t.getMinPotatoRequired() > 100000000
                || t.getDiscountPercent() < 0 || t.getDiscountPercent() > 100 || t.getUpgradeReward() < 0 || t.getUpgradeReward() > 100000
                || (t.getDescription() != null && t.getDescription().length() > 255) || (t.getBadgeIcon() != null && t.getBadgeIcon().length() > 100)
                || t.getBenefits() == null || t.getBenefits().size() > 20 || t.getBenefits().stream().anyMatch(b -> b == null || b.isBlank() || b.length() > 300)) bad("Thông tin hạng hoặc quyền lợi không hợp lệ.");
            if (previousBooks < 0 ? t.getMinBooksRequired() != 0 || t.getMinPotatoRequired() != 0 : t.getMinBooksRequired() <= previousBooks || t.getMinPotatoRequired() <= previousXp) bad("Hạng đầu có ngưỡng 0; ngưỡng sách và XP phải tăng dần theo hạng.");
            previousBooks = t.getMinBooksRequired(); previousXp = t.getMinPotatoRequired();
        }
    }
    private static void bad(String message) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
}
