package com.example.demochatbot.service.banner;

import com.example.demochatbot.dto.BannerDto;
import com.example.demochatbot.model.Banner;
import com.example.demochatbot.model.SiteSetting;
import com.example.demochatbot.repository.BannerRepository;
import com.example.demochatbot.repository.SiteSettingRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BannerServiceImpl implements BannerService {

    private final BannerRepository bannerRepository;
    private final SiteSettingRepository siteSettingRepository;
    private final ObjectMapper objectMapper;

    @PostConstruct
    public void initDefaultDataIfEmpty() {
        try {
            if (bannerRepository.count() == 0) {
                log.info("Kho dữ liệu Banner rỗng. Tiến hành khởi tạo 5 Banner mặc định vào CSDL...");
                seedDefaultBanners();
                seedDefaultAppBanners();
            }
            if (siteSettingRepository.count() == 0) {
                log.info("Kho dữ liệu Site Settings rỗng. Tiến hành khởi tạo các thiết lập mặc định vào CSDL...");
                seedDefaultSiteSettings();
            }
        } catch (Exception e) {
            log.error("Lỗi khi khởi tạo dữ liệu mặc định cho Banner / Site Settings: {}", e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<BannerDto> getActiveBanners(String platform) {
        return bannerRepository.findByPlatformAndIsActiveTrueOrderByOrderIndexAscIdAsc(normalizePlatform(platform))
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BannerDto> getAllBanners(String platform) {
        return bannerRepository.findByPlatformOrderByOrderIndexAscIdAsc(normalizePlatform(platform))
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BannerDto getBannerById(String id, String platform) {
        Banner banner = findInPlatform(id, platform);
        return toDto(banner);
    }

    @Override
    @Transactional
    public BannerDto createBanner(BannerDto dto) {
        dto.setPlatform(normalizePlatform(dto.getPlatform()));
        validateAppBanner(dto);
        dto.setId("banner-" + UUID.randomUUID());
        if (dto.getOrder() == null) {
            dto.setOrder(bannerRepository.findByPlatformOrderByOrderIndexAscIdAsc(dto.getPlatform()).stream()
                    .map(Banner::getOrderIndex).filter(Objects::nonNull).max(Integer::compareTo).orElse(0) + 1);
        }
        if (dto.getIsActive() == null) {
            dto.setIsActive(true);
        }

        Banner banner = toEntity(dto);
        banner.setCreatedAt(LocalDateTime.now());
        banner.setUpdatedAt(LocalDateTime.now());
        Banner saved = bannerRepository.save(banner);
        return toDto(saved);
    }

    @Override
    @Transactional
    public BannerDto updateBanner(String id, BannerDto dto, String platform) {
        Banner existing = findInPlatform(id, platform);
        if (dto.getPlatform() != null && !existing.getPlatform().equals(normalizePlatform(dto.getPlatform()))) {
            throw new IllegalArgumentException("Không thể chuyển banner sang kênh khác.");
        }

        updateEntityFromDto(existing, dto);
        validateAppBanner(toDto(existing));
        Banner saved = bannerRepository.save(existing);
        return toDto(saved);
    }

    @Override
    @Transactional
    public void toggleBannerStatus(String id, String platform) {
        Banner banner = findInPlatform(id, platform);
        banner.setIsActive(!Boolean.TRUE.equals(banner.getIsActive()));
        banner.setUpdatedAt(LocalDateTime.now());
        bannerRepository.save(banner);
    }

    @Override
    @Transactional
    public void deleteBanner(String id, String platform) {
        bannerRepository.delete(findInPlatform(id, platform));
    }

    @Override
    @Transactional
    public List<BannerDto> saveAllBanners(List<BannerDto> bannerDtos, String platform) {
        String channel = normalizePlatform(platform);
        List<Banner> existing = bannerRepository.findByPlatformOrderByOrderIndexAscIdAsc(channel);
        if (bannerDtos == null || bannerDtos.size() != existing.size()) {
            throw new IllegalArgumentException("Danh sách banner đã thay đổi. Vui lòng tải lại trước khi sắp xếp.");
        }
        Map<String, Banner> byId = existing.stream().collect(Collectors.toMap(Banner::getId, b -> b));
        Set<String> seen = new HashSet<>();
        // Validate first. Reordering never deletes records or overwrites banner content.
        for (BannerDto dto : bannerDtos) {
            if (dto == null || !byId.containsKey(dto.getId()) || !seen.add(dto.getId())
                    || (dto.getPlatform() != null && !channel.equals(normalizePlatform(dto.getPlatform())))) {
                throw new IllegalArgumentException("Danh sách chứa banner trùng hoặc không thuộc kênh " + channel);
            }
        }
        int order = 1;
        for (BannerDto dto : bannerDtos) {
            Banner banner = byId.get(dto.getId());
            banner.setOrderIndex(order++);
            banner.setUpdatedAt(LocalDateTime.now());
        }
        bannerRepository.saveAll(existing);
        return existing.stream().sorted(Comparator.comparing(Banner::getOrderIndex)).map(this::toDto).toList();
    }

    @Override
    @Transactional
    public List<BannerDto> resetDefaultBanners(String platform) {
        String channel = normalizePlatform(platform);
        bannerRepository.deleteAllInBatch(bannerRepository.findByPlatformOrderByOrderIndexAscIdAsc(channel));
        bannerRepository.flush();
        if ("APP".equals(channel)) seedDefaultAppBanners();
        else seedDefaultBanners();
        return getAllBanners(channel);
    }

    private static String normalizePlatform(String value) {
        String platform = value == null ? "WEB" : value.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("WEB", "APP").contains(platform)) {
            throw new IllegalArgumentException("Kênh banner phải là WEB hoặc APP.");
        }
        return platform;
    }

    private Banner findInPlatform(String id, String platform) {
        String channel = normalizePlatform(platform);
        return bannerRepository.findById(id).filter(b -> channel.equals(b.getPlatform()))
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy banner trong kênh " + channel));
    }

    private void validateAppBanner(BannerDto dto) {
        if (!"APP".equals(dto.getPlatform())) return;
        if (!Set.of("custom_image", "showcase").contains(Objects.toString(dto.getLayoutType(), ""))) {
            throw new IllegalArgumentException("Banner App hỗ trợ ảnh hoặc nội dung kèm ảnh.");
        }
        boolean pure = "custom_image".equals(dto.getLayoutType()) && "pure".equals(dto.getImageMode());
        String image = Objects.toString(dto.getImageUrl(), "");
        if (!image.isBlank() && !image.matches("(?is)^(https?://[^\\s]+|/(?!/)[^\\s]*|data:image/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=\\r\\n]+)$")) {
            throw new IllegalArgumentException("Ảnh App phải là URL ảnh hoặc ảnh PNG, JPG, WebP, GIF.");
        }
        if (pure && (dto.getImageUrl() == null || dto.getImageUrl().isBlank())) {
            throw new IllegalArgumentException("Vui lòng chọn ảnh cho banner.");
        }
        if (!pure && (dto.getTitle() == null || dto.getTitle().isBlank())) {
            throw new IllegalArgumentException("Vui lòng nhập tiêu đề banner.");
        }
        String link = Objects.toString(dto.getActionLink(), "");
        if (!link.isEmpty() && !Set.of("app:home", "app:offers", "app:categories", "app:search",
                "app:bookshelf", "app:profile", "app:payment", "app:chatbot", "app:leaderboard", "app:upload").contains(link)
                && !link.matches("book:[A-Za-z0-9_-]{1,64}")) {
            throw new IllegalArgumentException("Đích mở trên App không hợp lệ.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, String> getSiteSettings() {
        List<SiteSetting> list = siteSettingRepository.findAll();
        Map<String, String> map = new HashMap<>();
        for (SiteSetting setting : list) {
            map.put(setting.getSettingKey(), setting.getSettingValue());
        }
        return map;
    }

    @Override
    @Transactional
    public Map<String, String> saveSiteSettings(Map<String, String> settings) {
        if (settings == null) return Collections.emptyMap();
        List<SiteSetting> entities = new ArrayList<>();
        for (Map.Entry<String, String> entry : settings.entrySet()) {
            SiteSetting setting = siteSettingRepository.findById(entry.getKey())
                    .orElse(SiteSetting.builder().settingKey(entry.getKey()).build());
            setting.setSettingValue(entry.getValue());
            setting.setUpdatedAt(LocalDateTime.now());
            entities.add(setting);
        }
        siteSettingRepository.saveAll(entities);
        return getSiteSettings();
    }

    // =========================================================================
    // HELPER MAPPERS & SEED DATA
    // =========================================================================

    private void updateEntityFromDto(Banner existing, BannerDto dto) {
        if (dto == null || existing == null) return;
        if (dto.getLayoutType() != null) existing.setLayoutType(dto.getLayoutType());
        if (dto.getEyebrow() != null) existing.setEyebrow(dto.getEyebrow());
        if (dto.getTitle() != null) existing.setTitle(dto.getTitle());
        if (dto.getTitleHighlight() != null) existing.setTitleHighlight(dto.getTitleHighlight());
        if (dto.getDescription() != null) existing.setDescription(dto.getDescription());
        if (dto.getActionText() != null) existing.setActionText(dto.getActionText());
        if (dto.getActionLink() != null) existing.setActionLink(dto.getActionLink());
        if (dto.getIcon() != null) existing.setIcon(dto.getIcon());
        if (dto.getGradient() != null) existing.setGradient(dto.getGradient());
        if (dto.getImageUrl() != null) existing.setImageUrl(dto.getImageUrl());
        if (dto.getImageMode() != null) existing.setImageMode(dto.getImageMode());
        if (dto.getIsActive() != null) existing.setIsActive(dto.getIsActive());
        if (dto.getOrder() != null) existing.setOrderIndex(dto.getOrder());

        if (dto.getExtraProperties() != null && !dto.getExtraProperties().isEmpty()) {
            try {
                Map<String, Object> merged = new HashMap<>();
                if (existing.getExtraDataJson() != null && !existing.getExtraDataJson().trim().isEmpty()) {
                    try {
                        merged = objectMapper.readValue(existing.getExtraDataJson(), new TypeReference<Map<String, Object>>() {});
                    } catch (Exception ignored) {}
                }
                merged.putAll(dto.getExtraProperties());
                existing.setExtraDataJson(objectMapper.writeValueAsString(merged));
            } catch (Exception e) {
                log.error("Lỗi serialize extra properties cho banner {}: {}", existing.getId(), e.getMessage());
            }
        }
        existing.setUpdatedAt(LocalDateTime.now());
    }

    private BannerDto toDto(Banner entity) {
        if (entity == null) return null;
        BannerDto dto = BannerDto.builder()
                .id(entity.getId())
                .platform(entity.getPlatform())
                .layoutType(entity.getLayoutType())
                .eyebrow(entity.getEyebrow())
                .title(entity.getTitle())
                .titleHighlight(entity.getTitleHighlight())
                .description(entity.getDescription())
                .actionText(entity.getActionText())
                .actionLink(entity.getActionLink())
                .icon(entity.getIcon())
                .gradient(entity.getGradient())
                .imageUrl(entity.getImageUrl())
                .imageMode(entity.getImageMode())
                .isActive(entity.getIsActive())
                .order(entity.getOrderIndex())
                .build();

        if (entity.getExtraDataJson() != null && !entity.getExtraDataJson().trim().isEmpty()) {
            try {
                Map<String, Object> extra = objectMapper.readValue(entity.getExtraDataJson(), new TypeReference<Map<String, Object>>() {});
                if (extra != null) {
                    for (Map.Entry<String, Object> entry : extra.entrySet()) {
                        dto.setExtraProperty(entry.getKey(), entry.getValue());
                    }
                }
            } catch (Exception e) {
                log.warn("Lỗi deserialize extraDataJson cho banner {}: {}", entity.getId(), e.getMessage());
            }
        }
        return dto;
    }

    private Banner toEntity(BannerDto dto) {
        if (dto == null) return null;
        String extraJson = null;
        if (dto.getExtraProperties() != null && !dto.getExtraProperties().isEmpty()) {
            try {
                extraJson = objectMapper.writeValueAsString(dto.getExtraProperties());
            } catch (Exception e) {
                log.warn("Lỗi serialize extraProperties cho banner {}: {}", dto.getId(), e.getMessage());
            }
        }

        return Banner.builder()
                .id(dto.getId())
                .platform(normalizePlatform(dto.getPlatform()))
                .layoutType(dto.getLayoutType())
                .eyebrow(dto.getEyebrow())
                .title(dto.getTitle())
                .titleHighlight(dto.getTitleHighlight())
                .description(dto.getDescription())
                .actionText(dto.getActionText())
                .actionLink(dto.getActionLink())
                .icon(dto.getIcon())
                .gradient(dto.getGradient())
                .imageUrl(dto.getImageUrl())
                .imageMode(dto.getImageMode())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .orderIndex(dto.getOrder() != null ? dto.getOrder() : 0)
                .extraDataJson(extraJson)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private void seedDefaultBanners() {
        List<Banner> defaultList = new ArrayList<>();

        // Banner 1: Showcase
        try {
            List<Map<String, String>> books = List.of(
                    Map.of("title", "Tuổi thơ", "subtitle", "NUÔI DƯỠNG TRÍ TƯỞNG TƯỢNG", "color", "linear-gradient(145deg,#315b54,#7fac82)", "tag", "Nổi bật"),
                    Map.of("title", "Khám phá", "subtitle", "CHẠM ĐẾN CHÂN TRỜI MỚI", "color", "linear-gradient(145deg,#344b77,#8293c1)", "tag", "Mới nhất"),
                    Map.of("title", "Sáng tạo", "subtitle", "Ý TƯỞNG BẮT ĐẦU TỪ ĐÂY", "color", "linear-gradient(145deg,#783d67,#c17ca2)", "tag", "Top 1")
            );
            defaultList.add(Banner.builder()
                    .id("web-banner-" + UUID.randomUUID())
                    .layoutType("showcase")
                    .eyebrow("TUYỂN CHỌN DÀNH CHO BẠN")
                    .title("Một cuốn sách, ngàn cảm hứng")
                    .titleHighlight("Cùng HALM BOOK")
                    .description("Từ văn học, thiếu nhi đến khoa học và phát triển bản thân — bắt đầu với chủ đề khiến bạn tò mò nhất.")
                    .actionText("Tìm Sách Yêu Thích")
                    .actionLink("#trending-section")
                    .icon("ph-sparkle")
                    .gradient("linear-gradient(135deg, #1C1D1A 0%, #2B161B 100%)")
                    .isActive(true)
                    .orderIndex(1)
                    .imageUrl("")
                    .imageMode("overlay")
                    .extraDataJson(objectMapper.writeValueAsString(Map.of("books", books)))
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build());
        } catch (Exception e) {
            log.error("Lỗi khởi tạo banner 1: {}", e.getMessage());
        }

        // Banner 2: Mascot AI
        try {
            Map<String, Object> extra2 = Map.of(
                    "mascotQuote", "Chào bạn đọc! Mình là Khoai Nhỏ HALM 🥔. Hôm nay bạn muốn tìm sách hay giải đáp điều gì nào?",
                    "promptChips", List.of(
                            "Gợi ý sách kỹ năng sống hot nhất?",
                            "Tóm tắt ý chính cuốn Nhà Giả Kim",
                            "Các tác phẩm phí thuê dưới 30 Khoai?",
                            "Bí quyết duy trì Streak đọc 7 ngày"
                    )
            );
            defaultList.add(Banner.builder()
                    .id("web-banner-" + UUID.randomUUID())
                    .layoutType("mascot_ai")
                    .eyebrow("TRỢ LÝ AI KHOAI NHỎ THÔNG MINH")
                    .title("Tìm đúng cuốn sách cho bạn")
                    .titleHighlight("Đồng Hành Cùng AI")
                    .description("Khoai Nhỏ HALM đồng hành cùng bạn 24/7: tóm tắt nhanh nội dung sách, giải thích thuật ngữ chuyên sâu và định hướng lộ trình đọc cá nhân hóa.")
                    .actionText("Trò Chuyện Cùng AI")
                    .actionLink("#chat")
                    .icon("ph-chat-circle-dots")
                    .gradient("linear-gradient(135deg, #1A1813 0%, #332612 100%)")
                    .isActive(true)
                    .orderIndex(2)
                    .imageUrl("")
                    .imageMode("overlay")
                    .extraDataJson(objectMapper.writeValueAsString(extra2))
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build());
        } catch (Exception e) {
            log.error("Lỗi khởi tạo banner 2: {}", e.getMessage());
        }

        // Banner 3: VIP Potato
        try {
            Map<String, Object> extra3 = Map.of(
                    "tierHighlights", List.of(
                            Map.of("name", "Thợ Cày", "icon", "🌱", "discount", "0%", "badge", "Hạng Khởi Đầu"),
                            Map.of("name", "Cao Thủ Cày", "icon", "🚜", "discount", "-5%", "badge", "Hạng Bạc"),
                            Map.of("name", "Lão Nông", "icon", "🌾", "discount", "-10%", "badge", "Hạng Vàng"),
                            Map.of("name", "Đại Điền Chủ", "icon", "👑", "discount", "-20%", "badge", "Hoàng Gia VIP")
                    )
            );
            defaultList.add(Banner.builder()
                    .id("web-banner-" + UUID.randomUUID())
                    .layoutType("vip_potato")
                    .eyebrow("HỘI VIÊN & ĐẶC QUYỀN HOÀNG GIA")
                    .title("Nâng tầm trải nghiệm đọc trọn đời")
                    .titleHighlight("Bảo Lưu Hạng Vĩnh Viễn")
                    .description("Càng đọc nhiều càng thăng hạng cao. Giảm từ 5% đến 20% phí thuê sách vĩnh viễn, nhận huy hiệu danh giá và khung viền Avatar Hoàng Gia độc quyền.")
                    .actionText("Khám Phá Cấp Bậc Hội Viên")
                    .actionLink("/hang")
                    .icon("ph-crown")
                    .gradient("linear-gradient(135deg, #151614 0%, #231C0D 100%)")
                    .isActive(true)
                    .orderIndex(3)
                    .imageUrl("")
                    .imageMode("overlay")
                    .extraDataJson(objectMapper.writeValueAsString(extra3))
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build());
        } catch (Exception e) {
            log.error("Lỗi khởi tạo banner 3: {}", e.getMessage());
        }

        // Banner 4: Hot Deal
        try {
            Map<String, Object> extra4 = Map.of(
                    "dealBadge", "HOT DEAL TUẦN NÀY 🔥",
                    "vouchers", List.of(
                            Map.of("code", "HALM2026", "label", "-50% VIP", "desc", "Giảm 50% Gói VIP 1 Năm"),
                            Map.of("code", "FREE3UPLOAD", "label", "FREE 3X", "desc", "3 lần tải sách cá nhân AI"),
                            Map.of("code", "STREAK7D", "label", "+10 KHOAI", "desc", "Thưởng chuỗi điểm danh 7 ngày")
                    )
            );
            defaultList.add(Banner.builder()
                    .id("web-banner-" + UUID.randomUUID())
                    .layoutType("hot_deal")
                    .eyebrow("ĐẠI TIỆC ƯU ĐÃI & VOUCHER KHỦNG")
                    .title("Thuê sách thả ga — Không lo về giá")
                    .titleHighlight("Săn Voucher Tiết Kiệm")
                    .description("Mở khóa gói VIP giảm 50%, miễn phí 3 lượt tải tài liệu cá nhân bằng AI, combo sách kinh điển giảm 45% cùng hàng trăm mã giảm giá hấp dẫn.")
                    .actionText("Săn Ưu Đãi Đặc Quyền")
                    .actionLink("/uudai")
                    .icon("ph-ticket")
                    .gradient("linear-gradient(135deg, #220F12 0%, #170A0C 100%)")
                    .isActive(true)
                    .orderIndex(4)
                    .imageUrl("")
                    .imageMode("overlay")
                    .extraDataJson(objectMapper.writeValueAsString(extra4))
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build());
        } catch (Exception e) {
            log.error("Lỗi khởi tạo banner 4: {}", e.getMessage());
        }

        // Banner 5: Reader 3D
        try {
            Map<String, Object> extra5 = Map.of(
                    "readerFeatures", List.of("Lật trang 3D chân thực", "Chữ động Reflow Text", "Ghi chú & Bookmark"),
                    "ambientSounds", List.of("Tiếng mưa rơi êm dịu", "Giai điệu Lofi Chill", "Deep Focus Ambient")
            );
            defaultList.add(Banner.builder()
                    .id("web-banner-" + UUID.randomUUID())
                    .layoutType("reader_3d")
                    .eyebrow("TRẢI NGHIỆM ĐỌC ĐỈNH CAO")
                    .title("Trình đọc HALM Reader & Nhạc nền Focus")
                    .titleHighlight("Lật Trang 3D & Reflow Text")
                    .description("Hiệu ứng lật trang 3D sống động, tùy chỉnh font chữ không tràn màn hình kết hợp 4 giai điệu tập trung sâu: Tiếng mưa rơi, Lofi Chill, Sóng não Ambient & Thiên nhiên.")
                    .actionText("Vào Tủ Sách Của Tôi")
                    .actionLink("/tusachcn")
                    .icon("ph-headphones")
                    .gradient("linear-gradient(135deg, #101E1A 0%, #0A1310 100%)")
                    .isActive(true)
                    .orderIndex(5)
                    .imageUrl("")
                    .imageMode("overlay")
                    .extraDataJson(objectMapper.writeValueAsString(extra5))
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build());
        } catch (Exception e) {
            log.error("Lỗi khởi tạo banner 5: {}", e.getMessage());
        }

        bannerRepository.saveAll(defaultList);
        log.info("Đã khởi tạo thành công {} Banner mặc định vào CSDL.", defaultList.size());
    }

    private void seedDefaultAppBanners() {
        bannerRepository.saveAll(List.of(
                Banner.builder().id("app-banner-" + UUID.randomUUID()).platform("APP").layoutType("showcase")
                        .eyebrow("KHÁM PHÁ THƯ VIỆN").title("Một cuốn sách, ngàn cảm hứng")
                        .description("Chọn chủ đề bạn yêu thích và bắt đầu hành trình đọc.")
                        .actionText("Khám phá sách").actionLink("app:categories").imageMode("overlay").orderIndex(1).build(),
                Banner.builder().id("app-banner-" + UUID.randomUUID()).platform("APP").layoutType("showcase")
                        .eyebrow("ƯU ĐÃI DÀNH CHO BẠN").title("Tìm cuốn sách tiếp theo")
                        .description("Khám phá sách ưu đãi và các gói Khoai đang có trên HALM BOOK.")
                        .actionText("Xem ưu đãi").actionLink("app:offers").imageMode("overlay").orderIndex(2).build(),
                Banner.builder().id("app-banner-" + UUID.randomUUID()).platform("APP").layoutType("showcase")
                        .eyebrow("TRỢ LÝ HALM.AI").title("Tìm sách cùng Khoai Nhỏ")
                        .description("Trò chuyện với trợ lý để tìm tác phẩm phù hợp với bạn.")
                        .actionText("Trò chuyện ngay").actionLink("app:chatbot").imageMode("overlay").orderIndex(3).build()
        ));
    }

    private void seedDefaultSiteSettings() {
        List<SiteSetting> defaultSettings = List.of(
                SiteSetting.builder().settingKey("hotline").settingValue("0397409029").description("Số điện thoại đường dây nóng").updatedAt(LocalDateTime.now()).build(),
                SiteSetting.builder().settingKey("email").settingValue("support@halmbook.vn").description("Email hỗ trợ bạn đọc").updatedAt(LocalDateTime.now()).build(),
                SiteSetting.builder().settingKey("address").settingValue("03 Quang Trung, TP. Đà Nẵng").description("Địa chỉ văn phòng").updatedAt(LocalDateTime.now()).build(),
                SiteSetting.builder().settingKey("copyright").settingValue("© 2026 HALM BOOK. Tất cả bản quyền được bảo lưu.").description("Nội dung bản quyền").updatedAt(LocalDateTime.now()).build(),
                SiteSetting.builder().settingKey("slogan").settingValue("Không gian Đọc Sách & Tri Thức Độc Bản").description("Khẩu hiệu thương hiệu").updatedAt(LocalDateTime.now()).build()
        );
        siteSettingRepository.saveAll(defaultSettings);
        log.info("Đã khởi tạo thành công các thiết lập Site Settings mặc định vào CSDL.");
    }
}
