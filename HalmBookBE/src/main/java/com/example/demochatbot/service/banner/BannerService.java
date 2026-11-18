package com.example.demochatbot.service.banner;

import com.example.demochatbot.dto.BannerDto;

import java.util.List;
import java.util.Map;

public interface BannerService {
    List<BannerDto> getActiveBanners();
    List<BannerDto> getAllBanners();
    BannerDto getBannerById(String id);
    BannerDto createBanner(BannerDto bannerDto);
    BannerDto updateBanner(String id, BannerDto bannerDto);
    void toggleBannerStatus(String id);
    void deleteBanner(String id);
    List<BannerDto> saveAllBanners(List<BannerDto> bannerDtos);
    List<BannerDto> resetDefaultBanners();

    // Site Settings
    Map<String, String> getSiteSettings();
    Map<String, String> saveSiteSettings(Map<String, String> settings);
}
