package com.example.demochatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CartItemDto {
    private int cartItemId;
    private String bookId;

    // Trường chuẩn cho Mobile App (title, coverUrl, description, rentalDays, priceKhoai)
    private String title;
    private String author;
    private String coverUrl;
    private String description;
    private Integer rentalDays;
    private Integer priceKhoai;

    // Trường tương thích ngược với Web Frontend
    private String bookName;
    private String imgUrl;
    private Double rentPrice;
    private String planKey;
    private Double selectedPrice;

    public CartItemDto(
            int cartItemId,
            String bookId,
            String bookName,
            String author,
            String imgUrl,
            Double rentPrice,
            String planKey,
            Integer rentalDays,
            Double selectedPrice
    ) {
        this.cartItemId = cartItemId;
        this.bookId = bookId;
        this.bookName = bookName;
        this.title = bookName;
        this.author = author;
        this.imgUrl = imgUrl;
        this.coverUrl = imgUrl;
        this.rentPrice = rentPrice;
        this.planKey = planKey;
        this.rentalDays = rentalDays;
        this.selectedPrice = selectedPrice;
        this.priceKhoai = selectedPrice != null ? (int) Math.round(selectedPrice) : 0;
    }
}
