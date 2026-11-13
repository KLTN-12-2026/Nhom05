package com.example.demochatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MissionClaimRequest {
    private String missionId;
    private Boolean isMilestone;
    private Integer rewardPotato;
    private Integer rewardXp;
}
