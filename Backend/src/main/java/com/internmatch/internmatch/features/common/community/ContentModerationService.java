package com.internmatch.internmatch.features.common.community;

import org.springframework.stereotype.Service;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class ContentModerationService {

    // 1. Precise Link Regex
    private static final Pattern PRECISE_URL_PATTERN = Pattern.compile(
            "((https?://|www\\.|ftp://)|(([a-z0-9]+\\.)+([a-z]{2,}|[0-9]{1,3})))(:[0-9]{1,5})?(/\\S*)?",
            Pattern.CASE_INSENSITIVE
    );

    // 2. Comprehensive TLD Pattern
    private static final String TLD_GROUP = "(com|net|org|io|gov|edu|ph|link|me|xyz|info|biz|tk|ml|ga|cf|gq|club|tech|app|dev|online|site|shop|store|work|live|news|blog|xyz)";
    private static final Pattern OBFUSCATED_URL_PATTERN = Pattern.compile(
            "[a-z0-9-]+\\s*[\\.\\[\\( ]+\\s*" + TLD_GROUP,
            Pattern.CASE_INSENSITIVE
    );

    // 3. Exhaustive Forbidden Terms
    private static final List<String> FORBIDDEN_TERMS = Arrays.asList(
            // High-Severity Slurs
            "nigger", "nigga", "niggah", "faggot", "chink", "retard", "kike", "spic", "wetback", "hitler", "nazi",
            // Explicit / Profanity
            "porn", "pornography", "bitch", "whore", "slut", "cunt", "pussy", "dick", "cock", "fuck", "shit", "asshole",
            // Scams / Spam
            "crypto", "bitcoin", "ethereum", "casino", "gambling", "betting", "lottery", "win money", "free cash", "earn money",
            // Violence
            "rape", "kill yourself", "kys", "murder", "suicide", "bomb", "terrorist", "terrorism"
    );

    /**
     * Validates content with character collapsing and fuzzy matching.
     */
    public void validateContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            return;
        }

        String raw = content.trim();
        String lowercaseRaw = raw.toLowerCase();

        // 1. Direct Regex (Standard Links)
        if (PRECISE_URL_PATTERN.matcher(raw).find()) {
            throw new RuntimeException("MODERATION_ERROR: External links are prohibited.");
        }

        // 2. Obfuscated Link (e.g., "site dot com")
        if (OBFUSCATED_URL_PATTERN.matcher(raw).find()) {
            throw new RuntimeException("MODERATION_ERROR: Links are not allowed, even if obscured.");
        }

        // 3. Advanced Normalization
        // 3.1 Strip non-alphanumeric
        String stripped = lowercaseRaw.replaceAll("[^a-z0-9]", "");
        
        // 3.2 Collapse repeating characters (e.g., "niiiigggga" -> "niga")
        StringBuilder collapsedBuilder = new StringBuilder();
        if (stripped.length() > 0) {
            collapsedBuilder.append(stripped.charAt(0));
            for (int i = 1; i < stripped.length(); i++) {
                if (stripped.charAt(i) != stripped.charAt(i - 1)) {
                    collapsedBuilder.append(stripped.charAt(i));
                }
            }
        }
        String collapsed = collapsedBuilder.toString();

        // 4. Domain Check on Normalized Strings
        Pattern domainPattern = Pattern.compile(".{3,}" + TLD_GROUP);
        if (domainPattern.matcher(stripped).find() || domainPattern.matcher(collapsed).find()) {
             throw new RuntimeException("MODERATION_ERROR: Website link or domain detected.");
        }

        // 5. Term Check on all variations
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
        for (Object value : fields.values()) {
            if (value instanceof String) {
                validateContent((String) value);
            }
        }
    }
}
