package com.example.demochatbot.service.tier;

import com.example.demochatbot.dto.CustomerTierSummaryDto;
import com.example.demochatbot.dto.TierDto;
import com.example.demochatbot.model.Customer;
import com.example.demochatbot.model.MembershipTier;
import com.example.demochatbot.model.PotatoTransaction;
import com.example.demochatbot.repository.AccessRecordRepository;
import com.example.demochatbot.repository.CustomerRepository;
import com.example.demochatbot.repository.MembershipTierRepository;
import com.example.demochatbot.repository.PotatoTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ============================================================================
 * Implementation: TierServiceImpl
 * Hiện thực toàn bộ logic tính điểm cày (XP), xếp hạng thành viên,
 * tự động thăng hạng và cam kết bảo lưu vĩnh viễn quyền lợi cho độc giả.
 * ============================================================================
 */
@Service
public class TierServiceImpl implements TierService {
    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    @Autowired
    private MembershipTierRepository membershipTierRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private AccessRecordRepository accessRecordRepository;

    @Autowired
    private PotatoTransactionRepository potatoTransactionRepository;

    /**
     * Khởi tạo hoặc cập nhật đồng bộ 4 cấp bậc hội viên chuẩn xác trong cơ sở dữ liệu
     */
    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    @org.springframework.core.annotation.Order(0)
    @Transactional
    public void initDefaultTiersIfEmpty() {
        if (membershipTierRepository.count() > 0) return;
        syncTier("Thợ Cày", 0, 0, 0, "🌱", "Cấp bậc khởi đầu của độc giả HALM BOOK. Trải nghiệm hệ sinh thái đọc thử và mượn sách linh hoạt.");
        syncTier("Cao Thủ Cày", 10, 500, 5, "🚜", "Hạng Bạc Tri Thức. Giảm 5% phí thuê sách trọn đời, mở khóa huy hiệu Bạc danh dự.");
        syncTier("Lão Nông", 50, 2500, 10, "🌾", "Hạng Vàng Tinh Hoa. Giảm 10% phí thuê sách trọn đời, miễn phí 1 cuốn mỗi tháng và hỗ trợ VIP 24/7.");
        syncTier("Đại Điền Chủ", 150, 10000, 20, "👑", "Hạng Hoàng Gia VIP Tối Thượng. Giảm 20% phí thuê sách trọn đời, miễn cọc trọn đời và hộp quà ấn bản bìa cứng hàng năm.");
    }

    private void syncTier(String name, int minBooks, int minPotato, int discount, String icon, String desc) {
        List<MembershipTier> existing = membershipTierRepository.findAll();
        MembershipTier target = null;
        for (MembershipTier t : existing) {
            if (t.getTierName() != null && t.getTierName().trim().equalsIgnoreCase(name.trim())) {
                target = t;
                break;
            }
        }
        if (target == null) {
            target = new MembershipTier(0, name, minBooks, minPotato, discount, icon, desc, null);
        } else {
            target.setMinBooksRequired(minBooks);
            target.setMinPotatoRequired(minPotato);
            target.setDiscountPercent(discount);
            target.setBadgeIcon(icon);
            target.setDescription(desc);
        }
        membershipTierRepository.save(target);
    }

    public static int rank(MembershipTier tier) {
        if (tier == null) return 0;
        return tier.getRankOrder() != null && tier.getRankOrder() > 0 ? tier.getRankOrder() : getTierRank(tier.getTierName());
    }
    private List<MembershipTier> orderedTiers() {
        return membershipTierRepository.findAllByOrderByTierIdAsc().stream()
            .sorted(Comparator.comparingInt(TierServiceImpl::rank).thenComparingInt(MembershipTier::getTierId)).toList();
    }
    private int upgradeReward(MembershipTier tier) {
        return tier.getUpgradeReward() != null ? tier.getUpgradeReward() : rank(tier) == 2 ? 50 : rank(tier) == 3 ? 150 : rank(tier) >= 4 ? 500 : 0;
    }
    private List<String> getBenefitsForTier(MembershipTier tier) {
        if (tier.getBenefitsJson() != null) {
            try { return new com.fasterxml.jackson.databind.ObjectMapper().readValue(tier.getBenefitsJson(), new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {}); }
            catch (Exception e) { throw new IllegalStateException("Không đọc được quyền lợi hạng thành viên.", e); }
        }
        return List.of("Bảo lưu hạng đã đạt", "Tích lũy XP qua hoạt động đọc sách và nhiệm vụ");
    }

