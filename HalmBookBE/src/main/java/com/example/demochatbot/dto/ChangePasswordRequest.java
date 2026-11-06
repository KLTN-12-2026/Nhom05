package com.example.demochatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Dữ liệu từ popup "Đổi Mật Khẩu" ở trang Thông Tin Cá Nhân.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChangePasswordRequest {
    @NotBlank(message = "Vui lòng nhập mật khẩu hiện tại.")
    private String oldPassword;

    @NotBlank(message = "Vui lòng nhập mật khẩu mới.")
    @Size(min = 6, max = 100, message = "Mật khẩu mới phải từ 6 đến 100 ký tự.")
    private String newPassword;

    @NotBlank(message = "Vui lòng xác nhận mật khẩu mới.")
    private String confirmPassword;
}
