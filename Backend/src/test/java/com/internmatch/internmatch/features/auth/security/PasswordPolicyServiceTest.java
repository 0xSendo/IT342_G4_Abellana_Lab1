package com.internmatch.internmatch.features.auth.security;

import io.qameta.allure.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@Epic("Authentication Security")
@Feature("Password Policy")
class PasswordPolicyServiceTest {

    private final PasswordPolicyService service = new PasswordPolicyService();

    @Test
    @DisplayName("Strong password is accepted")
    void strongPasswordAccepted() {
        assertNull(service.validatePassword("S3cure#Intern2026!", "student@internmatch.com"));
        assertTrue(service.isValidPassword("S3cure#Intern2026!"));
    }

    @Test
    @DisplayName("Password shorter than 8 characters is rejected")
    void tooShortRejected() {
        assertEquals("Password must be at least 8 characters long",
                service.validatePassword("Short1!", "student@internmatch.com"));
        assertFalse(service.isValidPassword("Short1!"));
    }

    @Test
    @DisplayName("Password longer than 64 characters is rejected")
    void tooLongRejected() {
        String longPassword = "a".repeat(70);
        assertEquals("Password must be at most 64 characters long",
                service.validatePassword(longPassword, "student@internmatch.com"));
    }

    @Test
    @DisplayName("Common passwords are rejected")
    void commonPasswordsRejected() {
        assertEquals("Password is too weak. Choose a longer, less common password.",
                service.validatePassword("internmatch1", "student@internmatch.com"));
        assertFalse(service.isValidPassword("internmatch1"));
        assertFalse(service.isValidPassword("admin123"));
        assertFalse(service.isValidPassword("ADMIN123"));
        assertFalse(service.isValidPassword("Qwerty123"));
    }

    @Test
    @DisplayName("Password containing the email is rejected")
    void passwordContainingEmailRejected() {
        String email = "juan.dela.cruz@internmatch.com";
        assertNotNull(service.validatePassword("Juan.dela.cruz123", email));
        assertNotNull(service.validatePassword("juan.dela.cruz@internmatch.comRocks!", email));
        assertEquals("Password must not contain your email address",
                service.validatePassword("JJjuan.dela.cruzjj", email));
    }

    @Test
    @DisplayName("Null and empty passwords produce required errors")
    void nullEmptyRejected() {
        assertEquals("Password is required", service.validatePassword(null, "a@b.com"));
        assertEquals("Password is required", service.validatePassword("", "a@b.com"));
    }
}