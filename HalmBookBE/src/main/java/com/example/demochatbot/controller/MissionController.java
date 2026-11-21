package com.example.demochatbot.controller;

import com.example.demochatbot.model.Customer;
import com.example.demochatbot.repository.CustomerRepository;
import com.example.demochatbot.service.customer.CustomerService;
import com.example.demochatbot.service.mission.MissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

@RestController @RequiredArgsConstructor @RequestMapping("/api/home/missions")
public class MissionController {
    private final CustomerService customerService;
    private final CustomerRepository customers;
    private final MissionService missions;
    private Customer current() {
        try {
            Customer customer = customers.findCustomerById(customerService.getCurrentAccountId());
            if (customer != null) return customer;
        } catch (Exception ignored) { }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để xem nhiệm vụ.");
    }
    @GetMapping
    public ResponseEntity<?> list() {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(missions.dashboard(current()));
    }
    public record ActivityRequest(String kind, String keyword) {}
    @PostMapping("/activity")
    public Map<String, Object> activity(@RequestBody ActivityRequest request) {
        missions.visit(current().getCustomer_id(), request.kind(), request.keyword());
        return Map.of("success", true);
    }
    public record HeartbeatRequest(String bookId, String sessionId) {}
    @PostMapping("/reading-heartbeat")
    public Map<String, Object> heartbeat(@RequestBody HeartbeatRequest request) {
        return missions.heartbeat(current().getCustomer_id(), request.bookId(), request.sessionId());
    }
}
