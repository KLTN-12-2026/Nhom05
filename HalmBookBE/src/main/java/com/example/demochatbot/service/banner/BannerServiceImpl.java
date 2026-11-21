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
    public List<BannerDto> getActiveBanners() {
        return bannerRepository.findByIsActiveTrueOrderByOrderIndexAsc()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BannerDto> getAllBanners() {
        return bannerRepository.findAllByOrderByOrderIndexAsc()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BannerDto getBannerById(String id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Banner với mã: " + id));
        return toDto(banner);
    }

    @Override
    @Transactional
    public BannerDto createBanner(BannerDto dto) {
        if (dto.getId() == null || dto.getId().trim().isEmpty() || bannerRepository.existsById(dto.getId())) {
            dto.setId("banner-" + System.currentTimeMillis());
        }
        if (dto.getOrder() == null) {
            dto.setOrder((int) bannerRepository.count() + 1);
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
    public BannerDto updateBanner(String id, BannerDto dto) {
        Banner existing = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Banner với mã: " + id));

        updateEntityFromDto(existing, dto);
        Banner saved = bannerRepository.save(existing);
        return toDto(saved);
    }

    @Override
    @Transactional
    public void toggleBannerStatus(String id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Banner với mã: " + id));
        banner.setIsActive(!Boolean.TRUE.equals(banner.getIsActive()));
        banner.setUpdatedAt(LocalDateTime.now());
        bannerRepository.save(banner);
    }

    @Override
    @Transactional
    public void deleteBanner(String id) {
        if (!bannerRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy Banner với mã: " + id);
        }
        bannerRepository.deleteById(id);
    }

    @Override
    @Transactional
    public List<BannerDto> saveAllBanners(List<BannerDto> bannerDtos) {
        if (bannerDtos == null || bannerDtos.isEmpty()) {
            bannerRepository.deleteAllInBatch();
            return Collections.emptyList();
        }

        Set<String> incomingIds = new HashSet<>();
        for (BannerDto dto : bannerDtos) {
            if (dto.getId() != null && !dto.getId().trim().isEmpty()) {
                incomingIds.add(dto.getId().trim());
            }
        }

        List<Banner> existingAll = bannerRepository.findAll();
        List<Banner> toDelete = existingAll.stream()
                .filter(b -> !incomingIds.contains(b.getId()))
                .collect(Collectors.toList());
        if (!toDelete.isEmpty()) {
            bannerRepository.deleteAllInBatch(toDelete);
        }

        Map<String, Banner> existingMap = existingAll.stream()
                .collect(Collectors.toMap(Banner::getId, b -> b, (o1, o2) -> o1));

        List<Banner> toSave = new ArrayList<>();
        int index = 1;
        for (BannerDto dto : bannerDtos) {
            String id = dto.getId();
            if (id == null || id.trim().isEmpty()) {
                id = "banner-" + System.currentTimeMillis() + "-" + index;
                dto.setId(id);
            }
            dto.setOrder(index++);

            Banner banner = existingMap.get(id);
            if (banner == null) {
                banner = toEntity(dto);
                banner.setCreatedAt(LocalDateTime.now());
            } else {
                updateEntityFromDto(banner, dto);
            }
            banner.setUpdatedAt(LocalDateTime.now());
            toSave.add(banner);
        }

        List<Banner> saved = bannerRepository.saveAll(toSave);
        return saved.stream()
                .sorted(Comparator.comparing(b -> (b.getOrderIndex() != null ? b.getOrderIndex() : 0)))
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<BannerDto> resetDefaultBanners() {
        bannerRepository.deleteAllInBatch();
        bannerRepository.flush();
        seedDefaultBanners();
        return getAllBanners();
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
                    .id("banner-1")
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
                    .id("banner-2")
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
                    .id("banner-3")
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
                    .id("banner-4")
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
                    .id("banner-5")
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
