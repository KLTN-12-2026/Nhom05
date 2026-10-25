package com.example.demochatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CartItemDto {
    private int cartItemId;
    private String bookId;
    private String bookName;
    private String author;
    private String imgUrl;
    private Double rentPrice;
    private String planKey;
    private Integer rentalDays;
    private Double selectedPrice;
}
