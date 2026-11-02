package com.example.demochatbot.dto;

import com.example.demochatbot.model.Account;
import com.example.demochatbot.model.Customer;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;

/**
 * Dữ liệu hồ sơ trả về cho trang Thông Tin Cá Nhân.
 * Tên field giữ đúng như FE (CaNhan.jsx) đang đọc.
 */
public record CustomerProfileResponse(
        @JsonProperty("customer_id") String customerId,
        String customerName,
        String email,
        String phoneNumber,
        String address,
        @JsonFormat(pattern = "yyyy-MM-dd") LocalDate birthday,
        Boolean gender,
        String avatar,
        String username,
        String provider,
        boolean socialAccount
) {

    public static CustomerProfileResponse fromEntity(Customer customer) {
        Account account = customer.getAccount();
        String provider = account != null ? account.getProvider() : null;
        return new CustomerProfileResponse(
                customer.getCustomer_id(),
                customer.getCustomerName(),
                customer.getEmail(),
                customer.getPhoneNumber(),
                customer.getAddress(),
                toLocalDate(customer.getBirthday()),
                customer.isGender(),
                customer.getAvatar(),
                account != null ? account.getUsername() : null,
                provider,
                isSocialProvider(provider)
        );
    }

    /** Tài khoản đăng nhập bằng Google/Facebook: không có mật khẩu, email bị khóa. */
    public static boolean isSocialProvider(String provider) {
        return "GOOGLE".equalsIgnoreCase(provider) || "FACEBOOK".equalsIgnoreCase(provider);
    }

    private static LocalDate toLocalDate(Date date) {
        if (date == null) {
            return null;
        }
        if (date instanceof java.sql.Date sqlDate) {
            return sqlDate.toLocalDate();
        }
        return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
    }
}
