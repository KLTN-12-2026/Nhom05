package com.example.demochatbot.repository;

import com.example.demochatbot.model.Banner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BannerRepository extends JpaRepository<Banner, String> {
    List<Banner> findByPlatformAndIsActiveTrueOrderByOrderIndexAscIdAsc(String platform);
    List<Banner> findByPlatformOrderByOrderIndexAscIdAsc(String platform);
}
