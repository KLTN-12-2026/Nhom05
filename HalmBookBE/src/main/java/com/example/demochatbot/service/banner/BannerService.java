package com.example.demochatbot.service.banner;

import com.example.demochatbot.dto.BannerDto;

import java.util.List;
import java.util.Map;

public interface BannerService {
    List<BannerDto> getActiveBanners(String platform);
    List<BannerDto> getAllBanners(String platform);
    BannerDto getBannerById(String id, String platform);
    BannerDto createBanner(BannerDto bannerDto);
    BannerDto updateBanner(String id, BannerDto bannerDto, String platform);
    void toggleBannerStatus(String id, String platform);
    void deleteBanner(String id, String platform);
    List<BannerDto> saveAllBanners(List<BannerDto> bannerDtos, String platform);
    List<BannerDto> resetDefaultBanners(String platform);

    // Site Settings
    Map<String, String> getSiteSettings();
    Map<String, String> saveSiteSettings(Map<String, String> settings);
}
