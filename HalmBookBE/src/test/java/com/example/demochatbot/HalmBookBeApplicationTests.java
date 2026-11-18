package com.example.demochatbot;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DisplayName("HalmBook BE Application Bootstrap Test")
class HalmBookBeApplicationTests {

    @Test
    @DisplayName("Kiểm tra cấu hình lớp ứng dụng chính HalmBookBeApplication")
    void contextLoads() {
        HalmBookBeApplication app = new HalmBookBeApplication();
        assertNotNull(app, "Lớp khởi động HalmBookBeApplication phải được khởi tạo thành công");
        assertTrue(HalmBookBeApplication.class.isAnnotationPresent(org.springframework.boot.autoconfigure.SpringBootApplication.class),
                "HalmBookBeApplication phải mang annotation @SpringBootApplication");
    }

}
