package com.example.demochatbot.controller;
import com.example.demochatbot.service.offer.BookOfferService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequiredArgsConstructor @RequestMapping("/api/admin/book-offers") @PreAuthorize("hasRole('ADMIN')")
public class BookOfferController {
    private final BookOfferService offers;
    @GetMapping public Object list(@RequestParam(required = false) String kind) { return offers.list(true, kind); }
    @PostMapping public Object create(@RequestBody Map<String, Object> input) { return offers.save(null, input); }
    @PutMapping("/{id}") public Object update(@PathVariable String id, @RequestBody Map<String, Object> input) { return offers.save(id, input); }
    @DeleteMapping("/{id}") public Object delete(@PathVariable String id) { offers.delete(id); return Map.of("success", true); }
}
