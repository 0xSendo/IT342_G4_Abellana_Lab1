package com.internmatch.internmatch.features.common.community;

import org.springframework.stereotype.Service;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class ContentModerationService {

    // 1. Precise Link Regex - Requires protocol or www
    private static final Pattern PRECISE_URL_PATTERN = Pattern.compile(
            "(https?://|www\\.|ftp://)\\S+",
            Pattern.CASE_INSENSITIVE
    );

    // 2. Comprehensive TLD Pattern - Refined to require actual dot or "dot" text, not just spaces
    private static final String TLD_GROUP = "(com|net|org|io|gov|edu|ph|link|me|xyz|info|biz|tk|ml|ga|cf|gq|club|tech|app|dev|online|site|shop|store|work|live|news|blog)";
    private static final Pattern OBFUSCATED_URL_PATTERN = Pattern.compile(
            "[a-z0-9-]+\\s*(\\.|\\s+dot\\s+|\\[dot\\]|\\(dot\\))\\s*" + TLD_GROUP,
            Pattern.CASE_INSENSITIVE
    );

    // 3. Exhaustive Forbidden Terms
    private static final List<String> FORBIDDEN_TERMS = Arrays.asList(
            // High-Severity Slurs
            "nigger", "nigga", "niggah", "faggot", "chink", "retard", "kike", "spic", "wetback", "hitler", "nazi",
            // Explicit / Profanity
            "porn", "pornography", "bitch", "whore", "slut", "cunt", "pussy", "dick", "cock", "fuck", "shit", "asshole",
            "puta", "gago", "tarantado", "pakyu", "kupal",
            // Scams / Spam / Security
            "crypto", "bitcoin", "ethereum", "casino", "gambling", "betting", "lottery", "win money", "free cash", "earn money",
            "hack", "exploit", "phishing", "scam", "credential", "password", "token",
            // Illegal Substances
            "drugs", "weed", "cocaine", "heroin", "meth", "marijuana",
            // Violence
            "rape", "kill yourself", "kys", "murder", "suicide", "bomb", "terrorist", "terrorism"
    );

    // 4. Safe Tech Terms - Prevent false positives for portfolios
    private static final List<String> SAFE_TECH_TERMS = Arrays.asList(
            "node.js", "react.js", "vue.js", "next.js", "nuxt.js", "socket.io", "three.js", "d3.js", "express.js",
            "asp.net", "ado.net", "vb.net", "win.net", ".net core", ".net framework",
            "system.out", "console.log", "localhost", "127.0.0.1"
    );

    /**
     * Validates content with character collapsing and fuzzy matching.
     */
    public void validateContent(String content) {
        validateContent(content, false);
    }

    public void validateContent(String content, boolean allowLinks) {
        if (content == null || content.trim().isEmpty()) {
            return;
        }

        String raw = content.trim();
        String lowercaseRaw = raw.toLowerCase();

        if (!allowLinks) {
            // 0. Whitelist Protection: Temporarily mask safe tech terms
            String validationText = lowercaseRaw;
            for (String safe : SAFE_TECH_TERMS) {
                validationText = validationText.replace(safe, "SAFE_TECH_TERM");
            }

            // 1. Direct Regex (Standard Links) - Check against whitelisted text
            if (PRECISE_URL_PATTERN.matcher(validationText).find()) {
                throw new RuntimeException("MODERATION_ERROR: External links are prohibited for community safety.");
            }

            // 2. Obfuscated Link (e.g., "site dot com") - Check against whitelisted text
            if (OBFUSCATED_URL_PATTERN.matcher(validationText).find()) {
                throw new RuntimeException("MODERATION_ERROR: Security Alert: External links are not allowed, even if obscured.");
            }

            // 3. Advanced Normalization
            // 3.1 Strip non-alphanumeric
            String stripped = lowercaseRaw.replaceAll("[^a-z0-9]", "");
            
            // 3.2 Collapse repeating characters (e.g., "niiiigggga" -> "niga")
            String collapsed = collapseString(stripped);
        }

        // 5. Term Check on all variations
        validateForbiddenTerms(lowercaseRaw);
    }

    private void validateForbiddenTerms(String lowercaseRaw) {
        String stripped = lowercaseRaw.replaceAll("[^a-z0-9]", "");
        String collapsed = collapseString(stripped);

        for (String term : FORBIDDEN_TERMS) {
            String collapsedTerm = collapseString(term.toLowerCase().replaceAll("[^a-z0-9]", ""));
            
            // Check raw, stripped, and collapsed
            if (lowercaseRaw.contains(term) || stripped.contains(term) || collapsed.contains(collapsedTerm)) {
                throw new RuntimeException("MODERATION_ERROR: Prohibited language or topic detected.");
            }
            
            // Leetspeak variants (collapsed)
            String leet = term.replace("e", "3").replace("a", "4").replace("i", "1").replace("o", "0").replace("s", "5").replace("t", "7");
            String collapsedLeet = collapseString(leet.toLowerCase().replaceAll("[^a-z0-9]", ""));
            
            if (lowercaseRaw.contains(leet) || stripped.contains(leet) || collapsed.contains(collapsedLeet)) {
                throw new RuntimeException("MODERATION_ERROR: Content violates safety guidelines.");
            }
        }
    }

    private String collapseString(String s) {
        if (s == null || s.length() == 0) return "";
        StringBuilder sb = new StringBuilder();
        sb.append(s.charAt(0));
        for (int i = 1; i < s.length(); i++) {
            if (s.charAt(i) != s.charAt(i - 1)) {
                sb.append(s.charAt(i));
            }
        }
        return sb.toString();
    }

    /**
     * Validates multiple fields at once (e.g., for profile updates).
     */
    public void validateFields(java.util.Map<String, Object> fields) {
        validateFields(fields, false);
    }

    public void validateFields(java.util.Map<String, Object> fields, boolean allowLinksInAll) {
        for (java.util.Map.Entry<String, Object> entry : fields.entrySet()) {
            Object value = entry.getValue();
            if (value instanceof String) {
                boolean allowLinks = allowLinksInAll || isLinkPermittedField(entry.getKey());
                validateContent((String) value, allowLinks);
            }
        }
    }

    private boolean isLinkPermittedField(String key) {
        if (key == null) return false;
        String k = key.toLowerCase();
        return k.contains("url") || k.contains("website") || k.contains("linkedin") || k.contains("github") || k.contains("portfolio");
    }
}
