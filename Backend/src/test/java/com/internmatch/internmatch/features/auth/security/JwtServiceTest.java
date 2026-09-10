package com.internmatch.internmatch.features.auth.security;

import com.internmatch.internmatch.features.auth.Role;
import com.internmatch.internmatch.features.auth.User;
import io.qameta.allure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

@Epic("Authentication Security")
@Feature("JWT Token Service")
class JwtServiceTest {

    private static final String SECRET = "integration-test-secret-keys-must-be-long-32+";

    private JwtService jwtService;

    private User student;
    private User employer;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret", SECRET);
        jwtService.init();

        student = User.builder()
                .id(1L)
                .email("student@internmatch.com")
                .name("Student")
                .role(Role.STUDENT)
                .tokenVersion(0)
                .build();

        employer = User.builder()
                .id(2L)
                .email("employer@internmatch.com")
                .name("Employer")
                .role(Role.EMPLOYER)
                .tokenVersion(0)
                .build();
    }

    @Test
    @DisplayName("Token embeds subject and can be parsed back")
    void tokenRoundTripsUsername() {
        String token = jwtService.generateToken(student);
        assertEquals("student@internmatch.com", jwtService.extractUsername(token));
    }

    @Test
    @DisplayName("Token is valid for the correct user at matching tokenVersion")
    void validTokenForMatchingUser() {
        String token = jwtService.generateToken(student);
        assertTrue(jwtService.isTokenValid(token, student));
    }

    @Test
    @DisplayName("Token is invalid for a different user")
    void tokenInvalidForOtherUser() {
        String token = jwtService.generateToken(student);
        assertFalse(jwtService.isTokenValid(token, employer));
    }

    @Test
    @DisplayName("Token becomes invalid after tokenVersion bump (password change)")
    void tokenInvalidatedByTokenVersionBump() {
        String token = jwtService.generateToken(student);
        User rotated = User.builder()
                .id(1L)
                .email("student@internmatch.com")
                .name("Student")
                .role(Role.STUDENT)
                .tokenVersion(1)
                .build();
        assertFalse(jwtService.isTokenValid(token, rotated));
    }

    @Test
    @DisplayName("Tampered token is rejected")
    void tamperedTokenRejected() {
        String token = jwtService.generateToken(student);
        String tampered = token.substring(0, token.length() - 4) + "AAAA";
        assertFalse(jwtService.isTokenValid(tampered, student));
    }

    @Test
    @DisplayName("Garbage token is rejected")
    void garbageTokenRejected() {
        assertFalse(jwtService.isTokenValid("not.a.jwt", student));
        assertNull(jwtService.extractUsername("not.a.jwt"));
    }
}