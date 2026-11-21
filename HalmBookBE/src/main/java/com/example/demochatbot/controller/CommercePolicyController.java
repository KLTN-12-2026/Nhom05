package com.example.demochatbot.controller;
import com.example.demochatbot.service.policy.CommercePolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
@RestController @RequiredArgsConstructor
public class CommercePolicyController {
    private final CommercePolicyService service;
    @GetMapping("/api/home/commerce-policy") public ResponseEntity<?> read() { return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.current()); }
    @GetMapping("/api/admin/commerce-policy") @PreAuthorize("hasRole('ADMIN')") public Object adminRead() { return service.current(); }
    @PutMapping("/api/admin/commerce-policy") @PreAuthorize("hasRole('ADMIN')") public Object update(@RequestBody CommercePolicyService.Update request) { return service.update(request); }
}
