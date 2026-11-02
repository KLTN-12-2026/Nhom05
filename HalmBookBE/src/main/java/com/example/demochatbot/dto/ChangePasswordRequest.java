package com.example.demochatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ============================================================================
 * DTO: ChangePasswordRequest
 * Mô tả: Yêu cầu đổi mật khẩu từ màn hình Thông Tin Cá Nhân
 * ============================================================================
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChangePasswordRequest {
    private String oldPassword;
    private String newPassword;
    private String confirmPassword;
}
