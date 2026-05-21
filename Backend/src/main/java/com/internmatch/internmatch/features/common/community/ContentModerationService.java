package com.internmatch.internmatch.features.common.community;

import org.springframework.stereotype.Service;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class ContentModerationService {

    // Aggressive regex to detect URLs, even without protocol or www
    private static final Pattern URL_PATTERN = Pattern.compile(
            "((https?://|www\\.|ftp://)|(([a-z0-9]+\\.)+([a-z]{2,}|[0-9]{1,3})))(:[0-9]{1,5})?(/\\S*)?",
            Pattern.CASE_INSENSITIVE
    );

    // List of forbidden terms (expandable)
    private static final List<String> FORBIDDEN_TERMS = Arrays.asList(
            "nigger", "faggot", "chink", "retard", "rape", "kill yourself", "kys", "hitler",
            "nigga", "bitch", "whore", "slut"
    );

    /**
     * Validates community content against moderation rules.
     * @param content The text to validate
     * @throws RuntimeException if content violates rules
     */
    public void validateContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            return;
        }

        // 1. Check for URLs/Links
        // We use the raw content for regex as some protocols might be case-sensitive in some parsers
        if (URL_PATTERN.matcher(content).find()) {
            throw new RuntimeException("MODERATION_ERROR: External links are not permitted in community posts.");
        }

        String normalizedContent = content.toLowerCase();

        // 2. Check for Forbidden Terms / Slurs
        for (String term : FORBIDDEN_TERMS) {
            if (normalizedContent.contains(term)) {
                throw new RuntimeException("MODERATION_ERROR: Your post contains inappropriate language that violates community standards.");
            }
        }
    }
}
