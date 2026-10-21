package com.example.demochatbot.service.customer;


import com.example.demochatbot.model.Customer;
import org.springframework.stereotype.Service;

@Service
public interface CustomerService {

    Customer editCustomer(int accountId, Customer customerDetails);

    Customer findCustomerById(int accountId);

    boolean changePassword(int accountId, String oldPassword, String newPassword);

    int getCurrentAccountId();
}
