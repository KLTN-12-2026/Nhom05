package com.example.demochatbot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(excludeName = "org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration")
public class HalmBookBeApplication {

    public static void main(String[] args) {
        SpringApplication.run(HalmBookBeApplication.class, args);
    }

}
