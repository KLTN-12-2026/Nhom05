package com.example.demochatbot.controller;

import com.example.demochatbot.dto.AddToCartRequest;
import com.example.demochatbot.dto.CartItemDto;
import com.example.demochatbot.dto.CheckoutResponse;
import com.example.demochatbot.service.cart.CartService;
import com.example.demochatbot.service.customer.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * REST Controller quản lý Giỏ hàng và Thanh toán thuê sách bằng Khoai:
 * - GET    /api/cart                          : Lấy danh sách sách trong giỏ của user
 * - POST   /api/cart/add                      : Thêm sách vào giỏ
 * - PUT    /api/cart/{cartItemId}/duration    : Cập nhật số ngày thuê (7, 14, 30, 90 ngày)
 * - DELETE /api/cart/{cartItemId}             : Xóa 1 cuốn sách khỏi giỏ
 * - POST   /api/cart/checkout                 : Thanh toán thuê sách (@Transactional trừ Khoai)
 */
@RestController
@CrossOrigin(originPatterns = "*", allowedHeaders = "*")
@RequestMapping("/api/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    @Autowired
    private CustomerService customerService;

    private int resolveCurrentUserId(Integer requestUserId) {
        if (requestUserId != null && requestUserId > 0) {
            return requestUserId;
        }
        try {
            return customerService.getCurrentAccountId();
        } catch (Exception ignored) {
            return 0;
        }
    }

    /**
     * GET /api/cart -> Trả về danh sách sách trong giỏ của user
     */
    @GetMapping
    public ResponseEntity<?> getCart(@RequestParam(value = "userId", required = false) Integer userId) {
        try {
            int resolvedUserId = resolveCurrentUserId(userId);
            List<CartItemDto> items = cartService.getCart(resolvedUserId);
            return ResponseEntity.ok(items);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * POST /api/cart/add -> Thêm sách vào giỏ hàng
     */
    @PostMapping("/add")
    public ResponseEntity<?> addToCart(@RequestBody AddToCartRequest request) {
        try {
            cartService.addToCart(request);
            int count = cartService.getCartItemCount();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Thêm sách vào giỏ hàng thành công!",
                    "cartCount", count
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * PUT /api/cart/{cartItemId}/duration (Body: { "days": number }) -> Cập nhật số ngày thuê
     */
    @PutMapping("/{cartItemId}/duration")
    public ResponseEntity<?> updateDuration(
            @PathVariable("cartItemId") int cartItemId,
            @RequestBody Map<String, Object> body,
            @RequestParam(value = "userId", required = false) Integer userId
    ) {
        try {
            int days = 7;
            if (body != null && body.get("days") != null) {
                days = Integer.parseInt(String.valueOf(body.get("days")));
            }
            int resolvedUserId = resolveCurrentUserId(userId);
            CartItemDto updated = cartService.updateDuration(resolvedUserId, cartItemId, days);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * DELETE /api/cart/{cartItemId} -> Xóa 1 cuốn khỏi giỏ
     */
    @DeleteMapping("/{cartItemId}")
    public ResponseEntity<?> removeFromCart(
            @PathVariable("cartItemId") int cartItemId,
            @RequestParam(value = "userId", required = false) Integer userId
    ) {
        try {
            int resolvedUserId = resolveCurrentUserId(userId);
            cartService.removeFromCart(resolvedUserId, cartItemId);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Đã xóa sách khỏi giỏ hàng!",
                    "cartItemId", cartItemId
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * POST /api/cart/checkout (Body: { "cartItemIds": [Long] }) -> Thực hiện thanh toán thuê sách
     */
    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(
            @RequestBody Map<String, Object> body,
            @RequestParam(value = "userId", required = false) Integer userId
    ) {
        try {
            List<Integer> cartItemIds = new ArrayList<>();
            if (body != null && body.get("cartItemIds") instanceof List<?> rawList) {
                for (Object elem : rawList) {
                    if (elem != null) {
                        cartItemIds.add(Integer.parseInt(String.valueOf(elem)));
                    }
                }
            }
            int resolvedUserId = resolveCurrentUserId(userId);
            CheckoutResponse response = cartService.checkout(resolvedUserId, cartItemIds);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Lỗi xử lý thanh toán: " + e.getMessage()));
        }
    }
}
