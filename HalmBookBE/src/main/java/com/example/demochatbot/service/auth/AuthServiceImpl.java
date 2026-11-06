package com.example.demochatbot.service.auth;

import com.example.demochatbot.config.JwtTokenProvider;
import com.example.demochatbot.dto.AuthResponse;
import com.example.demochatbot.dto.RegisterRequest;
import com.example.demochatbot.enums.Role;
import com.example.demochatbot.model.Account;
import com.example.demochatbot.model.Customer;
import com.example.demochatbot.repository.AccountRepository;
import com.example.demochatbot.repository.CustomerRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String genarateNextCustomerId() {
        String lastId = customerRepository.findLastCustomer();
        int newNumber = 1;
        if (lastId != null && !lastId.isEmpty()) {
            try {
                String digits = lastId.replaceAll("\\D+", "");
                if (!digits.isEmpty()) {
                    newNumber = Integer.parseInt(digits) + 1;
                }
            } catch (NumberFormatException e) {
                System.out.printf("Loi dinh dang id khach hang !" + lastId);
            }
        }
        String candidate = String.format("id#C%05d", newNumber);
        while (customerRepository.existsById(candidate)) {
            newNumber++;
            candidate = String.format("id#C%05d", newNumber);
        }
        return candidate;
    }

    @Transactional
    public void register(RegisterRequest request) {
        if (accountRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Ten tai khoan da duoc su dung !");
        }
        Account account = new Account();

        account.setUsername(request.getUsername());
        account.setPassword(passwordEncoder.encode(request.getPassword()));
        account.setProvider("HALMBook");
        account.setRole(Role.USER);

        Account savedAccount = accountRepository.save(account);

        Customer customer = new Customer();
        customer.setCustomer_id(genarateNextCustomerId());
        customer.setCustomerName(savedAccount.getUsername());
        customer.setEmail(request.getEmail());
        customer.setAccount(savedAccount);

        customerRepository.save(customer);
    }

    @Override
    @Transactional
    public AuthResponse processGoogleLogin(String accessToken) {
        RestTemplate restTemplate = new RestTemplate();
        String googleApiUrl = "https://www.googleapis.com/oauth2/v3/userinfo?access_token=" + accessToken;
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(googleApiUrl, Map.class);
            Map<String, Object> payload = response.getBody();

            if (payload == null || !payload.containsKey("email")) {
                throw new RuntimeException("Phản hồi từ Google không hợp lệ hoặc thiếu Email.");
            }

            String email = (String) payload.get("email");
            String name = (String) payload.get("name");
            String picture = (String) payload.get("picture");

            Customer customer = customerRepository.findByEmail(email).orElse(null);

            Account account;

            if (customer == null) {
                account = new Account();
                account.setUsername(email.split("@")[0]);
                account.setProvider("GOOGLE");
                account.setRole(Role.USER);

                Account savedAccount = accountRepository.save(account);

                customer = new Customer();
                customer.setCustomer_id(genarateNextCustomerId());
                customer.setCustomerName(name);
                customer.setAvatar(picture);
                customer.setEmail(email);
                customer.setAccount(savedAccount);

                customerRepository.save(customer);
                account = savedAccount;
            } else {
                account = customer.getAccount();
                if (account == null) {
                    throw new RuntimeException("Dữ liệu lỗi: Customer có tồn tại nhưng mất liên kết với Account");
                }
                customer.setAvatar(picture);
                customerRepository.save(customer);
            }

            String jwtToken = tokenProvider.generateToken(account.getUsername(), String.valueOf(account.getRole()));
            return new AuthResponse(jwtToken, account, customer, String.valueOf(account.getRole()));

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Lỗi giao tiếp với Google API: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public AuthResponse processFacebookLogin(String accessToken) {
        RestTemplate restTemplate = new RestTemplate();
        String facebookApiUrl = "https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=" + accessToken;

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(facebookApiUrl, Map.class);
            Map<String, Object> payload = response.getBody();

            if (payload == null || !payload.containsKey("id")) {
                throw new RuntimeException("Phản hồi từ Facebook không hợp lệ.");
            }

            String fbId = (String) payload.get("id");
            String name = (String) payload.get("name");

            String email = (String) payload.get("email");
            if (email == null || email.isEmpty()) {
                email = fbId + "@facebook.halmbook.com";
            }

            String picture = "";
            Map<String, Object> pictureObj = (Map<String, Object>) payload.get("picture");
            if (pictureObj != null && pictureObj.containsKey("data")) {
                Map<String, Object> dataObj = (Map<String, Object>) pictureObj.get("data");
                picture = (String) dataObj.get("url");
            }

            Customer customer = customerRepository.findByEmail(email).orElse(null);
            Account account;

            if (customer == null) {
                account = new Account();
                account.setUsername(email.split("@")[0]);
                account.setProvider("FACEBOOK");
                account.setRole(Role.USER);

                Account savedAccount = accountRepository.save(account);

                customer = new Customer();
                customer.setCustomer_id(genarateNextCustomerId());
                customer.setCustomerName(name);
                customer.setAvatar(picture);
                customer.setEmail(email);
                customer.setAccount(savedAccount);

                customerRepository.save(customer);
                account = savedAccount;
            } else {
                account = customer.getAccount();
                if (account == null) throw new RuntimeException("Dữ liệu lỗi: Customer mất liên kết Account");

                customer.setAvatar(picture);
                customerRepository.save(customer);
            }

            String jwtToken = tokenProvider.generateToken(account.getUsername(), String.valueOf(account.getRole()));
            return new AuthResponse(jwtToken, account, customer, String.valueOf(account.getRole()));

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Lỗi giao tiếp với Facebook API: " + e.getMessage());
        }
    }
}
