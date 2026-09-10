package com.internmatch.internmatch.features.common.community;

import io.qameta.allure.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@Epic("Content Safety")
@Feature("Content Moderation")
class ContentModerationServiceTest {

    private final ContentModerationService service = new ContentModerationService();

    @Nested
    @Story("Allowed content")
    class AllowedContent {

        @Test
        @DisplayName("Null or blank content passes")
        @Description("Null and empty strings must not be flagged")
        void nullOrBlankPasses() {
            assertDoesNotThrow(() -> service.validateContent(null));
            assertDoesNotThrow(() -> service.validateContent(""));
            assertDoesNotThrow(() -> service.validateContent("   "));
        }

        @Test
        @DisplayName("Clean professional text passes")
        void cleanTextPasses() {
            assertDoesNotThrow(() -> service.validateContent("Seeking a Software Engineering internship at a top tech company."));
        }

        @Test
        @DisplayName("Safe tech terms are not falsely flagged")
        void safeTechTermsPass() {
            assertDoesNotThrow(() -> service.validateContent("I build full-stack apps with node.js and react.js."));
            assertDoesNotThrow(() -> service.validateContent("Testing against localhost in development."));
        }
    }

    @Nested
    @Story("Rejected content")
    class RejectedContent {

        @Test
        @DisplayName("Profanity is blocked")
        void profanityBlocked() {
            assertThrows(RuntimeException.class, () -> service.validateContent("This feature is totally shit."));
            assertThrows(RuntimeException.class, () -> service.validateContent("He called me a b17ch."));
        }

        @Test
        @DisplayName("Slurs are blocked")
        void slursBlocked() {
            assertThrows(RuntimeException.class, () -> service.validateContent("Offensive slur nigga detected here."));
        }

        @Test
        @DisplayName("Scam keywords are blocked")
        void scamKeywordsBlocked() {
            assertThrows(RuntimeException.class, () -> service.validateContent("Earn money fast with crypto in one easy step!"));
        }

        @Test
        @DisplayName("Leetspeak evasions are blocked")
        void leetspeakBlocked() {
            assertThrows(RuntimeException.class, () -> service.validateContent("s4l3 0f hacked accounts"));
        }

        @Test
        @DisplayName("Repeated-character evasions are collapsed and blocked")
        void repeatedCharEvasionBlocked() {
            assertThrows(RuntimeException.class, () -> service.validateContent("scamnnn offer for you"));
        }
    }

    @Nested
    @Story("Link policy")
    class LinkPolicy {

        @Test
        @DisplayName("Plain URL is blocked when links are not allowed")
        void urlBlockedByDefault() {
            assertThrows(RuntimeException.class, () -> service.validateContent("Check this out https://example.com/promo"));
        }

        @Test
        @DisplayName("Obfuscated URLs are blocked")
        void obfuscatedUrlBlocked() {
            assertThrows(RuntimeException.class, () -> service.validateContent("Visit our site dot com for details"));
            assertThrows(RuntimeException.class, () -> service.validateContent("See it at mypage[dot]net now"));
        }

        @Test
        @DisplayName("URL is allowed when links are permitted (internship descriptions)")
        void urlAllowedWithLinks() {
            assertDoesNotThrow(() -> service.validateContent("Check our website https://example.com/careers", true));
        }

        @Test
        @DisplayName("Link-permitted profile fields bypass URL blocking")
        void linkPermittedFields() {
            Map<String, Object> fields = new LinkedHashMap<>();
            fields.put("bio", "Final year CS student passionate about web development.");
            fields.put("website", "https://portfolio.example.com");
            fields.put("linkedin", "https://linkedin.com/in/student");
            assertDoesNotThrow(() -> service.validateFields(fields));
        }

        @Test
        @DisplayName("Non-link profile fields still enforce moderation")
        void moderatedFieldsStillBlocked() {
            Map<String, Object> fields = new LinkedHashMap<>();
            fields.put("bio", "Hmu for free bitcoin fast cash");
            assertThrows(RuntimeException.class, () -> service.validateFields(fields));
        }
    }
}