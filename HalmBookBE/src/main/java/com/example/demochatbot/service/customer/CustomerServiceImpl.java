package com.example.demochatbot.service.customer;


import com.example.demochatbot.model.Customer;
import com.example.demochatbot.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import com.example.demochatbot.service.account.CustomUserDetails;


@Service
public class CustomerServiceImpl implements CustomerService {


    @Autowired
    private CustomerRepository customerRepository;


    @Override
    public Customer editCustomer(int accountId, Customer customerDetails) {
        Customer existingCustomer = customerRepository.findCustomerById(accountId);
        if (existingCustomer == null) {
            throw new RuntimeException("Không tìm thấy thông tin khách hàng!");
        }

        if (customerDetails.getEmail() != null && !customerDetails.getEmail().equalsIgnoreCase(existingCustomer.getEmail())) {
            customerRepository.findByEmail(customerDetails.getEmail()).ifPresent(c -> {
                if (!c.getCustomer_id().equals(existingCustomer.getCustomer_id())) {
                    throw new RuntimeException("Email đã được sử dụng bởi tài khoản khác!");
                }
            });
        }

        int result = customerRepository.updateCustomerInfo(
                existingCustomer.getCustomer_id(),
                customerDetails.getCustomerName(),
                customerDetails.isGender(),
                customerDetails.getBirthday(),
                customerDetails.getAddress(),
                customerDetails.getPhoneNumber(),
                customerDetails.getEmail()
        );
        if (result <= 0) {
            throw new RuntimeException("Lỗi khi cập nhật thông tin khách hàng!");
        }
        return findCustomerById(accountId);
    }

    @Override
    public Customer findCustomerById(int accountId) {
        return customerRepository.findCustomerById(accountId);
    }

    @Override
    public boolean changePassword(int accountId, String oldPassword, String newPassword) {
        return false;
    }

    @Override
    public int getCurrentAccountId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails) {
            CustomUserDetails customUserDetails = (CustomUserDetails) authentication.getPrincipal();
            return customUserDetails.getAccount().getAccount_id();
        }
        throw new RuntimeException("Khong tim thay thong tin dang nhap !");
    }
}
