package com.internmatch.internmatch.features.auth.security;

import com.internmatch.internmatch.features.auth.User;
import com.internmatch.internmatch.features.auth.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    private final UserRepository userRepository;
    private static final int MAX_ATTEMPTS = 5;
    private static final int LOCKOUT_DURATION_MINUTES = 15;

    public void loginSucceeded(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setFailedLoginAttempts(0);
            user.setLockoutUntil(null);
            userRepository.save(user);
        });
    }

    public void loginFailed(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);
            
            if (attempts >= MAX_ATTEMPTS) {
                user.setLockoutUntil(LocalDateTime.now().plusMinutes(LOCKOUT_DURATION_MINUTES));
            }
            
            userRepository.save(user);
        });
    }

    public boolean isBlocked(String email) {
        return userRepository.findByEmail(email)
                .map(user -> !user.isAccountNonLocked())
                .orElse(false);
    }
    
    public int getRemainingAttempts(String email) {
        return userRepository.findByEmail(email)
                .map(user -> Math.max(0, MAX_ATTEMPTS - user.getFailedLoginAttempts()))
                .orElse(MAX_ATTEMPTS);
    }
}
