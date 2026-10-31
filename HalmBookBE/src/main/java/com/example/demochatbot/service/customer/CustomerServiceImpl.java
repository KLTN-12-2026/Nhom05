package com.example.demochatbot.service.customer;

import com.example.demochatbot.model.Account;
import com.example.demochatbot.model.Customer;
import com.example.demochatbot.repository.AccountRepository;
import com.example.demochatbot.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.demochatbot.service.account.CustomUserDetails;

@Service
public class CustomerServiceImpl implements CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired(required = false)
    private PasswordEncoder passwordEncoder;

    private String generateNextCustomerId() {
        String lastId = customerRepository.findLastCustomer();
        int newNumber = 1;
        if (lastId != null && !lastId.isEmpty()) {
            try {
                String digits = lastId.replaceAll("\\D+", "");
                if (!digits.isEmpty()) {
                    newNumber = Integer.parseInt(digits) + 1;
                }
            } catch (NumberFormatException e) {
                System.out.println("Lỗi định dạng id khách hàng: " + lastId);
            }
        }
        String candidate = String.format("id#C%05d", newNumber);
        while (customerRepository.existsById(candidate)) {
            newNumber++;
            candidate = String.format("id#C%05d", newNumber);
        }
        return candidate;
    }

    @Override
    @Transactional
    public Customer editCustomer(int accountId, Customer customerDetails) {
        Customer existingCustomer = findCustomerById(accountId);
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
        return customerRepository.findCustomerById(accountId);
    }

    @Override
    @Transactional
    public Customer findCustomerById(int accountId) {
        Customer customer = customerRepository.findCustomerById(accountId);
        if (customer == null) {
            Account account = accountRepository.findById(accountId).orElse(null);
            if (account != null) {
                Customer newCustomer = new Customer();
                newCustomer.setCustomer_id(generateNextCustomerId());
                newCustomer.setCustomerName(account.getUsername());
                newCustomer.setEmail(account.getUsername() != null && account.getUsername().contains("@") ? account.getUsername() : "");
                newCustomer.setAccount(account);
                newCustomer.setPotatoBalance(0);
                newCustomer.setTotalPotatoEarned(0);
                newCustomer.setStreakDays(0);
                customer = customerRepository.save(newCustomer);
            }
        }
        return customer;
    }

    @Override
    @Transactional
    public boolean changePassword(int accountId, String oldPassword, String newPassword) {
        Account account = accountRepository.findById(accountId).orElse(null);
        if (account == null) {
            return false;
        }
        if (passwordEncoder != null) {
            if (!passwordEncoder.matches(oldPassword, account.getPassword())) {
                return false;
            }
            account.setPassword(passwordEncoder.encode(newPassword));
        } else {
            account.setPassword(newPassword);
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
