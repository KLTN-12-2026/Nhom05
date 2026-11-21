package com.example.demochatbot.controller;
import com.example.demochatbot.service.customer.CustomerService;
import com.example.demochatbot.service.offer.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequiredArgsConstructor
public class OfferCartController {
    private final CustomerService current;
    private final OfferCartService cart;
    private final BookOfferService offers;
    @GetMapping("/api/home/book-offers") public ResponseEntity<?> list(@RequestParam(required = false) String kind) { return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(offers.list(false, kind)); }
    public record QuoteRequest(List<Integer> cartItemIds) {}
    @PostMapping("/api/home/checkout/quote") public ResponseEntity<?> quote(@RequestBody QuoteRequest request) { return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(cart.quote(current.getCurrentAccountId(), request.cartItemIds())); }
    @PostMapping("/api/home/cart/offers/{id}") public Object addOffer(@PathVariable String id) { return cart.addOffer(current.getCurrentAccountId(), id); }
    public record CouponRequest(String couponCode, String bookId, String planKey) {}
    @PostMapping("/api/home/cart/coupon") public Object apply(@RequestBody CouponRequest request) { return cart.applyCoupon(current.getCurrentAccountId(), request.couponCode(), request.bookId(), request.planKey()); }
    @DeleteMapping("/api/home/cart/coupon") public Object clear() { cart.clearCoupon(current.getCurrentAccountId()); return Map.of("success", true); }
}
