package com.example.demochatbot.service.account;

import com.example.demochatbot.model.Account;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class CustomUserDetails implements UserDetails {

    private final Account account;

    public CustomUserDetails(Account account) {
        this.account = account;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        String roleName = (account != null && account.getRole() != null) ? account.getRole().name() : "USER";
        return List.of(
                new SimpleGrantedAuthority("ROLE_" + roleName),
                new SimpleGrantedAuthority(roleName)
        );
    }

    public Account getAccount() {
        return account;
    }

    @Override
    public String getPassword() {
        return account != null ? account.getPassword() : null;
    }

    @Override
    public String getUsername() {
        return account != null ? account.getUsername() : null;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return account != null && !"LOCKED".equalsIgnoreCase(account.getStatus());
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return account != null && !"DISABLED".equalsIgnoreCase(account.getStatus());
    }
}
