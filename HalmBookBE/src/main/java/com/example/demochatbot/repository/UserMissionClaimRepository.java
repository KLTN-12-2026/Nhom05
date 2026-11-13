package com.example.demochatbot.repository;

import com.example.demochatbot.model.UserMissionClaim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface UserMissionClaimRepository extends JpaRepository<UserMissionClaim, Long> {
    List<UserMissionClaim> findByCustomerIdAndClaimDate(String customerId, LocalDate claimDate);

    List<UserMissionClaim> findByCustomerId(String customerId);

    boolean existsByCustomerIdAndMissionIdAndClaimDate(String customerId, String missionId, LocalDate claimDate);

    boolean existsByCustomerIdAndMissionId(String customerId, String missionId);
}
