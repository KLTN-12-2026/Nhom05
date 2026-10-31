package com.example.demochatbot.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Dữ liệu từ popup "Đổi Mật Khẩu" ở trang Thông Tin Cá Nhân.
 */
public record ChangePasswordRequest(
        @NotBlank(message = "Vui lòng nhập mật khẩu hiện tại.")
        String oldPassword,

        @NotBlank(message = "Vui lòng nhập mật khẩu mới.")
        @Size(min = 6, max = 100, message = "Mật khẩu mới phải từ 6 đến 100 ký tự.")
        String newPassword,

        @NotBlank(message = "Vui lòng xác nhận mật khẩu mới.")
        String confirmPassword
) {
}
