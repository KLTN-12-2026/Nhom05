package com.example.demochatbot.service.cart;

import com.example.demochatbot.dto.AddToCartRequest;
import com.example.demochatbot.dto.CartItemDto;

import java.util.List;

public interface CartService {
    void addToCart(AddToCartRequest request);

    List<CartItemDto> getCartItems();

    int getCartItemCount();

    void removeFromCart(int cartItemId);
}
