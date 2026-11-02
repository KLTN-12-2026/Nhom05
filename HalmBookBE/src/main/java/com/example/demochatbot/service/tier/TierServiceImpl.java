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
import jakarta.annotation.PostConstruct;
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

    @Autowired
    private MembershipTierRepository membershipTierRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private AccessRecordRepository accessRecordRepository;

    @Autowired
    private PotatoTransactionRepository potatoTransactionRepository;

    /**
     * Khởi tạo dữ liệu mẫu 4 cấp bậc hội viên nếu hệ thống chưa có
     */
    @PostConstruct
    @Transactional
    public void initDefaultTiersIfEmpty() {
        if (membershipTierRepository.count() == 0) {
            List<MembershipTier> defaultTiers = List.of(
                    new MembershipTier(0, "Thợ Cày", 0, 0, 0, "🌱", "Cấp bậc khởi đầu của độc giả HALM BOOK. Trải nghiệm hệ sinh thái đọc thử và mượn sách linh hoạt.", null),
                    new MembershipTier(0, "Cao Thủ Cày", 10, 500, 5, "🚜", "Hạng Bạc Tri Thức. Giảm 5% phí thuê sách trọn đời, mở khóa huy hiệu Bạc danh dự.", null),
                    new MembershipTier(0, "Lão Nông", 50, 2500, 10, "🌾", "Hạng Vàng Tinh Hoa. Giảm 10% phí thuê sách trọn đời, miễn phí 1 cuốn mỗi tháng và hỗ trợ VIP 24/7.", null),
                    new MembershipTier(0, "Đại Điền Chủ", 150, 10000, 20, "👑", "Hạng Hoàng Gia VIP Tối Thượng. Giảm 20% phí thuê sách trọn đời, miễn cọc trọn đời và hộp quà ấn bản bìa cứng hàng năm.", null)
            );
            membershipTierRepository.saveAll(defaultTiers);
        }
    }

    private List<String> getBenefitsForTier(String tierName) {
        String name = tierName != null ? tierName.trim() : "";
        if (name.contains("Đại Điền Chủ")) {
            return List.of(
                    "Giảm 20% toàn bộ dịch vụ và phí thuê sách trọn đời",
                    "Hộp quà ấn bản sách bìa cứng mạ vàng trao tận tay hàng năm",
                    "Miễn phí 100% tiền cọc sách vật lý và e-book",
                    "Đọc trước các tác phẩm mới xuất bản trước 14 ngày",
                    "Chuyên viên chăm sóc khách hàng VIP riêng 1-1",
                    "Khung 3D Hoàng Gia Ánh Kim biểu tượng vương giả trên hệ thống"
            );
        } else if (name.contains("Lão Nông")) {
            return List.of(
                    "Chiết khấu 10% toàn bộ dịch vụ và thuê sách trọn đời",
                    "Miễn phí 1 cuốn sách mỗi tháng do ban biên tập tuyển chọn",
                    "Khung avatar Tinh Hoa vàng kim lấp lánh độc quyền",
                    "Đọc trước các tác phẩm mới xuất bản trước 7 ngày",
                    "Đường dây nóng hỗ trợ độc quyền 24/7"
            );
        } else if (name.contains("Cao Thủ Cày")) {
            return List.of(
                    "Giảm trực tiếp 5% trên toàn bộ hóa đơn thuê sách trọn đời",
                    "Huy hiệu Bạc danh dự hiển thị cạnh tên tài khoản",
                    "Đọc trước các tác phẩm mới xuất bản trước 3 ngày",
                    "Ưu tiên hàng đợi hỗ trợ khách hàng trong vòng 2 giờ"
            );
        } else {
            return List.of(
                    "Đọc thử miễn phí hơn 10.000 tác phẩm kinh điển",
                    "Tích lũy điểm cày XP qua từng đầu sách",
                    "Nhận Khoai thưởng điểm danh hằng ngày",
                    "Bảo lưu vĩnh viễn mọi thứ hạng đạt được"
            );
        }
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
                .benefits(getBenefitsForTier(tier.getTierName()))
                .build();
    }

    @Override
    public List<TierDto> getAllTiers() {
        return membershipTierRepository.findAllByOrderByTierIdAsc()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Tính tổng điểm cày (XP) của độc giả:
     * XP = Khoai tích lũy (totalPotatoEarned) + (Số sách trong tủ * 50 XP) + (Streak * 20 XP)
     */
    private int calculateTotalPoints(Customer customer, int booksReadCount) {
        int earnedPotato = customer.getTotalPotatoEarned() != null ? customer.getTotalPotatoEarned() : 0;
        int streak = customer.getStreakDays() != null ? customer.getStreakDays() : 0;
        return earnedPotato + (booksReadCount * 50) + (streak * 20);
    }

    @Override
    @Transactional
    public CustomerTierSummaryDto getCustomerTierSummary(String customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin khách hàng với mã: " + customerId));

        // 1. Tự động kiểm tra và cập nhật hạng mới nhất
        MembershipTier currentTier = calculateAndUpdateCustomerTier(customer);

        // 2. Lấy danh sách toàn bộ các hạng
        List<MembershipTier> allTiersEntities = membershipTierRepository.findAllByOrderByTierIdAsc();
        List<TierDto> allTiers = allTiersEntities.stream().map(this::mapToDto).collect(Collectors.toList());

        // 3. Đếm số sách đã thuê/đọc
        int booksReadCount = (int) accessRecordRepository.countByCustomer(customer);

        // 4. Tính điểm cày (XP)
        int totalPoints = calculateTotalPoints(customer, booksReadCount);

        // 5. Xác định hạng kế tiếp
        MembershipTier nextTierEntity = null;
        for (MembershipTier tier : allTiersEntities) {
            if (tier.getTierId() > currentTier.getTierId()) {
                nextTierEntity = tier;
                break;
            }
        }

        boolean isMaxTier = (nextTierEntity == null);
        int booksRequiredForNext = isMaxTier ? currentTier.getMinBooksRequired() : nextTierEntity.getMinBooksRequired();
        int booksRemainingForNext = isMaxTier ? 0 : Math.max(0, booksRequiredForNext - booksReadCount);
        double progressPercentBooks = isMaxTier ? 100.0 : Math.min(100.0, Math.round(((double) booksReadCount / booksRequiredForNext) * 1000.0) / 10.0);

        int pointsRequiredForNext = isMaxTier ? currentTier.getMinPotatoRequired() : nextTierEntity.getMinPotatoRequired();
        int pointsRemainingForNext = isMaxTier ? 0 : Math.max(0, pointsRequiredForNext - totalPoints);
        double progressPercentPoints = isMaxTier ? 100.0 : Math.min(100.0, Math.round(((double) totalPoints / pointsRequiredForNext) * 1000.0) / 10.0);

        // Tiến trình tổng quát là max giữa tiến độ sách và tiến độ điểm
        double overallProgress = isMaxTier ? 100.0 : Math.max(progressPercentBooks, progressPercentPoints);

        // Kiểm tra xem hôm nay đã điểm danh streak chưa
        boolean hasCheckedInToday = customer.getLastStreakDate() != null && customer.getLastStreakDate().equals(LocalDate.now());

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
                .streakDays(customer.getStreakDays() != null ? customer.getStreakDays() : 0)
                .hasCheckedInToday(hasCheckedInToday)
                .discountPercent(currentTier.getDiscountPercent() != null ? currentTier.getDiscountPercent() : 0)
                .potatoBalance(customer.getPotatoBalance() != null ? customer.getPotatoBalance() : 0)
                .isPermanentProtected(true)
                .allTiers(allTiers)
                .build();
    }

    @Override
    @Transactional
    public MembershipTier calculateAndUpdateCustomerTier(Customer customer) {
        if (customer == null) return null;

        List<MembershipTier> tiers = membershipTierRepository.findAllByOrderByTierIdAsc();
        if (tiers.isEmpty()) return null;

        int booksCount = (int) accessRecordRepository.countByCustomer(customer);
        int points = calculateTotalPoints(customer, booksCount);

        // Duyệt từ hạng cao nhất xuống hạng thấp nhất để tìm hạng cao nhất đủ điều kiện
        MembershipTier earnedTier = tiers.get(0); // Mặc định là Tier 1 (Thợ Cày)
        for (int i = tiers.size() - 1; i >= 0; i--) {
            MembershipTier t = tiers.get(i);
            int minBooks = t.getMinBooksRequired() != null ? t.getMinBooksRequired() : 0;
            int minPoints = t.getMinPotatoRequired() != null ? t.getMinPotatoRequired() : 0;

            // Đạt điều kiện sách HOẶC đạt điều kiện điểm cày
            if ((minBooks > 0 && booksCount >= minBooks) || (minPoints > 0 && points >= minPoints)) {
                earnedTier = t;
                break;
            }
        }

        MembershipTier currentTier = customer.getMembershipTier();

        // CHÍNH SÁCH BẢO LƯU VĨNH VIỄN: Chỉ thăng cấp lên hạng cao hơn, tuyệt đối không bị giáng cấp!
        if (currentTier == null || earnedTier.getTierId() > currentTier.getTierId()) {
            customer.setMembershipTier(earnedTier);
            customerRepository.save(customer);

            // Nếu đây là lần thăng cấp thực sự, thưởng Khoai chào mừng hạng mới
            if (currentTier != null && earnedTier.getTierId() > currentTier.getTierId()) {
                int bonusPotato = earnedTier.getTierId() == 2 ? 50 : (earnedTier.getTierId() == 3 ? 150 : 500);
                int newBal = (customer.getPotatoBalance() != null ? customer.getPotatoBalance() : 0) + bonusPotato;
                customer.setPotatoBalance(newBal);
                customer.setTotalPotatoEarned((customer.getTotalPotatoEarned() != null ? customer.getTotalPotatoEarned() : 0) + bonusPotato);
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

        return currentTier;
    }

    @Override
    @Transactional
    public Map<String, Object> checkinDailyStreak(String customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng!"));

        LocalDate today = LocalDate.now();
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
        result.put("potatoBalance", newBal);
        result.put("tierName", updatedTier != null ? updatedTier.getTierName() : "Thợ Cày");
        result.put("tierBadge", updatedTier != null ? updatedTier.getBadgeIcon() : "🌱");

        return result;
    }

    @Override
    @Transactional
    public void addExperiencePoints(Customer customer, int points, String reason) {
        if (customer == null || points <= 0) return;
        int currentTotal = customer.getTotalPotatoEarned() != null ? customer.getTotalPotatoEarned() : 0;
        customer.setTotalPotatoEarned(currentTotal + points);
        customerRepository.save(customer);
        calculateAndUpdateCustomerTier(customer);
    }
}
