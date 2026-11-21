package com.example.demochatbot.controller;

import com.example.demochatbot.model.Mission;
import com.example.demochatbot.repository.*;
import com.example.demochatbot.service.mission.MissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController @RequiredArgsConstructor @RequestMapping("/api/admin/missions")
@PreAuthorize("hasRole('ADMIN')")
public class MissionAdminController {
    private final MissionRepository missions;
    private final MissionService service;
    private final UserMissionClaimRepository claims;
    @GetMapping public Object list() { return missions.findAllByOrderByOrderIndexAscIdAsc(); }
    @PostMapping public Object create(@RequestBody Mission input) { return service.saveConfig(null, input); }
    @PutMapping("/{id}") public Object update(@PathVariable String id, @RequestBody Mission input) { return service.saveConfig(id, input); }
    @GetMapping("/claims") public Object history(@RequestParam(defaultValue = "0") int page) {
        return claims.findAll(PageRequest.of(Math.max(0, page), 25, Sort.by(Sort.Direction.DESC, "id")));
    }
}
