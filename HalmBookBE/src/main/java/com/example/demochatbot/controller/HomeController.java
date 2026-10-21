package com.example.demochatbot.controller;

import com.example.demochatbot.model.Customer;
import com.example.demochatbot.service.customer.CustomerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;


@RestController
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*")
@RequestMapping("/api/home")
public class HomeController {

    @Autowired
    private CustomerService customerService;

    @GetMapping("/customer/info")
    public ResponseEntity<?> getCustomerInfo() {
        try {
            int accountId = customerService.getCurrentAccountId();
            Customer customer = customerService.findCustomerById(accountId);
            if (customer == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy thông tin khách hàng!");
            }
            return new ResponseEntity<>(customer, HttpStatus.OK);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    @PutMapping("/customer/edit")
    public ResponseEntity<?> editCustomer(@RequestBody Customer customerDetails) {
        try {
            int accountId = customerService.getCurrentAccountId();
            Customer customer = customerService.editCustomer(accountId, customerDetails);
            System.out.println("Chỉnh sửa thông tin thành công: " + customer.getCustomerName());
            return new ResponseEntity<>(customer, HttpStatus.OK);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