    private TierDto mapToDto(MembershipTier tier) {
        if (tier == null) return null;
        return TierDto.builder()
                .tierId(tier.getTierId())
                .tierName(tier.getTierName())
                .minBooksRequired(tier.getMinBooksRequired() != null ? tier.getMinBooksRequired() : 0)
                .minPotatoRequired(tier.getMinPotatoRequired() != null ? tier.getMinPotatoRequired() : 0)
                .discountPercent(tier.getDiscountPercent() != null ? tier.getDiscountPercent() : 0)
                .badgeIcon(tier.getBadgeIcon() != null ? tier.getBadgeIcon() : "🌱")
                .description(tier.getDescription())
                .benefits(getBenefitsForTier(tier))
                .rankOrder(rank(tier)).upgradeReward(upgradeReward(tier))
                .badgeSubtitle("Cấp " + rank(tier))
                .requirementsText(rank(tier) == 1 ? "Tạo tài khoản" : "Đạt " + tier.getMinBooksRequired() + " cuốn hoặc " + tier.getMinPotatoRequired() + " XP")
                .build();
    }

    @Override
    public List<TierDto> getAllTiers() {
        return orderedTiers()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public static int getTierRank(String tierName) {
        if (tierName == null) return 1;
        String upper = tierName.toUpperCase();
        if (upper.contains("ĐẠI ĐIỀN") || upper.contains("DAI DIEN") || upper.contains("TOI THUONG") || upper.contains("TỐI THƯỢNG") || upper.contains("HOANG GIA") || upper.contains("HOÀNG GIA") || upper.contains("TIER 4") || upper.contains("TIER4")) return 4;
        if (upper.contains("LÃO NÔNG") || upper.contains("LAO NONG") || upper.contains("TINH HOA") || upper.contains("TIER 3") || upper.contains("TIER3")) return 3;
        if (upper.contains("CAO THỦ") || upper.contains("CAO THU") || upper.contains("TRI THUC") || upper.contains("TRI THỨC") || upper.contains("TIER 2") || upper.contains("TIER2")) return 2;
        return 1;
    }

    /**
     * Tính tổng điểm cày (XP) của độc giả:
     * XP = Khoai tích lũy hoặc Số dư ví thực tế (lấy max) + (Số sách trong tủ * 50 XP) + (Streak * 20 XP)
     */
    @Override
    public int getTotalPoints(Customer customer) {
        return calculateTotalPoints(customer, (int) accessRecordRepository.countByCustomer(customer));
    }

    private int calculateTotalPoints(Customer customer, int booksReadCount) {
        int earnedPotato = customer.getTotalPotatoEarned() != null ? customer.getTotalPotatoEarned() : 0;
        int balance = customer.getPotatoBalance() != null ? customer.getPotatoBalance() : 0;
        int effectivePotato = Math.max(earnedPotato, balance);
        int streak = customer.getStreakDays() != null ? customer.getStreakDays() : 0;
        return (int) Math.min(Integer.MAX_VALUE, (long) effectivePotato + (long) booksReadCount * 50 + (long) streak * 20);
    }

    @Override
    @Transactional
    public CustomerTierSummaryDto getCustomerTierSummary(String customerId) {
        Customer customer = customerRepository.findByIdForUpdate(customerId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin khách hàng với mã: " + customerId));
        if (entityManager != null) entityManager.refresh(customer, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);

        // 1. Tự động kiểm tra và cập nhật hạng mới nhất
        MembershipTier currentTier = calculateAndUpdateCustomerTier(customer);

        // 2. Lấy danh sách toàn bộ các hạng
        List<MembershipTier> allTiersEntities = orderedTiers();
        List<TierDto> allTiers = allTiersEntities.stream().map(this::mapToDto).collect(Collectors.toList());

        // 3. Đếm số sách đã thuê/đọc
        int booksReadCount = (int) accessRecordRepository.countByCustomer(customer);

        // 4. Tính điểm cày (XP)
        int totalPoints = calculateTotalPoints(customer, booksReadCount);

        // 5. Xác định hạng kế tiếp
        int currentRank = currentTier != null ? rank(currentTier) : 1;
        MembershipTier nextTierEntity = null;
        for (MembershipTier tier : allTiersEntities) {
            int r = rank(tier);
            if (r > currentRank) {
                if (nextTierEntity == null || r < rank(nextTierEntity)) {
                    nextTierEntity = tier;
                }
            }
        }

        boolean isMaxTier = nextTierEntity == null;
        int booksRequiredForNext = isMaxTier ? (currentTier != null ? currentTier.getMinBooksRequired() : 150) : nextTierEntity.getMinBooksRequired();
        int booksRemainingForNext = isMaxTier ? 0 : Math.max(0, booksRequiredForNext - booksReadCount);
        double progressPercentBooks = isMaxTier ? 100.0 : Math.min(100.0, Math.round(((double) booksReadCount / booksRequiredForNext) * 1000.0) / 10.0);

        int pointsRequiredForNext = isMaxTier ? (currentTier != null ? currentTier.getMinPotatoRequired() : 10000) : nextTierEntity.getMinPotatoRequired();
        int pointsRemainingForNext = isMaxTier ? 0 : Math.max(0, pointsRequiredForNext - totalPoints);
        double progressPercentPoints = isMaxTier ? 100.0 : Math.min(100.0, Math.round(((double) totalPoints / pointsRequiredForNext) * 1000.0) / 10.0);

        // Tiến trình tổng quát là max giữa tiến độ sách và tiến độ điểm
        double overallProgress = isMaxTier ? 100.0 : Math.max(progressPercentBooks, progressPercentPoints);

        // Kiểm tra xem hôm nay đã điểm danh streak chưa
        LocalDate today = LocalDate.now(com.example.demochatbot.service.mission.MissionService.ZONE);
        boolean hasCheckedInToday = customer.getLastStreakDate() != null && customer.getLastStreakDate().equals(today);

        // Kiểm tra tính hợp lệ của chuỗi Streak: nếu ngày cuối điểm danh trước ngày hôm qua, chuỗi đã đứt
        int effectiveStreak = customer.getStreakDays() != null ? customer.getStreakDays() : 0;
        if (customer.getLastStreakDate() != null) {
            if (!customer.getLastStreakDate().equals(today) && !customer.getLastStreakDate().equals(today.minusDays(1))) {
                effectiveStreak = 0;
            }
        } else {
            effectiveStreak = 0;
        }

        // Format Member ID đẹp: HALM-C00007-VN
        String memberCode = "HALM-" + customer.getCustomer_id() + "-VN";

        return CustomerTierSummaryDto.builder()
                .customerId(customer.getCustomer_id())
                .formattedMemberCode(memberCode)
                .customerName(customer.getCustomerName())
                .avatarUrl(customer.getAvatarUrl() != null ? customer.getAvatarUrl() : customer.getAvatar())
                .currentTier(mapToDto(currentTier))
                .nextTier(mapToDto(nextTierEntity))
                .isMaxTier(isMaxTier)
                .booksReadCount(booksReadCount)
                .booksRequiredForNext(booksRequiredForNext)
                .booksRemainingForNext(booksRemainingForNext)
                .progressPercentBooks(progressPercentBooks)
                .totalPoints(totalPoints)
                .pointsRequiredForNext(pointsRequiredForNext)
                .pointsRemainingForNext(pointsRemainingForNext)
                .progressPercentPoints(progressPercentPoints)
                .overallProgressPercent(overallProgress)
                .streakDays(effectiveStreak)
                .hasCheckedInToday(hasCheckedInToday)
                .discountPercent(currentTier != null && currentTier.getDiscountPercent() != null ? currentTier.getDiscountPercent() : 0)
                .potatoBalance(customer.getPotatoBalance() != null ? customer.getPotatoBalance() : 0)
                .isPermanentProtected(true)
                .allTiers(allTiers)
                .build();
    }

    @Override
    @Transactional
    public MembershipTier calculateAndUpdateCustomerTier(Customer customer) {
        if (customer == null) return null;

        List<MembershipTier> tiers = orderedTiers();
        if (tiers.isEmpty()) return null;

        int booksCount = (int) accessRecordRepository.countByCustomer(customer);
        int points = calculateTotalPoints(customer, booksCount);

        // Đồng bộ totalPotatoEarned nếu số dư thực tế trong ví lớn hơn
        int currentBal = customer.getPotatoBalance() != null ? customer.getPotatoBalance() : 0;
        int currentEarned = customer.getTotalPotatoEarned() != null ? customer.getTotalPotatoEarned() : 0;
        if (currentBal > currentEarned) {
            customer.setTotalPotatoEarned(currentBal);
        }

        MembershipTier earnedTier = tiers.getFirst();
        for (MembershipTier tier : tiers) {
            int requiredBooks = tier.getMinBooksRequired() == null ? 0 : tier.getMinBooksRequired();
            int requiredXp = tier.getMinPotatoRequired() == null ? 0 : tier.getMinPotatoRequired();
            if (booksCount >= requiredBooks || points >= requiredXp) earnedTier = tier;
        }

        MembershipTier currentTier = customer.getMembershipTier();
        int currentRank = currentTier != null ? rank(currentTier) : 0;
        int earnedRank = rank(earnedTier);

        // CHÍNH SÁCH BẢO LƯU VĨNH VIỄN: Chỉ thăng cấp lên hạng cao hơn, tuyệt đối không bị giáng cấp!
        if (currentTier == null || earnedRank > currentRank) {
            customer.setMembershipTier(earnedTier);
            customerRepository.save(customer);

            // Nếu đây là lần thăng cấp thực sự, thưởng Khoai chào mừng hạng mới
            if (currentTier != null && earnedRank > currentRank) {
                int bonusPotato = upgradeReward(earnedTier);
                int newBal = Math.addExact(customer.getPotatoBalance() != null ? customer.getPotatoBalance() : 0, bonusPotato);
                customer.setPotatoBalance(newBal);
                customer.setTotalPotatoEarned(Math.addExact(customer.getTotalPotatoEarned() != null ? customer.getTotalPotatoEarned() : 0, bonusPotato));
                customerRepository.save(customer);

                // Ghi nhận biến động sổ cái
                PotatoTransaction tx = new PotatoTransaction();
                tx.setCustomer(customer);
                tx.setAmount(bonusPotato);
                tx.setBalanceAfter(newBal);
                tx.setType("TIER_UP_REWARD");
                tx.setDescription("Thưởng thăng hạng: Chúc mừng bạn đạt cấp bậc " + earnedTier.getTierName() + " " + earnedTier.getBadgeIcon());
                tx.setCreatedAt(LocalDateTime.now());
                potatoTransactionRepository.save(tx);
            }
            return earnedTier;
        }

        if (currentTier != null) {
            MembershipTier configured = tiers.stream().filter(t -> t.getTierId() == currentTier.getTierId()).findFirst().orElse(currentTier);
            return configured;
        }
        return currentTier;
    }

    @Override
    @Transactional
    public Map<String, Object> checkinDailyStreak(String customerId) {
        Customer customer = customerRepository.findByIdForUpdate(customerId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng!"));
        if (entityManager != null) entityManager.refresh(customer, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);

        LocalDate today = LocalDate.now(com.example.demochatbot.service.mission.MissionService.ZONE);
        LocalDate lastStreak = customer.getLastStreakDate();

        Map<String, Object> result = new HashMap<>();

        if (lastStreak != null && lastStreak.equals(today)) {
            result.put("success", false);
            result.put("message", "Hôm nay bạn đã điểm danh và nhận thưởng rồi! Hãy quay lại vào ngày mai nhé.");
            result.put("streakDays", customer.getStreakDays() != null ? customer.getStreakDays() : 0);
            result.put("potatoBalance", customer.getPotatoBalance() != null ? customer.getPotatoBalance() : 0);
            return result;
        }

        // Tính toán streak
        int newStreak = 1;
        if (lastStreak != null && lastStreak.equals(today.minusDays(1))) {
            newStreak = (customer.getStreakDays() != null ? customer.getStreakDays() : 0) + 1;
        }

        // Điểm thưởng: Gốc +5 Khoai
        int earnedPotato = 5;
        // Nếu chuỗi ngày chạm mốc bội số của 7 (7, 14, 21, 28...), thưởng thêm +20 Khoai
        if (newStreak % 7 == 0) {
            earnedPotato += 20;
        }

        int currentBal = customer.getPotatoBalance() != null ? customer.getPotatoBalance() : 0;
        int currentEarned = customer.getTotalPotatoEarned() != null ? customer.getTotalPotatoEarned() : 0;

        int newBal = currentBal + earnedPotato;
        customer.setPotatoBalance(newBal);
        customer.setTotalPotatoEarned(currentEarned + earnedPotato);
        customer.setStreakDays(newStreak);
        customer.setLastStreakDate(today);

        customerRepository.save(customer);

        // Lưu bản ghi giao dịch
        PotatoTransaction tx = new PotatoTransaction();
        tx.setCustomer(customer);
        tx.setAmount(earnedPotato);
        tx.setBalanceAfter(newBal);
        tx.setType("DAILY_CHECKIN");
        tx.setDescription("Điểm danh đọc sách hằng ngày (Chuỗi " + newStreak + " ngày liên tiếp 🔥)");
        tx.setCreatedAt(LocalDateTime.now());
        potatoTransactionRepository.save(tx);

        // Kiểm tra tự động thăng hạng sau khi nhận điểm
        MembershipTier updatedTier = calculateAndUpdateCustomerTier(customer);

        result.put("success", true);
        result.put("message", "Điểm danh thành công! Nhận +" + earnedPotato + " Khoai Tây và +20 Điểm cày (XP) 🔥");
        result.put("streakDays", newStreak);
        result.put("earnedPotato", earnedPotato);
        result.put("potatoBalance", customer.getPotatoBalance());
        result.put("tierName", updatedTier != null ? updatedTier.getTierName() : "Thợ Cày");
        result.put("tierBadge", updatedTier != null ? updatedTier.getBadgeIcon() : "🌱");

        return result;
    }

    @Override
    @Transactional
    public void addExperiencePoints(Customer customer, int points, String reason) {
        if (customer == null || points <= 0) return;
        int currentTotal = customer.getTotalPotatoEarned() != null ? customer.getTotalPotatoEarned() : 0;
        customer.setTotalPotatoEarned(Math.addExact(currentTotal, points));
        customerRepository.save(customer);
        calculateAndUpdateCustomerTier(customer);
    }
}
