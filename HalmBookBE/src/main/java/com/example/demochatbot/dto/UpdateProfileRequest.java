package com.example.demochatbot.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Dữ liệu FE gửi lên khi bấm "Lưu Thay Đổi" ở trang Thông Tin Cá Nhân.
 */
public record UpdateProfileRequest(
        @NotBlank(message = "Tên người dùng không được để trống.")
        @Size(max = 100, message = "Tên người dùng tối đa 100 ký tự.")
        String customerName,

        @Pattern(regexp = "^$|^0\\d{9}$", message = "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.")
        String phoneNumber,

        @JsonFormat(pattern = "yyyy-MM-dd")
        @Past(message = "Ngày sinh phải là một ngày trong quá khứ.")
        LocalDate birthday,

        Boolean gender,

        @Email(message = "Email không đúng định dạng.")
        @Size(max = 255, message = "Email tối đa 255 ký tự.")
        String email,

        @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự.")
        String address
) {
}
