package com.example.demochatbot.service.cart;

import com.example.demochatbot.dto.AddToCartRequest;
import com.example.demochatbot.dto.CartItemDto;
import com.example.demochatbot.dto.CheckoutResponse;

import java.util.List;

public interface CartService {
    void addToCart(AddToCartRequest request);

    List<CartItemDto> getCartItems();

    List<CartItemDto> getCart(int userId);

    CartItemDto updateDuration(int userId, int cartItemId, int days);

    int getCartItemCount();

    void removeFromCart(int cartItemId);

    void removeFromCart(int userId, int cartItemId);

    CheckoutResponse checkout(int userId, List<Integer> cartItemIds);
}
