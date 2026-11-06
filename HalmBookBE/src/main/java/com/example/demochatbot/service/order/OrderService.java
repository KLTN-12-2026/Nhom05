package com.example.demochatbot.service.order;

import com.example.demochatbot.dto.CheckoutRequest;
import com.example.demochatbot.dto.CheckoutResponse;
import com.example.demochatbot.dto.RentedBookDto;

import java.util.List;

/**
 * ============================================================================
 * Interface: OrderService
 * Mô tả: Cung cấp nghiệp vụ thanh toán, thuê sách bằng Khoai và quản lý Tủ sách cá nhân
 * ============================================================================
 */
public interface OrderService {

    /**
     * Thực hiện thanh toán thuê sách bằng Khoai Tây
     */
    CheckoutResponse checkoutWithPotato(int accountId, CheckoutRequest request);

    /**
     * Lấy danh sách các cuốn sách đang sở hữu/thuê trong Tủ Sách Cá Nhân
     */
    List<RentedBookDto> getCustomerBookshelf(int accountId);

    /**
     * Kiểm tra quyền đọc toàn bộ tác phẩm của độc giả
     */
    boolean checkBookAccess(int accountId, String bookId);
}
