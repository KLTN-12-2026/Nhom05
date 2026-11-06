package com.example.demochatbot.service.potato;

import com.example.demochatbot.dto.TopupRequest;
import com.example.demochatbot.dto.TransferRequest;
import com.example.demochatbot.dto.WalletResponseDto;
import com.example.demochatbot.model.PotatoPackage;
import com.example.demochatbot.model.PotatoTransaction;

import java.util.List;

/**
 * ============================================================================
 * Interface: PotatoService
 * Mô tả: Cung cấp các nghiệp vụ về Ví Khoai Tây (số dư, nạp khoai, lịch sử giao dịch, tặng khoai)
 * ============================================================================
 */
public interface PotatoService {

    /**
     * Lấy thông tin ví và số dư Khoai thực tế của tài khoản đăng nhập
     */
    WalletResponseDto getWalletInfo(int accountId);

    /**
     * Lấy danh sách tất cả các gói nạp Khoai đang khả dụng (kèm tự động khởi tạo gói mẫu nếu database trống)
     */
    List<PotatoPackage> getActivePackages();

    /**
     * Lấy toàn bộ lịch sử giao dịch (sổ cái biến động số dư) của khách hàng
     */
    List<PotatoTransaction> getTransactionHistory(int accountId);

    /**
     * Thực hiện nạp Khoai theo gói hoặc theo số tiền chuyển khoản VietQR
     */
    PotatoTransaction topupPotato(int accountId, TopupRequest request);

    /**
     * Thực hiện chuyển/tặng Khoai cho độc giả khác bằng email hoặc số điện thoại
     */
    PotatoTransaction transferPotato(int accountId, TransferRequest request);

    /**
     * Trừ Khoai khi thanh toán đơn thuê/mua sách
     */
    PotatoTransaction deductPotato(int accountId, int amount, String description);
}
