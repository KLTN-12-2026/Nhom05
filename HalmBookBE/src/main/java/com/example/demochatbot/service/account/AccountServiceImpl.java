package com.example.demochatbot.service.account;

import com.example.demochatbot.model.Account;
import com.example.demochatbot.model.Customer;
import com.example.demochatbot.repository.AccountRepository;
import com.example.demochatbot.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AccountServiceImpl implements UserDetailsService {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private CustomerRepository customerRepository;

    /**
     * Nạp thông tin tài khoản phục vụ xác thực Security:
     * Hỗ trợ tìm kiếm theo cả Username HOẶC Email (được lưu ở bảng Customer).
     * Giúp hệ thống không bị lỗi khi token mang Subject là email hay username từ Google, Facebook, hoặc tài khoản nội bộ.
     */
    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        // 1. Tìm ưu tiên theo username của bảng Account
        Optional<Account> accountOpt = accountRepository.findByUsername(identifier);

        // 2. Nếu không thấy, tìm kiếm qua email trong bảng Customer (liên kết với Account)
        if (accountOpt.isEmpty()) {
            accountOpt = customerRepository.findByEmail(identifier).map(Customer::getAccount);
        }

        Account account = accountOpt.orElseThrow(() -> 
                new UsernameNotFoundException("Không tìm thấy tài khoản với username hoặc email: " + identifier));

        return new CustomUserDetails(account);
    }
}
