package com.internmatch.internmatch.features.auth.security;

import org.springframework.stereotype.Service;
import java.util.Arrays;
import java.util.List;

@Service
public class PasswordPolicyService {

    private static final List<String> COMMON_PASSWORDS = Arrays.asList(
            "password", "password1", "internmatch", "internmatch1", "12345678",
            "123456789", "qwerty123", "changeme", "admin123", "letmein");

    public boolean isValidPassword(String password) {
        if (password == null || password.length() < 8 || password.length() > 64) {
            return false;
        }
        return !COMMON_PASSWORDS.contains(password.toLowerCase());
    }

    public String validatePassword(String password, String email) {
        if (password == null || password.isEmpty()) {
            return "Password is required";
        }
        if (password.length() < 8) {
            return "Password must be at least 8 characters long";
        }
        if (password.length() > 64) {
            return "Password must be at most 64 characters long";
        }
        if (!isValidPassword(password)) {
            return "Password is too weak. Choose a longer, less common password.";
        }
        if (email != null && !email.isBlank()) {
            String lower = password.toLowerCase();
            String local = email.split("@")[0].toLowerCase();
            if (lower.contains(local) || lower.contains(email.toLowerCase())) {
                return "Password must not contain your email address";
            }
        }
        return null;
    }
}