package com.example.demochatbot.service.customer;

import com.example.demochatbot.model.Account;
import com.example.demochatbot.model.Customer;
import com.example.demochatbot.repository.AccountRepository;
import com.example.demochatbot.repository.CustomerRepository;
import com.example.demochatbot.service.account.CustomUserDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class CustomerServiceImpl implements CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

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
        Account account = accountRepository.findById(accountId).orElse(null);
        if (account == null) {
            throw new RuntimeException("Không tìm thấy tài khoản người dùng!");
        }

        boolean matches = false;
        if (account.getPassword() != null) {
            if (passwordEncoder != null && passwordEncoder.matches(oldPassword, account.getPassword())) {
                matches = true;
            } else if (account.getPassword().equals(oldPassword)) {
                matches = true;
            }
        }

        if (!matches) {
            throw new RuntimeException("Mật khẩu hiện tại không chính xác!");
        }

        if (newPassword == null || newPassword.trim().length() < 6) {
            throw new RuntimeException("Mật khẩu mới phải có ít nhất 6 ký tự!");
        }

        if ((passwordEncoder != null && passwordEncoder.matches(newPassword.trim(), account.getPassword())) 
                || account.getPassword().equals(newPassword.trim())) {
            throw new RuntimeException("Mật khẩu mới không được trùng với mật khẩu hiện tại!");
        }

        if (passwordEncoder != null) {
            account.setPassword(passwordEncoder.encode(newPassword.trim()));
        } else {
            account.setPassword(newPassword.trim());
        }

        accountRepository.save(account);
        return true;
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
