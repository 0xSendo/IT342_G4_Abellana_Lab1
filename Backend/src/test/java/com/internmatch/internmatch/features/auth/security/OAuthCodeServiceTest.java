package com.internmatch.internmatch.features.auth.security;

import io.qameta.allure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@Epic("Authentication Security")
@Feature("OAuth Code Exchange")
class OAuthCodeServiceTest {

    private OAuthCodeService service;

    @BeforeEach
    void setUp() {
        service = new OAuthCodeService();
    }

    @Nested
    @Story("Issue Code")
    class IssueCode {

        @Test
        @DisplayName("Returns a non-blank Base64 URL-safe string")
        void returnsNonEmptyCode() {
            String code = service.issueCode("user@internmatch.com");

            assertNotNull(code);
            assertFalse(code.isBlank());
            assertTrue(code.length() > 20);
        }

        @Test
        @DisplayName("Different calls produce different codes")
        void differentCodes() {
            String code1 = service.issueCode("user@internmatch.com");
            String code2 = service.issueCode("user@internmatch.com");

            assertNotEquals(code1, code2);
        }
    }

    @Nested
    @Story("Redeem Code")
    class RedeemCode {

        @Test
        @DisplayName("Returns email for a valid code")
        void returnsEmailForValidCode() {
            String code = service.issueCode("alice@internmatch.com");

            String email = service.redeemCode(code);

            assertEquals("alice@internmatch.com", email);
        }

        @Test
        @DisplayName("Code is single-use — second redeem returns null")
        void singleUseRedemption() {
            String code = service.issueCode("alice@internmatch.com");

            String first = service.redeemCode(code);
            String second = service.redeemCode(code);

            assertEquals("alice@internmatch.com", first);
            assertNull(second);
        }

        @Test
        @DisplayName("Returns null for unknown code")
        void returnsNullForUnknownCode() {
            assertNull(service.redeemCode("nonexistent-code-abc123"));
        }

        @Test
        @DisplayName("Returns null for blank code")
        void returnsNullForBlankCode() {
            assertNull(service.redeemCode(null));
            assertNull(service.redeemCode(""));
            assertNull(service.redeemCode("   "));
        }

        @Test
        @DisplayName("Returns null for expired code")
        void returnsNullForExpiredCode() throws Exception {
            String code = service.issueCode("alice@internmatch.com");

            Field codesField = OAuthCodeService.class.getDeclaredField("codes");
            codesField.setAccessible(true);
            @SuppressWarnings("unchecked")
            Map<String, Object> codes = (Map<String, Object>) codesField.get(service);

            codes.put(code, createExpiredEntry("alice@internmatch.com"));

            String result = service.redeemCode(code);

            assertNull(result);
        }
    }

    @Nested
    @Story("Expiration Sweep")
    class ExpirationSweep {

        @Test
        @DisplayName("Expired entries are cleaned up when new codes are issued")
        void sweepCleansExpired() throws Exception {
            String oldCode = service.issueCode("old@internmatch.com");

            Field codesField = OAuthCodeService.class.getDeclaredField("codes");
            codesField.setAccessible(true);
            @SuppressWarnings("unchecked")
            Map<String, Object> codes = (Map<String, Object>) codesField.get(service);

            codes.put(oldCode, createExpiredEntry("old@internmatch.com"));

            String newCode = service.issueCode("new@internmatch.com");

            assertFalse(codes.containsKey(oldCode), "Expired code should be swept");
            assertTrue(codes.containsKey(newCode), "New code should still exist");
        }
    }

    private Object createExpiredEntry(String email) throws Exception {
        Class<?>[] innerClasses = OAuthCodeService.class.getDeclaredClasses();
        Class<?> codeEntryClass = null;
        for (Class<?> c : innerClasses) {
            if (c.getSimpleName().equals("CodeEntry")) {
                codeEntryClass = c;
                break;
            }
        }
        assertNotNull(codeEntryClass, "CodeEntry record not found");

        var constructor = codeEntryClass.getDeclaredConstructors()[0];
        constructor.setAccessible(true);
        return constructor.newInstance(email, Instant.now().minusMillis(5 * 60 * 1000));
    }
}
