package com.example.demochatbot.dto;

import com.example.demochatbot.model.BookGift;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookGiftDto {
    private Long giftId;
    private String senderId;
    private String senderName;
    private String senderAvatar;
    private String receiverId;
    private String receiverName;
    private String receiverAvatar;
    private String bookId;
    private String bookTitle;
    private String bookCover;
    private String bookAuthor;
    private String planKey;
    private Integer rentalDays;
    private Integer potatoPrice;
    private String message;
    private LocalDateTime createdAt;

    public static BookGiftDto fromEntity(BookGift gift) {
        if (gift == null) return null;

        String senderName = "Độc giả ẩn danh";
        String senderAvatar = null;
        String senderId = null;
        if (gift.getSender() != null) {
            senderId = gift.getSender().getCustomer_id();
            senderName = gift.getSender().getCustomerName() != null ? gift.getSender().getCustomerName() : "Độc giả " + senderId;
            senderAvatar = gift.getSender().getAvatarUrl() != null ? gift.getSender().getAvatarUrl() : gift.getSender().getAvatar();
        }

        String receiverName = "Người nhận";
        String receiverAvatar = null;
        String receiverId = null;
        if (gift.getReceiver() != null) {
            receiverId = gift.getReceiver().getCustomer_id();
            receiverName = gift.getReceiver().getCustomerName() != null ? gift.getReceiver().getCustomerName() : "Độc giả " + receiverId;
            receiverAvatar = gift.getReceiver().getAvatarUrl() != null ? gift.getReceiver().getAvatarUrl() : gift.getReceiver().getAvatar();
        }

        String bookTitle = "Tác phẩm";
        String bookCover = null;
        String bookAuthor = "HALM";
        String bookId = null;
        if (gift.getBook() != null) {
            bookId = gift.getBook().getBook_id();
            bookTitle = gift.getBook().getBookName();
            bookCover = gift.getBook().getImg_url();
            bookAuthor = gift.getBook().getAuthor() != null ? gift.getBook().getAuthor() : "Tác giả";
        }

        return BookGiftDto.builder()
                .giftId(gift.getGiftId())
                .senderId(senderId)
                .senderName(senderName)
                .senderAvatar(senderAvatar)
                .receiverId(receiverId)
                .receiverName(receiverName)
                .receiverAvatar(receiverAvatar)
                .bookId(bookId)
                .bookTitle(bookTitle)
                .bookCover(bookCover)
                .bookAuthor(bookAuthor)
                .planKey(gift.getPlanKey())
                .rentalDays(gift.getRentalDays())
                .potatoPrice(gift.getPotatoPrice())
                .message(gift.getMessage())
                .createdAt(gift.getCreatedAt())
                .build();
    }
}
