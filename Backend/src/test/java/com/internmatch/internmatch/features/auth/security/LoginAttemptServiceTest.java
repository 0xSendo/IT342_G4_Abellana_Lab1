package com.internmatch.internmatch.features.auth.security;

import com.internmatch.internmatch.features.auth.UserRepository;
import io.qameta.allure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@Epic("Authentication Security")
@Feature("Brute-Force Protection")
class LoginAttemptServiceTest {

    @Mock
    private UserRepository userRepository;

    private LoginAttemptService service;

    @BeforeEach
    void setUp() {
        service = new LoginAttemptService(userRepository);
        when(userRepository.findByEmail(anyString())).thenReturn(java.util.Optional.empty());
    }

    @Test
    @DisplayName("Account is blocked after 5 failed attempts from the same IP")
    void locksAfterFiveFailures() {
        String ip = "203.0.113.10";
        for (int i = 0; i < 4; i++) {
            service.loginFailed("victim@internmatch.com", ip);
            assertFalse(service.isBlocked("victim@internmatch.com", ip), "not blocked before 5th failure");
        }
        service.loginFailed("victim@internmatch.com", ip);
        assertTrue(service.isBlocked("victim@internmatch.com", ip));
    }

    @Test
    @DisplayName("Failures from one IP do not lock out a different IP")
    void lockIsScopedToAccountIpPair() {
        for (int i = 0; i < 5; i++) {
            service.loginFailed("victim@internmatch.com", "203.0.113.10");
        }
        assertTrue(service.isBlocked("victim@internmatch.com", "203.0.113.10"));
        assertFalse(service.isBlocked("victim@internmatch.com", "198.51.100.77"));
    }

    @Test
    @DisplayName("Successful login clears the lockout")
    void successfulLoginClearsLockout() {
        String ip = "203.0.113.10";
        for (int i = 0; i < 5; i++) {
            service.loginFailed("victim@internmatch.com", ip);
        }
        assertTrue(service.isBlocked("victim@internmatch.com", ip));

        service.loginSucceeded("victim@internmatch.com", ip);
        assertFalse(service.isBlocked("victim@internmatch.com", ip));
    }

    @Test
    @DisplayName("Clean account is never blocked")
    void cleanAccountNeverBlocked() {
        assertFalse(service.isBlocked("fresh@internmatch.com", "203.0.113.10"));
    }
}