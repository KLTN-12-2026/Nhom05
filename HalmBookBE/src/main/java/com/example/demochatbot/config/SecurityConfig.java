package com.example.demochatbot.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.security.core.userdetails.UsernameNotFoundException;
import com.example.demochatbot.repository.AccountRepository;
import com.example.demochatbot.model.Account;
import com.example.demochatbot.service.account.CustomUserDetails;
import java.util.Arrays;

@Configuration
@EnableMethodSecurity(securedEnabled = true)
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(@Lazy JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public UserDetailsService userDetailsService(AccountRepository accountRepository) {
        return username -> {
            Account account = accountRepository.findByUsername(username)
                    .orElseGet(() -> accountRepository.findByUsername(username.toLowerCase())
                            .orElseGet(() -> accountRepository.findByUsername(username.toUpperCase())
                                    .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tài khoản: " + username))));
            return new CustomUserDetails(account);
        };
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(UserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Cho phép các nguồn Frontend và Mobile App trên mạng LAN
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Cache-Control", "Content-Type", "Accept", "X-Requested-With", "Origin"));
        configuration.setExposedHeaders(Arrays.asList("Authorization"));

        // Cho phép gửi credentials (header/cookie)
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, CorsConfigurationSource corsConfigurationSource) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf.disable())

                // 1. Chế độ Vô trạng thái (Stateless), hoàn toàn dựa vào Bearer JWT
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth
                        // 2. Các endpoint công khai không cần token
                        .requestMatchers("/api/auth/**", "/api/password/**").permitAll()
                        .requestMatchers("/api/chat/**").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/api/user/support-tickets", "/api/user/support-tickets/**").permitAll()
                        .requestMatchers("/api/admin/support-tickets", "/api/admin/support-tickets/**").permitAll()
                        .requestMatchers("/api/admin/analytics", "/api/admin/analytics/**").permitAll()

                        // 3. Phân quyền cho gói nạp và khuyến mãi:
                        // Cho phép độc giả xem danh sách công khai (GET)
                        .requestMatchers(HttpMethod.GET, "/api/home/promotions", "/api/home/vouchers", "/api/promotions", "/api/promotions/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/home/potato/packages").permitAll()
                        // Yêu cầu quyền ADMIN cho các thao tác quản trị gói nạp & khuyến mãi
                        .requestMatchers("/api/home/potato/packages/all", "/api/home/potato/packages/admin").hasAnyAuthority("ROLE_ADMIN", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/home/potato/packages", "/api/home/potato/packages/**").hasAnyAuthority("ROLE_ADMIN", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/home/potato/packages/**").hasAnyAuthority("ROLE_ADMIN", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/home/potato/packages/**").hasAnyAuthority("ROLE_ADMIN", "ADMIN")
                        .requestMatchers("/api/promotions", "/api/promotions/**").hasAnyAuthority("ROLE_ADMIN", "ADMIN")

                        // 4. Nghiệp vụ ví, giỏ hàng, thanh toán và tủ sách cá nhân yêu cầu xác thực
                        .requestMatchers("/api/home/checkout", "/api/home/bookshelf", "/api/home/bookshelf/**").authenticated()
                        .requestMatchers("/api/home/cart/**").authenticated()
                        .requestMatchers("/api/home/potato/wallet", "/api/home/potato/topup", "/api/home/potato/transfer", "/api/home/potato/history", "/api/home/potato/transactions").authenticated()
                        .requestMatchers("/api/home/missions/claim", "/api/home/reading-progress", "/api/home/reading-notes/**").authenticated()

                        // 5. Các endpoint công khai của cửa hàng sách
                        .requestMatchers("/api/home/**").permitAll()

                        // 6. Phân quyền Quản trị viên (Admin Portal): Siết chặt bảo mật, chỉ ADMIN mới được truy cập
                        .requestMatchers("/api/admin/**", "/admin/**").hasAnyAuthority("ROLE_ADMIN", "ADMIN")

                        // 7. Phân quyền Người dùng (Độc giả)
                        .requestMatchers("/user/**", "/api/user/**").hasAnyAuthority("ROLE_USER", "USER", "ROLE_ADMIN", "ADMIN")

                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                );

        // 4. Chèn bộ lọc JWT tự tạo vào trước UsernamePasswordAuthenticationFilter
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
