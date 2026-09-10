package com.internmatch.internmatch.features.auth.security;

import io.qameta.allure.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Epic("Authentication Security")
@Feature("API Rate Limiting")
class RateLimitingServiceTest {

    private final RateLimitingService service = new RateLimitingService();

    @Test
    @DisplayName("Allows up to 10 requests per minute per IP")
    void allowsLimitWithinWindow() {
        for (int i = 0; i < 10; i++) {
            assertTrue(service.isAllowed("192.168.1.10"), "request " + (i + 1) + " should be allowed");
        }
    }

    @Test
    @DisplayName("Blocks the 11th request within the same minute")
    void blocksOverLimit() {
        for (int i = 0; i < 10; i++) {
            service.isAllowed("192.168.1.10");
        }
        assertFalse(service.isAllowed("192.168.1.10"));
        assertFalse(service.isAllowed("192.168.1.10"));
    }

    @Test
    @DisplayName("Different IPs are counted independently")
    void ipsAreIndependent() {
        for (int i = 0; i < 10; i++) {
            service.isAllowed("192.168.1.1");
        }
        assertFalse(service.isAllowed("192.168.1.1"));
        // A fresh IP starts with a clean budget
        for (int i = 0; i < 10; i++) {
            assertTrue(service.isAllowed("10.0.0.200"), "fresh IP request " + (i + 1));
        }
    }
}